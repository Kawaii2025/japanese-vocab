#!/usr/bin/env node

/**
 * Sync only users table to Neon
 * Usage: node sync-users-to-neon.js [--partial]
 * 
 * --partial flag: Only sync changed records
 * Without flag: Full sync all users
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../data/vocabulary.db');

const isPartial = process.argv.includes('--partial');

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

async function syncUsers() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL environment variable not set');
    err.code = 'ENV_CONFIG_ERROR';
    logSyncError(err, 'Cannot start users sync - missing database configuration', {
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
    console.log(`👤 Syncing users table ${isPartial ? '(partial mode)' : '(full sync)'}...\n`);

    // ✨ Start audit tracking
    audit = new AuditTracker(`users_${isPartial ? 'partial' : 'full'}`, { neonPool });
    await audit.start();

    // Get counts before sync
    const neonCountBefore = await neonPool.query('SELECT COUNT(*) as count FROM users');
    const sqliteUsersAll = await sqliteDb.all('SELECT * FROM users ORDER BY id');
    
    console.log(`📋 Before sync: SQLite=${sqliteUsersAll.length} | Neon=${neonCountBefore.rows[0].count}\n`);

    // Get users data - declare toSync at function level to avoid scoping issues
    const sqliteUsers = sqliteUsersAll;
    let toSync = [...sqliteUsers];

    if (isPartial) {
      console.log('🔍 Checking for changes...');
      const neonUsersMap = await getNeonTimestampMap(neonPool, 'users', 'created_at');
      toSync = getRecordsToSync(sqliteUsers, neonUsersMap, 'created_at');
      logSyncStatus(sqliteUsers.length, toSync);
    }

    console.log(`🔄 Syncing ${toSync.length} records...`);
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const row of toSync) {
      try {
        await neonPool.query(
          `INSERT INTO users (id, username, email, created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET
          username = $2, email = $3`,
          [row.id, row.username, row.email, msToTimestamp(row.created_at)]
        );
        syncedCount++;
      } catch (err) {
        failedCount++;
      }
    }

    // Verify sync
    const neonCountAfter = await neonPool.query('SELECT COUNT(*) as count FROM users');
    const match = neonCountAfter.rows[0].count === sqliteUsersAll.length;
    
    console.log(`\n🔍 After sync: Neon=${neonCountAfter.rows[0].count} ${match ? '✅' : '⚠️'}`);
    
    if (!match) {
      console.log(`   Expected ${sqliteUsersAll.length}, got ${neonCountAfter.rows[0].count}`);
    }

    console.log(`✅ Users sync complete! ${toSync.length} records synced\n`);
    
    // ✨ Print and save audit
    if (audit) {
      audit.printSummary();
      await audit.save();
    }

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    logSyncError(err, 'Users sync encountered an error', {
      table: 'users',
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

syncUsers();
