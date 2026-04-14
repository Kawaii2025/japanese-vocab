/**
 * Sync Progress Tracker
 * Shows real-time progress during record-by-record sync with error handling
 * 
 * Features:
 * - Progress indicator: . for success, ✗ for failure
 * - Track succeeded/failed/error details
 * - Detailed report after sync
 * - Safe retry on next sync (uses timestamp comparison)
 */

/**
 * Sync records with per-record error handling and progress display
 * 
 * @param {Array} records - Array of records to sync
 * @param {pg.Pool} pool - Neon connection pool
 * @param {string} tableName - Table name being synced
 * @param {Function} syncFn - Async function to sync a single record
 *   Expected signature: async (record, pool) => void
 * @returns {Object} Result object with statistics
 */
export async function syncRecordsWithProgress(records, pool, tableName, syncFn) {
  const results = {
    table: tableName,
    total: records.length,
    succeeded: 0,
    failed: 0,
    errors: [],
    failedIds: [],
    failedRecords: []
  };

  if (records.length === 0) {
    return results;
  }

  // Progress indicator line
  process.stdout.write('   Progress: ');
  const startIndex = process.stdout.columns ? process.stdout.columns : 80;
  let lineLength = 16; // "   Progress: " length

  for (const record of records) {
    try {
      await syncFn(record, pool);
      
      // Write progress dot
      process.stdout.write('.');
      lineLength++;
      results.succeeded++;

      // Wrap to next line if needed (leave room for summary)
      if (lineLength > 75) {
        process.stdout.write('\n              ');
        lineLength = 14;
      }
    } catch (err) {
      // Write progress cross
      process.stdout.write('✗');
      lineLength++;
      results.failed++;
      results.failedIds.push(record.id);
      results.failedRecords.push(record);
      results.errors.push({
        recordId: record.id,
        message: err.message,
        code: err.code
      });

      // Wrap to next line if needed
      if (lineLength > 75) {
        process.stdout.write('\n              ');
        lineLength = 14;
      }
    }
  }

  // Finish progress line
  process.stdout.write('\n');

  return results;
}

/**
 * Display sync results in a user-friendly format
 * 
 * @param {Object} results - Result object from syncRecordsWithProgress
 */
export function displaySyncResults(results) {
  if (results.total === 0) {
    console.log(`   ✅ No changes needed\n`);
    return;
  }

  const successRate = Math.round((results.succeeded / results.total) * 100);
  const icon = results.failed === 0 ? '✅' : (successRate >= 80 ? '⚠️ ' : '❌');

  console.log(`   ${icon} ${results.succeeded}/${results.total} succeeded (${successRate}%)`);

  if (results.failed > 0) {
    console.log(`   ❌ ${results.failed} failed:\n`);
    
    results.errors.forEach((err, idx) => {
      console.log(`      ${idx + 1}. ID ${err.recordId}: ${err.message}`);
      if (process.env.DEBUG_SYNC) {
        console.log(`         Code: ${err.code}\n`);
      }
    });

    console.log(`\n   💡 These ${results.failed} record(s) will be retried on next sync`);
    console.log(`      Run again: npm run sync-neon\n`);
  } else {
    console.log();
  }
}

/**
 * Individual sync functions for each table type
 */

export async function syncVocabularyRecord(record, pool, msToDate, msToTimestamp) {
  await pool.query(
    `INSERT INTO vocabulary 
    (id, chinese, original, kana, category, difficulty, input_date, next_review_date, review_count, mastery_level, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (id) DO UPDATE SET
    chinese = $2, original = $3, kana = $4, category = $5, difficulty = $6,
    input_date = $7, next_review_date = $8, review_count = $9, mastery_level = $10,
    created_at = $11, updated_at = $12`,
    [
      record.id, record.chinese, record.original, record.kana, record.category, 
      record.difficulty, msToDate(record.input_date), msToDate(record.next_review_date), 
      record.review_count, record.mastery_level, msToTimestamp(record.created_at), 
      msToTimestamp(record.updated_at)
    ]
  );
}

export async function syncUserRecord(record, pool, msToTimestamp) {
  await pool.query(
    `INSERT INTO users (id, username, email, created_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE SET
    username = $2, email = $3`,
    [record.id, record.username, record.email, msToTimestamp(record.created_at)]
  );
}

export async function syncPracticeRecord(record, pool, msToDate, msToTimestamp) {
  await pool.query(
    `INSERT INTO practice_records (id, user_id, vocabulary_id, is_correct, practice_date, practiced_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
    is_correct = $4, practice_date = $5, practiced_at = $6`,
    [
      record.id, record.user_id, record.vocabulary_id, record.is_correct, 
      msToDate(record.practice_date), msToTimestamp(record.practiced_at)
    ]
  );
}
