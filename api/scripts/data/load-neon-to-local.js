#!/usr/bin/env node

/**
 * Load data from Neon PostgreSQL into local SQLite database.
 *
 * Usage:
 *   node scripts/data/load-neon-to-local.js
 *   node scripts/data/load-neon-to-local.js --replace-local
 *
 * Notes:
 * - By default, this performs INSERT OR REPLACE (non-destructive merge).
 * - With --replace-local, local tables are cleared first.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import { toTimestampMs, toDateString } from '../../utils/timestamp-converter.js';

dotenv.config();
dotenv.config({ path: '.env.neon' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const primaryDbPath = path.join(__dirname, '../../../data/vocabulary.db');
const legacyDbPath = path.join(__dirname, '../../data/vocabulary.db');

function resolveDbPath() {
  if (fs.existsSync(primaryDbPath)) {
    return primaryDbPath;
  }

  return legacyDbPath;
}

function hasArg(flag) {
  return process.argv.includes(flag);
}

async function fetchNeonTable(pool, tableName) {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
    return result.rows;
  } catch (err) {
    const message = String(err.message || '');
    if (message.includes('relation') && message.includes('does not exist')) {
      console.log(`   ⚠️  ${tableName} table not found in Neon (skipping)`);
      return null;
    }
    throw err;
  }
}

async function replaceLocalData(db) {
  console.log('🧹 Clearing local tables before import...');

  // Delete child/dependent tables first to avoid FK constraint issues.
  await db.exec('DELETE FROM practice_records');
  await db.exec('DELETE FROM unfamiliar_words');
  await db.exec('DELETE FROM vocabulary');
  await db.exec('DELETE FROM users');

  console.log('   ✅ Local data cleared');
}

async function upsertVocabulary(db, rows) {
  let count = 0;
  for (const row of rows) {
    await db.run(
      `INSERT OR REPLACE INTO vocabulary
      (id, chinese, original, kana, category, difficulty, next_review_date, review_count, mastery_level, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.chinese,
        row.original,
        row.kana,
        row.category,
        row.difficulty,
        row.next_review_date,
        row.review_count ?? 0,
        row.mastery_level ?? 0,
        toTimestampMs(row.created_at),
        toTimestampMs(row.updated_at)
      ]
    );
    count += 1;
  }
  return count;
}

async function upsertUsers(db, rows) {
  let count = 0;
  for (const row of rows) {
    await db.run(
      `INSERT OR REPLACE INTO users (id, username, email, created_at)
      VALUES (?, ?, ?, ?)`,
      [row.id, row.username, row.email, toTimestampMs(row.created_at)]
    );
    count += 1;
  }
  return count;
}

async function upsertPracticeRecords(db, rows) {
  let count = 0;
  for (const row of rows) {
    await db.run(
      `INSERT OR REPLACE INTO practice_records
      (id, user_id, vocabulary_id, user_answer, is_correct, attempt_count, practice_date, practiced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.user_id,
        row.vocabulary_id,
        row.user_answer ?? null,
        row.is_correct,
        row.attempt_count ?? 1,
        row.practice_date ?? toDateString(row.practiced_at ?? row.created_at),
        toTimestampMs(row.practiced_at ?? row.created_at)
      ]
    );
    count += 1;
  }
  return count;
}

async function upsertUnfamiliarWords(db, rows) {
  let count = 0;
  for (const row of rows) {
    await db.run(
      `INSERT OR REPLACE INTO unfamiliar_words
      (id, user_id, vocabulary_id, unfamiliar_type, marked_at)
      VALUES (?, ?, ?, ?, ?)`,
      [
        row.id,
        row.user_id,
        row.vocabulary_id,
        row.unfamiliar_type,
        toTimestampMs(row.marked_at)
      ]
    );
    count += 1;
  }
  return count;
}

async function loadNeonToLocal() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set.');
    console.error('   Configure api/.env.neon with your Neon connection string.');
    process.exit(1);
  }

  const replaceLocal = hasArg('--replace-local');
  const dbPath = resolveDbPath();

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  let db;

  try {
    console.log('📥 Loading Neon data into local SQLite...\n');
    console.log(`📁 Local DB: ${dbPath}`);
    console.log(`🧭 Mode: ${replaceLocal ? 'replace-local' : 'merge-upsert'}\n`);

    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon');

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('BEGIN');

    if (replaceLocal) {
      await replaceLocalData(db);
    }

    let totalImported = 0;

    console.log('\n📝 Importing vocabulary...');
    const vocabularyRows = await fetchNeonTable(pool, 'vocabulary');
    if (vocabularyRows) {
      const imported = await upsertVocabulary(db, vocabularyRows);
      totalImported += imported;
      console.log(`   ✅ ${imported} records imported`);
    }

    console.log('\n👤 Importing users...');
    const usersRows = await fetchNeonTable(pool, 'users');
    if (usersRows) {
      const imported = await upsertUsers(db, usersRows);
      totalImported += imported;
      console.log(`   ✅ ${imported} records imported`);
    }

    console.log('\n📊 Importing practice_records...');
    const practiceRows = await fetchNeonTable(pool, 'practice_records');
    if (practiceRows) {
      const imported = await upsertPracticeRecords(db, practiceRows);
      totalImported += imported;
      console.log(`   ✅ ${imported} records imported`);
    }

    console.log('\n🏷️  Importing unfamiliar_words...');
    const unfamiliarRows = await fetchNeonTable(pool, 'unfamiliar_words');
    if (unfamiliarRows) {
      const imported = await upsertUnfamiliarWords(db, unfamiliarRows);
      totalImported += imported;
      console.log(`   ✅ ${imported} records imported`);
    }

    await db.exec('COMMIT');

    const localCounts = await db.all(`
      SELECT 'vocabulary' AS table_name, COUNT(*) AS count FROM vocabulary
      UNION ALL SELECT 'users', COUNT(*) FROM users
      UNION ALL SELECT 'practice_records', COUNT(*) FROM practice_records
      UNION ALL SELECT 'unfamiliar_words', COUNT(*) FROM unfamiliar_words
    `);

    console.log('\n✅ Neon -> local import complete!');
    console.log(`📊 Total imported: ${totalImported}`);
    console.log('📌 Local totals:');
    for (const row of localCounts) {
      console.log(`   - ${row.table_name}: ${row.count}`);
    }
  } catch (err) {
    if (db) {
      try {
        await db.exec('ROLLBACK');
      } catch {}
    }
    console.error('\n❌ Import failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (db) {
      await db.close();
    }
    await pool.end();
  }
}

loadNeonToLocal();
