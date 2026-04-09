#!/usr/bin/env node

/**
 * Backup Neon PostgreSQL database to JSON format
 * Usage: node backup-neon-to-json.js
 * 
 * Creates a backup of Neon data before syncing local changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportDir = path.join(__dirname, '../data/exports');

// Ensure export directory exists
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

async function backupNeonToJson() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Cannot backup Neon.');
    console.error('   Set DATABASE_URL in your .env file to enable Neon backup.');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔐 Backing up Neon PostgreSQL database...\n');

    // Test connection
    const testConnection = await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon');

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const backupData = {
      backupDate: new Date().toISOString(),
      backupSource: 'Neon PostgreSQL',
      tables: {}
    };

    // Backup vocabulary table
    console.log('📝 Backing up vocabulary...');
    const vocabResult = await pool.query('SELECT * FROM vocabulary ORDER BY id');
    backupData.tables.vocabulary = vocabResult.rows;
    console.log(`   ✅ ${vocabResult.rows.length} records`);

    // Backup users table
    try {
      console.log('👤 Backing up users...');
      const usersResult = await pool.query('SELECT * FROM users ORDER BY id');
      backupData.tables.users = usersResult.rows;
      console.log(`   ✅ ${usersResult.rows.length} records`);
    } catch (err) {
      console.log('   ⚠️  Users table not found (skipping)');
    }

    // Backup practice_records table
    try {
      console.log('📊 Backing up practice records...');
      const practiceResult = await pool.query('SELECT * FROM practice_records ORDER BY id');
      backupData.tables.practice_records = practiceResult.rows;
      console.log(`   ✅ ${practiceResult.rows.length} records`);
    } catch (err) {
      console.log('   ⚠️  Practice records table not found (skipping)');
    }

    // Save backup file
    const filename = `neon-backup-${timestamp}.json`;
    const filepath = path.join(exportDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    console.log(`\n✅ Backup complete!`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`📊 File size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);

    // Also save a "latest" version
    const latestPath = path.join(exportDir, 'neon-backup-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2));
    console.log(`🔗 Latest backup: ${latestPath}`);

    console.log('\n💡 Tip: You can restore this backup later with:');
    console.log(`   node restore-neon-from-json.js ${filepath}`);

    await pool.end();

  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

backupNeonToJson();
