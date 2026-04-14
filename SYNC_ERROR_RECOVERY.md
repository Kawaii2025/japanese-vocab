# Sync Error Recovery & Resilience Guide

## Current Sync Behavior

### Is Sync Idempotent? 
**YES** ✅ It's safe to retry, but with caveats.

### How It Works

All sync scripts use PostgreSQL's `ON CONFLICT (id) DO UPDATE SET`:

```javascript
INSERT INTO vocabulary (...) 
VALUES ($1, $2, ..., $N)
ON CONFLICT (id) DO UPDATE SET
  chinese = $2, original = $3, ...
```

This means:
- **New records**: Inserted normally
- **Already synced records**: Updated with same values (idempotent)
- **Failed records**: Mark for retry on next sync

### Example: Sync Fails at Record 5 (out of 10)

```
Syncing records: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    ✅ Record 1: synced
    ✅ Record 2: synced
    ✅ Record 3: synced
    ✅ Record 4: synced
    ❌ Record 5: ERROR (e.g., constraint violation)
    ⏸️  Records 6-10: NOT ATTEMPTED (loop stopped)
```

### On Next Sync Run

```
Timestamp comparison:
  • Records 1-4: Already in Neon with matching timestamp → SKIPPED
  • Record 5: Timestamp still newer than Neon → MARKED FOR RETRY
  • Records 6-10: Never synced → MARKED FOR SYNC

Syncing records: [5, 6, 7, 8, 9, 10]
    🔄 Record 5: Retry (may succeed this time if error was transient)
    ✅ Record 6-10: Synced normally
```

### Result
✅ **Safe to retry** - Partial success is preserved

---

## Error Types & Recovery

| Error Type | Cause | Recovery | Retry Needed? |
|-----------|-------|----------|---------------|
| **Network timeout** | Neon temporarily unavailable | Run sync again | ✅ Yes |
| **Foreign key constraint** | Related record missing | Fix data first, then retry | ✅ Yes |
| **Permission denied** | Connection issue | Check DATABASE_URL, retry | ✅ Yes |
| **Unique constraint** | Duplicate ID | Usually shouldn't happen | ❌ No - check data |
| **Invalid timestamp** | Data corruption | May need data cleanup | ⚠️ Partial |

---

## Best Practices for Error Recovery

### 1. **If Sync Fails:**
```bash
# Option A: Retry immediately (for transient errors)
npm run sync-neon

# Option B: Wait and retry (if Neon was temporarily down)
sleep 30 && npm run sync-neon

# Option C: Check error, fix if needed, then retry
DEBUG_SYNC=1 npm run sync-neon  # See full error details
# Fix the underlying issue
npm run sync-neon               # Retry
```

### 2. **Verifying Partial Success:**
After retrying, check the output:
```
📊 Sync Summary:
   Vocabulary: 5 records synced (421 → 426)
   Users: 0 records synced (4 → 4)
   Practice Records: 10 records synced (194 → 204)

✅ Sync verification PASSED - No records were lost
```

### 3. **For Persistent Errors:**

If the same record keeps failing:
```bash
# Enable debug mode to see full error
DEBUG_SYNC=1 npm run sync-neon 2>&1 | tee sync-debug.log

# Look for the specific record ID in the log
grep "Record 5:" sync-debug.log

# Check if record exists in SQLite
node scripts/debug/check-id1.js

# Or do full audit
npm run sync-full  # Complete re-sync
```

---

## Understanding Sync Modes

### Partial Sync (Recommended)
```bash
npm run sync-neon
```

**Behavior:**
- Only syncs changed records (based on timestamp)
- If error at record 5:
  - Records 1-4: ✅ Synced
  - Record 5: ❌ Failed
  - Next run: Tries 5 again + continues with 6-10

**Recovery:** Very simple - just retry

---

### Full Sync (Complete Replace)
```bash
npm run sync-to-neon
```

**Behavior:**
- Syncs ALL records (ignores timestamps)
- Ensures Neon = SQLite exactly
- If error at record 5:
  - Records 1-4: ✅ Synced
  - Record 5: ❌ Failed
  - Next run: Syncs everything again from scratch

**Recovery:** Slower but more thorough

---

### Individual Table Sync
```bash
npm run sync-vocabulary   # Only vocabulary
npm run sync-users        # Only users
npm run sync-practice-records  # Only practice records
```

**Behavior:**
- Same as full sync but for one table only
- Useful if only one table has issues

**Recovery:** Fastest targeted fix

---

## How Records Are Compared

### Timestamp-Based Comparison (Partial Sync)

```javascript
// For each record in SQLite:
const sqliteRecord = {
  id: 1,
  updated_at: 1712043600000  // Last updated this timestamp
};

// Check in Neon:
const neonRecord = {
  id: 1,
  updated_at: 1712043598000  // Synced earlier timestamp
};

// Decision:
if (sqliteRecord.updated_at > neonRecord.updated_at + 1_HOUR) {
  // Sync it (SQLite version is newer)
} else {
  // Skip it (already in sync or within 1-hour threshold)
}
```

**Key concept:** If already synced before, timestamp in Neon will equal SQLite, so it's skipped.

---

## Safe Retry Pattern

The sync is designed for safe retries:

```
Attempt 1: Sync 10 records
  ✅ 1,2,3,4: Synced to Neon (timestamp set)
  ❌ 5: Failed (not in Neon, timestamp still old)
  ⏸️  6-10: Not reached

Attempt 2: Compare timestamps again
  ✅ 1,2,3,4: Timestamp in Neon matches SQLite → SKIP
  ❌ 5: Timestamp in Neon is still old → TRY AGAIN
  ✅ 6-10: Not in Neon yet → SYNC
```

**Result:** ✅ Idempotent - safe to retry indefinitely

---

## Monitoring for Issues

### Check Sync Output

**Good output:**
```
✅ Sync verification PASSED - No records were lost
```

**Warning output:**
```
⚠️  Sync verification WARNING - Record count decreased:
   • Vocabulary: expected 419, got 418
```

### Compare Record Counts

```bash
# Before running sync
echo "SQLite: $(sqlite3 data/vocabulary.db 'SELECT COUNT(*) FROM vocabulary')"
echo "Neon: $(psql -c 'SELECT COUNT(*) FROM vocabulary' DATABASE_URL 2>/dev/null)"

# After sync
echo "SQLite: $(sqlite3 data/vocabulary.db 'SELECT COUNT(*) FROM vocabulary')"
echo "Neon: $(psql -c 'SELECT COUNT(*) FROM vocabulary' DATABASE_URL 2>/dev/null)"
```

---

## FAQ

### Q: If sync fails at record 5, do I lose records 1-4?
**A:** No! Records 1-4 are already in Neon. They won't be lost.

### Q: Should I restart from record 1 or record 5?
**A:** Neither! The sync **automatically** handles this. Just run it again, it will:
- Skip records 1-4 (already synced)
- Retry record 5
- Continue with 6-10

### Q: What if the same record keeps failing?
**A:** The record has a real problem (e.g., missing related record). Fix the underlying issue first:
```bash
# Investigate the error
DEBUG_SYNC=1 npm run sync-neon | grep "ERROR"

# Fix the issue in SQLite
# Then retry
npm run sync-neon
```

### Q: Is it safe to run sync multiple times?
**A:** Yes! The `ON CONFLICT` clause makes it idempotent. Running sync 10 times gives the same result as running it once (assuming no data changes between runs).

### Q: What's the 1-hour threshold I see?
**A:** To prevent constant re-syncing of the same records due to clock skew or minor timing differences, records within 1 hour of the Neon version are skipped. This is very conservative and usually not a problem.

---

## Recovery Examples

### Scenario 1: Network Timeout
```
Error: Query timeout after 30s

Recovery:
1. Network was temporarily down
2. Some records may have synced partially
3. Just retry: npm run sync-neon
4. Already-synced records are skipped
5. Failed records are retried
```

### Scenario 2: Foreign Key Constraint
```
Error: violates foreign key constraint "practice_records_user_id_fkey"
       Key (user_id)=(99) is not present in table "users"

Recovery:
1. A practice record references a non-existent user
2. Fix: Add missing user to SQLite or remove bad practice record
3. Retry: npm run sync-neon
```

### Scenario 3: Persistent SQL Error
```
Error: duplicate key value violates unique constraint

Recovery:
1. Data integrity issue in SQLite
2. Investigate: node scripts/debug/check-id1.js
3. Fix the duplicate data
4. Retry: npm run sync-neon
```

---

## Summary

✅ **Sync is safe to retry:**
- Idempotent (safe for repeated runs)
- Partial success is preserved
- Failed records are automatically retried
- No manual recovery steps needed

✅ **On error, just retry:**
```bash
npm run sync-neon  # It handles recovery automatically
```

✅ **Get visibility:**
```bash
DEBUG_SYNC=1 npm run sync-neon  # See detailed error info
```
