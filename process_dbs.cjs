const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

async function processDb(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`Database not found: ${dbPath}`);
    return;
  }
  console.log(`Processing database: ${dbPath}`);
  const db = new sqlite3.Database(dbPath);

  const run = (sql) => new Promise((resolve, reject) => {
    db.run(sql, (err) => err ? reject(err) : resolve());
  });

  const all = (sql) => new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => err ? reject(err) : resolve(rows));
  });

  try {
    await run('DROP INDEX IF EXISTS idx_vocabulary_input_date');
    
    const columns = await all('PRAGMA table_info(vocabulary)');
    if (columns.some(col => col.name === 'input_date')) {
      await run('ALTER TABLE vocabulary DROP COLUMN input_date');
      console.log('Dropped input_date column.');
    } else {
      console.log('input_date column does not exist.');
    }

    const remainingColumns = await all('PRAGMA table_info(vocabulary)');
    console.log(`Remaining columns: ${remainingColumns.map(c => c.name).join(', ')}`);
  } catch (err) {
    console.error(`Error processing ${dbPath}:`, err.message);
  } finally {
    db.close();
  }
}

async function main() {
  await processDb(path.join(process.cwd(), 'data/vocabulary.db'));
  await processDb(path.join(process.cwd(), 'api/data/vocabulary.db'));
}

main();
