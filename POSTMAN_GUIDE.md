# Postman Guide: Check SQLite Data via API

## Step 1: Download & Install Postman

- **Download**: https://www.postman.com/downloads/
- **Or use web version**: https://web.postman.com (no install needed)

## Step 2: Create a New Request

1. Click **"New"** → **"Request"**
2. Name it: `Get Vocabulary`
3. Click **"Save"** to save to a collection

## Step 3: Check All Vocabulary Data

### Request Setup:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/vocabulary`
- Click **Send**

### Response:
You'll see your 410+ vocabulary items in JSON format with fields:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kana": "りんご",
      "chinese": "苹果",
      "category": "Food",
      "mastery_level": 3,
      "review_count": 15,
      "next_review_date": "2026-04-15",
      "input_date": "2026-01-10",
      "created_at": 1704873600
    },
    ...
  ]
}
```

## Step 4: Other Useful Endpoints

### Get Single Word by ID:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/vocabulary/1`

### Get Statistics:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/stats`
- **Response**: Shows mastery distribution, daily stats, review counts

### Get Practice History:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/practice`
- **Response**: All practice sessions with results

### Check Sync Status:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/sync/status`
- **Response**: Shows if Neon is configured and ready for backup

### Health Check:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/health`
- **Response**: Confirms API and SQLite are running

## Step 5: Using Query Parameters (Filtering)

### Paginate Results (limit 10 per page):
- **URL**: `http://localhost:3001/api/vocabulary?limit=10&page=1`

### Search for Specific Word:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/vocabulary/search?q=りんご`

## Step 6: Advanced - Create Collections for Organized Testing

### Create New Collection:
1. Click **Collections** → **+**
2. Name it: `Japanese Vocab API`
3. Add requests:
   - GetAll Vocabulary
   - GetStats
   - GetPracticeHistory
   - CheckSyncStatus
   - HealthCheck

### Save Environment Variables (Optional):
1. Click **Environments** → **+**
2. Name it: `Local Dev`
3. Add variable:
   ```
   Key: base_url
   Value: http://localhost:3001
   ```
4. Use in requests: `{{base_url}}/api/vocabulary`

## Step 7: View Response in Different Formats

After clicking **Send**, you can view responses as:
- **JSON** (formatted view)
- **Tree** (hierarchical view)
- **Raw** (plain text)

### Pretty Print JSON:
Click the **Pretty** button in the response panel to format nicely.

### Save Response:
Right-click response → **Save as file** to export to JSON

## Quick Reference: All API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/vocabulary` | List all words |
| GET | `/api/vocabulary/:id` | Get specific word |
| GET | `/api/vocabulary/search?q=...` | Search words |
| GET | `/api/stats` | Get statistics |
| GET | `/api/practice` | Get practice history |
| GET | `/api/sync/status` | Check sync status |
| GET | `/health` | Health check |
| GET | `/api/health` | Detailed health check |
| POST | `/api/sync/import-from-neon` | Import from Neon |
| POST | `/api/sync/export-to-neon` | Backup to Neon |

## Troubleshooting

### ❌ "Cannot connect to localhost:3001"
1. Verify API is running: `cd api && npm run start`
2. Check port is 3001: Server logs should show `http://localhost:3001`
3. Try `http://127.0.0.1:3001/api/vocabulary` instead

### ❌ "Empty response or no data"
1. Confirm import succeeded (check terminal output)
2. Run `sqlite3 /Users/kaiwen/dev/japanese-vocab/data/vocabulary.db "SELECT COUNT(*) FROM vocabulary;"`
3. Check SQLite file exists: `ls -lh /Users/kaiwen/dev/japanese-vocab/data/vocabulary.db`

### ❌ CORS Error
Should not occur, but if it does:
1. Restart API server
2. Ensure `npm run start` is running in `/api` folder

## Tips

✅ **Use Postman collections** for reproducible testing
✅ **Save responses** as baseline for comparisons
✅ **Use environment variables** for URLs (switch between dev/prod)
✅ **Check response times** - SQLite queries should be <10ms
✅ **View raw JSON** to debug data structure issues

---

**Next**: After confirming data in Postman, you can start the frontend with `npm run dev` to see it in the UI!
