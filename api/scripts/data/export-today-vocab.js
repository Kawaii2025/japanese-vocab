#!/usr/bin/env node

/**
 * Export today's vocabulary records from local SQLite to JSON.
 * Usage:
 *   node export-today-vocab.js
 *   node export-today-vocab.js --date=2026-04-22
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const primaryDbPath = path.join(__dirname, '../../../data/vocabulary.db');
const legacyDbPath = path.join(__dirname, '../../data/vocabulary.db');
const exportDir = path.join(__dirname, '../../data/exports');

function resolveDbPath() {
  // Prefer root-level data DB used by current API runtime.
  if (fs.existsSync(primaryDbPath)) {
    return primaryDbPath;
  }

  // Backward-compatible fallback for older path layout.
  return legacyDbPath;
}

function getLocalDateString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function getExportDateArg() {
  const dateArg = process.argv.find((arg) => arg.startsWith('--date='));
  if (!dateArg) {
    return getLocalDateString();
  }

  const value = dateArg.slice('--date='.length).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    console.error(`❌ Invalid date format: ${value}`);
    console.error('   Use YYYY-MM-DD, e.g. --date=2026-04-22');
    process.exit(1);
  }

  return value;
}

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

async function exportTodayVocab() {
  const exportDate = getExportDateArg();
  let db;

  try {
    console.log(`📤 Exporting vocabulary for date: ${exportDate}\n`);

    db = await open({
      filename: resolveDbPath(),
      driver: sqlite3.Database
    });

    const rows = await db.all(
      `SELECT *
       FROM vocabulary
       WHERE input_date = ?
          OR DATE(input_date) = ?
          OR DATE(input_date, 'unixepoch') = ?
       ORDER BY id`,
      exportDate,
      exportDate,
      exportDate
    );

    const payload = {
      exportDate: new Date().toISOString(),
      filterDate: exportDate,
      exportSource: 'SQLite',
      table: 'vocabulary',
      count: rows.length,
      data: rows
    };

    const datedFilename = `vocabulary-today-${exportDate}.json`;
    const datedPath = path.join(exportDir, datedFilename);
    fs.writeFileSync(datedPath, JSON.stringify(payload, null, 2));

    const latestPath = path.join(exportDir, 'vocabulary-today-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(payload, null, 2));

    console.log(`✅ Export complete`);
    console.log(`📝 Records exported: ${rows.length}`);
    console.log(`📁 Saved file: ${datedPath}`);
    console.log(`🔗 Latest copy: ${latestPath}`);

    await db.close();
  } catch (err) {
    if (db) {
      try {
        await db.close();
      } catch {
        // Ignore close errors in failure path
      }
    }

    if (String(err.message || '').includes('no such table: vocabulary')) {
      console.error('❌ Export failed: vocabulary table not found in local SQLite DB.');
      console.error('   Initialize local DB first by starting API once: npm run start');
      process.exit(1);
    }

    console.error('❌ Export failed:', err.message);
    process.exit(1);
  }
}

exportTodayVocab();
