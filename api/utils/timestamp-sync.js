/**
 * Timestamp comparison utilities for Neon/SQLite sync
 * Provides reliable timestamp comparison using EXTRACT(EPOCH) to avoid timezone issues
 */

/**
 * Get timestamps from Neon using EXTRACT(EPOCH)
 * @param {Pool} neonPool - PostgreSQL connection pool
 * @param {string} table - Table name
 * @param {string} column - Timestamp column name
 * @returns {Map} Map of id -> milliseconds
 */
export async function getNeonTimestampMap(neonPool, table, column) {
  const result = await neonPool.query(
    `SELECT id, EXTRACT(EPOCH FROM ${column}) * 1000 as timestamp_ms FROM ${table} ORDER BY id`
  );
  return new Map(result.rows.map(r => [r.id, Math.floor(r.timestamp_ms)]));
}

/**
 * Compare and filter records for syncing
 * Syncs records that are:
 * - Missing in Neon, OR
 * - Genuinely newer in SQLite (>1hr difference)
 * 
 * @param {Array} sqliteRecords - SQLite records with timestamp field
 * @param {Map} neonTimestampMap - Map from getNeonTimestampMap
 * @param {string} timestampField - Field name in sqliteRecords containing milliseconds
 * @returns {Array} IDs of records that need syncing
 */
export function getRecordsToSync(sqliteRecords, neonTimestampMap, timestampField = 'updated_at') {
  const toSync = [];
  
  for (const row of sqliteRecords) {
    const neonMs = neonTimestampMap.get(row.id);
    const sqliteMs = row[timestampField];
    
    // If record doesn't exist in Neon, sync it
    if (neonMs === undefined) {
      toSync.push(row.id);
    } 
    // Compare timestamps - sync if SQLite is newer (>1hr)
    else {
      const diff = sqliteMs - neonMs;
      if (diff > 3600000) {
        toSync.push(row.id);
      }
    }
  }
  
  return toSync;
}

/**
 * Log sync status
 * @param {number} total - Total records in SQLite
 * @param {Array} toSync - IDs to sync
 */
export function logSyncStatus(total, toSync) {
  console.log(`   Total: ${total} | To sync: ${toSync.length} | Skipped: ${total - toSync.length}\n`);
}
