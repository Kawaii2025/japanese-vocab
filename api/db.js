/**
 * Hybrid Database: Local SQLite (Primary) + Neon PostgreSQL (Backup/Sync)
 * Benefits:
 * - Fast local reads/writes with SQLite
 * - Automatic sync to cloud Neon for backup
 * - Two-way sync capability
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite local database
const dbPath = path.join(__dirname, '../data/vocabulary.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
let sqlite = null;

export async function initializeDatabase() {
  if (sqlite) return sqlite;

  sqlite = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await sqlite.exec('PRAGMA journal_mode = WAL');  // Write-Ahead Logging
  await sqlite.exec('PRAGMA synchronous = NORMAL'); // Faster writes
  await sqlite.exec('PRAGMA foreign_keys = ON');    // Enable foreign key constraints

  await initializeSQLite();
  
  console.log('✅ SQLite Database: READY (Local Primary)');
  return sqlite;
}

// Optional: Neon PostgreSQL for backup/sync
export const neonPool = process.env.DATABASE_URL ? new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  keepAlive: true
}) : null;

if (neonPool) {
  console.log('✅ Neon Connection: CONFIGURED (Backup/Sync)');
} else {
  console.log('⚠️  Neon Connection: NOT CONFIGURED (Local-only mode)');
}

// Initialize SQLite schema if needed
export async function initializeSQLite() {
  try {
    if (!sqlite) return;

    // Create sync_status table for tracking changes
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        operation TEXT NOT NULL,
        synced BOOLEAN DEFAULT 0,
        synced_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(table_name, record_id, operation)
      );

      CREATE INDEX IF NOT EXISTS idx_sync_status_synced ON sync_status(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_status_table ON sync_status(table_name);
    `);

    // Create vocabulary table
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chinese TEXT NOT NULL,
        original TEXT,
        kana TEXT NOT NULL,
        category TEXT,
        difficulty INTEGER DEFAULT 1,
        input_date TEXT DEFAULT CURRENT_DATE,
        next_review_date TEXT,
        review_count INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_kana ON vocabulary(kana);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(category);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_input_date ON vocabulary(input_date);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_review_date ON vocabulary(next_review_date);
    `);

    // Create users table
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Create practice_records table
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS practice_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        vocabulary_id INTEGER NOT NULL,
        user_answer TEXT,
        is_correct BOOLEAN NOT NULL,
        attempt_count INTEGER DEFAULT 1,
        practice_date TEXT DEFAULT CURRENT_DATE,
        practiced_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_practice_records_user ON practice_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_practice_records_vocab ON practice_records(vocabulary_id);
      CREATE INDEX IF NOT EXISTS idx_practice_records_date ON practice_records(practice_date);
    `);

    // Create unfamiliar_words table
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS unfamiliar_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        vocabulary_id INTEGER NOT NULL,
        unfamiliar_type TEXT NOT NULL,
        marked_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(user_id, vocabulary_id, unfamiliar_type),
        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_unfamiliar_words_user ON unfamiliar_words(user_id);
    `);

    console.log('✅ SQLite schema initialized');
  } catch (err) {
    console.error('❌ SQLite initialization error:', err.message);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (sqlite) await sqlite.close();
  if (neonPool) await neonPool.end();
  console.log('📊 Databases closed');
  process.exit(0);
});

export default async () => {
  return await initializeDatabase();
};

