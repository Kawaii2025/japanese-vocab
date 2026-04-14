/**
 * Generic Database Migration Runner
 * Usage: node run-migration.js <sql-file-name>
 * Examples:
 *   node run-migration.js add-unique-constraint.sql
 *   node run-migration.js sync-audit-tables.sql
 */
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get SQL file from command line arguments
const sqlFileName = process.argv[2];
if (!sqlFileName) {
  console.error('❌ Usage: node run-migration.js <sql-file-name>');
  console.error('Examples:');
  console.error('  node run-migration.js add-unique-constraint.sql');
  console.error('  node run-migration.js sync-audit-tables.sql');
  process.exit(1);
}

dotenv.config();
dotenv.config({ path: '.env.neon' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log(`🔄 Running migration: ${sqlFileName}\n`);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    console.error('   Create .env.neon file with your Neon database URL');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, sqlFileName);
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Migration file not found: ${sqlFileName}`);
      console.error(`   Looking in: ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL:\n');
    console.log(sql);
    console.log('\n');
    
    // Execute migration
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === '42P01') {
      console.log('\n💡 Tip: Table does not exist');
    } else if (error.code === '23505') {
      console.log('\n💡 Tip: Constraint already exists');
    } else if (error.code === '42P07') {
      console.log('\n💡 Tip: Constraint name already exists');
    } else {
      console.error('\nFull error:', error);
    }
    
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration();
