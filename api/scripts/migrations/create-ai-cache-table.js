#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../data/vocabulary.db');

async function createAiCacheTable() {
  console.log('🔄 Creating ai_examples_cache table...');
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Create ai_examples_cache table without UNIQUE constraint on expressions
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ai_examples_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original TEXT,
        kana TEXT NOT NULL,
        chinese TEXT NOT NULL,
        word_class TEXT,
        examples_json TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Create unique index instead
    await db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_examples_cache_unique 
      ON ai_examples_cache(COALESCE(original, ''), kana, chinese, COALESCE(word_class, ''));
    `);

    // Create lookup index
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_examples_cache_lookup 
      ON ai_examples_cache(COALESCE(original, ''), kana);
    `);

    console.log('✅ ai_examples_cache table created successfully!');

    // Verify table was created
    const result = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_examples_cache'");
    if (result) {
      console.log('✅ Table verified: ai_examples_cache exists');
    }

  } catch (err) {
    console.error('❌ Error creating table:', err.message);
  } finally {
    await db.close();
  }
}

createAiCacheTable();
