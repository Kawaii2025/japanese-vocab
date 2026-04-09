# 📥 Data Import Guide: Neon → SQLite

This guide explains how to migrate your existing vocabulary data from Neon PostgreSQL to the new local SQLite database.

## Prerequisites

You have word data in Neon PostgreSQL that you want to transfer to the local SQLite database.

## Step 1: Set Up Neon Connection (One-time Setup)

Create or update `.env` file in the `api/` directory with your Neon connection string:

```bash
# api/.env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

You can find this in your Neon dashboard:
1. Go to [neon.tech](https://neon.tech)
2. Select your project
3. Click "Connection string"
4. Copy the connection URL

Example:
```
DATABASE_URL=postgresql://neondb_owner:abc123@ep-cool-lake-123456.us-east-1.neon.tech/neondb?sslmode=require
```

## Step 2: Start the API Server

```bash
cd api
npm run start
```

You should see:
```
✅ SQLite Database: READY (Local Primary)
✅ Neon Connection: CONFIGURED (Backup/Sync)
```

## Step 3: Import Data from Neon

Make an HTTP POST request to import all data:

### Using `curl`:
```bash
curl -X POST http://localhost:3001/api/sync/import-from-neon \
  -H "Content-Type: application/json"
```

### Using JavaScript/Node.js:
```javascript
const response = await fetch('http://localhost:3001/api/sync/import-from-neon', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const result = await response.json();
console.log(result);
```

### Using Python:
```python
import requests

response = requests.post('http://localhost:3001/api/sync/import-from-neon')
print(response.json())
```

### Expected Response:
```json
{
  "success": true,
  "message": "✅ Successfully imported 150 records from Neon to SQLite",
  "imported": 150,
  "data": {
    "success": true,
    "imported": 150,
    "message": "✅ Successfully imported 150 records from Neon to SQLite"
  }
}
```

## Step 4: Verify Import

Check that data was imported by querying the API:

```bash
curl http://localhost:3001/api/vocabulary
```

You should see your vocabulary items with all metadata intact.

## What Gets Imported

The import process transfers:
- ✅ **vocabulary** - All words, kana, definitions, categories, mastery levels
- ✅ **users** - User accounts (if any)
- ✅ **practice_records** - All practice history and reviews

## Troubleshooting

### ❌ "Neon not configured"
**Problem**: Response says `"reason": "Neon not configured"`

**Solution**: 
1. Check `.env` file exists at `api/.env`
2. Verify `DATABASE_URL` is set correctly
3. Restart the server: `npm run start`

### ❌ "Import failed" with connection error
**Problem**: Cannot connect to Neon

**Solution**:
1. Verify the connection string is correct
2. Check Neon project is active
3. Ensure IP has access (Neon usually allows all IPs)
4. Try testing connection with psql:
   ```bash
   psql postgresql://user:password@host/database
   ```

### ❌ "Tables not found"
**Problem**: Warning message about missing tables

**Solution**: This is normal. It means those tables don't exist in Neon yet. Only existing tables are imported.

### ❌ Import seems stuck or slow
**Problem**: Request takes a long time

**Solution**:
- Large datasets (10k+ records) may take time
- Check server logs for progress messages
- Be patient - imports are one-time operations

## After Import

Once data is in SQLite:

1. **Backup the file**: Copy `/data/vocabulary.db` somewhere safe
2. **Test the app**: Run the frontend and practice with your words
3. **Optional**: Set up automatic Neon backups using `/api/sync/export-to-neon`

## Reversing the Import

If you want to reimport (useful after testing):

1. Delete the SQLite file:
   ```bash
   rm data/vocabulary.db
   ```

2. Restart the API server (it will recreate an empty database)

3. Run the import again

## Two-Way Sync (Optional)

After import, you can:

- **Push updates to Neon backup**:
  ```bash
  curl -X POST http://localhost:3001/api/sync/export-to-neon
  ```

- **Check sync status**:
  ```bash
  curl http://localhost:3001/api/sync/status
  ```

## Performance After Import

SQLite is **10-25x faster** than Neon:
- Query time: ~1-5ms (SQLite) vs ~50-100ms+ (Neon)
- No network latency
- Instant local backups
- Perfect for single-user/small team use

---

**Need help?** Check [SQLITE_MIGRATION.md](SQLITE_MIGRATION.md) for technical details.
