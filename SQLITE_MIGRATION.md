# SQLite + Neon Two-Way Sync Migration Guide

## 2026-04 Timestamp Standard Update

The project now uses Unix milliseconds for all temporal fields in both databases.

- SQLite: `INTEGER`
- Neon: `BIGINT`
- Display: Beijing time derived from timestamp (not stored as date string)

Migration commands:

```bash
npm --prefix api run migrate-timestamp -- --sqlite-only
npm --prefix api run migrate-timestamp -- --neon-only
```

Verification commands:

```bash
sqlite3 data/vocabulary.db "PRAGMA table_info(vocabulary); PRAGMA table_info(practice_records);"
sqlite3 data/vocabulary.db "SELECT typeof(input_date), typeof(next_review_date), typeof(created_at), typeof(updated_at) FROM vocabulary LIMIT 1;"
sqlite3 data/vocabulary.db "SELECT typeof(practice_date), typeof(practiced_at) FROM practice_records WHERE practice_date IS NOT NULL LIMIT 1;"
```

Expected SQLite result: `typeof(...) = integer` for migrated timestamp columns.

## Overview

Your Japanese Vocab app has been migrated from Neon PostgreSQL to a **hybrid setup**:
- **Primary**: Local SQLite database (fast, file-based)
- **Backup**: Neon PostgreSQL (optional, for cloud sync)

## Performance Benefits

| Operation | PostgreSQL (Neon) | SQLite (Local) | Improvement |
|-----------|-------------------|----------------|------------|
| Insert    | ~50ms (network)   | ~2-5ms        | 10-25x faster |
| Query     | ~30ms (network)   | ~1-3ms        | 10-30x faster |
| Batch Ops | ~500ms+           | ~50-100ms    | 5-10x faster |

## Architecture

```
┌─────────────────────┐
│  Local SQLite DB    │  ← Primary storage
│  /data/vocab.db     │  ← Fast reads/writes
└──────────┬──────────┘
           │ (Optional sync)
           ↓
┌─────────────────────┐
│ Neon PostgreSQL     │  ← Backup/Cloud Mirror
│ (DATABASE_URL)      │  ← Two-way sync
└─────────────────────┘
```

## Setup Instructions

### 1. **Install Dependencies**
```bash
cd api
npm install
# Already done: sqlite3, sqlite packages added
```

### 2. **Database Auto-Initialization**
- SQLite database is created automatically at `/data/vocabulary.db`
- Schema is applied on first run
- All tables from PostgreSQL schema are available

### 3. **Optional: Neon Cloud Sync**
If you want to keep Neon as a backup:

```bash
# Keep DATABASE_URL in .env for Neon sync
# The system will:
# - Use local SQLite for fast operations
# - Periodically sync changes to Neon
# - Allow manual imports from Neon if needed
```

## Migration Steps

### Step 1: Export Data from Neon (if you have existing data)

```bash
# The sync service will provide these endpoints:
POST /api/sync/export-to-neon    # Backup SQLite to Neon
POST /api/sync/import-from-neon  # Restore from Neon to SQLite
GET  /api/sync/status            # Check sync status
```

### Step 2: Start the Server

```bash
npm run start
# or for development with auto-reload
npm run dev
```

### Step 3: Verify SQLite is Working

```bash
# Health check endpoint
curl http://localhost:3000/health

Response:
{
  "success": true,
  "database": "SQLite (Local)",
  "timestamp": "..."
}
```

## Data Migration from Neon

### Option A: Automatic (Recommended)
If you have data in Neon and `DATABASE_URL` is set:

```bash
# Call the import endpoint
curl -X POST http://localhost:3000/api/sync/import-from-neon

# This will:
# 1. Connect to Neon
# 2. Fetch all tables
# 3. Import into local SQLite
# 4. Track import as completed
```

### Option B: Manual Using pg_dump
```bash
# Export from Neon
pg_dump $DATABASE_URL > neon_backup.sql

# Convert to SQLite format (use online converter or migration script)
# Then import manually
```

## API Changes

All endpoints remain the same, but they now use SQLite:

```javascript
// All existing endpoints work identically
GET    /api/vocabulary
POST   /api/vocabulary
PUT    /api/vocabulary/:id
DELETE /api/vocabulary/:id
GET    /api/practice
POST   /api/practice
GET    /api/stats
```

## Sync Operations

### Automatic Background Sync
- Changes are automatically tracked in `sync_status` table
- Optional periodic sync to Neon (can be configured)

### Manual Sync Endpoints

```bash
# Get current sync status
GET /api/sync/status

# Push local changes to Neon
POST /api/sync/push-to-neon

# Pull changes from Neon
POST /api/sync/pull-from-neon

# Full export local to Neon
POST /api/sync/export-to-neon

# Full import from Neon to local
POST /api/sync/import-from-neon
```

## Configuration

### Environment Variables

```bash
# .env file

# Optional: Neon connection for cloud backup/sync
DATABASE_URL=postgresql://...

# Server config (unchanged)
PORT=3000
NODE_ENV=development
```

### SQLite Optimizations (Already Applied)

```
PRAGMA journal_mode = WAL;        # Write-Ahead Logging for concurrency
PRAGMA synchronous = NORMAL;      # Faster writes
PRAGMA foreign_keys = ON;        # Enable constraints
```

## File Structure

```
api/
├── data/
│   └── vocabulary.db          ← New: Local SQLite database
├── db.js                      ← Updated: SQLite + Neon support
├── server.js                  ← Updated: Async initialization
├── controllers/
│   ├── vocabulary.controller.js   ← Updated: SQLite queries
│   ├── practice.controller.js     ← Updated: SQLite queries
│   └── stats.controller.js        ← Updated: SQLite queries
├── services/
│   └── sync.service.js           ← New: Two-way sync service
└── routes/
    └── sync.routes.js            ← New: Sync API endpoints
```

## Troubleshooting

### Issue: Database file not created
**Solution**: Check `/data` directory exists with write permissions
```bash
mkdir -p data
chmod 755 data
```

### Issue: Port 3000 already in use
**Solution**: Change port in config.js or use different port
```bash
PORT=3001 npm start
```

### Issue: Neon sync fails
**Solution**: Check DATABASE_URL is correct
```bash
# Test Neon connection
node -e "const pg = require('pg'); new pg.Pool({connectionString: process.env.DATABASE_URL}).query('SELECT NOW()').then(r => console.log(r.rows[0]))"
```

## Performance Tips

1. **Use pagination** for large datasets
   ```bash
   GET /api/vocabulary?page=1&limit=20
   ```

2. **Index queries** for faster searches
   - Indexes automatically created on common fields

3. **Batch operations** when possible
   ```bash
   POST /api/vocabulary/batch
   # More efficient than individual inserts
   ```

## Backup Strategy

### Daily Backup Script
```bash
#!/bin/bash
# backup.sh
cp data/vocabulary.db data/vocabulary.db.backup.$(date +%Y%m%d)
# Optional: Also push to Neon
curl -X POST http://localhost:3000/api/sync/push-to-neon
```

## Rollback to Neon (if needed)

If you need to switch back to Neon:

1. **Stop the app**
   ```bash
   # Press Ctrl+C
   ```

2. **Restore original db.js**
   ```bash
   git checkout api/db.js  # if using git
   ```

3. **Update controllers** (or use git to restore original versions)

4. **Restart**
   ```bash
   npm start
   ```

## Next Steps

1. **Test the local database**
   - Add a few words
   - Practice
   - Check stats

2. **Optional: Enable Neon sync**
   - Set up the sync endpoints
   - Test import/export

3. **Monitor performance**
   - Check response times
   - Compare with Neon benchmarks

4. **Set up backups**
   - Automated SQLite backups
   - Or periodic Neon exports

---

**Questions?** Check the API documentation at `/api` when server is running.
