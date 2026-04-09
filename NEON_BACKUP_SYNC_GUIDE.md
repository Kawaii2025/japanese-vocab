# 🔄 Backup & Sync Guide: SQLite ↔ Neon

## Overview

Complete guide for safely backing up and syncing data between your local SQLite database and Neon PostgreSQL.

```
Local SQLite → Backup Neon → Sync to Neon (Full or Partial)
```

---

## 📊 Sync Modes Quick Reference

| Mode | Command | Use Case | Speed | Data Synced |
|------|---------|----------|-------|------------|
| **Full Sync** | `npm run sync-to-neon` | Initial setup, complete refresh | Slower | All records |
| **Partial Sync** | `npm run sync-to-neon-partial` | Daily updates, incremental changes | ⚡ Fast | Only changed records |
| **Sync Vocabulary** | `npm run sync-vocabulary` | Fix vocabulary table only | Very Fast | Vocabulary table |
| **Sync Users** | `npm run sync-users` | Fix users table only | Very Fast | Users table |
| **Sync Practice Records** | `npm run sync-practice-records` | Fix practice records only | Very Fast | Practice records table |

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
npm run sync-vocabulary              # Full sync
npm run sync-vocabulary -- --partial # Partial sync (changed only)
```

**Users only:**
```bash
npm run sync-users                   # Full sync
npm run sync-users -- --partial      # Partial sync
```

**Practice Records only:**
```bash
npm run sync-practice-records        # Full sync
npm run sync-practice-records -- --partial # Partial sync
```

### Debugging Workflow:

```bash
# Step 1: Hit error? Fix the bug in your code
# (e.g., fix vocabulary table schema)

# Step 2: Sync only that table (very fast!)
npm run sync-vocabulary -- --partial

# Step 3: Verify it worked
# (Check Neon console or test API)
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
npm run sync-to-neon

# Step 3: Verify in Neon Console
```

### Workflow 2: Daily Update (Partial Sync)

```bash
cd api

# Fast sync of only changed records
npm run sync-to-neon-partial

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
npm run sync-vocabulary -- --partial

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
- Use partial sync instead: `npm run sync-to-neon-partial`
- For large datasets, full sync can take time
- Don't interrupt the process
- Check internet connection

### One table has error, others are fine
**Solution**: Sync only that table
```bash
# Found error in vocabulary table?
npm run sync-vocabulary -- --partial

# Error in practice records?
npm run sync-practice-records -- --partial
```

---

## 📊 Complete Command Reference

All scripts are in `/api/` directory:

| Script | Command | Purpose | Speed |
|--------|---------|---------|-------|
| `backup-neon-to-json.js` | `npm run backup-neon` | Backup all Neon data to JSON | Fast ⚡ |
| `sync-to-neon.js` | `npm run sync-to-neon` | Full sync all tables | Slower 🐢 |
| `sync-to-neon-partial.js` | `npm run sync-to-neon-partial` | Partial sync (changed only) | Very Fast ⚡⚡ |
| `sync-vocabulary-to-neon.js` | `npm run sync-vocabulary` | Full sync vocabulary table | Very Fast ⚡⚡ |
| `sync-vocabulary-to-neon.js` | `npm run sync-vocabulary -- --partial` | Partial sync vocabulary | Ultra Fast ⚡⚡⚡ |
| `sync-users-to-neon.js` | `npm run sync-users` | Sync users table | Very Fast ⚡⚡ |
| `sync-practice-records-to-neon.js` | `npm run sync-practice-records` | Sync practice records table | Very Fast ⚡⚡ |
| `restore-neon-from-json.js` | `npm run restore-neon` | Restore Neon from backup | Fast ⚡ |
| `export-to-json.js` | `npm run export-json` | Backup SQLite to JSON | Fast ⚡ |
| `import-from-json.js` | `npm run import-json` | Restore SQLite from JSON | Fast ⚡ |

---

## 🚀 Performance Tips

### For Best Performance:

1. **Use partial sync for daily work**
   ```bash
   npm run sync-to-neon-partial  # Only syncs changed records
   ```

2. **Use single-table sync for debugging**
   ```bash
   npm run sync-vocabulary -- --partial  # Super fast for fixing one table
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
   npm run sync-to-neon-partial
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
npm run sync-vocabulary -- --partial
```

---

## 📞 Need Help?

| Issue | Command |
|-------|---------|
| Connection not working | `psql $DATABASE_URL -c "SELECT NOW();"` |
| One table has error | `npm run sync-[table] -- --partial` |
| Lost data? | `npm run restore-neon` |
| Want to start fresh? | `npm run backup-neon && npm run restore-neon` |
| Not sure what changed? | `npm run sync-to-neon-partial` (shows what will sync) |

