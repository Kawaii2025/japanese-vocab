#!/usr/bin/env node

/**
 * Sync ai_examples_cache table to Neon
 * Usage: node sync-ai-cache-to-neon.js [--full]
 * 
 * --full flag: Full sync all records
 * Without flag: Only sync new/changed records
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

const isFull = process.argv.includes('--full');

async function syncAiCache() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  let neonPool;
  let sqliteDb;
  try {
    neonPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (err) {
    console.error('❌ Failed to initialize database connections:', err.message);
    process.exit(1);
  }

  try {
    console.log(`📝 Syncing ai_examples_cache table ${isFull ? '(full sync)' : '(incremental)'}...\n`);

    // Get counts before sync
    const neonCountBefore = await neonPool.query('SELECT COUNT(*) as count FROM ai_examples_cache');
    const sqliteCacheAll = await sqliteDb.all('SELECT * FROM ai_examples_cache ORDER BY id');
    
    console.log(`📋 Before sync: SQLite=${sqliteCacheAll.length} | Neon=${neonCountBefore.rows[0].count}\n`);

    let toSync = sqliteCacheAll;
    
    if (!isFull && sqliteCacheAll.length > 0) {
      console.log('🔍 Checking for new records...');
      // Get max id from Neon to only sync newer records
      const neonMaxResult = await neonPool.query('SELECT MAX(id) as max_id FROM ai_examples_cache');
      const neonMaxId = neonMaxResult.rows[0].max_id || 0;
      toSync = sqliteCacheAll.filter(row => row.id > neonMaxId);
      console.log(`   Found ${toSync.length} new record(s) to sync\n`);
    }

    if (toSync.length === 0) {
      console.log('✅ No new records to sync');
      await neonPool.end();
      await sqliteDb.close();
      return;
    }

    console.log(`🔄 Syncing ${toSync.length} record(s)...`);
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const row of toSync) {
      try {
        await neonPool.query(
          `INSERT INTO ai_examples_cache 
          (id, original, kana, chinese, word_class, examples_json, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
          original = $2, kana = $3, chinese = $4, word_class = $5, 
          examples_json = $6, created_at = $7`,
          [row.id, row.original, row.kana, row.chinese, row.word_class, row.examples_json, row.created_at]
        );
        syncedCount++;
      } catch (err) {
        failedCount++;
        console.error(`   ❌ Failed to sync id=${row.id}:`, err.message);
      }
    }

    // Verify sync
    const neonCountAfter = await neonPool.query('SELECT COUNT(*) as count FROM ai_examples_cache');
    const afterCount = Number(neonCountAfter.rows[0].count);
    
    console.log(`\n🔍 After sync: Neon=${afterCount}`);
    console.log(`✅ Ai cache sync complete! ${syncedCount} record(s) synced`);
    
    if (failedCount > 0) {
      console.log(`⚠️  ${failedCount} record(s) failed to sync`);
    }

    await neonPool.end();
    await sqliteDb.close();

  } catch (err) {
    console.error('❌ Ai cache sync error:', err.message);
    
    try {
      await neonPool.end();
      await sqliteDb.close();
    } catch (cleanupErr) {
      console.error('⚠️  Cleanup failed:', cleanupErr.message);
    }
    process.exit(1);
  }
}

syncAiCache();
