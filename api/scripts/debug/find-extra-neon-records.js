#!/usr/bin/env node

/**
 * Find records that exist in Neon but not in SQLite
 * This helps identify discrepancies between the two databases
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
dotenv.config({ path: '.env.neon' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../data/vocabulary.db');

async function findExtraRecords() {
  let pool;
  let db;
  
  try {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    db = await open({ filename: dbPath, driver: sqlite3.Database });

    console.log('🔍 Comparing vocabulary records...\n');

    // Get all IDs from SQLite
    const sqliteIds = await db.all('SELECT id FROM vocabulary ORDER BY id');
    console.log(`✅ SQLite: ${sqliteIds.length} records`);

    // Get all IDs from Neon
    const neonResult = await pool.query('SELECT COUNT(*) as count FROM vocabulary');
    console.log(`✅ Neon: ${neonResult.rows[0].count} records\n`);

    // Create sets for comparison
    const sqliteIdSet = new Set(sqliteIds.map(r => r.id));
    const neonResult2 = await pool.query('SELECT id FROM vocabulary ORDER BY id');
    const neonIdSet = new Set(neonResult2.rows.map(r => r.id));

    // Find extra records
    const extraAtNeon = Array.from(neonIdSet).filter(id => !sqliteIdSet.has(id));
    const missingAtNeon = Array.from(sqliteIdSet).filter(id => !neonIdSet.has(id));

    if (extraAtNeon.length > 0) {
      console.log(`⚠️  Found ${extraAtNeon.length} extra record(s) at Neon:\n`);
      const extras = await pool.query(
        'SELECT id, chinese, original, kana, category, difficulty FROM vocabulary WHERE id = ANY($1) ORDER BY id',
        [extraAtNeon]
      );
      
      console.log('ID | Chinese | Original | Kana | Category | Difficulty');
      console.log('---|---------|----------|------|----------|----------');
      extras.rows.forEach(r => {
        console.log(`${r.id} | ${r.chinese} | ${r.original} | ${r.kana} | ${r.category} | ${r.difficulty}`);
      });
    } else {
      console.log('✅ No extra records at Neon');
    }

    if (missingAtNeon.length > 0) {
      console.log(`\n⚠️  Found ${missingAtNeon.length} missing record(s) at Neon:\n`);
      const missing = await db.all(
        'SELECT id, chinese, original, kana, category, difficulty FROM vocabulary WHERE id IN (' +
        missingAtNeon.map(() => '?').join(',') + ') ORDER BY id',
        missingAtNeon
      );
      
      console.log('ID | Chinese | Original | Kana | Category | Difficulty');
      console.log('---|---------|----------|------|----------|----------');
      missing.forEach(r => {
        console.log(`${r.id} | ${r.chinese} | ${r.original} | ${r.kana} | ${r.category} | ${r.difficulty}`);
      });
    } else {
      console.log('✅ All SQLite records exist at Neon');
    }

    await pool.end();
    await db.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

findExtraRecords();
