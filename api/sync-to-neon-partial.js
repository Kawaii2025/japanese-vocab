#!/usr/bin/env node

/**
 * Partial Sync: Only sync changed records
 * Compares SQLite vs Neon `updated_at` timestamps
 * Usage: node sync-to-neon-partial.js
 * 
 * This is MUCH faster than full sync - only pushes changed data!
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/vocabulary.db');

// Helper to ask user for confirmation
async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

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

async function partialSyncToNeon() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Cannot sync to Neon.');
    process.exit(1);
  }

  console.log('⚡ Partial Sync: Only sync changed records\n');

  const neonPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  const sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log('🔐 Connecting to Neon...');
    await neonPool.query('SELECT NOW()');
    console.log('✅ Connected\n');

    console.log('📊 Comparing changes...\n');

    // ============ VOCABULARY ============
    console.log('📝 Checking vocabulary...');
    
    // Get all Neon vocabulary
    const neonVocab = await neonPool.query('SELECT id, updated_at FROM vocabulary ORDER BY id');
    const neonVocabMap = new Map(neonVocab.rows.map(r => [r.id, new Date(r.updated_at)]));

    // Get all SQLite vocabulary
    const sqliteVocab = await sqliteDb.all('SELECT id, updated_at FROM vocabulary ORDER BY id');
    
    let vocabToSync = [];
    for (const row of sqliteVocab) {
      const neonUpdated = neonVocabMap.get(row.id);
      const sqliteUpdated = new Date(msToTimestamp(row.updated_at));
      
      // Sync if: record doesn't exist in Neon OR SQLite version is newer
      if (!neonUpdated || sqliteUpdated > neonUpdated) {
        vocabToSync.push(row.id);
      }
    }

    console.log(`   Total: ${sqliteVocab.length} | To sync: ${vocabToSync.length} | Skipped: ${sqliteVocab.length - vocabToSync.length}`);

    if (vocabToSync.length > 0) {
      const sqliteVocabData = await sqliteDb.all(`
        SELECT * FROM vocabulary WHERE id IN (${vocabToSync.join(',')}) ORDER BY id
      `);

      for (const row of sqliteVocabData) {
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
      console.log(`   ✅ ${vocabToSync.length} vocabulary items synced\n`);
    } else {
      console.log(`   ✅ No changes needed\n`);
    }

    // ============ USERS ============
    try {
      console.log('👤 Checking users...');
      
      const neonUsers = await neonPool.query('SELECT id, created_at FROM users ORDER BY id');
      const neonUsersMap = new Map(neonUsers.rows.map(r => [r.id, new Date(r.created_at)]));

      const sqliteUsers = await sqliteDb.all('SELECT id, created_at FROM users ORDER BY id');
      
      let usersToSync = [];
      for (const row of sqliteUsers) {
        const neonCreated = neonUsersMap.get(row.id);
        const sqliteCreated = new Date(msToTimestamp(row.created_at));
        
        if (!neonCreated || sqliteCreated > neonCreated) {
          usersToSync.push(row.id);
        }
      }

      console.log(`   Total: ${sqliteUsers.length} | To sync: ${usersToSync.length} | Skipped: ${sqliteUsers.length - usersToSync.length}`);

      if (usersToSync.length > 0) {
        const sqliteUsersData = await sqliteDb.all(`
          SELECT * FROM users WHERE id IN (${usersToSync.join(',')}) ORDER BY id
        `);

        for (const row of sqliteUsersData) {
          await neonPool.query(
            `INSERT INTO users (id, username, email, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
            username = $2, email = $3`,
            [row.id, row.username, row.email, msToTimestamp(row.created_at)]
          );
        }
        console.log(`   ✅ ${usersToSync.length} users synced\n`);
      } else {
        console.log(`   ✅ No changes needed\n`);
      }
    } catch (err) {
      console.log('   ⚠️  Users check failed:', err.message, '\n');
    }

    // ============ PRACTICE RECORDS ============
    try {
      console.log('📊 Checking practice records...');
      
      const neonPractice = await neonPool.query('SELECT id, practiced_at FROM practice_records ORDER BY id');
      const neonPracticeMap = new Map(neonPractice.rows.map(r => [r.id, new Date(r.practiced_at)]));

      const sqlitePractice = await sqliteDb.all('SELECT id, practiced_at FROM practice_records ORDER BY id');
      
      let practiceToSync = [];
      for (const row of sqlitePractice) {
        const neonPracticed = neonPracticeMap.get(row.id);
        const sqlitePracticed = new Date(msToTimestamp(row.practiced_at));
        
        if (!neonPracticed || sqlitePracticed > neonPracticed) {
          practiceToSync.push(row.id);
        }
      }

      console.log(`   Total: ${sqlitePractice.length} | To sync: ${practiceToSync.length} | Skipped: ${sqlitePractice.length - practiceToSync.length}`);

      if (practiceToSync.length > 0) {
        const sqlitePracticeData = await sqliteDb.all(`
          SELECT * FROM practice_records WHERE id IN (${practiceToSync.join(',')}) ORDER BY id
        `);

        for (const row of sqlitePracticeData) {
          await neonPool.query(
            `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
            is_correct = $4, practice_date = $5, practiced_at = $6`,
            [row.id, row.user_id, row.vocabulary_id, row.is_correct, msToDate(row.practice_date), msToTimestamp(row.practiced_at)]
          );
        }
        console.log(`   ✅ ${practiceToSync.length} practice records synced\n`);
      } else {
        console.log(`   ✅ No changes needed\n`);
      }
    } catch (err) {
      console.log('   ⚠️  Practice records check failed:', err.message, '\n');
    }

    console.log('✅ Partial sync complete!\n');

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    console.error('❌ Partial sync failed:', err.message);
    await neonPool.end();
    await sqliteDb.close();
    process.exit(1);
  }
}

partialSyncToNeon();
