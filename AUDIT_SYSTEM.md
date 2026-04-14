# Audit System Documentation

## Overview

The Audit System provides comprehensive tracking and logging for sync operations between SQLite and Neon databases. It records detailed metrics, errors, and verification results for complete visibility into data synchronization processes.

## Features

### 1. **Operation Tracking**
- Start/end timestamps for each sync operation
- Duration calculation (both milliseconds and seconds)
- Unique session IDs for tracking
- Operation name and sync mode (full vs. partial)

### 2. **Per-Table Metrics**
- Number of records successfully synced
- Number of records that failed to sync
- Success rate calculation
- Summary statistics across all tables

### 3. **Error Recording**
- Individual record errors captured with:
  - Record ID
  - Table name
  - Error message
  - Error code (database-specific)
  - Timestamp of error occurrence

### 4. **Verification Results**
- Expected count vs. actual count comparison
- Match verification (success/failure indicator)
- Stored for each synced table

### 5. **Persistent Storage**
- Audit reports saved as JSON files
- Location: `/api/data/audits/`
- Filename format: `{operation}-{sessionId}.json`
- Automatic directory creation if needed

## Architecture

### AuditTracker Class

Location: `/api/utils/audit-tracker.js`

**Constructor:**
```javascript
const audit = new AuditTracker(operationName, options = {})
```
- `operationName`: Descriptive name for the operation (e.g., "vocabulary_full", "practice_records_partial")
- `options.sessionId`: Optional custom session ID (auto-generated if not provided)

**Key Methods:**

#### recordError(recordId, table, message, code)
Records an individual record error:
```javascript
await audit.recordError(rowId, 'vocabulary', 'Constraint violation', 'UNIQUE_VIOLATION')
```

#### updateProgress(progress)
Updates table-level sync metrics:
```javascript
await audit.updateProgress({
  vocabulary: { succeeded: 450, failed: 5 },
  practice_records: { succeeded: 1200, failed: 0 }
})
```

#### verify(result)
Records verification results after sync:
```javascript
await audit.verify({
  table: 'vocabulary',
  expectedCount: 1000,
  actualCount: 1000,
  match: true
})
```

#### generateReport()
Generates comprehensive audit report object:
```javascript
const report = audit.generateReport()
// Returns structured report with all metrics
```

#### printSummary()
Prints human-readable summary to console:
```javascript
audit.printSummary()
// Output:
// 📊 Audit Summary
// ================
// Operation: vocabulary_full
// Duration: 12.45s
// Total Processed: 1000
// ✅ Succeeded: 995
// ❌ Failed: 5
// Success Rate: 99.50%
```

#### save()
Persists audit report to JSON file:
```javascript
const filepath = await audit.save()
// Creates: /api/data/audits/vocabulary_full-{sessionId}.json
```

## Integration with Sync Scripts

### Sync Scripts Using Audit Tracking
1. `/api/scripts/sync/sync-vocabulary-to-neon.js`
2. `/api/scripts/sync/sync-practice-records-to-neon.js`
3. `/api/scripts/sync/sync-users-to-neon.js`

### Implementation Pattern

Each sync script follows this pattern:

```javascript
import { AuditTracker } from '../../utils/audit-tracker.js

async function syncTable() {
  let audit;
  
  try {
    // 1. Initialize audit tracker
    audit = new AuditTracker(`tablename_${isPartial ? 'partial' : 'full'}`)
    
    // 2. Get data and prepare sync
    const toSync = [...records]
    
    // 3. Sync with error tracking
    let syncedCount = 0
    let failedCount = 0
    
    for (const row of toSync) {
      try {
        await neonPool.query(SQL, params)
        syncedCount++
      } catch (err) {
        failedCount++
        await audit.recordError(row.id, 'tablename', err.message, err.code)
      }
    }
    
    // 4. Update progress metrics
    await audit.updateProgress({
      tablename: { succeeded: syncedCount, failed: failedCount }
    })
    
    // 5. Verify sync results
    const verified = await verifySync()
    await audit.verify({
      table: 'tablename',
      expectedCount: verified.expected,
      actualCount: verified.actual,
      match: verified.match
    })
    
    // 6. Print and save audit
    audit.printSummary()
    await audit.save()
    
  } catch (err) {
    // On error, still save audit before exit
    if (audit) {
      audit.printSummary()
      await audit.save()
    }
    process.exit(1)
  }
}
```

## Audit Report Structure

Each audit JSON file contains:

```json
{
  "sessionId": "1698765432123-abc123def",
  "operation": "vocabulary_full",
  "startTime": "2024-04-09T10:30:00.000Z",
  "endTime": "2024-04-09T10:30:12.450Z",
  "durationMs": 12450,
  "durationSeconds": "12.45",
  
  "tableMetrics": {
    "vocabulary": {
      "succeeded": 995,
      "failed": 5
    }
  },
  
  "verificationResults": {
    "vocabulary": {
      "expectedCount": 1000,
      "actualCount": 1000,
      "match": true,
      "timestamp": "2024-04-09T10:30:12.400Z"
    }
  },
  
  "errorCount": 5,
  "errors": [
    {
      "recordId": "vocab_123",
      "table": "vocabulary",
      "message": "duplicate key value violates unique constraint",
      "code": "23505",
      "timestamp": "2024-04-09T10:30:05.123Z"
    }
  ],
  
  "summary": {
    "totalRecordsProcessed": 1000,
    "totalSucceeded": 995,
    "totalFailed": 5,
    "successRate": "99.50%"
  }
}
```

## Usage Examples

### Running a Sync with Audit

```bash
# Full sync with audit tracking
cd /path/to/api
node scripts/sync/sync-vocabulary-to-neon.js

# Output:
# 📝 Syncing vocabulary table (full sync)...
# 📋 Audit session started
# 📋 Before sync: SQLite=1000 | Neon=500
# 🔄 Syncing 1000 records...
# 🔍 After sync: Neon=1000 ✅
# 📊 Audit Summary
# ================
# Operation: vocabulary_full
# Duration: 12.45s
# Total Processed: 1000
# ✅ Succeeded: 1000
# ❌ Failed: 0
# Success Rate: 100.00%
# 📋 Audit saved to: /path/to/api/data/audits/vocabulary_full-1698765432123-abc123def.json
```

### Checking Audit Files

```bash
# List all audit files
ls -la api/data/audits/

# View specific audit
cat api/data/audits/vocabulary_full-1698765432123-abc123def.json | jq

# Query errors from recent audit
cat api/data/audits/vocabulary_full-*.json | jq '.errors'

# Check success rate across all audits
for f in api/data/audits/*.json; do
  echo "$f:"
  jq '.summary.successRate' "$f"
done
```

### Analyzing Audit Data

**Find all failed records:**
```bash
jq '.errors[] | {record: .recordId, error: .message}' audit-file.json
```

**Get operation timing:**
```bash
jq '{operation: .operation, duration: .durationSeconds}' audit-file.json
```

**Summary statistics:**
```bash
jq '.summary' audit-file.json
```

## Best Practices

1. **Always Save Audits**: Audits should be saved even on errors for post-mortem analysis
2. **Review Error Patterns**: Regularly check audit files for recurring errors
3. **Monitor Success Rates**: Track success rate trends to identify degradation
4. **Archive Old Audits**: Periodically archive audit files older than 30 days
5. **Verify After Failures**: After any failed sync, review audit to understand impact

## Integration with Monitoring

Audit files can be:
- Parsed by monitoring systems
- Sent to logging services
- Analyzed for trends
- Integrated with alerts
- Used for compliance reporting

## Troubleshooting

### Audits Not Saving
- Check `/api/data/` directory exists and is writable
- Verify `/api/data/audits/` directory gets created automatically
- Check file system permissions

### Missing Error Details
- Ensure `recordError()` is called with complete information
- Verify database error codes are being captured
- Check error messages aren't truncated

### Performance Impact
- Audit tracking adds minimal overhead
- Error recording is async and non-blocking
- JSON serialization happens after sync completes

## Future Enhancements

- [ ] Automatic audit report cleanup (older than 30 days)
- [ ] Audit summary dashboard
- [ ] Integration with error alerting
- [ ] Comparative audit analysis
- [ ] Performance profiling metrics
