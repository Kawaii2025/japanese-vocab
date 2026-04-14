-- Migration: Create sync audit and error tracking tables
-- Purpose: Track sync history, errors, and recovery attempts
-- Run: node migrations/run-migration.js sync-audit-tables.sql

-- ============ SYNC AUDIT TABLE ============
-- Tracks when syncs run, what they synced, and whether they completed
CREATE TABLE IF NOT EXISTS sync_audit (
  id SERIAL PRIMARY KEY,
  
  -- Sync metadata
  sync_type VARCHAR(50) NOT NULL,  -- 'partial', 'full', 'vocabulary', 'users', 'practice_records'
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'running',  -- 'running', 'completed', 'failed', 'partial_failure'
  
  -- Counts
  total_attempted INTEGER DEFAULT 0,
  total_succeeded INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  
  -- Details (JSON for flexibility)
  details JSONB DEFAULT '{}',  -- {vocabulary: {before: 100, after: 105, synced: 5}, users: {...}}
  
  -- Error info
  error_message TEXT,
  error_code VARCHAR(10),
  
  -- Index for queries
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_audit_status ON sync_audit(status);
CREATE INDEX IF NOT EXISTS idx_sync_audit_type ON sync_audit(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_audit_created_at ON sync_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_audit_active ON sync_audit(status) WHERE status IN ('running', 'partial_failure');

-- ============ SYNC ERROR TABLE ============
-- Tracks individual records that failed during sync
CREATE TABLE IF NOT EXISTS sync_errors (
  id SERIAL PRIMARY KEY,
  
  -- Link to sync_audit
  audit_id INTEGER REFERENCES sync_audit(id) ON DELETE CASCADE,
  
  -- Record identification
  record_id INTEGER NOT NULL,
  table_name VARCHAR(50) NOT NULL,  -- 'vocabulary', 'users', 'practice_records'
  
  -- Error details
  error_message TEXT NOT NULL,
  error_code VARCHAR(10),
  error_detail TEXT,  -- Full error for debugging
  
  -- Tracking
  first_failed_at TIMESTAMP DEFAULT NOW(),
  last_failed_at TIMESTAMP DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  
  -- Resolution
  resolved_at TIMESTAMP,
  resolved_on_sync_id INTEGER REFERENCES sync_audit(id),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_errors_audit ON sync_errors(audit_id);
CREATE INDEX IF NOT EXISTS idx_sync_errors_record ON sync_errors(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_sync_errors_resolved ON sync_errors(resolved_at);
CREATE INDEX IF NOT EXISTS idx_sync_errors_active ON sync_errors(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sync_errors_failed_at ON sync_errors(last_failed_at DESC);

-- ============ SYNC STATS VIEW ============
-- Quick stats on sync health
CREATE OR REPLACE VIEW sync_stats AS
SELECT
  sync_type,
  COUNT(*) as total_syncs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
  COUNT(CASE WHEN status IN ('failed', 'partial_failure') THEN 1 END) as failed_syncs,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 1)
  END as success_rate,
  MAX(completed_at) as last_sync,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM sync_audit
WHERE completed_at IS NOT NULL
GROUP BY sync_type;

-- ============ RECENT ERRORS VIEW ============
-- Show unresolved errors for quick debugging
CREATE OR REPLACE VIEW unresolved_sync_errors AS
SELECT
  se.id,
  se.table_name,
  se.record_id,
  se.error_message,
  se.error_code,
  se.retry_count,
  se.last_failed_at,
  sa.sync_type,
  sa.completed_at as last_attempted
FROM sync_errors se
LEFT JOIN sync_audit sa ON se.audit_id = sa.id
WHERE se.resolved_at IS NULL
ORDER BY se.last_failed_at DESC;

-- ============ SYNC HISTORY VIEW ============
-- Recent sync attempts
CREATE OR REPLACE VIEW recent_sync_history AS
SELECT
  id,
  sync_type,
  status,
  total_attempted,
  total_succeeded,
  total_failed,
  started_at,
  completed_at,
  CASE
    WHEN status = 'running' THEN NULL
    ELSE EXTRACT(EPOCH FROM (completed_at - started_at))::INT
  END as duration_seconds,
  error_message
FROM sync_audit
ORDER BY started_at DESC
LIMIT 50;
