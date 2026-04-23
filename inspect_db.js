const sqlite3 = require('sqlite3').verbose();

async function inspect(dbPath) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return resolve({ path: dbPath, error: err.message });
      
      const columns = ['input_date', 'next_review_date', 'created_at', 'updated_at'];
      const results = { path: dbPath, columns: {} };
      
      db.all("SELECT 1 FROM vocabulary LIMIT 1", [], (err) => {
          if (err) {
              db.close();
              return resolve({ path: dbPath, error: err.message });
          }
          
          let pending = columns.length;
          columns.forEach(col => {
            const query = "SELECT typeof(" + col + ") as type, count(*) as count FROM vocabulary GROUP BY type";
            db.all(query, [], (err, types) => {
                if (err) {
                    results.columns[col] = { error: err.message };
                    pending--;
                    if (pending === 0) { db.close(); resolve(results); }
                } else {
                    const samplesQuery = "SELECT " + col + " FROM vocabulary WHERE typeof(" + col + ") NOT IN ('integer', 'real') LIMIT 3";
                    db.all(samplesQuery, [], (err, samples) => {
                        results.columns[col] = { types };
                        if (!err) {
                            results.columns[col].samples = samples.map(s => s[col]);
                        }
                        pending--;
                        if (pending === 0) { db.close(); resolve(results); }
                    });
                }
            });
          });
      });
    });
  });
}

async function main() {
  const paths = ['data/vocabulary.db', 'api/data/vocabulary.db'];
  const finalResults = [];
  for (const path of paths) {
    finalResults.push(await inspect(path));
  }
  console.log(JSON.stringify(finalResults, null, 2));
}

main();
