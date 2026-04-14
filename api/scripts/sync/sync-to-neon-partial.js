#!/usr/bin/env node

/**
 * Partial Sync: Only sync changed records
 * Compares SQLite vs Neon `updated_at` timestamps
 * Usage: node sync-to-neon-partial.js
 * 
 * This is MUCH faster than full sync - only pushes changed data!
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { getNeonTimestampMap, getRecordsToSync, logSyncStatus } from '../../utils/timestamp-sync.js';
import { logSyncError, formatSyncError } from '../../utils/error-handler.js';

dotenv.config();

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

// Helper to convert JS milliseconds to date string (YYYY-MM-DD)
const msToDate = (ms) => {
  if (!ms || ms === null || ms === undefined || ms === '') return null;
  const num = Number(ms);
  if (isNaN(num)) return null;
  try {
    return new Date(num).toISOString().split('T')[0];
  } catch (e) {
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
    return null;
  }
};


async function partialSyncToNeon() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL environment variable not set');
    err.code = 'ENV_CONFIG_ERROR';
    logSyncError(err, 'Cannot start partial sync - missing database configuration', {
      operation: 'initialize sync'
    });
    console.log('📝 Setup Instructions:');
    console.log('─'.repeat(50));
    console.log('Option 1: Use .env.neon (Recommended)');
    console.log('  • Copy template: cp .env.neon.example .env.neon');
    console.log('  • Edit file: nano .env.neon');
    console.log('  • Add your Neon connection URL');
    console.log('  • Run again: npm run sync-neon\n');
    console.log('Option 2: Use .env file');
    console.log('  • Copy template: cp .env.example .env');
    console.log('  • Edit file: nano .env');
    console.log('  • Uncomment DATABASE_URL and add your connection URL');
    console.log('  • Run directly: npx node sync-to-neon-partial.js\n');
    console.log('🔗 Get your Neon URL from: https://console.neon.tech/\n');
    console.log('📌 Reference: .env.neon.example shows the format needed');
    console.log('─'.repeat(50) + '\n');
    process.exit(1);
  }

  console.log('⚡ Partial Sync: Only sync changed records\n');

  let neonPool;
  let sqliteDb;

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
    console.log('🔐 Connecting to Neon...');
    try {
      await neonPool.query('SELECT NOW()');
      console.log('✅ Connected\n');
    } catch (connErr) {
      logSyncError(connErr, 'Failed to connect to Neon database', {
        operation: 'Neon connection test'
      });
      throw connErr;
    }

    console.log('📊 Comparing changes...\n');

    // Get counts before sync
    const sqliteVocabBefore = await sqliteDb.all('SELECT COUNT(*) as count FROM vocabulary');
    const sqliteUsersBefore = await sqliteDb.all('SELECT COUNT(*) as count FROM users');
    const sqlitePracticeBefore = await sqliteDb.all('SELECT COUNT(*) as count FROM practice_records');

    const neonVocabBefore = await neonPool.query('SELECT COUNT(*) as count FROM vocabulary');
    const neonUsersBefore = await neonPool.query('SELECT COUNT(*) as count FROM users');
    const neonPracticeBefore = await neonPool.query('SELECT COUNT(*) as count FROM practice_records');

    console.log('📋 Record counts before sync:');
    console.log(`   Vocabulary: SQLite=${sqliteVocabBefore[0].count} | Neon=${neonVocabBefore.rows[0].count}`);
    console.log(`   Users: SQLite=${sqliteUsersBefore[0].count} | Neon=${neonUsersBefore.rows[0].count}`);
    console.log(`   Practice Records: SQLite=${sqlitePracticeBefore[0].count} | Neon=${neonPracticeBefore.rows[0].count}\n`);

    // Track how many records were synced
    let vocabSyncedCount = 0;
    let usersSyncedCount = 0;
    let practiceSyncedCount = 0;

    // ============ VOCABULARY ============
    try {
      console.log('📝 Checking vocabulary...');
      
      const sqliteVocab = await sqliteDb.all('SELECT id, updated_at FROM vocabulary ORDER BY id');
      const neonVocabMap = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
      let vocabToSync = getRecordsToSync(sqliteVocab, neonVocabMap, 'updated_at');
      vocabSyncedCount = vocabToSync.length;
      
      logSyncStatus(sqliteVocab.length, vocabToSync);

      if (vocabToSync.length > 0) {
        const sqliteVocabData = await sqliteDb.all(`
          SELECT * FROM vocabulary WHERE id IN (${vocabToSync.join(',')}) ORDER BY id
        `);

        for (const row of sqliteVocabData) {
          await neonPool.query(
            `INSERT INTO vocabulary 
            (id, chinese, original, kana, category, difficulty, input_date, next_review_date, review_count, mastery_level, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET
            chinese = $2, original = $3, kana = $4, category = $5, difficulty = $6,
            input_date = $7, next_review_date = $8, review_count = $9, mastery_level = $10,
            created_at = $11, updated_at = $12`,
            [row.id, row.chinese, row.original, row.kana, row.category, row.difficulty,
             msToDate(row.input_date), msToDate(row.next_review_date), row.review_count, row.mastery_level,
             msToTimestamp(row.created_at), msToTimestamp(row.updated_at)]
          );
        }
        console.log(`   ✅ ${vocabToSync.length} vocabulary items synced\n`);
      } else {
        console.log(`   ✅ No changes needed\n`);
      }
    } catch (err) {
      logSyncError(err, 'Syncing vocabulary failed', {
        table: 'vocabulary',
        operation: 'fetch and sync vocabulary items',
        attemptedRecordCount: vocabToSync?.length
      });
    }

    // ============ USERS ============
    try {
      console.log('👤 Checking users...');
      
      const sqliteUsers = await sqliteDb.all('SELECT id, created_at FROM users ORDER BY id');
      const neonUsersMap = await getNeonTimestampMap(neonPool, 'users', 'created_at');
      let usersToSync = getRecordsToSync(sqliteUsers, neonUsersMap, 'created_at');
      usersSyncedCount = usersToSync.length;
      
      logSyncStatus(sqliteUsers.length, usersToSync);

      if (usersToSync.length > 0) {
        const sqliteUsersData = await sqliteDb.all(`
          SELECT * FROM users WHERE id IN (${usersToSync.join(',')}) ORDER BY id
        `);

        for (const row of sqliteUsersData) {
          await neonPool.query(
            `INSERT INTO users (id, username, email, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
            username = $2, email = $3`,
            [row.id, row.username, row.email, msToTimestamp(row.created_at)]
          );
        }
        console.log(`   ✅ ${usersToSync.length} users synced\n`);
      } else {
        console.log(`   ✅ No changes needed\n`);
      }
    } catch (err) {
      logSyncError(err, 'Syncing users failed', {
        table: 'users',
        operation: 'fetch and sync users',
        attemptedRecordCount: sqliteUsersData?.length
      });
    }

    // ============ PRACTICE RECORDS ============
    try {
      console.log('📊 Checking practice records...');
      
      const sqlitePractice = await sqliteDb.all('SELECT id, practiced_at FROM practice_records ORDER BY id');
      const neonPracticeMap = await getNeonTimestampMap(neonPool, 'practice_records', 'practiced_at');
      let practiceToSync = getRecordsToSync(sqlitePractice, neonPracticeMap, 'practiced_at');
      practiceSyncedCount = practiceToSync.length;
      
      logSyncStatus(sqlitePractice.length, practiceToSync);

      if (practiceToSync.length > 0) {
        const sqlitePracticeData = await sqliteDb.all(`
          SELECT * FROM practice_records WHERE id IN (${practiceToSync.join(',')}) ORDER BY id
        `);

        for (const row of sqlitePracticeData) {
          await neonPool.query(
            `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
            is_correct = $4, practice_date = $5, practiced_at = $6`,
            [row.id, row.user_id, row.vocabulary_id, row.is_correct, msToDate(row.practice_date), msToTimestamp(row.practiced_at)]
          );
        }
        console.log(`   ✅ ${practiceToSync.length} practice records synced\n`);
      } else {
        console.log(`   ✅ No changes needed\n`);
      }
    } catch (err) {
      logSyncError(err, 'Syncing practice records failed', {
        table: 'practice_records',
        operation: 'fetch and sync practice records',
        attemptedRecordCount: sqlitePracticeData?.length
      });
    }

    // ============ VERIFICATION ============
    console.log('🔍 Verifying sync results...\n');
    
    const neonVocabAfter = await neonPool.query('SELECT COUNT(*) as count FROM vocabulary');
    const neonUsersAfter = await neonPool.query('SELECT COUNT(*) as count FROM users');
    const neonPracticeAfter = await neonPool.query('SELECT COUNT(*) as count FROM practice_records');

    const totalSynced = vocabSyncedCount + usersSyncedCount + practiceSyncedCount;

    console.log('📊 Sync Summary:');
    console.log(`   Vocabulary: ${vocabSyncedCount} records synced (${neonVocabBefore.rows[0].count} → ${neonVocabAfter.rows[0].count})`);
    console.log(`   Users: ${usersSyncedCount} records synced (${neonUsersBefore.rows[0].count} → ${neonUsersAfter.rows[0].count})`);
    console.log(`   Practice Records: ${practiceSyncedCount} records synced (${neonPracticeBefore.rows[0].count} → ${neonPracticeAfter.rows[0].count})\n`);

    // For partial sync, we're OK as long as:
    // 1. No records were removed
    // 2. Only new/updated records were added
    const vocabOK = neonVocabAfter.rows[0].count >= neonVocabBefore.rows[0].count;
    const usersOK = neonUsersAfter.rows[0].count >= neonUsersBefore.rows[0].count;
    const practiceOK = neonPracticeAfter.rows[0].count >= neonPracticeBefore.rows[0].count;

    if (vocabOK && usersOK && practiceOK) {
      console.log('✅ Sync verification PASSED - No records were lost\n');
      if (totalSynced === 0) {
        console.log('📌 Note: Zero records needed syncing (all up to date)\n');
      }
    } else {
      console.log('⚠️  Sync verification WARNING - Record count decreased:\n');
      if (!vocabOK) console.log(`   • Vocabulary: ${neonVocabBefore.rows[0].count} → ${neonVocabAfter.rows[0].count} ❌`);
      if (!usersOK) console.log(`   • Users: ${neonUsersBefore.rows[0].count} → ${neonUsersAfter.rows[0].count} ❌`);
      if (!practiceOK) console.log(`   • Practice Records: ${neonPracticeBefore.rows[0].count} → ${neonPracticeAfter.rows[0].count} ❌`);
      console.log('\n   Please investigate data loss!\n');
    }

    console.log('✅ Partial sync complete!\n');

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    logSyncError(err, 'Partial sync encountered a critical error', {
      operation: 'partial sync to Neon'
    });
    try {
      await neonPool.end();
      await sqliteDb.close();
    } catch (cleanupErr) {
      console.error('⚠️  Cleanup failed:', cleanupErr.message);
    }
    process.exit(1);
  }
}

partialSyncToNeon();
