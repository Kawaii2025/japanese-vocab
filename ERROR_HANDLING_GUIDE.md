# Error Handling & Debugging Guide

## Overview

When the sync operation encounters an error, you'll now see detailed, helpful error messages instead of cryptic messages. This guide explains what to look for and how to debug issues.

## Error Message Format

When a sync fails, you'll see a structured error message:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ [Context: What was happening]
───────────────────────────────────────────────────────────────
Error: [specific error message]
Code: [error code if available]
Table: [which table was being synced]
Operation: [what operation failed]
Records attempted: [how many records]

💡 Troubleshooting:
  • [Specific suggestion 1]
  • [Specific suggestion 2]
  • [Specific suggestion 3]
───────────────────────────────────────────────────────────────

💽 For full error details, run with DEBUG mode:
   DEBUG_SYNC=1 npm run sync-neon
```

## Common Error Scenarios

### 1. Database Connection Failed

**You'll see:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Code: ECONNREFUSED
```

**Troubleshooting steps:**
1. Verify Neon database is running
   - Check: `nc -zv neon.cloud 5432`
2. Verify DATABASE_URL is correct
   - Run: `echo $DATABASE_URL` (should show connection string)
3. Check internet connection
   - Try: `ping neon.cloud`
4. Verify credentials in `.env.neon` file
   - File should contain: `DATABASE_URL=postgresql://...`

### 2. Missing Configuration File

**You'll see:**
```
Error: ENOENT: no such file or directory
Table: -
Operation: database initialization
```

**Troubleshooting steps:**
1. Check if `.env.neon` exists:
   ```bash
   ls -la .env.neon
   ```
2. If missing, create from template:
   ```bash
   cp .env.neon.example .env.neon
   ```
3. Edit with your Neon connection URL:
   ```bash
   nano .env.neon
   ```

### 3. Permission/Constraint Error

**You'll see:**
```
Error: FOREIGN KEY constraint violated
Code: 23503
Table: practice_records
```

**Troubleshooting steps:**
1. Check data integrity before syncing
   - Run: `npm run sync-full` (full sync rebuilds tables)
2. Verify related records exist:
   - Users must exist before syncing practice records
   - Vocabulary must exist before syncing practice records
3. If still failing after full sync, check database schema

### 4. Timeout or Network Error

**You'll see:**
```
Error: Query timeout after 30s
Code: TIMEOUT
```

**Troubleshooting steps:**
1. Check network connectivity:
   ```bash
   ping neon.cloud
   speedtest  # or test internet speed
   ```
2. Retry the sync:
   ```bash
   npm run sync-neon
   ```
3. Try full sync (more robust to network issues):
   ```bash
   npm run sync-full
   ```

## Debug Mode

Enable detailed error diagnostics:

```bash
DEBUG_SYNC=1 npm run sync-neon
```

This shows:
- Full stack traces
- Variable state at failure point
- Database query details
- Connection pool diagnostics

**Output includes:**
```
🔍 Full Stack Trace (DEBUG mode):
  at Function.query (/path/to/neon-wrapper.js:45:12)
  at partialSyncToNeon (/path/to/sync-to-neon-partial.js:122:34)
  ...
```

## Error Codes Reference

| Code | Meaning | Common Cause |
|------|---------|--------------|
| `ECONNREFUSED` | Connection rejected | Database not running |
| `ENOTFOUND` | Host not found | Network issue or invalid URL |
| `EACCES` | Permission denied | Invalid credentials |
| `ENOENT` | File not found | Missing config file |
| `23505` | Unique constraint | Duplicate record ID |
| `23503` | Foreign key constraint | Related record missing |
| `ENV_CONFIG_ERROR` | Config issue | Missing environment variable |

## Checking Sync Status

After successful sync, you'll see:

```
✅ Partial sync complete!
```

With status per table:
```
📝 Checking vocabulary...
   Total: 419 | To sync: 5 | Skipped: 414
   ✅ 5 vocabulary items synced

👤 Checking users...
   Total: 4 | To sync: 0 | Skipped: 4
   ✅ No changes needed

📊 Checking practice records...
   Total: 62 | To sync: 0 | Skipped: 62
   ✅ No changes needed
```

## Recovery Procedures

### If Sync Fails Partially

The sync uses transactions, so partial failures should be automatically rolled back. If you see mixed results:

1. Check which table failed:
   ```bash
   grep "❌" sync.log | tail -5
   ```

2. Try sync again:
   ```bash
   npm run sync-neon
   ```

3. If still failing, run full sync:
   ```bash
   npm run sync-full
   ```

### If Data Gets Corrupted

1. **Restore from backup:**
   ```bash
   npm run restore-backup
   ```

2. **Or clear and re-import:**
   ```bash
   npm run clear-neon
   npm run sync-full
   ```

## Monitoring Sync Health

Run these checks periodically:

```bash
# Check for data mismatches
npm run validate-sync

# Verify all tables synced
npm run sync-status

# Generate sync report
npm run sync-report
```

## Getting Help

If you still can't resolve the error:

1. **Collect diagnostic info:**
   ```bash
   DEBUG_SYNC=1 npm run sync-neon 2>&1 | tee sync-debug.log
   ```

2. **Share the log:**
   - Include the full error message (after `❌`)
   - Include output from: `DEBUG_SYNC=1 npm run sync-neon`
   - Note what was changed before the error
   - Include: `echo $DATABASE_URL | sed 's/:[^:]*@/:[PASSWORD]@/'`

3. **Common solutions:**
   - Restart the Neon database service
   - Clear browser cache and restart dev server
   - Rebuild Docker container if using containers
   - Check free disk space on Neon: `SELECT pg_database_size('vocabulary');`

## Error Handling for Developers

When adding new sync operations, use the error handler:

```javascript
import { logSyncError } from './utils/error-handler.js';

try {
  // Your sync operation
  await myCustomSync();
} catch (err) {
  logSyncError(err, 'Description of what was happening', {
    table: 'my_table',
    operation: 'detailed operation name',
    attemptedRecordCount: recordCount
  });
}
```

The error handler will automatically:
- Format the error message clearly
- Add appropriate troubleshooting suggestions
- Show debug info if `DEBUG_SYNC=1`
- Classify error type (connection, constraint, file, etc.)

## Key Takeaways

✅ **Error messages now include:**
- What failed (table and operation)
- Why it failed (error message and code)
- How to fix it (troubleshooting suggestions)
- How to debug further (DEBUG mode instructions)

✅ **Recovery is easier:**
- Clear error context helps identify root cause
- Specific troubleshooting steps for each error type
- Quick reference for error codes

✅ **Development is faster:**
- Developers spend less time debugging
- Problems are identified immediately
- Solutions are actionable, not cryptic
