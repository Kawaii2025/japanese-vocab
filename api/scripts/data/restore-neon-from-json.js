#!/usr/bin/env node

/**
 * Restore Neon PostgreSQL database from JSON backup
 * Usage: node restore-neon-from-json.js [backup-file.json]
 * 
 * Example:
 *   node restore-neon-from-json.js data/exports/neon-backup-latest.json
 *   node restore-neon-from-json.js data/exports/neon-backup-2026-04-09.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultBackupPath = path.join(__dirname, '../../data/exports/neon-backup-latest.json');

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

async function restoreNeonFromJson(backupPath) {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Cannot restore to Neon.');
    process.exit(1);
  }

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  console.log(`📥 Restoring Neon from backup: ${backupPath}\n`);

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`📅 Backup date: ${backupData.backupDate}`);
  console.log(`🗂️  Tables to restore: ${Object.keys(backupData.tables).join(', ')}\n`);

  const confirmed = await askConfirmation('⚠️  This will REPLACE data in Neon. Continue? (y/n): ');
  if (!confirmed) {
    console.log('\n❌ Cancelled.');
    process.exit(0);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔐 Connecting to Neon...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected\n');

    console.log('🔄 Restoring data...\n');

    // Restore vocabulary
    if (backupData.tables.vocabulary) {
      console.log('📝 Restoring vocabulary...');
      const vocabData = backupData.tables.vocabulary;

      // First clear existing data
      await pool.query('DELETE FROM vocabulary');

      for (const row of vocabData) {
        await pool.query(
          `INSERT INTO vocabulary 
          (id, chinese, original, kana, category, difficulty, input_date, next_review_date, review_count, mastery_level, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [row.id, row.chinese, row.original, row.kana, row.category, row.difficulty,
           row.input_date, row.next_review_date, row.review_count, row.mastery_level,
           row.created_at, row.updated_at]
        );
      }
      console.log(`   ✅ ${vocabData.length} records restored`);
    }

    // Restore users
    if (backupData.tables.users) {
      console.log('👤 Restoring users...');
      const usersData = backupData.tables.users;

      await pool.query('DELETE FROM users');

      for (const row of usersData) {
        await pool.query(
          `INSERT INTO users (id, username, email, created_at)
          VALUES ($1, $2, $3, $4)`,
          [row.id, row.username, row.email, row.created_at]
        );
      }
      console.log(`   ✅ ${usersData.length} records restored`);
    }

    // Restore practice records
    if (backupData.tables.practice_records) {
      console.log('📊 Restoring practice records...');
      const practiceData = backupData.tables.practice_records;

      await pool.query('DELETE FROM practice_records');

      for (const row of practiceData) {
        await pool.query(
          `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [row.id, row.user_id, row.vocabulary_id, row.is_correct, row.practice_date, row.practiced_at]
        );
      }
      console.log(`   ✅ ${practiceData.length} records restored`);
    }

    console.log('\n✅ Restore complete!');
    await pool.end();

  } catch (err) {
    console.error('❌ Restore failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

// Get filename from command line argument or use default
const backupPath = process.argv[2] || defaultBackupPath;
restoreNeonFromJson(backupPath);
