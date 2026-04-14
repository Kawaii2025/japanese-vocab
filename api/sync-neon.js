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
const envNeonExamplePath = path.join(__dirname, '.env.neon.example');

// Load .env.neon
if (!fs.existsSync(envNeonPath)) {
  console.error('\n❌ Error: .env.neon file not found\n');
  console.log('📝 Setup Instructions:');
  console.log('─'.repeat(50));
  console.log('1. Copy the example file:');
  console.log('   cp .env.neon.example .env.neon\n');
  console.log('2. Edit .env.neon and add your Neon database URL:');
  console.log('   nano .env.neon\n');
  console.log('3. Get your connection string from:');
  console.log('   https://console.neon.tech/\n');
  console.log('4. Then run sync again:');
  console.log('   npm run sync-neon\n');
  console.log('📌 Reference: .env.neon.example shows the format needed');
  console.log('─'.repeat(50) + '\n');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envNeonPath));

// Set DATABASE_URL in environment
if (envConfig.DATABASE_URL) {
  process.env.DATABASE_URL = envConfig.DATABASE_URL;
  console.log('✅ Loaded DATABASE_URL from .env.neon');
} else {
  console.error('\n❌ DATABASE_URL not found in .env.neon\n');
  console.log('📝 Configuration Error:');
  console.log('─'.repeat(50));
  console.log('The .env.neon file exists but DATABASE_URL is missing or empty.\n');
  console.log('1. Check your .env.neon file:');
  console.log('   cat .env.neon\n');
  console.log('2. Make sure it has this format:');
  console.log('   DATABASE_URL=postgresql://username:password@host/database...\n');
  console.log('📌 Reference: .env.neon.example shows the correct format');
  console.log('─'.repeat(50) + '\n');
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
