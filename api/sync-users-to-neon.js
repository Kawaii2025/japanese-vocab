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
import { getNeonTimestampMap, getRecordsToSync, logSyncStatus } from './utils/timestamp-sync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/vocabulary.db');

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
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const neonPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });

  try {
    console.log(`👤 Syncing users table ${isPartial ? '(partial mode)' : '(full sync)'}...\n`);

    // Get users data
    let sqliteUsers = await sqliteDb.all('SELECT * FROM users ORDER BY id');
    let toSync = [...sqliteUsers];

    if (isPartial) {
      console.log('🔍 Checking for changes...');
      const neonUsersMap = await getNeonTimestampMap(neonPool, 'users', 'created_at');
      toSync = getRecordsToSync(sqliteUsers, neonUsersMap, 'created_at');
      logSyncStatus(sqliteUsers.length, toSync);
    }

    console.log(`🔄 Syncing ${toSync.length} records...`);
    for (const row of toSync) {
      await neonPool.query(
        `INSERT INTO users (id, username, email, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
        username = $2, email = $3`,
        [row.id, row.username, row.email, msToTimestamp(row.created_at)]
      );
    }

    console.log(`✅ Users sync complete! ${toSync.length} records synced`);
    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    console.error('❌ Users sync failed:', err.message);
    await neonPool.end();
    await sqliteDb.close();
    process.exit(1);
  }
}

syncUsers();
