# Japanese Vocab Sync System Guide

## Overview

The sync system keeps vocabulary data synchronized between **SQLite** (local development) and **Neon PostgreSQL** (production). It compares timestamps to detect changes and only syncs what's new or modified.

```
SQLite (Local)  →  Compare Timestamps  →  Neon PostgreSQL (Cloud)
   419 words        via EXTRACT(EPOCH)       419 words
     4 users        Reliable milliseconds      4 users  
    62 records      No timezone bugs           62 records
```

---

## Key Concepts

### 1. **Partial Sync vs Full Sync**

**Partial Sync** (Default, Fast) ⚡
- Compares timestamps between SQLite and Neon
- Only syncs records that are NEW or MODIFIED
- ~100ms for 400+ records
- **Command**: `npm run sync-neon`

**Full Sync** (Rare, Slow)
- Syncs ALL records regardless of changes
- Used for initial migration or recovery
- ~5000ms+ for 400+ records
- **Command**: `node sync-to-neon.js` (no --partial flag)

### 2. **Timestamp Comparison Logic**

The sync system uses **milliseconds since epoch** (Unix time in milliseconds):

```javascript
// SQLite stores: 1700000000000 (milliseconds)
// Example: April 8, 2026 at 10:00 AM

// Comparison: Only sync if SQLite is NEWER than Neon
if (sqliteMs - neonMs > 3600000) {  // > 1 hour newer
  sync_record()
}
```

**Why 1 hour threshold?** 
- Avoids constant re-syncing of old records
- Catches genuinely changed data
- Records must be modified, not just retrieved

### 3. **Why EXTRACT(EPOCH)?**

*Problem:* JavaScript's Date parsing breaks with timezone-aware strings
```javascript
// This FAILS after timezone offset:
new Date("Mon Apr 13 2026 16:35:17 GMT+0800").getTime()
// Returns WRONG milliseconds due to GMT+0800 interpretation
```

*Solution:* Let PostgreSQL calculate it
```javascript
// PostgreSQL does the math correctly:
EXTRACT(EPOCH FROM practiced_at) * 1000  // Always correct
// Returns exact milliseconds, ignores timezones
```

---

## Architecture

### Three Tables Being Synced

#### 1. **vocabulary** table
- **Timestamp column**: `updated_at` (when record last changed)
- **Script**: `sync-vocabulary-to-neon.js --partial`
- **Sample**: 419 words, 0 new updates

#### 2. **users** table  
- **Timestamp column**: `created_at` (when user created)
- **Script**: `sync-users-to-neon.js --partial`
- **Sample**: 4 users, all in sync

#### 3. **practice_records** table
- **Timestamp column**: `practiced_at` (when practice session happened)
- **Script**: `sync-practice-records-to-neon.js --partial`
- **Sample**: 62 records, all in sync

### Master Coordinator

**`sync-to-neon-partial.js`**
- Calls all three tables in sequence
- Loads DATABASE_URL from `.env.neon`
- Provides helpful setup instructions if URL missing

**Flow:**
```
1. Connect to Neon
2. Check vocabulary (get timestamps, compare, sync if needed)
3. Check users (get timestamps, compare, sync if needed)
4. Check practice_records (get timestamps, compare, sync if needed)
5. Disconnect and report results
```

---

## The Common Utility: `utils/timestamp-sync.js`

All sync scripts use three shared functions:

### Function 1: `getNeonTimestampMap(pool, table, column)`

**What it does:**
- Fetches all records from Neon
- Extracts their timestamps using PostgreSQL's EXTRACT(EPOCH)
- Returns a Map for fast lookup

**Example:**
```javascript
const map = await getNeonTimestampMap(neonPool, 'vocabulary', 'updated_at');
// Result: Map { 1 => 1700000000000, 2 => 1700000100000, ... }
```

**Why EXTRACT(EPOCH)?** 
Direct millisecond calculation in the database = no JavaScript timezone bugs

### Function 2: `getRecordsToSync(sqliteRecords, neonMap, field)`

**What it does:**
- Compares each SQLite record with its Neon equivalent
- Identifies which ones need syncing

**Logic:**
```javascript
for each SQLite record:
  - If missing in Neon → SYNC (new record)
  - If SQLite is >1hr newer → SYNC (genuinely changed)
  - Otherwise → SKIP (already synced)
```

**Example:**
```javascript
const sqliteVocab = [
  { id: 1, updated_at: 1700000000000 },  // Created long ago
  { id: 2, updated_at: 1700099999999 },  // Modified 1.5 hours ago
  { id: 3, updated_at: 1700000050000 }   // Created long ago
];

const neonMap = new Map([
  [1, 1700000000000],  // Matches SQLite exactly
  [2, 1700000000000],  // SQLite is 99,999,999ms (27 hours) newer → SYNC
  // 3 is missing in Neon → SYNC
]);

// Result: [2, 3] need syncing
```

### Function 3: `logSyncStatus(total, toSync)`

**What it does:**
- Prints consistent status line across all syncs

**Output:**
```
   Total: 419 | To sync: 1 | Skipped: 418
```

---

## Usage Guide

### Running Syncs

**One-time full sync (rare):**
```bash
cd api
# Load DATABASE_URL from .env.neon
DATABASE_URL=$(grep DATABASE_URL .env.neon | cut -d'=' -f2) \
  node sync-neon.js
```

**Recommended: Partial sync (fast, incremental):**
```bash
npm run sync-neon
# Or directly:
node sync-neon.js --partial
```

**Individual table sync:**
```bash
# Vocabulary only
node sync-vocabulary-to-neon.js --partial

# Users only
node sync-users-to-neon.js --partial

# Practice records only  
node sync-practice-records-to-neon.js --partial
```

### Setup Once

**1. Create `.env.neon` file:**
```bash
cp .env.neon.example .env.neon
# Edit with your actual Neon DATABASE_URL
nano .env.neon
```

**2. Get DATABASE_URL from:**
- [Neon Console](https://console.neon.tech/)
- Copy connection string from your project

**3. Format should be:**
```
DATABASE_URL=postgresql://user:password@host/database
```

---

## Data Flow Example

### Scenario: User adds 1 new vocabulary word

**SQLite:**
```
ID  | Chinese | Original | updated_at
----+---------+----------+------------------
418 | 天       | てん     | 1700000000000 (old)
419 | 新       | あたら   | 1700099999999 (NOW - just added)
```

**Neon (before sync):**
```
ID  | Chinese | Original | updated_at
----+---------+----------+------------------
418 | 天       | てん     | 1700000000000
(419 doesn't exist yet)
```

**Sync Process:**

1. Get Neon timestamps: `{418 => 1700000000000}`
2. Compare with SQLite:
   - ID 418: SQLite 1700000000000 = Neon 1700000000000 → **SKIP** (same)
   - ID 419: Not in Neon map → **SYNC** (new)
3. Insert ID 419 into Neon
4. Report: `Total: 419 | To sync: 1 | Skipped: 418`

**Neon (after sync):**
```
ID  | Chinese | Original | updated_at
----+---------+----------+------------------
418 | 天       | てん     | 1700000000000
419 | 新       | あたら   | 1700099999999 (NOW synced!)
```

**Next sync run:**
- ID 419: SQLite 1700099999999 = Neon 1700099999999 → **SKIP** (already in sync)
- Result: `Total: 419 | To sync: 0 | Skipped: 419` ✅

---

## Files Reference

### Main Sync Scripts
- `sync-neon.js` - Entry point, loads `.env.neon`
- `sync-neon.sh` - Bash wrapper (cross-platform helper)
- `sync-to-neon-partial.js` - Master coordinator (calls all 3 tables)
- `sync-to-neon.js` - Full sync (legacy, rarely used)

### Individual Table Scripts
- `sync-vocabulary-to-neon.js` - Vocabulary table only
- `sync-users-to-neon.js` - Users table only
- `sync-practice-records-to-neon.js` - Practice records table only

### Utilities
- `utils/timestamp-sync.js` - Common timestamp comparison functions
- `utils/neon-wrapper.js` - SQLite API compatibility layer for Neon

---

## Troubleshooting

### "DATABASE_URL not set"
**Solution:** Check `.env.neon` file exists and has valid value
```bash
cat .env.neon | grep DATABASE_URL
```

### "60 records syncing constantly"
**Old issue (FIXED):** Timezone offset bug in timestamp comparison
- **Status**: Resolved with EXTRACT(EPOCH) method
- **Safeguard**: 1-hour threshold prevents re-syncing old records

### "Some records not syncing"
**Check:** If modified >1 hour ago, they sync. Otherwise skipped by design
- **Expected behavior**: Partial sync only catches recent changes
- **Solution**: Use full sync if you need everything: `node sync-neon.js` (no --partial)

### "Wrong timestamps appeared"
**Old issue (FIXED):** Invalid epoch dates (1970-01-21) were corrupting data
- **Status**: Data normalized during initial sync
- **Current**: All timestamps are valid and consistent

---

## Performance

**Typical sync time:**
- Partial sync: **50-200ms** (just timestamps, fast comparison)
- Full sync: **2000-5000ms** (all data, full transfer)

**What's fast:**
- EXTRACT(EPOCH) in PostgreSQL (single query)
- Millisecond comparison (simple math)
- Map lookup (O(1) access)

**What's slow:**
- Network latency to Neon (~20-50ms)
- Full data transfer (if syncing 400+ records)

---

## Next Steps

1. **First time?** Run: `npm run sync-neon`
2. **Add new vocab?** Just run sync again - it detects changes
3. **Need debugging?** Check logs for table status line
4. **Contributing?** See architecture above for how to add new tables

---

## Quick Reference Card

| Aspect | Detail |
|--------|--------|
| **Sync Type** | Partial (default, fast) or Full (rare, slow) |
| **Timestamp Method** | EXTRACT(EPOCH FROM column) * 1000 |
| **Threshold** | Only sync if > 1 hour difference |
| **Config File** | `.env.neon` (stores DATABASE_URL) |
| **Entry Point** | `npm run sync-neon` |
| **Tables** | vocabulary (419), users (4), practice_records (62) |
| **Master Script** | `sync-to-neon-partial.js` |
| **Utility Module** | `utils/timestamp-sync.js` |
| **Common Pattern** | Get timestamps → Compare → Sync if needed |
