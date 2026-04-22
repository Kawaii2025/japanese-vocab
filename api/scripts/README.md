# Scripts Organization

This directory contains utility scripts organized by purpose.

## 📁 Directory Structure

### `sync/` - Database Synchronization
Syncs data between SQLite (local) and Neon PostgreSQL (production).

| Script | Purpose |
|--------|---------|
| `sync-neon.js` | Wrapper - loads `.env.neon` and runs partial sync |
| `sync-neon.sh` | Shell wrapper for sync-neon.js |
| `sync-to-neon-partial.js` | **Recommended** - only syncs changed records (fast) |
| `sync-to-neon.js` | Full sync - syncs ALL records (slower, more thorough) |
| `sync-vocabulary-to-neon.js` | Sync only vocabulary table |
| `sync-users-to-neon.js` | Sync only users table |
| `sync-practice-records-to-neon.js` | Sync only practice records table |

**Quick Start:**
```bash
npm run sync-neon              # Partial sync (recommended)
npm run sync-to-neon           # Full sync
npm run sync-vocabulary        # Single table
```

### `data/` - Data Import/Export/Backup
Manages data backup, restoration, and format conversion.

| Script | Purpose |
|--------|---------|
| `backup-neon-to-json.js` | Backup Neon database to JSON file |
| `restore-neon-from-json.js` | Restore Neon database from JSON backup |
| `export-to-json.js` | Export SQLite data to JSON |
| `export-today-vocab.js` | Export vocabulary for one date (default: today) |
| `import-from-json.js` | Import JSON data into SQLite |

**Quick Start:**
```bash
npm run backup-neon            # Backup Neon to JSON
npm run restore-neon           # Restore Neon from JSON
npm run export-json            # Export SQLite to JSON
npm run export-today           # Export today's vocabulary only
npm run import-json            # Import JSON to SQLite
```

### `test/` - Test Scripts
Testing and validation scripts for development.

| Script | Purpose |
|--------|---------|
| `test-db-connection.js` | Verify database connectivity |
| `test-db.js` | Test database operations |
| `test-error-handling.js` | Demonstrate error handling |
| `test-pagination.js` | Test pagination logic |
| `test-time-format.js` | Test time formatting utilities |
| `test-timezone-queries.js` | Test timezone handling |
| `test-batch-add.js` | Test batch data insertion |

**Quick Start:**
```bash
node scripts/test/test-db-connection.js    # Check DB connection
node scripts/test/test-error-handling.js   # See error messages
```

### `debug/` - Debug & Utility Scripts
Debugging tools and data manipulation utilities.

| Script | Purpose |
|--------|---------|
| `check-id1.js` | Debug ID issues |
| `check-timezone.js` | Debug timezone handling |
| `debug-kana.js` | Debug kana (hiragana) data |
| `normalize-kana.js` | Normalize kana characters |
| `trim-kana.js` | Trim kana whitespace |
| `clear-test-words.js` | Clear test vocabulary entries |
| `warmup-db.js` | Warm up database connection pool |

**Quick Start:**
```bash
node scripts/debug/check-timezone.js       # Debug timezone data
node scripts/debug/normalize-kana.js       # Fix kana characters
```

## 🚀 Common Workflows

### Sync Local Changes to Neon
```bash
npm run sync-neon              # Fast: only changed records
npm run sync-to-neon           # Complete: all records
```

### Backup Before Major Changes
```bash
npm run backup-neon            # Creates JSON backup
npm run restore-neon           # Can restore if needed
```

### Test Database Connection
```bash
node scripts/test/test-db-connection.js
```

### Debug Specific Issues
```bash
node scripts/debug/check-timezone.js       # Timezone problems
node scripts/debug/normalize-kana.js       # Character encoding
```

## 📋 Error Handling

All sync scripts now provide detailed error messages:
- **What failed**: Table name and operation
- **Why it failed**: Specific error code and message
- **How to fix it**: Targeted troubleshooting suggestions
- **Debug info**: Full stack traces with `DEBUG_SYNC=1`

Example:
```bash
DEBUG_SYNC=1 npm run sync-neon
```

See `/ERROR_HANDLING_GUIDE.md` for full details.

## 🔧 Development

When adding new scripts:
1. Choose appropriate subdirectory (`sync`, `data`, `test`, or `debug`)
2. Update import paths based on new directory depth
3. Add npm script to `package.json` if user-facing
4. Document purpose in this README

### Import Path Quick Reference
- Scripts in `scripts/sync/` → Use `../../utils/` for utilities
- Scripts in `scripts/data/` → Use `../../utils/` for utilities
- Scripts in `scripts/test/` → Use `../../db.js` for database
- Scripts in `scripts/debug/` → Use `../../db.js` for database

## ✅ All Scripts Updated
- ✅ 7 sync scripts organized
- ✅ 4 data management scripts organized
- ✅ 7 test scripts organized
- ✅ 7 debug scripts organized
- ✅ All import paths updated
- ✅ npm scripts updated (package.json)
- ✅ Error handling applied to all sync scripts
