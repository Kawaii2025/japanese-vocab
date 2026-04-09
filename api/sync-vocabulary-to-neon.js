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

async function syncVocabulary() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const neonPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });

  try {
    console.log(`📝 Syncing vocabulary table ${isPartial ? '(partial mode)' : '(full sync)'}...\n`);

    // Get vocabulary data
    let sqliteVocab = await sqliteDb.all('SELECT * FROM vocabulary ORDER BY id');
    let toSync = [...sqliteVocab];

    if (isPartial) {
      console.log('🔍 Checking for changes...');
      const neonVocab = await neonPool.query('SELECT id, updated_at FROM vocabulary ORDER BY id');
      const neonVocabMap = new Map(neonVocab.rows.map(r => [r.id, new Date(r.updated_at)]));

      toSync = sqliteVocab.filter(row => {
        const neonUpdated = neonVocabMap.get(row.id);
        const sqliteUpdated = new Date(msToTimestamp(row.updated_at));
        return !neonUpdated || sqliteUpdated > neonUpdated;
      });

      console.log(`   Total: ${sqliteVocab.length} | To sync: ${toSync.length} | Skipped: ${sqliteVocab.length - toSync.length}\n`);
    }

    console.log(`🔄 Syncing ${toSync.length} records...`);
    for (const row of toSync) {
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
    }

    console.log(`✅ Vocabulary sync complete! ${toSync.length} records synced`);
    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    console.error('❌ Vocabulary sync failed:', err.message);
    await neonPool.end();
    await sqliteDb.close();
    process.exit(1);
  }
}

syncVocabulary();
