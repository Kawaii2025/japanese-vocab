#!/usr/bin/env node

/**
 * Export SQLite database to JSON format
 * Usage: node export-to-json.js
 * 
 * This creates text-based JSON backups that can be safely committed to GitHub
 * Company security policies can accept text files but not binary database files
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
const exportDir = path.join(__dirname, '../data/exports');

// Ensure export directory exists
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

async function exportToJson() {
  try {
    console.log('📤 Exporting SQLite to JSON format...\n');

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const exportData = {
      exportDate: new Date().toISOString(),
      exportSource: 'SQLite',
      tables: {}
    };

    // Export vocabulary table
    console.log('📝 Exporting vocabulary...');
    const vocabulary = await db.all('SELECT * FROM vocabulary ORDER BY id');
    exportData.tables.vocabulary = vocabulary;
    console.log(`   ✅ ${vocabulary.length} records`);

    // Export users table
    try {
      console.log('👤 Exporting users...');
      const users = await db.all('SELECT * FROM users ORDER BY id');
      exportData.tables.users = users;
      console.log(`   ✅ ${users.length} records`);
    } catch (err) {
      console.log('   ⚠️  Users table not found (skipping)');
    }

    // Export practice_records table
    try {
      console.log('📊 Exporting practice records...');
      const practice = await db.all('SELECT * FROM practice_records ORDER BY id');
      exportData.tables.practice_records = practice;
      console.log(`   ✅ ${practice.length} records`);
    } catch (err) {
      console.log('   ⚠️  Practice records table not found (skipping)');
    }

    // Save to file
    const filename = `vocabulary-export-${timestamp}.json`;
    const filepath = path.join(exportDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Export complete!`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`📊 File size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);

    // Also save a "latest" version for easy access
    const latestPath = path.join(exportDir, 'vocabulary-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(exportData, null, 2));
    console.log(`🔗 Latest copy: ${latestPath}`);

    await db.close();

  } catch (err) {
    console.error('❌ Export failed:', err.message);
    process.exit(1);
  }
}

exportToJson();
