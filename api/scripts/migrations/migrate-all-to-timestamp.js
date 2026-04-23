#!/usr/bin/env node

/**
 * One-time migration: normalize temporal columns to Unix-millisecond timestamps
 * for both local SQLite and Neon PostgreSQL.
 *
 * Usage:
 *   node scripts/migrations/migrate-all-to-timestamp.js [--sqlite-only] [--neon-only]
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { toTimestampMs } from '../../utils/timestamp-converter.js';

dotenv.config();
dotenv.config({ path: '.env.neon' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqliteDbPath = path.join(__dirname, '../../../data/vocabulary.db');

const sqliteOnly = process.argv.includes('--sqlite-only');
const neonOnly = process.argv.includes('--neon-only');

const SQLITE_TEMPORAL_COLUMNS = {
  vocabulary: ['next_review_date', 'created_at', 'updated_at'],
  users: ['created_at'],
  practice_records: ['practice_date', 'practiced_at']
};

async function migrateSqlite() {
  const db = await open({ filename: sqliteDbPath, driver: sqlite3.Database });

  let updatedCount = 0;
  await db.exec('BEGIN TRANSACTION');

  try {
    for (const [table, columns] of Object.entries(SQLITE_TEMPORAL_COLUMNS)) {
      const rows = await db.all(`SELECT id, ${columns.join(', ')} FROM ${table} ORDER BY id`);

      for (const row of rows) {
        const updates = [];
        const values = [];

        for (const column of columns) {
          const normalized = toTimestampMs(row[column]);
          const current = row[column] === null || row[column] === undefined || row[column] === ''
            ? null
            : Number(row[column]);
          const needsTypeRewrite = typeof row[column] === 'string' && normalized !== null;

          if (normalized !== current || needsTypeRewrite) {
            updates.push(`${column} = ?`);
            values.push(normalized);
          }
        }

        if (updates.length > 0) {
          values.push(row.id);
          await db.run(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, ...values);
          updatedCount++;
        }
      }
    }

    // Rebuild tables so timestamp columns have INTEGER affinity.
    await db.exec('PRAGMA foreign_keys = OFF');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS vocabulary_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chinese TEXT NOT NULL,
        original TEXT,
        kana TEXT NOT NULL,
        category TEXT,
        difficulty INTEGER DEFAULT 1,
        next_review_date INTEGER,
        review_count INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    await db.exec(`
      INSERT INTO vocabulary_new
      (id, chinese, original, kana, category, difficulty, next_review_date, review_count, mastery_level, created_at, updated_at)
      SELECT
        id,
        chinese,
        original,
        kana,
        category,
        difficulty,
        CAST(next_review_date AS INTEGER),
        review_count,
        mastery_level,
        CAST(created_at AS INTEGER),
        CAST(updated_at AS INTEGER)
      FROM vocabulary
    `);

    await db.exec('DROP TABLE vocabulary');
    await db.exec('ALTER TABLE vocabulary_new RENAME TO vocabulary');
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_kana ON vocabulary(kana)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(category)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_vocabulary_review_date ON vocabulary(next_review_date)');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS practice_records_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        vocabulary_id INTEGER NOT NULL,
        user_answer TEXT,
        is_correct BOOLEAN NOT NULL,
        attempt_count INTEGER DEFAULT 1,
        practice_date INTEGER,
        practiced_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      INSERT INTO practice_records_new
      (id, user_id, vocabulary_id, user_answer, is_correct, attempt_count, practice_date, practiced_at)
      SELECT
        id,
        user_id,
        vocabulary_id,
        user_answer,
        is_correct,
        attempt_count,
        CAST(practice_date AS INTEGER),
        CAST(practiced_at AS INTEGER)
      FROM practice_records
    `);

    await db.exec('DROP TABLE practice_records');
    await db.exec('ALTER TABLE practice_records_new RENAME TO practice_records');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_practice_records_user ON practice_records(user_id)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_practice_records_vocab ON practice_records(vocabulary_id)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_practice_records_date ON practice_records(practice_date)');

    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('COMMIT');
    await db.close();
    console.log(`SQLite migration complete: updated ${updatedCount} rows`);
  } catch (err) {
    await db.exec('ROLLBACK');
    try {
      await db.exec('PRAGMA foreign_keys = ON');
    } catch {}
    await db.close();
    throw err;
  }
}

async function migrateNeon() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Cannot migrate Neon.');
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const columnsToMigrate = {
    vocabulary: ['next_review_date', 'created_at', 'updated_at'],
    users: ['created_at'],
    practice_records: ['practice_date', 'practiced_at']
  };

  const getColumnType = async (table, column) => {
    const r = await pool.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column]
    );
    return r.rows[0]?.data_type || null;
  };

  const usingExpression = (column, dataType) => {
    if (!dataType) {
      throw new Error(`Column type not found for ${column}`);
    }

    if (dataType.includes('timestamp') || dataType === 'date') {
      return `(EXTRACT(EPOCH FROM ${column}) * 1000)::bigint`;
    }

    if (dataType === 'bigint' || dataType === 'integer' || dataType === 'numeric' || dataType === 'double precision') {
      return `${column}::bigint`;
    }

    if (dataType.includes('character') || dataType === 'text') {
      return `
        CASE
          WHEN ${column} IS NULL OR btrim(${column}) = '' THEN NULL
          WHEN ${column} ~ '^[0-9]+(\\.[0-9]+)?$' THEN
            CASE
              WHEN ${column}::double precision >= 1000000000000 THEN floor(${column}::double precision)::bigint
              ELSE floor(${column}::double precision * 1000)::bigint
            END
          ELSE (EXTRACT(EPOCH FROM ${column}::timestamp) * 1000)::bigint
        END`;
    }

    return `${column}::bigint`;
  };

  try {
    await pool.query('BEGIN');
    for (const [table, columns] of Object.entries(columnsToMigrate)) {
      for (const column of columns) {
        const dataType = await getColumnType(table, column);
        await pool.query(`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`);
        const sql = `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE BIGINT USING ${usingExpression(column, dataType)}`;
        await pool.query(sql);
      }
    }
    await pool.query('COMMIT');
    console.log('Neon migration complete: temporal columns normalized to BIGINT Unix-ms');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }
}

async function run() {
  try {
    if (!neonOnly) {
      await migrateSqlite();
    }

    if (!sqliteOnly) {
      await migrateNeon();
    }

    console.log('All requested migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
