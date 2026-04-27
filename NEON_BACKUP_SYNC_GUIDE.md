# 🔄 Backup & Sync Guide: SQLite ↔ Neon

## Overview

Complete guide for safely backing up and syncing data between your local SQLite database and Neon PostgreSQL.

```
Local SQLite → Backup Neon → Sync to Neon (Full or Partial)
```

---

## ⚙️ Initial Setup: Configure .env.neon

Before syncing, you need to set up your Neon database credentials.

### Step 1: Create `.env.neon` file

Navigate to the `api` folder and create a `.env.neon` file with your Neon connection string:

```bash
cd api
# Create the file (replace with your actual Neon connection string)
echo 'DATABASE_URL=postgresql://username:password@host/database?sslmode=require&channel_binding=require' > .env.neon
```

### Step 2: Example `.env.neon` content:

```env
# Neon Database URL (for syncing only)
# Keep this separate from .env to avoid loading it in normal development
DATABASE_URL=postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-damp-math-ahvdmdkf-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Step 3: Security - `.env.neon` is protected

✅ **Good news**: `.env.neon` is added to `.gitignore` automatically
- Your credentials will **never** be committed to git
- The file only exists on your local machine
- Safe to store sensitive database credentials

### Step 4: Verify setup

Test that the connection works:

```bash
cd api
npm run sync-neon  # This loads DATABASE_URL from .env.neon automatically
```

Expected output:
```
✅ Loaded DATABASE_URL from .env.neon
🔄 Starting Neon sync...
🔐 Connecting to Neon...
✅ Connected
```

---

## 📊 Sync Modes Quick Reference

| Mode | Command | Use Case | Speed | Data Synced |
|------|---------|----------|-------|------------|
| **Partial — All** | `npm run sync-all-partial` | Daily updates, incremental changes | ⚡ Fast | Only changed records |
| **Full — All** | `npm run sync-all-full` | Initial setup, complete refresh | Slower | All records |
| **Partial — Vocab** | `npm run sync-vocab-only-partial` | Fix vocabulary table only | Very Fast | Vocabulary table |
| **Full — Vocab** | `npm run sync-vocab-only-full` | Force-refresh vocabulary | Fast | Vocabulary table |
| **Partial — Users** | `npm run sync-users-only-partial` | Fix users table only | Very Fast | Users table |
| **Full — Users** | `npm run sync-users-only-full` | Force-refresh users | Fast | Users table |
| **Partial — Practice** | `npm run sync-practice-only-partial` | Fix practice records only | Very Fast | Practice records |
| **Full — Practice** | `npm run sync-practice-only-full` | Force-refresh practice records | Fast | Practice records |

---

## 🛡️ Step 1: Backup Neon Data (IMPORTANT!)

Always backup Neon before syncing. This is your safety net!

### Command:
```bash
cd api
npm run backup-neon
```

### What it does:
- Exports all Neon PostgreSQL data to JSON
- Creates a timestamped backup file: `data/exports/neon-backup-YYYY-MM-DD.json`
- Also creates `data/exports/neon-backup-latest.json` for easy reference

### Example Output:
```
🔐 Backing up Neon PostgreSQL database...

✅ Connected to Neon
📝 Backing up vocabulary...
   ✅ 408 records
👤 Backing up users...
   ✅ 4 records
📊 Backing up practice records...
   ✅ 180 records

✅ Backup complete!
📁 Saved to: data/exports/neon-backup-2026-04-09.json
📊 File size: 154.05 KB
🔗 Latest backup: data/exports/neon-backup-latest.json
```

---

## 🚀 Step 2a: Full Sync Local Data to Neon

Use this for initial setup or when you need to sync everything.

### Command:
```bash
cd api
npm run sync-to-neon
```

### What it does:
1. Syncs all records from all tables
2. Shows data counts before and after
3. **REQUIRES** user confirmation before proceeding
4. Uses `INSERT OR UPDATE` logic (updates existing, inserts new)
5. Shows final data counts

### Example Flow:
```
🔄 SQLite → Neon Sync Tool

⚠️  WARNING: This will overwrite data in Neon!
   Make sure you have backed up Neon data first.

Have you backed up Neon data? (y/n): y

🔐 Connecting to Neon...
✅ Connected to Neon

📊 Starting sync process...

📈 Data counts:
   SQLite → Neon
   Vocabulary: 406 → 406
   Users: 4 → 4
   Practice Records: 180 → 180

Proceed with sync? (y/n): y

🔄 Syncing vocabulary...
   ✅ 406 vocabulary items synced
🔄 Syncing users...
   ✅ 4 users synced
🔄 Syncing practice records...
   ✅ 180 practice records synced

✅ Sync complete!
📊 Neon data after sync:
   Vocabulary: 406 → 408
   Users: 4 → 4
   Practice Records: 180 → 180
```

---

## ⚡ Step 2b: Partial Sync (Only Changed Records)

Much faster! Only syncs records that have been modified. Perfect for daily updates.

### Command:
```bash
cd api
npm run sync-to-neon-partial
```

### What it does:
1. Compares `updated_at` timestamps between SQLite and Neon
2. Only syncs records that:
   - Don't exist in Neon yet, OR
   - Have been updated in SQLite (newer than Neon)
3. Skips unchanged records
4. Shows statistics: Total | To Sync | Skipped
5. Much faster than full sync! ⚡

### Example Flow:
```
⚡ Partial Sync: Only sync changed records

🔐 Connecting to Neon...
✅ Connected

📊 Comparing changes...

📝 Checking vocabulary...
   Total: 406 | To sync: 3 | Skipped: 403
   ✅ 3 vocabulary items synced

👤 Checking users...
   Total: 4 | To sync: 0 | Skipped: 4
   ✅ No changes needed

📊 Checking practice records...
   Total: 180 | To sync: 5 | Skipped: 175
   ✅ 5 practice records synced

✅ Partial sync complete!
```

### When to use partial sync:
- ✅ Daily/regular updates
- ✅ After adding a few new words
- ✅ After practice sessions
- ✅ When you want speed

### When to use full sync:
- ✅ Initial setup
- ✅ Recovery/restoration
- ✅ Complete refresh needed

---

## 🎯 Step 2c: Single Table Sync (For Debugging)

If one table has an error, fix it and sync only that table!

### Individual Table Commands:

**Vocabulary only:**
```bash
npm run sync-vocab-only-partial  # Partial sync (changed only) — default
npm run sync-vocab-only-full     # Full sync
```

**Users only:**
```bash
npm run sync-users-only-partial  # Partial sync — default
npm run sync-users-only-full     # Full sync
```

**Practice Records only:**
```bash
npm run sync-practice-only-partial  # Partial sync — default
npm run sync-practice-only-full     # Full sync
```

### Debugging Workflow:

```bash
# Step 1: Hit error? Fix the bug in your code

# Step 2: Sync only that table (very fast!)
npm run sync-vocab-only-partial

# Step 3: Verify it worked
```

---

## 🔙 Step 3: Restore from Backup (If Needed)

If something goes wrong, restore Neon from your backup.

### Command:
```bash
# Restore from latest backup
cd api
npm run restore-neon

# Or specify a specific backup file
node restore-neon-from-json.js data/exports/neon-backup-2026-04-09.json
```

### What it does:
1. Reads backup JSON file
2. Clears existing Neon data
3. Restores all data from backup
4. Requires user confirmation

**⚠️ WARNING**: This will DELETE all current Neon data and replace it!

---

## 📋 Complete Workflows

### Workflow 1: Initial Setup (Full Sync)

```bash
cd api

# Step 1: Backup current Neon
npm run backup-neon

# Step 2: Full sync all data
npm run sync-all-full

# Step 3: Verify in Neon Console
```

### Workflow 2: Daily Update (Partial Sync)

```bash
cd api

# Fast sync of only changed records
npm run sync-all-partial

# Takes seconds instead of minutes!
```

### Workflow 3: Fix After Error

```bash
cd api

# 1. Backup before fixing
npm run backup-neon

# 2. Fix the bug (e.g., schema change)
# (Make code changes and commit)

# 3. Sync only the affected table
npm run sync-vocab-only-partial

# 4. Check for errors in output
# If still broken, restore backup:
npm run restore-neon
```

### Workflow 4: Complete Refresh

```bash
cd api

# Restore everything from backup
npm run restore-neon

# Then sync latest local changes
npm run sync-to-neon
```

---

## 🔐 Environment Setup

Make sure your `.env` file in `/api` folder has the correct connection string:

```env
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/neondb?sslmode=require
```

Get your Neon connection string from:
1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project
3. Click "Connection string"
4. Copy the **PostgreSQL** connection string

### Verify Connection:
```bash
# Test your connection string
psql $DATABASE_URL -c "SELECT NOW();"
```

---

## 📁 Backup Files

All backups are stored in: `data/exports/`

```
data/
├── exports/
│   ├── neon-backup-2026-04-09.json         (timestamped backup)
│   ├── neon-backup-latest.json             (latest backup - always exists)
│   ├── vocabulary-export-2026-04-09.json   (SQLite snapshot)
│   └── vocabulary-latest.json              (latest SQLite export)
```

### Git Integration (Recommended):
```bash
# Track backups in git for history
git add data/exports/neon-backup-*.json
git commit -m "Backup before sync on 2026-04-09"
```

---

## ⚠️ Safety Tips

1. **Always backup before syncing** - Don't skip the backup step!
   ```bash
   npm run backup-neon
   ```

2. **Use git to track backups** - Keep history for recovery
   ```bash
   git add data/exports/neon-backup-*.json
   git commit -m "Backup: $(date)"
   ```

3. **Keep multiple backups** - Keep timestamped versions
   - `neon-backup-2026-04-09.json` ← specific date
   - `neon-backup-latest.json` ← always the latest

4. **Test in staging first** - If possible:
   - Test on a staging Neon database first
   - Then sync to production

5. **Review data counts** - Always check before/after numbers
   ```
   Before: Vocabulary: 406 | Users: 4 | Practice: 180
   After:  Vocabulary: 408 | Users: 4 | Practice: 185
   ```

6. **Use partial sync for daily work** - Much faster!
   ```bash
   npm run sync-to-neon-partial  # Only changed records
   ```

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL not set"
**Solution**: Add `DATABASE_URL` to your `.env` file in the `api` folder
```bash
# Check if .env exists
ls -la api/.env

# Add connection string
echo "DATABASE_URL=postgresql://..." >> api/.env
```

### Error: "Failed to connect to Neon"
**Solution**:
- Check internet connection
- Verify `DATABASE_URL` is correct
- Test connection: `psql $DATABASE_URL -c "SELECT NOW();"`
- Check if Neon server is running in console

### Error: "Table not found"
**Solution**: This is normal for new tables
- The script will skip missing tables
- Create table in Neon schema first
- Then run sync again

### Sync takes a long time
**Solution**:
- Use partial sync instead: `npm run sync-all-partial`
- For large datasets, full sync can take time
- Don't interrupt the process
- Check internet connection

### One table has error, others are fine
**Solution**: Sync only that table
```bash
# Found error in vocabulary table?
npm run sync-vocab-only-partial

# Error in practice records?
npm run sync-practice-only-partial
```

---

## 🔧 SQLite ↔ Neon Compatibility Issues & Debugging

### Issue 1: "SQLITE_RANGE: column index out of range"

**Root Cause**: PostgreSQL-specific SQL expressions like `BEIJING_CURRENT_DATE` (timezone casting) were being passed as literal strings to SQLite, which doesn't understand them.

**Symptoms**:
- Error on local endpoints: `/api/vocabulary/review/today`
- Error in practice endpoints
- Works in Neon but fails locally

**Solution**:
- Created `getBeijingCurrentDateParam()` function that returns:
  - **SQLite**: Plain date string `"2026-04-09"` (calculated in JavaScript)
  - **Neon**: SQL expression wrapped in `RawSQL` for injection
- Added `setDatabaseType()` in `db.js` to detect which database is active
- Updated all controllers to use the dynamic function instead of static constants

**Debug Process**:
```bash
# 1. Added console.log to see what was being passed
console.log('dateParam:', dateParam, 'isNeon:', isNeon);

# 2. Discovered SQLite was getting SQL expressions as strings
# 3. Implemented database type detection
# 4. Tested both locally and on Neon
```

### Issue 2: "date/time field value out of range"

**Root Cause**: JavaScript milliseconds (`1775728965317`) being sent to PostgreSQL's `TIMESTAMP` type, which expects ISO 8601 format.

**Symptoms**:
- Error on Neon production: `/api/practice` endpoint fails
- Error message: `date/time field value out of range: "1775728965317"`
- Works locally because SQLite accepts milliseconds

**Solution**:
- Created `getCurrentTimestamp()` function that returns:
  - **SQLite**: JavaScript milliseconds (integer)
  - **Neon**: ISO timestamp string`2026-04-09T14:30:45.123Z`
- Updated practice controller to use dynamic timestamp format

**Debug Process**:
```bash
# 1. Tested practice endpoint on Neon got error
# 2. Realized timestamp format was wrong
# 3. SQLite uses milliseconds internally, PostgreSQL needs ISO strings
# 4. Created database-aware timestamp converter
# 5. Tested both endpoints after fix
```

### Issue 3: Syntax Error - Duplicate Closing Brace

**Root Cause**: Accidental duplicate `}}` introduced during editing.

**Symptoms**:
- SyntaxError in `vocabulary.controller.js` line 456
- Code wouldn't parse

**Solution**:
- Removed duplicate closing brace

### Key Learnings

| Database | Date Format | Timestamp Format | SQL Expressions | Timezone |
|----------|-------------|------------------|-----------------|----------|
| SQLite | `YYYY-MM-DD` string | Milliseconds (int) | Not supported | None (handled in JS) |
| PostgreSQL/Neon | `date` type | ISO 8601 string | `NOW() AT TIME ZONE 'Asia/Shanghai'` | Supported natively |

**Best Practice**: Always test on both databases when adding date/time functionality!

---

## 💡 Timezone Utilities Migration Path

### Before (Database-Specific)
```javascript
// Old approach - only worked with Neon
const BEIJING_CURRENT_DATE = `(NOW() AT TIME ZONE 'Asia/Shanghai')::date`;

// Controllers had to pick which database they were on
if (isNeon) {
  // Use SQL expression
} else {
  // Use JS calculation - but developers often forgot this!
}
```

### After (Database-Agnostic)
```javascript
// utils/timezone.js - Single source of truth
const getBeijingCurrentDateParam = () => {
  if (isNeon) {
    // Return SQL expression wrapped for injection
    return wrapRawSQL(`(NOW() AT TIME ZONE 'Asia/Shanghai')::date`);
  } else {
    // Return calculated date string for SQLite
    const nowBeijing = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    return nowBeijing.toISOString().split('T')[0];
  }
};

// Controllers - no conditional logic needed!
const getTodayVocabulary = async (req, res) => {
  const dateParam = getBeijingCurrentDateParam(); // Works everywhere
  // ... rest of logic
};
```

### Files Updated
- `/api/utils/timezone.js` - Complete rewrite with 3 new functions for database compatibility
- `/api/db.js` - Added `setDatabaseType()` call to initialize detection
- `/api/controllers/vocabulary.controller.js` - Switched to dynamic timezone functions
- `/api/controllers/practice.controller.js` - Switched to dynamic timestamp functions  
- `/api/controllers/stats.controller.js` - Switched to dynamic timezone functions

---

## ✅ Testing & Verification Results

All compatibility issues discovered and fixed during this session. Both SQLite and Neon endpoints now tested and working.

### LocalDatabase (SQLite) Tests
```bash
# Test 1: Get today's vocabulary review
curl -s http://localhost:3001/api/vocabulary/review/today | jq '.'
# Response: {"success":true,"data":[...34 review items...]}

# Test 2: Record a practice attempt
curl -s -X POST http://localhost:3001/api/practice \
  -H "Content-Type: application/json" \
  -d '{"vocabulary_id":1,"is_correct":true}' | jq '.'
# Response: {"success":true,"data":{"practice":{"id":8,...}}}
```

### Production Database (Neon) Tests
```bash
# Test: Record practice attempt on Vercel
curl -s -X POST https://[your-domain]/api/practice \
  -H "Content-Type: application/json" \
  -d '{"vocabulary_id":1,"is_correct":true}' | jq '.'
# Response: {"success":true,"data":{"practice":null,"vocabulary":{...},"message":"回答正确！"}}
```

### Data Integrity After Full Sync
```
✅ Vocabulary:   406 local → 408 Neon (2 new records synced)
✅ Users:        4 local  → 4 Neon (all synced)
✅ Practice:     180 local → 180 Neon (all synced)
✅ Backup:       neon-backup-2026-04-09.json created successfully
```

### Git Commits Verifying Fixes
```
98c7f2d fix: use appropriate timestamp format for SQLite vs Neon
a3b9e21 fix: import getCurrentTimestamp from timezone utility
2f41c03 refactor: database-agnostic timezone utilities
7d1f2f4 fix: remove duplicate closing brace in getTodayReview
```

---

## 🔍 Quick Debugging Checklist

When adding new date/time features to the API:

### ✓ Before You Code
- [ ] Will this feature use dates or timestamps?
- [ ] Do I need current date in Beijing timezone?
- [ ] Will this work on both SQLite (local) and PostgreSQL/Neon (production)?

### ✓ Implementation
- [ ] Import `getBeijingCurrentDateParam()` or `getBeijingCurrentDate()` or `getCurrentTimestamp()` from utils/timezone
- [ ] Never hardcode `NOW()` - use helper functions instead
- [ ] Never assume date format - use helpers that return correct format per database
- [ ] For parameters: use `getBeijingCurrentDateParam()` (return param, not SQL expression)
- [ ] For computed values: use `getBeijingCurrentDate()` or `getCurrentTimestamp()`

### ✓ Testing (IMPORTANT - test both!)
- [ ] `curl http://localhost:3001/api/yourEndpoint` - Test on SQLite
- [ ] Deploy to Vercel and test same endpoint on Neon production
- [ ] If one fails, it's likely a database compatibility issue
- [ ] Check timezone.js for available helper functions

### ✓ Common Errors & Quick Fixes

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `SQLITE_RANGE: column index out of range` | Using `RawSQL` on SQLite | Use `getBeijingCurrentDateParam()` instead |
| `date/time field value out of range: "1775728...` | Milliseconds sent to Neon | Use `getCurrentTimestamp()` |
| `no such function: NOW` | NOW() doesn't exist in SQLite | Use `getCurrentTimestamp()` |
| Works locally but fails on Neon | Date format mismatch | Check timezone.js helpers |
| Works on Neon but fails locally | SQL expression used on SQLite | Use helpers, not raw SQL |

### ✓ When to Use Each Helper Function
```javascript
// For query parameters (WHERE clause dates)
const dateParam = getBeijingCurrentDateParam(); // Returns appropriate format/SQL

// For display (formatted date string)
const dateStr = getBeijingCurrentDate(); // Returns YYYY-MM-DD string

// For storing in database (timestamps)
const timestamp = getCurrentTimestamp(); // Returns ms for SQLite, ISO for Neon

// For timezone-aware date calculations
const { BEIJING_OFFSET_MS } = require('./timezone'); // Use for manual calculations if needed
```

---

## 📊 Complete Command Reference

All scripts are in `/api/` directory:

| Script | Command | Purpose | Speed |
|--------|---------|---------|-------|
| `backup-neon-to-json.js` | `npm run backup-neon` | Backup all Neon data to JSON | Fast ⚡ |
| `sync-to-neon.js` | `npm run sync-all-full` | Full sync all tables | Slower 🐢 |
| `sync-to-neon-partial.js` | `npm run sync-all-partial` | Partial sync all tables (changed only) | Very Fast ⚡⚡ |
| `sync-vocabulary-to-neon.js` | `npm run sync-vocab-only-partial` | Partial sync vocabulary (default) | Ultra Fast ⚡⚡⚡ |
| `sync-vocabulary-to-neon.js` | `npm run sync-vocab-only-full` | Full sync vocabulary table | Very Fast ⚡⚡ |
| `sync-users-to-neon.js` | `npm run sync-users-only-partial` | Partial sync users (default) | Ultra Fast ⚡⚡⚡ |
| `sync-users-to-neon.js` | `npm run sync-users-only-full` | Full sync users table | Very Fast ⚡⚡ |
| `sync-practice-records-to-neon.js` | `npm run sync-practice-only-partial` | Partial sync practice records (default) | Ultra Fast ⚡⚡⚡ |
| `sync-practice-records-to-neon.js` | `npm run sync-practice-only-full` | Full sync practice records table | Very Fast ⚡⚡ |
| `restore-neon-from-json.js` | `npm run restore-neon` | Restore Neon from backup | Fast ⚡ |
| `export-to-json.js` | `npm run export-json` | Backup SQLite to JSON | Fast ⚡ |
| `import-from-json.js` | `npm run import-json` | Restore SQLite from JSON | Fast ⚡ |

---

## 🚀 Performance Tips

### For Best Performance:

1. **Use partial sync for daily work**
   ```bash
   npm run sync-all-partial  # Only syncs changed records
   ```

2. **Use single-table sync for debugging**
   ```bash
   npm run sync-vocab-only-partial  # Super fast for fixing one table
   ```

3. **Batch operations before syncing**
   - Add multiple words locally
   - Do practice sessions
   - Then sync once with partial mode
   - Saves time and bandwidth

4. **Schedule backups before risky operations**
   ```bash
   npm run backup-neon
   # Make big changes...
   npm run sync-all-partial
   ```

---

## 📝 Common Scenarios

### Scenario 1: I Added 3 New Words
```bash
cd api
npm run sync-to-neon-partial  # Syncs only those 3 words ⚡
```

### Scenario 2: I Changed Word #123
```bash
cd api
npm run sync-to-neon-partial  # Syncs only that word ⚡
```

### Scenario 3: After Practice Session (10 records)
```bash
cd api
npm run sync-to-neon-partial  # Syncs 10 practice records ⚡
```

### Scenario 4: Did Practice Session, Schema Maybe Broke
```bash
cd api

# Step 1: Backup first
npm run backup-neon

# Step 2: Fix schema issue...
# (Edit code, commit, etc.)

# Step 3: Sync only practice records
npm run sync-practice-records -- --partial

# Step 4: Check for errors
# If still broken:
npm run restore-neon  # Restore from backup
```

### Scenario 5: Complete Data Refresh (Start Over)
```bash
cd api

# Backup current Neon
npm run backup-neon

# Restore to known good state
npm run restore-neon

# Full sync with latest local data
npm run sync-to-neon
```

---

## ✅ Verification Checklist

After each sync, verify in [Neon Console](https://console.neon.tech/):

- [ ] Record counts match expectations
- [ ] Recent records are present
- [ ] No duplicate entries
- [ ] Data looks correct
- [ ] Timestamps are reasonable

```sql
-- Quick verification queries
SELECT COUNT(*) FROM vocabulary;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM practice_records;
SELECT * FROM vocabulary ORDER BY updated_at DESC LIMIT 5;
```

---

## 🎯 Recommended Workflow

### Daily Routine:
```bash
cd api

# Quick partial sync of changes
npm run sync-to-neon-partial

# Takes seconds! ⚡
```

### Weekly:
```bash
cd api

# Backup for archive
npm run backup-neon

# Full verification sync
npm run sync-to-neon
```

### Before Big Changes:
```bash
cd api

# Always backup first
npm run backup-neon

# Make changes...

# Use specific table sync if something breaks
npm run sync-vocab-only-partial
```

---

## 📞 Need Help?

| Issue | Command |
|-------|---------|
| Connection not working | `psql $DATABASE_URL -c "SELECT NOW();"` |
| One table has error | `npm run sync-vocab-only-partial` (or users/practice) |
| Lost data? | `npm run restore-neon` |
| Want to start fresh? | `npm run backup-neon && npm run restore-neon` |
| Not sure what changed? | `npm run sync-all-partial` (shows what will sync) |

