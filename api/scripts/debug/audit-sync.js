#!/usr/bin/env node

/**
 * Sync Audit Diagnostic Tool
 * 
 * Usage:
 *   node scripts/debug/audit-sync.js              (show recent syncs)
 *   node scripts/debug/audit-sync.js errors       (show unresolved errors)
 *   node scripts/debug/audit-sync.js stats        (show sync statistics)
 *   node scripts/debug/audit-sync.js record 1042  (show errors for record)
 *   node scripts/debug/audit-sync.js cleanup      (cleanup old records)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SyncAudit } from '../../utils/sync-audit.js';

dotenv.config();
dotenv.config({ path: '.env.neon' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2] || 'syncs';
const arg1 = process.argv[3];

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  console.error('   Set it in .env or .env.neon file');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    switch (command) {
      case 'syncs':
        await showRecentSyncs();
        break;
      case 'recent':
        await showRecentSyncs();
        break;
      case 'errors':
        await showUnresolvedErrors();
        break;
      case 'stats':
        await showSyncStats();
        break;
      case 'record':
        if (!arg1) {
          console.error('Usage: node audit-sync.js record <record_id>');
          process.exit(1);
        }
        await showRecordErrors(parseInt(arg1));
        break;
      case 'cleanup':
        await cleanupOldRecords();
        break;
      case 'health':
        await showSyncHealth();
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function showRecentSyncs() {
  console.log('\n📋 Recent Sync History\n');

  const result = await pool.query(`
    SELECT 
      id,
      sync_type,
      status,
      total_attempted,
      total_succeeded,
      total_failed,
      started_at::text,
      CASE 
        WHEN completed_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (completed_at - started_at))::INT || 's'
        ELSE 'running'
      END as duration,
      CASE
        WHEN status = 'completed' THEN '✅'
        WHEN status = 'partial_failure' THEN '⚠️ '
        WHEN status = 'failed' THEN '❌'
        ELSE '⏳'
      END as result
    FROM sync_audit
    ORDER BY started_at DESC
    LIMIT 20
  `);

  if (result.rows.length === 0) {
    console.log('  No sync records found');
    console.log();
    return;
  }

  console.log('ID   Type          Status   Attempted  Succeeded  Failed  Duration  Result');
  console.log('────────────────────────────────────────────────────────────────────────────');

  result.rows.forEach(row => {
    const syncType = (row.sync_type + '').padEnd(11);
    const status = (row.status + '').padEnd(9);
    const attempted = (row.total_attempted + '').padStart(10);
    const succeeded = (row.total_succeeded + '').padStart(10);
    const failed = (row.total_failed + '').padStart(7);
    const duration = (row.duration + '').padStart(8);

    console.log(
      `${row.id.toString().padStart(3)}  ${syncType}  ${status} ${attempted}  ${succeeded}  ${failed}  ${duration}  ${row.result}`
    );
  });

  console.log();
}

async function showUnresolvedErrors() {
  console.log('\n❌ Unresolved Sync Errors\n');

  const result = await pool.query(`
    SELECT 
      id,
      table_name,
      record_id,
      error_message,
      error_code,
      retry_count,
      last_failed_at::text,
      sync_type
    FROM unresolved_sync_errors
    ORDER BY last_failed_at DESC
  `);

  if (result.rows.length === 0) {
    console.log('  ✅ No unresolved errors!\n');
    return;
  }

  console.log(`Found ${result.rows.length} unresolved error(s):\n`);

  result.rows.forEach((row, idx) => {
    console.log(`${idx + 1}. Record: ${row.record_id} (${row.table_name})`);
    console.log(`   Error: ${row.error_message}`);
    console.log(`   Code: ${row.error_code || 'N/A'}`);
    console.log(`   Retries: ${row.retry_count}`);
    console.log(`   Last Failed: ${row.last_failed_at}`);
    console.log(`   Sync Type: ${row.sync_type || 'unknown'}`);
    console.log();
  });
}

async function showSyncStats() {
  console.log('\n📊 Sync Statistics by Type\n');

  const result = await pool.query(`
    SELECT 
      sync_type,
      total_syncs,
      successful_syncs,
      failed_syncs,
      success_rate,
      max(last_sync)::text as last_sync,
      ROUND(avg_duration_seconds::numeric, 1) as avg_duration_sec
    FROM sync_stats
    ORDER BY sync_type
  `);

  if (result.rows.length === 0) {
    console.log('  No sync statistics available\n');
    return;
  }

  console.log('Type            Total  Success  Failed  Rate    Last Sync           Avg Duration');
  console.log('──────────────────────────────────────────────────────────────────────────────────');

  result.rows.forEach(row => {
    const type = (row.sync_type + '').padEnd(14);
    const total = (row.total_syncs + '').padStart(6);
    const success = (row.successful_syncs + '').padStart(8);
    const failed = (row.failed_syncs + '').padStart(7);
    const rate = (row.success_rate + '%').padStart(6);
    const lastSync = (row.last_sync || 'never').substring(0, 19).padEnd(19);
    const duration = (row.avg_duration_sec + 's').padStart(11);

    console.log(`${type}  ${total}  ${success}  ${failed}  ${rate}  ${lastSync}  ${duration}`);
  });

  console.log();
}

async function showRecordErrors(recordId) {
  console.log(`\n📍 Error History for Record ${recordId}\n`);

  const result = await pool.query(`
    SELECT 
      id,
      table_name,
      error_message,
      error_code,
      retry_count,
      first_failed_at::text,
      last_failed_at::text,
      resolved_at::text,
      audit_id
    FROM sync_errors
    WHERE record_id = $1
    ORDER BY last_failed_at DESC
  `, [recordId]);

  if (result.rows.length === 0) {
    console.log(`  No errors found for record ${recordId}\n`);
    return;
  }

  result.rows.forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.table_name} (Audit ${row.audit_id})`);
    console.log(`   Error: ${row.error_message}`);
    console.log(`   Code: ${row.error_code || 'N/A'}`);
    console.log(`   First Failed: ${row.first_failed_at}`);
    console.log(`   Last Failed: ${row.last_failed_at}`);
    console.log(`   Retried: ${row.retry_count} times`);

    if (row.resolved_at) {
      console.log(`   ✅ Resolved: ${row.resolved_at}`);
    } else {
      console.log(`   ❌ Still unresolved`);
    }
    console.log();
  });
}

async function showSyncHealth() {
  console.log('\n🏥 Sync System Health Report\n');

  // Get latest syncs
  const syncs = await pool.query(`
    SELECT COUNT(*) as total FROM sync_audit
  `);

  // Get unresolved errors
  const errors = await pool.query(`
    SELECT COUNT(*) as total FROM sync_errors WHERE resolved_at IS NULL
  `);

  // Get success rate last 30 days
  const successRate = await pool.query(`
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 1)
      END as rate
    FROM sync_audit
    WHERE completed_at > NOW() - INTERVAL '30 days'
  `);

  // Get most common error
  const commonError = await pool.query(`
    SELECT error_code, error_message, COUNT(*) as count
    FROM sync_errors
    WHERE resolved_at IS NULL
    GROUP BY error_code, error_message
    ORDER BY count DESC
    LIMIT 1
  `);

  console.log('Total Syncs Recorded:', syncs.rows[0].total);
  console.log('Unresolved Errors:', errors.rows[0].total);
  console.log(`Success Rate (30 days): ${successRate.rows[0].rate || 0}%`);

  if (commonError.rows.length > 0) {
    const err = commonError.rows[0];
    console.log(`\nMost Common Error (${err.count} occurrences):`);
    console.log(`  Code: ${err.error_code || 'N/A'}`);
    console.log(`  Message: ${err.error_message}`);
  }

  console.log('\n' + (errors.rows[0].total === 0 ? '✅' : '⚠️ ') + ' System Status: ' + 
    (errors.rows[0].total === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'));
  console.log();
}

async function cleanupOldRecords() {
  console.log('\n🧹 Cleaning up old audit records...\n');

  const deletedAudits = await SyncAudit.cleanupOldAudits(pool, 90);
  const deletedErrors = await SyncAudit.cleanupResolvedErrors(pool, 30);

  console.log(`✅ Deleted ${deletedAudits} old audit records (90+ days)`);
  console.log(`✅ Deleted ${deletedErrors} resolved errors (30+ days)`);
  console.log();
}

function showHelp() {
  console.log(`
Sync Audit Diagnostic Tool

Usage:
  node scripts/debug/audit-sync.js [command] [args]

Commands:
  syncs                  Show recent sync history (default)
  recent                 Show recent syncs (alias)
  errors                 Show unresolved sync errors
  stats                  Show sync statistics by type
  record <id>           Show error history for a specific record
  health                Show sync system health report
  cleanup               Clean up old audit records (90+ days)
  help                  Show this help message

Examples:
  node scripts/debug/audit-sync.js              # Show recent syncs
  node scripts/debug/audit-sync.js errors       # Show failing records
  node scripts/debug/audit-sync.js record 1042  # Show errors for record 1042
  node scripts/debug/audit-sync.js health       # Show health report
  node scripts/debug/audit-sync.js cleanup      # Clean up old records

Environment:
  Requires DATABASE_URL in .env or .env.neon file
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
