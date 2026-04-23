#!/usr/bin/env node

/**
 * Sync only vocabulary table to Neon
 * Usage: node sync-vocabulary-to-neon.js [--partial]
 * 
 * --partial flag: Only sync changed records (compare updated_at)
 * Without flag: Full sync all vocabulary
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNeonTimestampMap, getRecordsToSync, logSyncStatus } from '../../utils/timestamp-sync.js';
import { logSyncError } from '../../utils/error-handler.js';
import { AuditTracker } from '../../utils/audit-tracker.js';
import { toTimestampMs } from '../../utils/timestamp-converter.js';

dotenv.config();
dotenv.config({ path: '.env.neon' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../data/vocabulary.db');

const isPartial = process.argv.includes('--partial');

async function syncVocabulary() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL environment variable not set');
    err.code = 'ENV_CONFIG_ERROR';
    logSyncError(err, 'Cannot start vocabulary sync - missing database configuration', {
      operation: 'initialize sync'
    });
    process.exit(1);
  }

  let neonPool;
  let sqliteDb;
  let audit;
  try {
    neonPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (err) {
    logSyncError(err, 'Failed to initialize database connections', {
      operation: 'database initialization'
    });
    process.exit(1);
  }

  try {
    console.log(`📝 Syncing vocabulary table ${isPartial ? '(partial mode)' : '(full sync)'}...\n`);

    // ✨ Start audit tracking
    audit = new AuditTracker(`vocabulary_${isPartial ? 'partial' : 'full'}`, { neonPool });
    await audit.start();

    // Get counts before sync
    const neonCountBefore = await neonPool.query('SELECT COUNT(*) as count FROM vocabulary');
    const sqliteVocabAll = await sqliteDb.all('SELECT * FROM vocabulary ORDER BY id');
    
    console.log(`📋 Before sync: SQLite=${sqliteVocabAll.length} | Neon=${neonCountBefore.rows[0].count}\n`);

    // Get vocabulary data - declare toSync at function level to avoid scoping issues
    const sqliteVocab = sqliteVocabAll;
    let toSync = [...sqliteVocab];

    if (isPartial) {
      console.log('🔍 Checking for changes...');
      const neonVocabMap = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
      toSync = getRecordsToSync(sqliteVocab, neonVocabMap, 'updated_at');
      logSyncStatus(sqliteVocab.length, toSync);
    }

    console.log(`🔄 Syncing ${toSync.length} records...`);
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const row of toSync) {
      try {
        await neonPool.query(
          `INSERT INTO vocabulary 
          (id, chinese, original, kana, category, difficulty, next_review_date, review_count, mastery_level, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
          chinese = $2, original = $3, kana = $4, category = $5, difficulty = $6,
          next_review_date = $7, review_count = $8, mastery_level = $9,
          updated_at = $11`,
          [row.id, row.chinese, row.original, row.kana, row.category, row.difficulty,
            toTimestampMs(row.next_review_date), row.review_count, row.mastery_level,
            toTimestampMs(row.created_at), toTimestampMs(row.updated_at)]
        );
        syncedCount++;
      } catch (err) {
        failedCount++;
        if (audit) await audit.recordError(row.id, 'vocabulary', err.message, err.code);
      }
    }

    // ✨ Update audit with progress
    if (audit) {
      await audit.updateProgress({
        vocabulary: { succeeded: syncedCount, failed: failedCount }
      });
    }

    // Verify sync
    const neonCountAfter = await neonPool.query('SELECT COUNT(*) as count FROM vocabulary');
    const match = neonCountAfter.rows[0].count === sqliteVocabAll.length;
    
    console.log(`\n🔍 After sync: Neon=${neonCountAfter.rows[0].count} ${match ? '✅' : '⚠️'}`);
    
    if (!match) {
      console.log(`   Expected ${sqliteVocabAll.length}, got ${neonCountAfter.rows[0].count}`);
    }

    // ✨ Update audit with verification results
    if (audit) {
      await audit.verify({
        table: 'vocabulary',
        expectedCount: sqliteVocabAll.length,
        actualCount: neonCountAfter.rows[0].count,
        match: match
      });
    }

    console.log(`✅ Vocabulary sync complete! ${toSync.length} records synced\n`);
    
    // ✨ Print and save audit
    if (audit) {
      audit.printSummary();
      await audit.save();
    }

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    logSyncError(err, 'Vocabulary sync encountered an error', {
      table: 'vocabulary',
      operation: isPartial ? 'partial sync changed records' : 'full sync all records',
      attemptedRecordCount: toSync?.length
    });

    // ✨ Print and save audit before exit
    if (audit) {
      audit.printSummary();
      try {
        await audit.save();
      } catch (saveErr) {
        console.error('⚠️  Failed to save audit:', saveErr.message);
      }
    }

    try {
      await neonPool.end();
      await sqliteDb.close();
    } catch (cleanupErr) {
      console.error('⚠️  Cleanup failed:', cleanupErr.message);
    }
    process.exit(1);
  }
}

syncVocabulary();
