# Per-Record Error Handling Integration Guide

## Overview

The sync system now provides **per-record error handling** that ensures:
- Partial failures don't halt the entire sync
- Progress is visible during sync (dots for success, ✗ for failures)
- Failed records are tracked and automatically retried on next sync
- Users have full visibility into what succeeded and what failed

---

## How It Works

### Before (Current)
```
Syncing vocabulary [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

for (const record of records) {
  await neonPool.query(...)  // ← If this throws, entire loop stops
}
```

**Problem:** If record 5 fails, records 6-10 never synced. Next run doesn't know which failed.

### After (New)
```
Syncing vocabulary [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

. . ✗ . . . . . . .

Results:
  ✅ 9 succeeded
  ❌ 1 failed (Record 5: foreign key constraint)
  
  💡 Record 5 will retry on next sync
```

**Benefit:** See exactly which records failed, next sync automatically retries them.

---

## Integration Example

### Before: Typical Error Handling

```javascript
// Current sync-to-neon-partial.js vocabulary sync
console.log('📝 Checking vocabulary...');

const sqliteVocab = await sqliteDb.all('SELECT id, updated_at FROM vocabulary');
const neonVocabMap = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
let vocabToSync = getRecordsToSync(sqliteVocab, neonVocabMap, 'updated_at');

if (vocabToSync.length > 0) {
  const sqliteVocabData = await sqliteDb.all(`...`);

  for (const row of sqliteVocabData) {
    // ⚠️ If this fails, loop stops, remaining records not synced
    await neonPool.query(`INSERT INTO vocabulary ...`, [row.id, ...]);
  }
  console.log(`✅ ${vocabToSync.length} vocabulary items synced\n`);
}
```

### After: Per-Record Error Handling

```javascript
import { syncRecordsWithProgress, displaySyncResults, syncVocabularyRecord } from '../../utils/sync-progress.js';

console.log('📝 Checking vocabulary...');

const sqliteVocab = await sqliteDb.all('SELECT id, updated_at FROM vocabulary');
const neonVocabMap = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
let vocabToSync = getRecordsToSync(sqliteVocab, neonVocabMap, 'updated_at');

if (vocabToSync.length > 0) {
  const sqliteVocabData = await sqliteDb.all(`...`);

  // ✨ NEW: Use progress tracker with error handling
  const vocabResults = await syncRecordsWithProgress(
    sqliteVocabData,
    neonPool,
    'vocabulary',
    async (record, pool) => {
      await syncVocabularyRecord(record, pool, msToDate, msToTimestamp);
    }
  );

  // ✨ NEW: Display results with failed record tracking
  displaySyncResults(vocabResults);
  vocabSyncedCount = vocabResults.succeeded;
}
```

---

## Key Features

### 1. Progress Display

During sync, users see real-time progress:

```
📝 Checking vocabulary...

Progress: . . . ✗ . . . . . .

Results:
  ✅ 9 succeeded (90%)
  ❌ 1 failed:
     1. ID 1042: violates foreign key constraint "vocabulary_category_fkey"
     
  💡 This record will be retried on next sync
      Run again: npm run sync-neon
```

**Legend:**
- `.` = Record synced successfully
- `✗` = Record failed (but sync continues)
- Line wraps automatically for readability

### 2. Automatic Retry

Failed records are automatically retried on next sync:

```
First sync (records 1-10):
  . . . ✗ . . . . . .
  ✅ 9 succeeded, ❌ 1 failed (record 5)

Second sync (same records 1-10):
  . . . . . . . . . .
  ✅ 1 succeeded (record 5 retry), 9 skipped (unchanged)
  
Why? Timestamp-based comparison:
  • Records 1-4: Synced earlier → same timestamp → SKIP
  • Record 5: Never successfully synced → still marked as "changed" → RETRY
  • Records 6-10: Synced earlier → same timestamp → SKIP
```

### 3. Error Details

Failed records are tracked with error information:

```javascript
{
  table: 'vocabulary',
  total: 10,
  succeeded: 9,
  failed: 1,
  failedIds: [1042],
  failedRecords: [{ id: 1042, chinese: '...', ... }],
  errors: [
    { 
      recordId: 1042, 
      message: 'violates foreign key constraint "vocabulary_category_fkey"',
      code: '23503'
    }
  ]
}
```

---

## Using in Your Scripts

### Step 1: Import the utilities

```javascript
import { 
  syncRecordsWithProgress, 
  displaySyncResults, 
  syncVocabularyRecord,
  syncUserRecord,
  syncPracticeRecord
} from '../../utils/sync-progress.js';
```

### Step 2: Replace your record loop

**Old:**
```javascript
for (const row of records) {
  await neonPool.query(`INSERT INTO ...`, [...]);
}
```

**New:**
```javascript
const results = await syncRecordsWithProgress(
  records,
  neonPool,
  'vocabulary',  // table name
  async (record, pool) => {
    await syncVocabularyRecord(record, pool, msToDate, msToTimestamp);
  }
);

displaySyncResults(results);
```

### Step 3: Track synced count

```javascript
// For summary later
vocabSyncedCount = results.succeeded;

// Or if you want individual failed records:
console.log(`Failed IDs: ${results.failedIds.join(', ')}`);
console.log(`Failed records:`, results.failedRecords);
```

---

## Supported Tables

Pre-built sync functions for each table:

### `syncVocabularyRecord(record, pool, msToDate, msToTimestamp)`
Syncs a single vocabulary record. Required parameters:
- `record`: Vocabulary object with all fields
- `pool`: Neon connection pool
- `msToDate`: Helper to convert milliseconds to date
- `msToTimestamp`: Helper to convert milliseconds to ISO timestamp

**Example:**
```javascript
const vocabResults = await syncRecordsWithProgress(
  records,
  neonPool,
  'vocabulary',
  async (record, pool) => {
    await syncVocabularyRecord(record, pool, msToDate, msToTimestamp);
  }
);
```

### `syncUserRecord(record, pool, msToTimestamp)`
Syncs a single user record.

**Example:**
```javascript
const userResults = await syncRecordsWithProgress(
  records,
  neonPool,
  'users',
  async (record, pool) => {
    await syncUserRecord(record, pool, msToTimestamp);
  }
);
```

### `syncPracticeRecord(record, pool, msToDate, msToTimestamp)`
Syncs a single practice record.

**Example:**
```javascript
const practiceResults = await syncRecordsWithProgress(
  records,
  neonPool,
  'practice_records',
  async (record, pool) => {
    await syncPracticeRecord(record, pool, msToDate, msToTimestamp);
  }
);
```

---

## Complete Integration Example

Here's how to update a full section of sync code:

### Original (sync-to-neon-partial.js - VOCABULARY section)

```javascript
// ============ VOCABULARY ============
try {
  console.log('📝 Checking vocabulary...');
  
  const sqliteVocab = await sqliteDb.all('SELECT id, updated_at FROM vocabulary ORDER BY id');
  const neonVocabMap = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
  let vocabToSync = getRecordsToSync(sqliteVocab, neonVocabMap, 'updated_at');
  vocabSyncedCount = vocabToSync.length;
  
  logSyncStatus(sqliteVocab.length, vocabToSync);

  if (vocabToSync.length > 0) {
    const sqliteVocabData = await sqliteDb.all(`
      SELECT * FROM vocabulary WHERE id IN (${vocabToSync.join(',')}) ORDER BY id
    `);

    for (const row of sqliteVocabData) {
      await neonPool.query(
        `INSERT INTO vocabulary 
        (id, chinese, original, kana, category, difficulty, input_date, next_review_date, review_count, mastery_level, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
        chinese = $2, original = $3, kana = $4, category = $5, difficulty = $6,
        input_date = $7, next_review_date = $8, review_count = $9, mastery_level = $10,
        created_at = $11, updated_at = $12`,
        [row.id, row.chinese, row.original, row.kana, row.category, row.difficulty,
         msToDate(row.input_date), msToDate(row.next_review_date), row.review_count, row.mastery_level,
         msToTimestamp(row.created_at), msToTimestamp(row.updated_at)]
      );
    }
    console.log(`   ✅ ${vocabToSync.length} vocabulary items synced\n`);
  } else {
    console.log(`   ✅ No changes needed\n`);
  }
} catch (err) {
  logSyncError(err, 'Syncing vocabulary failed', {
    table: 'vocabulary',
    operation: 'fetch and sync vocabulary items',
    attemptedRecordCount: vocabToSync?.length
  });
}
```

### Updated (with per-record error handling)

```javascript
import { syncRecordsWithProgress, displaySyncResults, syncVocabularyRecord } from '../../utils/sync-progress.js';

// ... at top of file

// ============ VOCABULARY ============
try {
  console.log('📝 Checking vocabulary...');
  
  const sqliteVocab = await sqliteDb.all('SELECT id, updated_at FROM vocabulary ORDER BY id');
  const neonVocabMap = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
  let vocabToSync = getRecordsToSync(sqliteVocab, neonVocabMap, 'updated_at');
  
  logSyncStatus(sqliteVocab.length, vocabToSync);

  if (vocabToSync.length > 0) {
    const sqliteVocabData = await sqliteDb.all(`
      SELECT * FROM vocabulary WHERE id IN (${vocabToSync.join(',')}) ORDER BY id
    `);

    // ✨ NEW: Per-record error handling with progress
    const vocabResults = await syncRecordsWithProgress(
      sqliteVocabData,
      neonPool,
      'vocabulary',
      async (record, pool) => {
        await syncVocabularyRecord(record, pool, msToDate, msToTimestamp);
      }
    );

    displaySyncResults(vocabResults);
    vocabSyncedCount = vocabResults.succeeded;
  } else {
    console.log(`   ✅ No changes needed\n`);
  }
} catch (err) {
  logSyncError(err, 'Syncing vocabulary failed', {
    table: 'vocabulary',
    operation: 'fetch and sync vocabulary items',
    attemptedRecordCount: vocabToSync?.length
  });
}
```

---

## Output Comparison

### Before (Current)
```
📝 Checking vocabulary...
   ✅ 5 vocabulary items synced
```

### After (With Progress & Error Handling)
```
📝 Checking vocabulary...
Progress: . . . ✗ . . . . . .

Results:
  ✅ 9 succeeded (90%)
  ❌ 1 failed:
     1. ID 1042: violates foreign key constraint "vocabulary_category_fkey"

  💡 This record will be retried on next sync
      Run again: npm run sync-neon
```

---

## Debugging Failed Records

### Enable Debug Mode
```bash
DEBUG_SYNC=1 npm run sync-neon
```

This shows:
- Full error messages with error codes
- Detailed troubleshooting for each failure

### Investigate Failed Record
```bash
# Check if record exists in SQLite
node scripts/debug/check-id1.js 1042

# Check the actual record data
sqlite3 data/vocabulary.db "SELECT * FROM vocabulary WHERE id = 1042"

# Check if related records exist (e.g., category)
sqlite3 data/vocabulary.db "SELECT * FROM categories WHERE id = [category_id]"
```

---

## When Records Keep Failing

If the same record fails repeatedly on every sync:

1. **It's a data problem, not a temporary issue**
   ```bash
   DEBUG_SYNC=1 npm run sync-neon | grep "Record 1042"
   ```

2. **Fix the underlying data**
   - Missing related record (foreign key)
   - Invalid data format
   - Corrupted record

3. **Then sync again**
   ```bash
   npm run sync-neon  # Will retry the fixed record
   ```

---

## Benefits Summary

✅ **Better visibility:** See exactly which records failed  
✅ **Automatic recovery:** Failed records retry on next sync  
✅ **No data loss:** Partial success is preserved  
✅ **User friendly:** Progress indicator during long syncs  
✅ **Debuggable:** Error codes and messages for troubleshooting  
✅ **Idempotent:** Safe to retry any number of times  

---

## Next Steps for Implementation

1. Update `sync-to-neon-partial.js` to use per-record error handling
2. Update individual table syncs (vocabulary, users, practice)
3. Update full sync (`sync-to-neon.js`)
4. Test error scenarios (intentional failures)
5. Update ERROR_HANDLING_GUIDE.md with new progress format
