#!/usr/bin/env node

/**
 * Sync only practice_records table to Neon
 * Usage: node sync-practice-records-to-neon.js [--partial]
 * 
 * --partial flag: Only sync changed records
 * Without flag: Full sync all practice records
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
import { ensureVocabularyReadableView } from '../../utils/ensure-neon-view.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../data/vocabulary.db');

const isPartial = process.argv.includes('--partial');

async function syncPracticeRecords() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL environment variable not set');
    err.code = 'ENV_CONFIG_ERROR';
    logSyncError(err, 'Cannot start practice records sync - missing database configuration', {
      operation: 'initialize sync'
    });
    process.exit(1);
  }

  let neonPool;
  let sqliteDb;
  let audit;
  let toSync = [];
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
    console.log(`📊 Syncing practice_records table ${isPartial ? '(partial mode)' : '(full sync)'}...\n`);

    // ✨ Start audit tracking
    audit = new AuditTracker(`practice_records_${isPartial ? 'partial' : 'full'}`, { neonPool });
    await audit.start();

    // Get counts before sync
    const neonCountBefore = await neonPool.query('SELECT COUNT(*) as count FROM practice_records');
    const sqlitePracticeAll = await sqliteDb.all('SELECT * FROM practice_records ORDER BY id');
    
    console.log(`📋 Before sync: SQLite=${sqlitePracticeAll.length} | Neon=${neonCountBefore.rows[0].count}\n`);

    // Get practice records data - declare toSync at function level to avoid scoping issues
    const sqlitePractice = sqlitePracticeAll;
    toSync = [...sqlitePractice];

    if (isPartial) {
      console.log('🔍 Checking for changes...');
      const neonPracticeMap = await getNeonTimestampMap(neonPool, 'practice_records', 'practiced_at');
      toSync = getRecordsToSync(sqlitePractice, neonPracticeMap, 'practiced_at');
      logSyncStatus(sqlitePractice.length, toSync);
    }

    console.log(`🔄 Syncing ${toSync.length} records...`);
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const row of toSync) {
      try {
        await neonPool.query(
          `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
          is_correct = $4, practice_date = $5, practiced_at = $6`,
          [row.id, row.user_id, row.vocabulary_id, row.is_correct, toTimestampMs(row.practice_date), toTimestampMs(row.practiced_at)]
        );
        syncedCount++;
      } catch (err) {
        failedCount++;
      }
    }

    // Verify sync
    const neonCountAfter = await neonPool.query('SELECT COUNT(*) as count FROM practice_records');
    await ensureVocabularyReadableView(neonPool);
    console.log('🪟 Ensured view: vocabulary_readable');
    const match = neonCountAfter.rows[0].count === sqlitePracticeAll.length;
    
    console.log(`\n🔍 After sync: Neon=${neonCountAfter.rows[0].count} ${match ? '✅' : '⚠️'}`);
    
    if (!match) {
      console.log(`   Expected ${sqlitePracticeAll.length}, got ${neonCountAfter.rows[0].count}`);
    }

    console.log(`✅ Practice records sync complete! ${toSync.length} records synced\n`);
    
    // ✨ Print and save audit
    if (audit) {
      audit.printSummary();
      await audit.save();
    }

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    logSyncError(err, 'Practice records sync encountered an error', {
      table: 'practice_records',
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

syncPracticeRecords();
