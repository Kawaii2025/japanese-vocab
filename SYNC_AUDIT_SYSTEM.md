# Sync Audit & Error Tracking System

## What Was Created

A **production-ready audit and error tracking system** for your sync operations. This complements the timestamp-based recovery system.

### 📦 Files Created

1. **api/migrations/sync-audit-tables.sql**
   - Migration file for two new database tables
   - `sync_audit` - Track all sync runs
   - `sync_errors` - Track failed records
   - 3 convenience views for quick queries

2. **api/utils/sync-audit.js**
   - Main SyncAudit class for integration
   - Static methods for querying history
   - Error logging and tracking
   - Cleanup utilities

3. **api/scripts/debug/audit-sync.js**
   - Diagnostic tool for inspection
   - Shows recent syncs, errors, stats
   - Can query specific record errors
   - Health report generation

4. **SYNC_AUDIT_GUIDE.md**
   - Integration guide for sync scripts
   - Schema documentation
   - Query examples
   - Debugging workflows

---

## Quick Start

### 1. Create Tables

```bash
cd api
node migrations/run-migration.js sync-audit-tables.sql
```

### 2. Use in Sync Script

```javascript
import { SyncAudit } from '../../utils/sync-audit.js';

const audit = new SyncAudit(neonPool, 'partial');
await audit.start();

try {
  // ... sync records ...
  await audit.recordError(recordId, 'vocabulary', 'error message');
} catch (err) {
  await audit.fail(err.message);
}
```

### 3. Query Audit Data

```bash
# Show recent syncs
node scripts/debug/audit-sync.js

# Show unresolved errors
node scripts/debug/audit-sync.js errors

# Show sync statistics
node scripts/debug/audit-sync.js stats

# Show errors for a specific record
node scripts/debug/audit-sync.js record 1042
```

---

## Database Schema

### sync_audit Table

Records every sync operation:

```
id              Primary key
sync_type       'partial', 'full', 'vocabulary', etc.
started_at      When sync started
completed_at    When sync finished
status          'running', 'completed', 'failed', 'partial_failure'
total_attempted How many records were attempted
total_succeeded How many succeeded
total_failed    How many failed
details         JSON with per-table details
error_message   If failed, the error
error_code      Error code (e.g., '23505')
```

### sync_errors Table

Tracks individual record failures:

```
id              Primary key
audit_id        Link to sync_audit.id
record_id       Which record failed
table_name      'vocabulary', 'users', 'practice_records'
error_message   What went wrong
error_code      Error code
retry_count     How many times retried
first_failed_at First failure timestamp
last_failed_at  Most recent failure
resolved_at     When it was fixed (NULL if still failing)
```

### Views

**sync_stats** - Success rates per sync type
```sql
SELECT * FROM sync_stats;
-- Shows: sync_type, total_syncs, successful, failed, success_rate, last_sync, avg_duration
```

**unresolved_sync_errors** - Current errors
```sql
SELECT * FROM unresolved_sync_errors;
-- Shows: table_name, record_id, error_message, error_code, retry_count, last_failed_at
```

**recent_sync_history** - Last 50 syncs
```sql
SELECT * FROM recent_sync_history;
-- Shows: all sync_audit fields, plus duration in seconds
```

---

## Integration Points

### In sync-to-neon-partial.js

Wrap each table section:

```javascript
const audit = new SyncAudit(neonPool, 'partial');
await audit.start();

try {
  // Vocabulary sync...
  const vocabResults = await syncRecordsWithProgress(...);
  
  for (const error of vocabResults.errors) {
    await audit.recordError(error.recordId, 'vocabulary', error.message, error.code);
  }
  
  await audit.updateProgress({
    vocabulary: { succeeded: vocabResults.succeeded, failed: vocabResults.failed }
  });

  // Users sync... (same pattern)
  // Practice sync... (same pattern)

  // At end
  await audit.completeWithFailures(totalFailed);
  
} catch (err) {
  await audit.fail(err.message, err.code);
  throw err;
}
```

---

## Usage Examples

### Example 1: See Recent Syncs

```bash
$ node scripts/debug/audit-sync.js
📋 Recent Sync History

ID   Type          Status   Attempted  Succeeded  Failed  Duration  Result
────────────────────────────────────────────────────────────────────────────
42   partial       completed      435        433        2     47s    ✅
41   partial       completed      435        435        0     44s    ✅
40   full          completed      439        439        0    124s    ✅
39   vocabulary   completed      419        419        0     12s    ✅
```

### Example 2: See Failing Records

```bash
$ node scripts/debug/audit-sync.js errors
❌ Unresolved Sync Errors

Found 2 unresolved error(s):

1. Record: 1042 (vocabulary)
   Error: violates foreign key constraint "vocabulary_category_fkey"
   Code: 23503
   Retries: 3
   Last Failed: 2026-04-14 10:35:22
   Sync Type: partial

2. Record: 99 (users)
   Error: duplicate key value violates unique constraint "users_email_key"
   Code: 23505
   Retries: 1
   Last Failed: 2026-04-14 10:40:15
   Sync Type: partial
```

### Example 3: View Sync Statistics

```bash
$ node scripts/debug/audit-sync.js stats
📊 Sync Statistics by Type

Type            Total  Success  Failed  Rate    Last Sync           Avg Duration
──────────────────────────────────────────────────────────────────────────────────
full              120       118        2  98.3%  2026-04-14 10:35    127.5s
partial          1240      1235        5  99.6%  2026-04-14 10:44     45.2s
practice_records  340       340        0 100.0%  2026-04-14 09:15     8.3s
users             240       238        2  99.2%  2026-04-14 10:30     3.1s
vocabulary       430       428        2  99.5%  2026-04-14 10:20    12.4s
```

### Example 4: Find All Errors for a Record

```bash
$ node scripts/debug/audit-sync.js record 1042
📍 Error History for Record 1042

1. vocabulary (Audit 38)
   Error: violates foreign key constraint "vocabulary_category_fkey"
   Code: 23503
   First Failed: 2026-04-14 10:30:22
   Last Failed: 2026-04-14 10:30:22
   Retried: 1 times
   ❌ Still unresolved

2. vocabulary (Audit 37)
   Error: violates foreign key constraint "vocabulary_category_fkey"
   Code: 23503
   First Failed: 2026-04-14 10:15:10
   Last Failed: 2026-04-14 10:15:10
   Retried: 0 times
   ❌ Still unresolved
```

### Example 5: Quick Health Check

```bash
$ node scripts/debug/audit-sync.js health
🏥 Sync System Health Report

Total Syncs Recorded: 2170
Unresolved Errors: 2
Success Rate (30 days): 99.5%

Most Common Error (2 occurrences):
  Code: 23503
  Message: violates foreign key constraint "vocabulary_category_fkey"

⚠️  System Status: NEEDS ATTENTION
```

---

## How It Works Together

### Without Audit System
```
Sync runs → Records sync or fail → User doesn't know what happened
```

### With Audit System
```
Sync starts → Audit record created (audit_id = 42)
           ↓
Records sync → Success recorded in sync_audit
           ↓
Some fail → Errors recorded in sync_errors with audit_id = 42
           ↓
Next sync runs → Can query: "What errors from sync 42?"
           ↓
If error fixed → Mark error as resolved on audit_id = 43
           ↓
History maintained → Can see: "Record 1042 failed on Apr 14 & 13, resolved on Apr 15"
```

---

## Timestamp-Based Recovery + Audit Tracking

**How they work together:**

1. **Timestamp system** (automatic)
   - Handles actual retry logic
   - Compares timestamps to determine if record needs sync
   - Failed records automatically retried next run

2. **Audit system** (informational & tracking)
   - Records when syncs ran
   - Tracks which specific records failed
   - Provides visibility and debugging info
   - Helps you understand patterns

**Example scenario:**
```
Sync 1 (Apr 14 10:30):
  - Record 1042 fails → audit_id=40, sync_errors records it
  
Sync 2 (Apr 14 10:35):
  - Timestamp check: Record 1042 still has old timestamp → retry
  - Record 1042 succeeds → audit_id=41, sync_errors marked as resolved
  
Later debugging:
  - Query: "Which syncs was record 1042 failing?"
  - Answer: "Sync 40 (Apr 14 10:30) failed, retry succeeded in sync 41 (Apr 14 10:35)"
```

---

## Maintenance

### Regular Cleanup

Add to cron job (e.g., nightly):

```bash
# Clean up old records older than 90 days
node scripts/debug/audit-sync.js cleanup
```

Or programmatically:

```javascript
import { SyncAudit } from './api/utils/sync-audit.js';

await SyncAudit.cleanupOldAudits(neonPool, 90);      // 90+ days
await SyncAudit.cleanupResolvedErrors(neonPool, 30); // 30+ days
```

---

## What You Can Do Now

✅ **See all syncs and their results**
```bash
node scripts/debug/audit-sync.js
```

✅ **Find records that keep failing**
```bash
node scripts/debug/audit-sync.js errors
```

✅ **Check which sync attempts for a specific record**
```bash
node scripts/debug/audit-sync.js record 1042
```

✅ **Monitor sync reliability**
```bash
node scripts/debug/audit-sync.js stats
```

✅ **Get quick health report**
```bash
node scripts/debug/audit-sync.js health
```

✅ **Query directly via SQL**
```sql
SELECT * FROM unresolved_sync_errors;
SELECT * FROM recent_sync_history LIMIT 10;
SELECT * FROM sync_stats;
```

---

## Next Steps

1. **Run migration** to create tables:
   ```bash
   node migrations/run-migration.js sync-audit-tables.sql
   ```

2. **Integrate into sync scripts** (follow SYNC_AUDIT_GUIDE.md):
   - Add `SyncAudit` import
   - Start audit before sync
   - Record errors during sync
   - Mark as complete after sync

3. **Add cleanup** to cron job:
   ```bash
   0 2 * * * cd /path/to/app && node scripts/debug/audit-sync.js cleanup
   ```

4. **Start collecting data** via normal syncs

5. **Query and debug** using the diagnostic tool

---

## Benefits

✅ **Visibility** - See exactly what happened in each sync  
✅ **Debugging** - Identify patterns in failures  
✅ **Trending** - Monitor sync reliability over time  
✅ **Audit Trail** - For compliance and accountability  
✅ **Diagnosis** - Quickly identify which records are problematic  
✅ **Automation** - Can query for alerts and monitoring  
✅ **Documentation** - Complete history of all syncs  

---

## File Reference

| File | Purpose |
|------|---------|
| `api/migrations/sync-audit-tables.sql` | Database migration |
| `api/utils/sync-audit.js` | Main tracking utility |
| `api/scripts/debug/audit-sync.js` | Diagnostic tool |
| `SYNC_AUDIT_GUIDE.md` | Integration & query guide |
| `SYNC_ERROR_RECOVERY.md` | Recovery mechanism (existing) |
| `sync-progress.js` | Per-record error handler (existing) |
