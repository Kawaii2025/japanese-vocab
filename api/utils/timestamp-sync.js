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
    `SELECT
       id,
       CASE
         WHEN ${column} IS NULL THEN NULL
         WHEN pg_typeof(${column})::text IN ('timestamp without time zone', 'timestamp with time zone', 'date')
           THEN EXTRACT(EPOCH FROM ${column}) * 1000
         ELSE (${column})::double precision
       END AS timestamp_ms
     FROM ${table}
     ORDER BY id`
  );
  return new Map(
    result.rows
      .filter((r) => r.timestamp_ms !== null && r.timestamp_ms !== undefined)
      .map((r) => [r.id, Math.floor(Number(r.timestamp_ms))])
  );
}

/**
 * Compare and filter records for syncing
 * Syncs records that are:
 * - Missing in Neon, OR
 * - Updated in SQLite (newer timestamp than Neon)
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
    // Sync if SQLite timestamp is newer than Neon (any difference)
    else if (sqliteMs > neonMs) {
      toSync.push(row.id);
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
