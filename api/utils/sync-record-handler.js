/**
 * Enhanced sync with per-record error handling
 * Allows graceful recovery if individual records fail to sync
 */

/**
 * Sync records with per-record error handling
 * Continues syncing even if individual records fail
 * 
 * @param {Array} records - Records to sync
 * @param {Object} pool - Database pool connection
 * @param {String} tableName - Table name for logging
 * @param {Function} syncFn - Function to sync individual record
 * @returns {Object} Results with succeeded, failed, and skipped counts
 */
export async function syncRecordsWithErrorHandling(records, pool, tableName, syncFn) {
  const results = {
    succeeded: 0,
    failed: 0,
    failedIds: [],
    errors: []
  };

  console.log(`🔄 Syncing ${records.length} ${tableName} records...`);

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await syncFn(record, pool);
      results.succeeded++;
      process.stdout.write('.');
    } catch (err) {
      results.failed++;
      results.failedIds.push(record.id);
      results.errors.push({
        id: record.id,
        message: err.message,
        index: i + 1
      });
      process.stdout.write('✗');
    }
  }

  console.log(''); // Newline after progress dots

  // Report detailed results
  if (results.failed === 0) {
    console.log(`   ✅ All ${results.succeeded} records synced successfully\n`);
  } else {
    console.log(`   ⚠️  Results: ${results.succeeded} succeeded, ${results.failed} failed\n`);
    
    if (results.failed <= 5) {
      // Show details for small number of failures
      console.log('   Failed records:');
      results.errors.forEach(err => {
        console.log(`     • Record ${err.id}: ${err.message}`);
      });
      console.log('');
    } else {
      // Show summary for many failures
      console.log(`   Failed IDs: ${results.failedIds.join(', ')}\n`);
    }
  }

  return results;
}

/**
 * Sync individual vocabulary record
 */
export async function syncVocabularyRecord(row, pool) {
  const msToDate = (ms) => {
    if (!ms || ms === null || ms === undefined) return null;
    const num = Number(ms);
    if (isNaN(num)) return null;
    try {
      return new Date(num).toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

  const msToTimestamp = (ms) => {
    if (!ms || ms === null || ms === undefined) return null;
    const num = Number(ms);
    if (isNaN(num)) return null;
    try {
      return new Date(num).toISOString();
    } catch (e) {
      return null;
    }
  };

  await pool.query(
    `INSERT INTO vocabulary 
    (id, chinese, original, kana, category, difficulty, input_date, next_review_date, review_count, mastery_level, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (id) DO UPDATE SET
    chinese = $2, original = $3, kana = $4, category = $5, difficulty = $6,
    input_date = $7, next_review_date = $8, review_count = $9, mastery_level = $10,
    created_at = $11, updated_at = $12`,
    [row.id, row.chinese, row.original, row.kana, row.category, row.difficulty,
     msToDate(row.input_date), msToDate(row.next_review_date), row.review_count, row.mastery_level,
     msToTimestamp(row.created_at), msToTimestamp(row.updated_at)]
  );
}

/**
 * Sync individual user record
 */
export async function syncUserRecord(row, pool) {
  const msToTimestamp = (ms) => {
    if (!ms || ms === null || ms === undefined) return null;
    const num = Number(ms);
    if (isNaN(num)) return null;
    try {
      return new Date(num).toISOString();
    } catch (e) {
      return null;
    }
  };

  await pool.query(
    `INSERT INTO users (id, username, email, created_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE SET
    username = $2, email = $3`,
    [row.id, row.username, row.email, msToTimestamp(row.created_at)]
  );
}

/**
 * Sync individual practice record
 */
export async function syncPracticeRecord(row, pool) {
  const msToDate = (ms) => {
    if (!ms || ms === null || ms === undefined) return null;
    const num = Number(ms);
    if (isNaN(num)) return null;
    try {
      return new Date(num).toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

  const msToTimestamp = (ms) => {
    if (!ms || ms === null || ms === undefined) return null;
    const num = Number(ms);
    if (isNaN(num)) return null;
    try {
      return new Date(num).toISOString();
    } catch (e) {
      return null;
    }
  };

  await pool.query(
    `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
    is_correct = $4, practice_date = $5, practiced_at = $6`,
    [row.id, row.user_id, row.vocabulary_id, row.is_correct, msToDate(row.practice_date), msToTimestamp(row.practiced_at)]
  );
}
