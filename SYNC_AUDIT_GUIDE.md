# Sync Audit & Error Tracking Integration Guide

## Overview

The audit system tracks:
- **When** syncs run and how long they take
- **What** was synced (record counts per table)
- **Status** (completed, partial_failure, failed)
- **Which records** failed and why
- **Recovery** tracking (when errors are resolved)

## Database Schema

Two new tables created:

### `sync_audit` - Sync History
```sql
id              SERIAL PRIMARY KEY
sync_type       VARCHAR(50)    -- 'partial', 'full', 'vocabulary', etc.
started_at      TIMESTAMP      -- When sync started
completed_at    TIMESTAMP      -- When sync finished
status          VARCHAR(20)    -- 'running', 'completed', 'failed', 'partial_failure'
total_attempted INTEGER        -- How many records tried
total_succeeded INTEGER        -- How many succeeded
total_failed    INTEGER        -- How many failed
details         JSONB          -- {vocabulary: {before: 100, after: 105, synced: 5}}
error_message   TEXT           -- If failed, why
error_code      VARCHAR(10)    -- Error code (e.g., '23505')
```

### `sync_errors` - Individual Record Errors
```sql
id              SERIAL PRIMARY KEY
audit_id        INTEGER        -- Link to sync_audit
record_id       INTEGER        -- Which record failed
table_name      VARCHAR(50)    -- 'vocabulary', 'users', 'practice_records'
error_message   TEXT           -- Error details
error_code      VARCHAR(10)    -- Error code
retry_count     INTEGER        -- How many times retried
first_failed_at TIMESTAMP      -- First failure
last_failed_at  TIMESTAMP      -- Most recent failure
resolved_at     TIMESTAMP      -- When it was fixed (NULL if still failing)
```

## Setup

### 1. Run Migration

```bash
cd api
node migrations/run-migration.js sync-audit-tables.sql
```

### 2. Verify Tables Created

```bash
psql $DATABASE_URL -c "\dt sync_* "
psql $DATABASE_URL -c "SELECT * FROM sync_stats;"  # Should be empty
```

## Integration into Sync Scripts

### Before: No Audit Tracking

```javascript
// sync-to-neon-partial.js
try {
  const sqliteVocab = await sqliteDb.all('SELECT * FROM vocabulary WHERE ...);
  
  for (const row of sqliteVocab) {
    await neonPool.query('INSERT INTO vocabulary ...', [...]);
  }
  
  console.log(`✅ Synced ${sqliteVocab.length} records`);
} catch (err) {
  console.error('Sync failed:', err.message);
  process.exit(1);
}
```

### After: With Audit Tracking

```javascript
import { SyncAudit, displaySyncAuditSummary } from '../../utils/sync-audit.js';

try {
  // ✨ NEW: Start audit
  const audit = new SyncAudit(neonPool, 'partial');
  await audit.start();

  const sqliteVocab = await sqliteDb.all('SELECT * FROM vocabulary WHERE ...);
  
  let vocabFailed = 0;
  for (const row of sqliteVocab) {
    try {
      await neonPool.query('INSERT INTO vocabulary ...', [...]);
    } catch (err) {
      vocabFailed++;
      // ✨ NEW: Record error
      await audit.recordError(row.id, 'vocabulary', err.message, err.code, err.detail);
    }
  }
  
  // ✨ NEW: Update progress
  await audit.updateProgress({
    vocabulary: { succeeded: sqliteVocab.length - vocabFailed, failed: vocabFailed }
  });

  // ✨ NEW: Mark as completed
  await audit.completeWithFailures(vocabFailed);
  
  console.log(`✅ Synced ${sqliteVocab.length - vocabFailed} records`);
} catch (err) {
  // ✨ NEW: Record fatal error
  const audit = new SyncAudit(neonPool, 'partial');
  await audit.fail(err.message, err.code);
  
  console.error('Sync failed:', err.message);
  process.exit(1);
}
```

## Using with sync-progress.js

Combine with the per-record error handler:

```javascript
import { syncRecordsWithProgress, displaySyncResults } from '../../utils/sync-progress.js';
import { SyncAudit } from '../../utils/sync-audit.js';

try {
  const audit = new SyncAudit(neonPool, 'partial');
  await audit.start();

  // ... get records to sync ...

  const vocabResults = await syncRecordsWithProgress(
    sqliteVocabData,
    neonPool,
    'vocabulary',
    async (record, pool) => {
      await syncVocabularyRecord(record, pool, msToDate, msToTimestamp);
    }
  );

  displaySyncResults(vocabResults);

  // ✨ NEW: Record all errors in audit
  for (const error of vocabResults.errors) {
    await audit.recordError(error.recordId, 'vocabulary', error.message, error.code);
  }

  await audit.updateProgress({
    vocabulary: { succeeded: vocabResults.succeeded, failed: vocabResults.failed }
  });

  vocabSyncedCount = vocabResults.succeeded;
}

// Later: Mark resolved errors
if (vocabResults.failed === 0) {
  // All succeeded in THIS sync, mark previous errors as resolved
  for (const prevError of previousErrors) {
    await audit.markErrorResolved(prevError.record_id, 'vocabulary', audit.auditId);
  }
}
```

## Querying Sync History

### View Recent Syncs

```javascript
import { SyncAudit } from './api/utils/sync-audit.js';

const history = await SyncAudit.getRecentSyncHistory(neonPool, 10);
console.table(history);
```

Output:
```
┌────┬─────────┬───────────┬──────────┬──────────┬──────────┐
│ id │ sync_id │sync_type  │ status   │ duration │ created  │
├────┼─────────┼───────────┼──────────┼──────────┼──────────┤
│  1 │   1042  │ partial   │completed │     25s  │ 2026-04  │
│  2 │   1041  │ partial   │completed │     22s  │ 2026-04  │
│  3 │   1040  │ full      │completed │    120s  │ 2026-04  │
└────┴─────────┴───────────┴──────────┴──────────┴──────────┘
```

### View Unresolved Errors

```javascript
const errors = await SyncAudit.getUnresolvedErrors(neonPool);
console.table(errors);
```

Output:
```
┌────┬──────────┬────────────────┬──────────┬──────────────────┬────────┐
│ id │ table    │ record_id      │ message  │ last_failed_at   │ retries│
├────┼──────────┼────────────────┼──────────┼──────────────────┼────────┤
│  5 │vocabulary│ 1042           │foreign   │2026-04-14 10:30  │  3     │
│  6 │ users    │ 99             │duplicate │2026-04-14 09:45  │  1     │
└────┴──────────┴────────────────┴──────────┴──────────────────┴────────┘
```

### View Sync Statistics

```javascript
const stats = await SyncAudit.getSyncStats(neonPool);
console.table(stats);
```

Output:
```
┌──────────────┬───────┬──────────┬───────────┬──────────────┬──────────┐
│ sync_type    │ total │ success  │ failed    │ success_rate │ last_sync│
├──────────────┼───────┼──────────┼───────────┼──────────────┼──────────┤
│ partial      │  120  │   118    │    2      │   98.3%      │ 10:30    │
│ full         │   10  │   10     │    0      │  100%        │ yesterday│
│ vocabulary   │   30  │   29     │    1      │   96.7%      │ 08:15    │
└──────────────┴───────┴──────────┴───────────┴──────────────┴──────────┘
```

### View Errors for Specific Record

```javascript
const recordErrors = await SyncAudit.getRecordErrors(neonPool, 1042, 'vocabulary');
console.table(recordErrors);
```

Output:
```
┌────┬─────────┬────────────────┬───────────────────────────┬─────────────┐
│ id │ audit   │ first_failed   │ error_message             │ retry_count │
├────┼─────────┼────────────────┼───────────────────────────┼─────────────┤
│  5 │  1040   │ 2026-04-14 10:30│foreign key constraint    │      3      │
│  8 │  1041   │ 2026-04-14 10:32│foreign key constraint    │      4      │
│  9 │  1042   │ 2026-04-14 10:45│foreign key constraint    │      5      │
└────┴─────────┴────────────────┴───────────────────────────┴─────────────┘
```

## Automated Housekeeping

### Clean Up Old Audit Records (90+ days)

```bash
# Add to nightly cron job
node -e "
import { SyncAudit } from './api/utils/sync-audit.js';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const deleted = await SyncAudit.cleanupOldAudits(pool, 90);
console.log(\`Deleted \${deleted} old audit records\`);
pool.end();
"
```

Or in a script:

```javascript
// cleanup-sync-audit.js
const { SyncAudit } = await import('./utils/sync-audit.js');

const deletedAudits = await SyncAudit.cleanupOldAudits(neonPool, 90);
const deletedErrors = await SyncAudit.cleanupResolvedErrors(neonPool, 30);

console.log(`Cleaned up ${deletedAudits} old audits`);
console.log(`Cleaned up ${deletedErrors} resolved errors`);
```

## Complete Example: sync-to-neon-partial.js

Here's how the full integration looks:

```javascript
import { SyncAudit, displaySyncAuditSummary } from '../../utils/sync-audit.js';
import { syncRecordsWithProgress, displaySyncResults } from '../../utils/sync-progress.js';

try {
  // ✨ Start audit
  const audit = new SyncAudit(neonPool, 'partial');
  const auditId = await audit.start();
  console.log(`📋 Sync audit started (ID: ${auditId})\n`);

  let totalResults = {
    vocabulary: { succeeded: 0, failed: 0 },
    users: { succeeded: 0, failed: 0 },
    practice: { succeeded: 0, failed: 0 }
  };

  // ============ VOCABULARY ============
  try {
    console.log('📝 Checking vocabulary...');
    const sqliteVocabData = await sqliteDb.all(`...`);
    
    const vocabResults = await syncRecordsWithProgress(
      sqliteVocabData,
      neonPool,
      'vocabulary',
      async (record, pool) => {
        await syncVocabularyRecord(record, pool, msToDate, msToTimestamp);
      }
    );

    displaySyncResults(vocabResults);

    // ✨ Record errors
    for (const error of vocabResults.errors) {
      await audit.recordError(error.recordId, 'vocabulary', error.message, error.code);
    }

    totalResults.vocabulary = {
      succeeded: vocabResults.succeeded,
      failed: vocabResults.failed
    };
  } catch (err) {
    await audit.recordError(0, 'vocabulary', err.message, err.code, err.stack);
  }

  // ============ USERS ============
  // ... same pattern ...

  // ============ PRACTICE RECORDS ============
  // ... same pattern ...

  // ✨ Update audit and complete
  await audit.updateProgress(totalResults);
  await audit.completeWithFailures(
    totalResults.vocabulary.failed +
    totalResults.users.failed +
    totalResults.practice.failed
  );

  // ✨ Display summary
  const auditRecord = await SyncAudit.getRecentSyncHistory(neonPool, 1);
  displaySyncAuditSummary(auditRecord[0]);

} catch (err) {
  // ✨ Record fatal error and fail audit
  const audit = new SyncAudit(neonPool, 'partial');
  await audit.fail(err.message, err.code);
  
  logSyncError(err, 'Fatal sync error', { operation: 'sync' });
  process.exit(1);
}
```

## Debugging with Audit Data

### Q: Which records keep failing?

```bash
# See all unresolved errors
psql $DATABASE_URL -c "SELECT * FROM unresolved_sync_errors ORDER BY retry_count DESC"
```

### Q: What errors happened last sync?

```bash
# Get latest sync audit
psql $DATABASE_URL -c "
SELECT 
  sa.id, 
  sa.sync_type, 
  sa.status, 
  count(se.id) as error_count
FROM sync_audit sa
LEFT JOIN sync_errors se ON sa.id = se.audit_id
WHERE sa.id = (SELECT MAX(id) FROM sync_audit)
GROUP BY sa.id, sa.sync_type, sa.status;
"
```

### Q: How is sync reliability trending?

```bash
# View sync stats by type
psql $DATABASE_URL -c "SELECT * FROM sync_stats"
```

### Q: When was a specific record last synced?

```bash
# Find most recent error for record
psql $DATABASE_URL -c "
SELECT 
  se.last_failed_at,
  se.error_message,
  sa.sync_type,
  se.retry_count
FROM sync_errors se
JOIN sync_audit sa ON se.audit_id = sa.id
WHERE se.record_id = 1042 AND se.table_name = 'vocabulary'
ORDER BY se.last_failed_at DESC
LIMIT 1;
"
```

## Benefits

✅ **Visibility** - See all syncs and their results  
✅ **Debugging** - Track which records fail and why  
✅ **Trending** - Monitor sync reliability over time  
✅ **Recovery** - Know when errors are fixed  
✅ **Audit Trail** - Compliance and accountability  
✅ **Automation** - Query for alerts and reports  

## Views Available

- `sync_stats` - Success rates per sync type
- `unresolved_sync_errors` - Current failing records
- `recent_sync_history` - Last 50 syncs
