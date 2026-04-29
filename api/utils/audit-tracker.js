/**
 * AuditTracker - Comprehensive audit logging for sync operations
 * 
 * Tracks:
 * - Operation metadata (start/end time, duration)
 * - Per-table sync metrics (succeeded/failed counts)
 * - Individual record errors with details
 * - Verification results
 * 
 * Persists audit logs as JSON for analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_DIR = path.join(__dirname, '../data/audits');

export class AuditTracker {
  constructor(operationName, options = {}) {
    this.operationName = operationName;
    this.startTime = new Date();
    this.errors = [];
    this.tables = {};
    this.verificationResults = {};
    this.sessionId = options.sessionId || this.generateSessionId();
    this.neonPool = options.neonPool || null;  // Optional: Pass Neon connection for database storage
    this.auditId = null;  // Set when audit is saved to database
    
    // Ensure audit directory exists
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start audit tracking (create record in database if pool provided)
   */
  async start() {
    if (this.neonPool) {
      try {
        const result = await this.neonPool.query(
          `INSERT INTO sync_audit (sync_type, status, total_attempted, total_succeeded, total_failed, details)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [this.operationName, 'running', 0, 0, 0, JSON.stringify({})]
        );
        this.auditId = result.rows[0].id;
        console.log(`📋 Audit started in Neon (ID: ${this.auditId})`);
      } catch (err) {
        console.error(`⚠️  Failed to create audit record in Neon: ${err.message}`);
        // Continue anyway - file-based audit will still work
      }
    }
  }

  /**
   * Record an error for a specific record
   * @param {string} recordId - The ID of the record that failed
   * @param {string} table - The table name
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   */
  async recordError(recordId, table, message, code = null) {
    const errorRecord = {
      recordId,
      table,
      message,
      code,
      timestamp: new Date().toISOString()
    };
    this.errors.push(errorRecord);

    // Also record in Neon if pool is available
    if (this.neonPool && this.auditId) {
      try {
        await this.neonPool.query(
          `INSERT INTO sync_errors (audit_id, record_id, table_name, error_message, error_code)
           VALUES ($1, $2, $3, $4, $5)`,
          [this.auditId, recordId, table, message, code]
        );
      } catch (err) {
        console.error(`⚠️  Failed to record error in Neon: ${err.message}`);
      }
    }
  }

  /**
   * Update sync progress for a table
   * @param {object} progress - { tableName: { succeeded, failed } }
   */
  async updateProgress(progress) {
    Object.assign(this.tables, progress);
  }

  /**
   * Record verification results
   * @param {object} result - { table, expectedCount, actualCount, match }
   */
  async verify(result) {
    this.verificationResults[result.table] = {
      expectedCount: result.expectedCount,
      actualCount: result.actualCount,
      match: result.match,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;

    return {
      sessionId: this.sessionId,
      operation: this.operationName,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs: duration,
      durationSeconds: (duration / 1000).toFixed(2),
      tableMetrics: this.tables,
      verificationResults: this.verificationResults,
      errorCount: this.errors.length,
      errors: this.errors,
      summary: this.generateSummary()
    };
  }

  generateSummary() {
    let totalSucceeded = 0;
    let totalFailed = 0;

    for (const table of Object.values(this.tables)) {
      totalSucceeded += table.succeeded || 0;
      totalFailed += table.failed || 0;
    }

    return {
      totalRecordsProcessed: totalSucceeded + totalFailed,
      totalSucceeded,
      totalFailed,
      successRate: totalSucceeded + totalFailed > 0 
        ? ((totalSucceeded / (totalSucceeded + totalFailed)) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Save audit report to file AND database
   */
  async save() {
    const report = this.generateReport();
    
    // Save to JSON file
    const filename = `${this.operationName}-${this.sessionId}.json`;
    const filepath = path.join(AUDIT_DIR, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`📋 Audit saved to file: ${filepath}`);
    } catch (err) {
      console.error(`❌ Failed to save audit file: ${err.message}`);
    }

    // Update Neon database if available
    if (this.neonPool && this.auditId) {
      try {
        const totalSucceeded = Object.values(this.tables).reduce((sum, t) => sum + (t.succeeded || 0), 0);
        const totalFailed = Object.values(this.tables).reduce((sum, t) => sum + (t.failed || 0), 0);
        
        await this.neonPool.query(
          `UPDATE sync_audit 
           SET completed_at = NOW(), 
               status = $1,
               total_attempted = $2,
               total_succeeded = $3,
               total_failed = $4,
               details = $5
           WHERE id = $6`,
          [
            totalFailed > 0 ? 'partial_failure' : 'completed',
            totalSucceeded + totalFailed,
            totalSucceeded,
            totalFailed,
            JSON.stringify({
              tables: this.tables,
              verification: this.verificationResults,
              duration: report.durationSeconds
            }),
            this.auditId
          ]
        );
        console.log(`📋 Audit updated in Neon (ID: ${this.auditId})`);
      } catch (err) {
        console.error(`⚠️  Failed to update audit in Neon: ${err.message}`);
      }
    }

    return filepath;
  }

  /**
   * Print audit summary to console
   */
  printSummary() {
    const report = this.generateReport();
    console.log('\n📊 Audit Summary');
    console.log('================');
    console.log(`Operation: ${report.operation}`);
    console.log(`Duration: ${report.durationSeconds}s`);
    console.log(`Total Processed: ${report.summary.totalRecordsProcessed}`);
    console.log(`✅ Succeeded: ${report.summary.totalSucceeded}`);
    if (report.summary.totalFailed > 0) {
      console.log(`❌ Failed: ${report.summary.totalFailed}`);
    }
    console.log(`Success Rate: ${report.summary.successRate}`);
    
    if (Object.keys(report.verificationResults).length > 0) {
      console.log('\nVerification Results:');
      for (const [table, result] of Object.entries(report.verificationResults)) {
        console.log(`  ${table}: ${result.expectedCount} expected, ${result.actualCount} actual ${result.match ? '✅' : '⚠️'}`);
      }
    }
  }
}

export default AuditTracker;
