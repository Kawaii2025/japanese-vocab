/**
 * Sync Audit & Error Tracking Utility
 * 
 * Usage:
 *   import { SyncAudit } from '../../utils/sync-audit.js';
 *   
 *   const audit = new SyncAudit(neonPool, 'partial');
 *   await audit.start();
 *   
 *   try {
 *     // ... sync operations ...
 *     await audit.updateProgress({ vocabulary: { succeeded: 5, failed: 0 } });
 *     await audit.complete();
 *   } catch (err) {
 *     await audit.recordError(recordId, 'vocabulary', err.message, err.code);
 *     await audit.fail(err.message, err.code);
 *   }
 */

export class SyncAudit {
  constructor(pool, syncType = 'partial') {
    this.pool = pool;
    this.syncType = syncType;
    this.auditId = null;
    this.startTime = null;
  }

  /**
   * Start a new sync audit record
   */
  async start() {
    try {
      const result = await this.pool.query(
        `INSERT INTO sync_audit (sync_type, status, started_at)
         VALUES ($1, $2, NOW())
         RETURNING id, started_at`,
        [this.syncType, 'running']
      );
      this.auditId = result.rows[0].id;
      this.startTime = result.rows[0].started_at;
      return this.auditId;
    } catch (err) {
      console.error('Failed to start sync audit:', err.message);
      // Don't fail sync if audit fails - it's optional
      return null;
    }
  }

  /**
   * Update progress during sync
   * @param {Object} tableStats - { vocabulary: {succeeded: 5, failed: 1}, users: {...} }
   */
  async updateProgress(tableStats) {
    if (!this.auditId) return;

    try {
      let totalSucceeded = 0;
      let totalFailed = 0;
      let totalAttempted = 0;

      for (const [table, stats] of Object.entries(tableStats)) {
        totalSucceeded += stats.succeeded || 0;
        totalFailed += stats.failed || 0;
        totalAttempted += (stats.succeeded || 0) + (stats.failed || 0);
      }

      await this.pool.query(
        `UPDATE sync_audit 
         SET 
           total_attempted = $2,
           total_succeeded = $3,
           total_failed = $4,
           details = $5
         WHERE id = $1`,
        [this.auditId, totalAttempted, totalSucceeded, totalFailed, JSON.stringify(tableStats)]
      );
    } catch (err) {
      console.error('Failed to update sync audit:', err.message);
    }
  }

  /**
   * Record a single record error
   * @param {number} recordId
   * @param {string} tableName - 'vocabulary', 'users', or 'practice_records'
   * @param {string} errorMessage
   * @param {string} errorCode - e.g., '23505', '23503'
   * @param {string} errorDetail - Full error for debugging
   */
  async recordError(recordId, tableName, errorMessage, errorCode = null, errorDetail = null) {
    if (!this.auditId) return;

    try {
      // Check if this error already exists
      const existing = await this.pool.query(
        `SELECT id FROM sync_errors 
         WHERE audit_id = $1 AND record_id = $2 AND table_name = $3`,
        [this.auditId, recordId, tableName]
      );

      if (existing.rows.length > 0) {
        // Update existing error
        await this.pool.query(
          `UPDATE sync_errors
           SET 
             last_failed_at = NOW(),
             retry_count = retry_count + 1,
             error_message = $2,
             error_code = $3,
             error_detail = $4
           WHERE id = $1`,
          [existing.rows[0].id, errorMessage, errorCode, errorDetail]
        );
      } else {
        // Insert new error
        await this.pool.query(
          `INSERT INTO sync_errors (audit_id, record_id, table_name, error_message, error_code, error_detail)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [this.auditId, recordId, tableName, errorMessage, errorCode, errorDetail]
        );
      }
    } catch (err) {
      console.error('Failed to record sync error:', err.message);
    }
  }

  /**
   * Mark sync as completed successfully
   */
  async complete() {
    if (!this.auditId) return;

    try {
      await this.pool.query(
        `UPDATE sync_audit 
         SET 
           status = 'completed',
           completed_at = NOW()
         WHERE id = $1`,
        [this.auditId]
      );
    } catch (err) {
      console.error('Failed to complete sync audit:', err.message);
    }
  }

  /**
   * Mark sync as completed with partial failures
   */
  async completeWithFailures(failureCount) {
    if (!this.auditId) return;

    try {
      await this.pool.query(
        `UPDATE sync_audit 
         SET 
           status = $2,
           completed_at = NOW()
         WHERE id = $1`,
        [this.auditId, failureCount === 0 ? 'completed' : 'partial_failure']
      );
    } catch (err) {
      console.error('Failed to update sync audit:', err.message);
    }
  }

  /**
   * Mark sync as failed
   */
  async fail(errorMessage, errorCode = null) {
    if (!this.auditId) return;

    try {
      await this.pool.query(
        `UPDATE sync_audit 
         SET 
           status = 'failed',
           error_message = $2,
           error_code = $3,
           completed_at = NOW()
         WHERE id = $1`,
        [this.auditId, errorMessage, errorCode]
      );
    } catch (err) {
      console.error('Failed to fail sync audit:', err.message);
    }
  }

  /**
   * Mark an error as resolved on a successful retry
   */
  async markErrorResolved(recordId, tableName, resolvingSyncId = null) {
    try {
      await this.pool.query(
        `UPDATE sync_errors
         SET 
           resolved_at = NOW(),
           resolved_on_sync_id = $3
         WHERE record_id = $1 AND table_name = $2 AND resolved_at IS NULL`,
        [recordId, tableName, resolvingSyncId || this.auditId]
      );
    } catch (err) {
      console.error('Failed to mark error as resolved:', err.message);
    }
  }

  /**
   * Get recent sync history
   */
  static async getRecentSyncHistory(pool, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT * FROM recent_sync_history LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (err) {
      console.error('Failed to get sync history:', err.message);
      return [];
    }
  }

  /**
   * Get unresolved errors
   */
  static async getUnresolvedErrors(pool) {
    try {
      const result = await pool.query(`SELECT * FROM unresolved_sync_errors`);
      return result.rows;
    } catch (err) {
      console.error('Failed to get unresolved errors:', err.message);
      return [];
    }
  }

  /**
   * Get sync statistics
   */
  static async getSyncStats(pool) {
    try {
      const result = await pool.query(`SELECT * FROM sync_stats`);
      return result.rows;
    } catch (err) {
      console.error('Failed to get sync stats:', err.message);
      return [];
    }
  }

  /**
   * Get errors for a specific record (useful for debugging)
   */
  static async getRecordErrors(pool, recordId, tableName) {
    try {
      const result = await pool.query(
        `SELECT * FROM sync_errors 
         WHERE record_id = $1 AND table_name = $2
         ORDER BY last_failed_at DESC`,
        [recordId, tableName]
      );
      return result.rows;
    } catch (err) {
      console.error('Failed to get record errors:', err.message);
      return [];
    }
  }

  /**
   * Clean up old sync audit records (older than N days)
   */
  static async cleanupOldAudits(pool, daysToKeep = 90) {
    try {
      const result = await pool.query(
        `DELETE FROM sync_audit 
         WHERE completed_at < NOW() - INTERVAL '1 day' * $1
         AND status = 'completed'
         RETURNING id`,
        [daysToKeep]
      );
      return result.rows.length;
    } catch (err) {
      console.error('Failed to cleanup old audits:', err.message);
      return 0;
    }
  }

  /**
   * Clean up old resolved errors (older than N days)
   */
  static async cleanupResolvedErrors(pool, daysToKeep = 30) {
    try {
      const result = await pool.query(
        `DELETE FROM sync_errors 
         WHERE resolved_at < NOW() - INTERVAL '1 day' * $1
         RETURNING id`,
        [daysToKeep]
      );
      return result.rows.length;
    } catch (err) {
      console.error('Failed to cleanup resolved errors:', err.message);
      return 0;
    }
  }
}

/**
 * Helper function to display sync audit info
 */
export function displaySyncAuditSummary(audit) {
  if (!audit) return;

  console.log('\n📊 Sync Audit Summary:');
  console.log(`   Sync Type: ${audit.sync_type}`);
  console.log(`   Status: ${audit.status}`);
  console.log(`   Total Attempted: ${audit.total_attempted}`);
  console.log(`   Succeeded: ${audit.total_succeeded}`);
  console.log(`   Failed: ${audit.total_failed}`);
  
  if (audit.completed_at) {
    const duration = new Date(audit.completed_at) - new Date(audit.started_at);
    const seconds = Math.round(duration / 1000);
    console.log(`   Duration: ${seconds}s`);
  }

  if (audit.error_message) {
    console.log(`   Error: ${audit.error_message}`);
  }

  console.log();
}
