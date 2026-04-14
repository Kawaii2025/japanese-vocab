#!/usr/bin/env node

/**
 * Sync local SQLite data to Neon PostgreSQL
 * Usage: node sync-to-neon.js
 * 
 * This script pushes all data from your local SQLite database to Neon.
 * IMPORTANT: Run backup-neon-to-json.js FIRST to backup existing Neon data!
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { logSyncError } from '../../utils/error-handler.js';
import { SyncAudit } from '../../utils/sync-audit.js';

dotenv.config();
dotenv.config({ path: '.env.neon' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/vocabulary.db');

// Helper to ask user for confirmation
async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

async function syncToNeon() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL environment variable not set');
    err.code = 'ENV_CONFIG_ERROR';
    logSyncError(err, 'Cannot start full sync - missing database configuration', {
      operation: 'initialize sync'
    });
    console.error('   Set DATABASE_URL in your .env file to enable Neon sync.');
    process.exit(1);
  }

  console.log('🔄 SQLite → Neon Sync Tool\n');
  console.log('⚠️  WARNING: This will overwrite data in Neon!');
  console.log('   Make sure you have backed up Neon data first.\n');

  const confirmed = await askConfirmation('Have you backed up Neon data? (y/n): ');
  if (!confirmed) {
    console.log('\n❌ Cancelled. Please run: node backup-neon-to-json.js');
    process.exit(0);
  }

  let neonPool;
  let sqliteDb;
  let audit;
  try {
    neonPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL
    });

    sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  } catch (err) {
    logSyncError(err, 'Failed to initialize database connections', {
      operation: 'database initialization'
    });
    process.exit(1);
  }

  try {
    console.log('\n🔐 Connecting to Neon...');
    try {
      const testConn = await neonPool.query('SELECT NOW()');
      console.log('✅ Connected to Neon\n');
    } catch (connErr) {
      logSyncError(connErr, 'Failed to connect to Neon database', {
        operation: 'Neon connection test'
      });
      throw connErr;
    }

    // ✨ Start audit tracking
    audit = new SyncAudit(neonPool, 'full');
    const auditId = await audit.start();
    console.log(`📋 Audit started (ID: ${auditId})\n`);

    console.log('📊 Starting sync process...\n');

    // Get counts before sync
    const neonVocabBefore = await neonPool.query('SELECT COUNT(*) as count FROM vocabulary');
    const neonUsersBefore = await neonPool.query('SELECT COUNT(*) as count FROM users');
    const neonPracticeBefore = await neonPool.query('SELECT COUNT(*) as count FROM practice_records');

    const sqliteVocab = await sqliteDb.all('SELECT COUNT(*) as count FROM vocabulary');
    const sqliteUsers = await sqliteDb.all('SELECT COUNT(*) as count FROM users');
    const sqlitePractice = await sqliteDb.all('SELECT COUNT(*) as count FROM practice_records');

    console.log('📈 Data counts:');
    console.log(`   SQLite → Neon`);
    console.log(`   Vocabulary: ${sqliteVocab[0].count} → ${neonVocabBefore.rows[0].count}`);
    console.log(`   Users: ${sqliteUsers[0].count} → ${neonUsersBefore.rows[0].count}`);
    console.log(`   Practice Records: ${sqlitePractice[0].count} → ${neonPracticeBefore.rows[0].count}\n`);

    const finalConfirm = await askConfirmation('Proceed with sync? (y/n): ');
    if (!finalConfirm) {
      console.log('\n❌ Cancelled.');
      await neonPool.end();
      await sqliteDb.close();
      process.exit(0);
    }

    // Helper to convert JS milliseconds to date string (YYYY-MM-DD)
    const msToDate = (ms) => {
      if (!ms || ms === null || ms === undefined || ms === '') return null;
      const num = Number(ms);
      if (isNaN(num)) return null;
      try {
        return new Date(num).toISOString().split('T')[0];
      } catch (e) {
        console.warn(`⚠️  Invalid date value: ${ms}`);
        return null;
      }
    };

    // Helper to convert JS milliseconds to ISO timestamp
    const msToTimestamp = (ms) => {
      if (!ms || ms === null || ms === undefined || ms === '') return null;
      const num = Number(ms);
      if (isNaN(num)) return null;
      try {
        return new Date(num).toISOString();
      } catch (e) {
        console.warn(`⚠️  Invalid timestamp value: ${ms}`);
        return null;
      }
    };

    console.log('\n🔄 Syncing vocabulary...');
    const vocabularyData = await sqliteDb.all('SELECT * FROM vocabulary ORDER BY id');
    let vocabSynced = 0;
    let vocabFailed = 0;
    
    for (const row of vocabularyData) {
      try {
        await neonPool.query(
          `INSERT INTO vocabulary 
          (id, chinese, original, kana, category, difficulty, input_date, next_review_date, review_count, mastery_level, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
          chinese = $2, original = $3, kana = $4, category = $5, difficulty = $6,
          input_date = $7, next_review_date = $8, review_count = $9, mastery_level = $10,
          updated_at = $12`,
          [row.id, row.chinese, row.original, row.kana, row.category, row.difficulty,
           msToDate(row.input_date), msToDate(row.next_review_date), row.review_count, row.mastery_level,
           msToTimestamp(row.created_at), msToTimestamp(row.updated_at)]
        );
        vocabSynced++;
      } catch (err) {
        vocabFailed++;
        if (audit) await audit.recordError(row.id, 'vocabulary', err.message, err.code);
      }
    }
    console.log(`   ✅ ${vocabSynced}/${vocabularyData.length} vocabulary items synced`);

    // Sync users
    let usersSynced = 0;
    let usersFailed = 0;
    try {
      console.log('🔄 Syncing users...');
      const usersData = await sqliteDb.all('SELECT * FROM users ORDER BY id');
      
      for (const row of usersData) {
        try {
          await neonPool.query(
            `INSERT INTO users (id, username, email, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
            username = $2, email = $3`,
            [row.id, row.username, row.email, msToTimestamp(row.created_at)]
          );
          usersSynced++;
        } catch (err) {
          usersFailed++;
          if (audit) await audit.recordError(row.id, 'users', err.message, err.code);
        }
      }
      console.log(`   ✅ ${usersSynced}/${usersData.length} users synced`);
    } catch (err) {
      console.log('   ⚠️  Users sync encountered an issue:');
      logSyncError(err, 'Users table sync failed (continuing with other tables)', {
        table: 'users',
        operation: 'full sync all users'
      });
      if (audit) await audit.recordError(0, 'users', err.message, err.code);
    }

    // Sync practice records
    let practiceSynced = 0;
    let practiceFailed = 0;
    try {
      console.log('🔄 Syncing practice records...');
      const practiceData = await sqliteDb.all('SELECT * FROM practice_records ORDER BY id');
      
      for (const row of practiceData) {
        try {
          await neonPool.query(
            `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
            is_correct = $4, practice_date = $5, practiced_at = $6`,
            [row.id, row.user_id, row.vocabulary_id, row.is_correct, msToDate(row.practice_date), msToTimestamp(row.practiced_at)]
          );
          practiceSynced++;
        } catch (err) {
          practiceFailed++;
          if (audit) await audit.recordError(row.id, 'practice_records', err.message, err.code);
        }
      }
      console.log(`   ✅ ${practiceSynced}/${practiceData.length} practice records synced`);
    } catch (err) {
      console.log('   ⚠️  Practice records sync encountered an issue:');
      logSyncError(err, 'Practice records table sync failed (continuing)', {
        table: 'practice_records',
        operation: 'full sync all practice records'
      });
      if (audit) await audit.recordError(0, 'practice_records', err.message, err.code);
    }

    // Get counts after sync
    const neonVocabAfter = await neonPool.query('SELECT COUNT(*) as count FROM vocabulary');
    const neonUsersAfter = await neonPool.query('SELECT COUNT(*) as count FROM users');
    const neonPracticeAfter = await neonPool.query('SELECT COUNT(*) as count FROM practice_records');

    // ✨ Update audit with progress
    if (audit) {
      await audit.updateProgress({
        vocabulary: { succeeded: vocabSynced, failed: vocabFailed },
        users: { succeeded: usersSynced, failed: usersFailed },
        practice_records: { succeeded: practiceSynced, failed: practiceFailed }
      });
    }

    console.log('\n✅ Sync complete!');
    console.log('📊 Data verification:');
    console.log(`   Vocabulary: ${neonVocabBefore.rows[0].count} → ${neonVocabAfter.rows[0].count} (expected: ${sqliteVocab[0].count}) ${neonVocabAfter.rows[0].count === sqliteVocab[0].count ? '✅' : '⚠️'}`);
    console.log(`   Users: ${neonUsersBefore.rows[0].count} → ${neonUsersAfter.rows[0].count} (expected: ${sqliteUsers[0].count}) ${neonUsersAfter.rows[0].count === sqliteUsers[0].count ? '✅' : '⚠️'}`);
    console.log(`   Practice Records: ${neonPracticeBefore.rows[0].count} → ${neonPracticeAfter.rows[0].count} (expected: ${sqlitePractice[0].count}) ${neonPracticeAfter.rows[0].count === sqlitePractice[0].count ? '✅' : '⚠️'}`);

    const vocabMatch = neonVocabAfter.rows[0].count === sqliteVocab[0].count;
    const usersMatch = neonUsersAfter.rows[0].count === sqliteUsers[0].count;
    const practiceMatch = neonPracticeAfter.rows[0].count === sqlitePractice[0].count;

    if (vocabMatch && usersMatch && practiceMatch) {
      console.log('\n✅ Full verification PASSED - All counts match SQLite exactly!\n');
    } else {
      console.log('\n⚠️  Verification WARNING - Counts do not match SQLite:\n');
      if (!vocabMatch) console.log(`   • Vocabulary: expected ${sqliteVocab[0].count}, got ${neonVocabAfter.rows[0].count}`);
      if (!usersMatch) console.log(`   • Users: expected ${sqliteUsers[0].count}, got ${neonUsersAfter.rows[0].count}`);
      if (!practiceMatch) console.log(`   • Practice Records: expected ${sqlitePractice[0].count}, got ${neonPracticeAfter.rows[0].count}`);
      console.log('');
    }

    // ✨ Mark audit as completed
    const totalFailed = vocabFailed + usersFailed + practiceFailed;
    if (audit) await audit.completeWithFailures(totalFailed);

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    logSyncError(err, 'Full sync encountered a critical error', {
      operation: 'full sync to Neon'
    });
    // ✨ Record the fatal error
    if (audit) await audit.fail(err.message, err.code);
    try {
      await neonPool.end();
      await sqliteDb.close();
    } catch (cleanupErr) {
      console.error('⚠️  Cleanup failed:', cleanupErr.message);
    }
    process.exit(1);
  }
}

syncToNeon();
