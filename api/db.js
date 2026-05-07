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
import { createNeonWrapper } from './utils/neon-wrapper.js';
import { setDatabaseType } from './utils/timezone.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite local database path (only used locally, not on Vercel)
const dbPath = path.join(__dirname, '../data/vocabulary.db');

// Ensure data directory exists (only for local development, not on Vercel)
const dataDir = path.dirname(dbPath);
if (!process.env.DATABASE_URL && !fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.warn('⚠️  Could not create data directory:', err.message);
  }
}

// Initialize SQLite database
let sqlite = null;
let database = null;
let useNeon = false;

const SQLITE_KANA_INDEX = 'idx_vocabulary_kana';
const SQLITE_ORIGINAL_KANA_UNIQUE_INDEX = 'idx_vocabulary_original_kana_unique';
const NEON_OLD_KANA_CONSTRAINT = 'vocabulary_kana_key';
const NEON_ORIGINAL_KANA_UNIQUE_INDEX = 'idx_vocabulary_original_kana_unique';

// Initialize Neon Pool FIRST (before initializeDatabase)
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
  console.log('✅ Neon Connection Pool: CREATED');
} else {
  console.log('⚠️  Neon Connection: NOT CONFIGURED (DATABASE_URL not set)');
}

export async function initializeDatabase() {
  // Determine which database to use
  const hasDatabaesUrl = !!process.env.DATABASE_URL;
  console.log(`[DB Init] DATABASE_URL present: ${hasDatabaesUrl}`);
  console.log(`[DB Init] neonPool exists: ${!!neonPool}`);
  
  useNeon = hasDatabaesUrl && neonPool;

  if (useNeon) {
    // Production: Use Neon PostgreSQL for Vercel serverless
    setDatabaseType(true);  // Tell timezone utils we're using Neon
    console.log('🔄 Initializing Neon PostgreSQL (Production Mode)...');

    // Test connection
    try {
      const result = await neonPool.query('SELECT NOW()');
      console.log('✅ Neon PostgreSQL: CONNECTED');
      await initializeNeon();
      
      // Return wrapped Neon pool to provide SQLite-compatible API
      database = createNeonWrapper(neonPool);
      return database;
    } catch (err) {
      console.error('❌ Neon Connection Failed:', err.message);
      throw err;
    }
  } else {
    // Local: Use SQLite
    setDatabaseType(false);  // Tell timezone utils we're using SQLite
    if (sqlite) return sqlite;
    
    console.log('🔄 Initializing SQLite Database (Local Mode)...');
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
        word_class TEXT,
        next_review_date TEXT,
        review_count INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    // Add word_class column if it doesn't exist
    try {
      await sqlite.exec('ALTER TABLE vocabulary ADD COLUMN word_class TEXT');
    } catch (err) {
      // Ignore error if column already exists
    }

    // Migrate old kana-only uniqueness to original+kana uniqueness.
    await sqlite.exec(`
      DROP INDEX IF EXISTS ${SQLITE_KANA_INDEX};
      CREATE INDEX IF NOT EXISTS ${SQLITE_KANA_INDEX} ON vocabulary(kana);
      CREATE UNIQUE INDEX IF NOT EXISTS ${SQLITE_ORIGINAL_KANA_UNIQUE_INDEX}
      ON vocabulary(COALESCE(original, ''), kana);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(category);
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

    // Create ai_examples_cache table for caching AI generated examples
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS ai_examples_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original TEXT,
        kana TEXT NOT NULL,
        chinese TEXT NOT NULL,
        word_class TEXT,
        examples_json TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_examples_cache_unique 
      ON ai_examples_cache(COALESCE(original, ''), kana, chinese, COALESCE(word_class, ''));

      CREATE INDEX IF NOT EXISTS idx_ai_examples_cache_lookup ON ai_examples_cache(COALESCE(original, ''), kana);
    `);

    console.log('✅ SQLite schema initialized');
  } catch (err) {
    console.error('❌ SQLite initialization error:', err.message);
  }
}

// Initialize Neon PostgreSQL schema
export async function initializeNeon() {
  try {
    if (!neonPool) return;

    // Create vocabulary table
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id SERIAL PRIMARY KEY,
        chinese TEXT NOT NULL,
        original TEXT,
        kana TEXT NOT NULL,
        category TEXT,
        difficulty INTEGER DEFAULT 1,
        word_class TEXT,
        next_review_date TEXT,
        review_count INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );

      ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS ${NEON_OLD_KANA_CONSTRAINT};
      CREATE INDEX IF NOT EXISTS idx_vocabulary_kana ON vocabulary(kana);
      CREATE UNIQUE INDEX IF NOT EXISTS ${NEON_ORIGINAL_KANA_UNIQUE_INDEX}
      ON vocabulary ((COALESCE(original, '')), kana);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(category);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_review_date ON vocabulary(next_review_date);
    `);
    // Add word_class column if it doesn't exist
    try {
      await neonPool.query('ALTER TABLE vocabulary ADD COLUMN word_class TEXT');
    } catch (err) {
      // Ignore error if column already exists
    }

    // Create users table
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    // Create practice_records table
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS practice_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        vocabulary_id INTEGER NOT NULL,
        user_answer TEXT,
        is_correct BOOLEAN NOT NULL,
        attempt_count INTEGER DEFAULT 1,
        practice_date TEXT DEFAULT CURRENT_DATE,
        practiced_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_practice_records_user ON practice_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_practice_records_vocab ON practice_records(vocabulary_id);
      CREATE INDEX IF NOT EXISTS idx_practice_records_date ON practice_records(practice_date);
    `);

    // Create unfamiliar_words table
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS unfamiliar_words (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        vocabulary_id INTEGER NOT NULL,
        unfamiliar_type TEXT NOT NULL,
        marked_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        UNIQUE(user_id, vocabulary_id, unfamiliar_type),
        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_unfamiliar_words_user ON unfamiliar_words(user_id);
    `);

    // Create ai_examples_cache table for caching AI generated examples
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS ai_examples_cache (
        id SERIAL PRIMARY KEY,
        original TEXT,
        kana TEXT NOT NULL,
        chinese TEXT NOT NULL,
        word_class TEXT,
        examples_json TEXT NOT NULL,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        UNIQUE((COALESCE(original, '')), kana, chinese, COALESCE(word_class, ''))
      );

      CREATE INDEX IF NOT EXISTS idx_ai_examples_cache_lookup ON ai_examples_cache((COALESCE(original, '')), kana);
    `);

    console.log('✅ Neon PostgreSQL schema initialized');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✅ Neon PostgreSQL schema already exists');
    } else {
      console.error('❌ Neon initialization error:', err.message);
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📊 Shutting down databases...');
  if (sqlite) {
    try {
      await sqlite.close();
      console.log('📊 SQLite closed');
    } catch (err) {
      console.warn('⚠️  Error closing SQLite:', err.message);
    }
  }
  if (neonPool) {
    try {
      await neonPool.end();
      console.log('📊 Neon PostgreSQL closed');
    } catch (err) {
      console.warn('⚠️  Error closing Neon:', err.message);
    }
  }
  process.exit(0);
});

// Helper to get database type info
export function getDatabaseInfo() {
  return {
    type: useNeon ? 'Neon PostgreSQL' : 'SQLite (Local)',
    isNeon: useNeon,
    hasUrlSet: !!process.env.DATABASE_URL
  };
}

export default async () => {
  return await initializeDatabase();
};

