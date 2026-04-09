#!/usr/bin/env node

/**
 * Import JSON data back into SQLite database
 * Usage: node import-from-json.js [filename]
 * 
 * Example:
 *   node import-from-json.js data/exports/vocabulary-latest.json
 *   node import-from-json.js data/exports/vocabulary-export-2026-04-09.json
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database is in parent/data directory
const dbPath = path.join(__dirname, '../data/vocabulary.db');
const defaultJsonPath = path.join(__dirname, '../data/exports/vocabulary-latest.json');

async function importFromJson(jsonPath) {
  try {
    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ File not found: ${jsonPath}`);
      process.exit(1);
    }

    console.log(`📥 Importing from JSON: ${jsonPath}\n`);

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    console.log(`📅 Export date: ${jsonData.exportDate}`);
    console.log(`🗂️  Tables to import: ${Object.keys(jsonData.tables).join(', ')}\n`);

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    let totalImported = 0;

    // Import vocabulary
    if (jsonData.tables.vocabulary) {
      console.log('📝 Importing vocabulary...');
      const vocabData = jsonData.tables.vocabulary;
      
      for (const row of vocabData) {
        await db.run(
          `INSERT OR REPLACE INTO vocabulary 
          (id, chinese, original, kana, category, difficulty, input_date, next_review_date, review_count, mastery_level, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.id, row.chinese, row.original, row.kana, row.category, row.difficulty,
           row.input_date, row.next_review_date, row.review_count, row.mastery_level,
           row.created_at, row.updated_at]
        );
      }
      console.log(`   ✅ ${vocabData.length} records imported`);
      totalImported += vocabData.length;
    }

    // Import users
    if (jsonData.tables.users) {
      console.log('👤 Importing users...');
      const usersData = jsonData.tables.users;
      
      for (const row of usersData) {
        await db.run(
          `INSERT OR REPLACE INTO users (id, username, email, created_at)
          VALUES (?, ?, ?, ?)`,
          [row.id, row.username, row.email, row.created_at]
        );
      }
      console.log(`   ✅ ${usersData.length} records imported`);
      totalImported += usersData.length;
    }

    // Import practice_records
    if (jsonData.tables.practice_records) {
      console.log('📊 Importing practice records...');
      const practiceData = jsonData.tables.practice_records;
      
      for (const row of practiceData) {
        await db.run(
          `INSERT OR REPLACE INTO practice_records 
          (id, user_id, vocabulary_id, is_correct, attempted_date, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [row.id, row.user_id, row.vocabulary_id, row.is_correct, row.attempted_date, row.created_at]
        );
      }
      console.log(`   ✅ ${practiceData.length} records imported`);
      totalImported += practiceData.length;
    }

    console.log(`\n✅ Import complete!`);
    console.log(`📊 Total records imported: ${totalImported}`);

    await db.close();

  } catch (err) {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
  }
}

// Get filename from command line argument or use default
const jsonPath = process.argv[2] || defaultJsonPath;
importFromJson(jsonPath);
