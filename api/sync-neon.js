#!/usr/bin/env node

/**
 * Sync to Neon wrapper - automatically loads DATABASE_URL from .env.neon
 * Usage: node sync-neon.js
 * Or: npm run sync-neon
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envNeonPath = path.join(__dirname, '.env.neon');

// Load .env.neon
if (!fs.existsSync(envNeonPath)) {
  console.error('❌ Error: .env.neon file not found');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envNeonPath));

// Set DATABASE_URL in environment
if (envConfig.DATABASE_URL) {
  process.env.DATABASE_URL = envConfig.DATABASE_URL;
  console.log('✅ Loaded DATABASE_URL from .env.neon');
} else {
  console.error('❌ DATABASE_URL not found in .env.neon');
  process.exit(1);
}

// Run the sync script
console.log('🔄 Starting Neon sync...\n');
try {
  execSync('node sync-to-neon-partial.js', {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('\n❌ Sync failed');
  process.exit(1);
}
