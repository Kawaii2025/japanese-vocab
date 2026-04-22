#!/usr/bin/env node

/**
 * Partial Sync: Only sync changed records
 * Compares SQLite vs Neon `updated_at` timestamps
 * Includes merge conflict detection (like git merge)
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
import { SyncAudit } from '../../utils/sync-audit.js';
import { detectMergeConflicts, resolveConflicts, applyMergeResolution } from '../../utils/sync-merge-conflicts.js';

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

const toUnixMs = (num) => (Math.abs(num) >= 1e12 ? num : num * 1000);

// SQLite date fields may be YYYY-MM-DD text, Unix seconds, or Unix milliseconds
const msToDate = (val) => {
  if (!val || val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const num = Number(trimmed);
    if (!isNaN(num)) {
      try {
        return new Date(toUnixMs(num)).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  const num = Number(val);
  if (isNaN(num)) return null;
  try {
    return new Date(toUnixMs(num)).toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
};

// SQLite timestamp fields may be Unix seconds or Unix milliseconds
const msToTimestamp = (sec) => {
  if (!sec || sec === null || sec === undefined || sec === '') return null;
  const num = Number(sec);
  if (isNaN(num)) return null;
  try {
    return new Date(toUnixMs(num)).toISOString();
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

    // ✨ Start audit tracking
    audit = new SyncAudit(neonPool, 'partial');
    const auditId = await audit.start();
    console.log(`📋 Audit started (ID: ${auditId})\n`);

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
    let vocabFailedCount = 0;
    let usersSyncedCount = 0;
    let usersFailedCount = 0;
    let practiceSyncedCount = 0;
    let practiceFailedCount = 0;

    // ============ VOCABULARY ============
    try {
      console.log('📝 Checking vocabulary...');
      
      const sqliteVocab = await sqliteDb.all('SELECT id, updated_at FROM vocabulary ORDER BY id');
      const neonVocabMap = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
      let vocabToSync = getRecordsToSync(sqliteVocab, neonVocabMap, 'updated_at');
      
      logSyncStatus(sqliteVocab.length, vocabToSync);

      // 🔀 Check for merge conflicts BEFORE syncing
      let conflicts = [];
      let resolutions = {};
      
      if (vocabToSync.length > 0) {
        // Get full data from both sources for conflict detection
        const sqliteFullVocab = await sqliteDb.all(
          `SELECT * FROM vocabulary WHERE id IN (${vocabToSync.join(',')}) ORDER BY id`
        );
        const neonFullVocab = await neonPool.query(
          `SELECT id, chinese, original, kana, category, difficulty, input_date, next_review_date, 
                  review_count, mastery_level, created_at, updated_at FROM vocabulary 
           WHERE id IN (${vocabToSync.join(',')}) ORDER BY id`
        );
        
        // Create maps for easy lookup
        const sqliteVocabMap = new Map(sqliteFullVocab.map(v => [v.id, v]));
        const neonVocabDataMap = new Map(neonFullVocab.rows.map(v => [v.id, v]));
        
        // Detect conflicts
        conflicts = detectMergeConflicts(sqliteFullVocab, neonVocabMap, neonVocabDataMap);
        
        if (conflicts.length > 0) {
          // Ask user to resolve conflicts
          resolutions = await resolveConflicts(conflicts);
          
          // Apply resolution to determine actual sync list
          const mergeResult = applyMergeResolution(vocabToSync, resolutions, conflicts);
          vocabToSync = mergeResult.toSync;
          
          console.log(`\n📊 After conflict resolution: ${vocabToSync.length} records to sync\n`);
        }
      }

      vocabSyncedCount = vocabToSync.length;

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
        
        // 📋 Record synced vocabulary IDs in audit
        if (audit) {
          await audit.recordSyncedRecords('vocabulary', vocabToSync);
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
      vocabFailedCount = vocabToSync?.length || 0;
      if (audit) await audit.recordError(0, 'vocabulary', err.message, err.code);
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
      usersFailedCount = usersToSync?.length || 0;
      if (audit) await audit.recordError(0, 'users', err.message, err.code);
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
      practiceFailedCount = practiceToSync?.length || 0;
      if (audit) await audit.recordError(0, 'practice_records', err.message, err.code);
    }

    // ✨ Update audit with progress (vocabulary only for partial sync)
    if (audit) {
      await audit.updateProgress({
        vocabulary: { succeeded: vocabSyncedCount, failed: vocabFailedCount }
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

    // ✨ Mark audit as completed (vocabulary only)
    const totalFailed = vocabFailedCount;  // Only count vocabulary failures
    if (audit) await audit.completeWithFailures(totalFailed);

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    logSyncError(err, 'Partial sync encountered a critical error', {
      operation: 'partial sync to Neon'
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

partialSyncToNeon();
