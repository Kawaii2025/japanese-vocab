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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/vocabulary.db');

const isPartial = process.argv.includes('--partial');

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

async function syncPracticeRecords() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const neonPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });

  try {
    console.log(`📊 Syncing practice_records table ${isPartial ? '(partial mode)' : '(full sync)'}...\n`);

    // Get practice records data
    let sqlitePractice = await sqliteDb.all('SELECT * FROM practice_records ORDER BY id');
    let toSync = [...sqlitePractice];

    if (isPartial) {
      console.log('🔍 Checking for changes...');
      const neonPractice = await neonPool.query('SELECT id, practiced_at FROM practice_records ORDER BY id');
      const neonPracticeMap = new Map(neonPractice.rows.map(r => [r.id, new Date(r.practiced_at)]));

      toSync = sqlitePractice.filter(row => {
        const neonPracticed = neonPracticeMap.get(row.id);
        const sqlitePracticed = new Date(msToTimestamp(row.practiced_at));
        return !neonPracticed || sqlitePracticed > neonPracticed;
      });

      console.log(`   Total: ${sqlitePractice.length} | To sync: ${toSync.length} | Skipped: ${sqlitePractice.length - toSync.length}\n`);
    }

    console.log(`🔄 Syncing ${toSync.length} records...`);
    for (const row of toSync) {
      await neonPool.query(
        `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
        is_correct = $4, practice_date = $5, practiced_at = $6`,
        [row.id, row.user_id, row.vocabulary_id, row.is_correct, msToDate(row.practice_date), msToTimestamp(row.practiced_at)]
      );
    }

    console.log(`✅ Practice records sync complete! ${toSync.length} records synced`);
    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    console.error('❌ Practice records sync failed:', err.message);
    await neonPool.end();
    await sqliteDb.close();
    process.exit(1);
  }
}

syncPracticeRecords();
