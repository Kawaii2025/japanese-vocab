# Local Debugging Guide: Testing Neon PostgreSQL Locally

This guide explains how to test Neon/PostgreSQL code paths locally without deploying to Vercel every time.

## Problem

- Local development uses SQLite (fast, no setup)
- Vercel production uses Neon PostgreSQL
- Changes to Neon code paths aren't tested until deploy
- Debugging errors on Vercel is slow

**Solution**: Test both database paths locally!

---

## Setup: Use Neon Locally

### Step 1: Get Your Neon Connection String

1. Go to [neon.tech](https://neon.tech) console
2. Click your project → Connection string
3. Copy the PostgreSQL connection string:
   ```
   postgresql://neondb_owner:npg_xxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Enable Neon for Local Testing

Edit `api/.env` to enable Neon:

```env
# Comment out this line to test with SQLite
# DATABASE_URL=postgresql://...

# Uncomment this line to test with Neon (copy from neon.tech)
DATABASE_URL=postgresql://neondb_owner:npg_xxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

PORT=3001
NODE_ENV=development
```

### Step 3: Restart Server

```bash
cd api
npm run start
```

You should see:
```
✅ Neon Connection: AVAILABLE
🔄 Initializing Neon PostgreSQL (Production Mode)...
✅ Neon PostgreSQL: CONNECTED
✅ Neon PostgreSQL schema initialized
```

---

## Testing: SQLite vs Neon Comparison

### Test Endpoint with SQLite

**1. Comment out DATABASE_URL in `api/.env`:**
```env
# DATABASE_URL=postgresql://...
PORT=3001
```

**2. Restart server:**
```bash
cd api
npm run start
```

**3. Test endpoint:**
```bash
curl http://localhost:3001/api/vocabulary | head -20
```

**4. Check logs for:**
```
⚠️  Neon Connection: NOT CONFIGURED
✅ SQLite Database: READY (Local Primary)
```

### Test Endpoint with Neon

**1. Uncomment DATABASE_URL in `api/.env`:**
```env
DATABASE_URL=postgresql://neondb_owner:npg_xxxxx@...
PORT=3001
```

**2. Restart server:**
```bash
cd api
npm run start
```

**3. Test endpoint:**
```bash
curl http://localhost:3001/api/vocabulary | head -20
```

**4. Check logs for:**
```
✅ Neon Connection: AVAILABLE
🔄 Initializing Neon PostgreSQL (Production Mode)...
✅ Neon PostgreSQL: CONNECTED
```

---

## Debug Logging: View Query Conversion

### Enable detailed logging

The Neon wrapper already includes debug logging. When you test with Neon, you'll see in the terminal:

```
🔄 Converted query: {
  original: 'SELECT * FROM vocabulary WHERE input_date = ?...',
  converted: 'SELECT * FROM vocabulary WHERE input_date = (CURRENT_DATE)...',
  cleanParams: [],
  rawParams: { '0': '(CURRENT_DATE)' }
}

📊 Neon GET: { query: '...', params: [...] }
```

This shows:
- Original SQLite query
- Converted PostgreSQL query
- Which parameters are being used
- Raw SQL expressions being injected

### View specific queries

To see a specific endpoint's queries, test it and watch the terminal:

```bash
# In terminal 1: watch the logs
cd api && npm run start

# In terminal 2: make a request
curl http://localhost:3001/api/vocabulary/review/today
```

The logs will show:
- What SQLite query was sent
- How it was converted to PostgreSQL
- Whether it succeeded or failed
- Actual error messages

---

## Common Issues & Solutions

### Issue 1: Different Results in SQLite vs Neon

**Symptom:** Query returns data in SQLite but not in Neon

**Debug steps:**
```bash
# 1. Test with SQLite
# (comment DATABASE_URL, restart)
curl http://localhost:3001/api/vocabulary

# 2. Test with Neon
# (uncomment DATABASE_URL, restart)
curl http://localhost:3001/api/vocabulary

# 3. Compare responses in terminal
```

**Common cause:** Date/timezone conversion differences

**Fix:** Check function conversion in `neon-wrapper.js`:
```javascript
// These conversions might need tuning:
pgQuery = pgQuery.replace(/date\('now'\)/gi, 'CURRENT_DATE');
pgQuery = pgQuery.replace(/strftime\('%Y-%m-%d', 'now'\)/gi, "CURRENT_DATE");
```

### Issue 2: "Invalid Input Syntax" Error

**Symptom:**
```
error: invalid input syntax for type date: "..."
```

**Debug steps:**

1. **Check the logs** - they show the converted query:
   ```
   original: 'SELECT * FROM vocabulary WHERE date = ?'
   converted: 'SELECT * FROM vocabulary WHERE date = $1'
   params: ['(CURRENT_DATE)']  // ← This should NOT be a string!
   ```

2. **The problem:** Raw SQL expression being treated as parameter

3. **The fix:** Wrap in `RawSQL()`:
   ```javascript
   // Before (wrong):
   const result = await db.all(query, BEIJING_CURRENT_DATE);
   
   // After (correct):
   const result = await db.all(query, wrapRawSQL(BEIJING_CURRENT_DATE));
   ```

### Issue 3: Query Runs in SQLite but Not Neon

**Symptom:** Works locally with SQLite, fails on Neon

**Debug steps:**

1. **Enable Neon locally** - test the same endpoint
2. **Check terminal logs** for the converted query
3. **Test the PostgreSQL query directly** in Neon console (if it's a simple query)
4. **Check parameter types** - PostgreSQL is stricter about types

**Example:** SQLite accepts `'2024-01-01'` as date, PostgreSQL might need `DATE '2024-01-01'`

---

## Advanced: Test Specific Queries

### Query Testing Script

Create `api/test-neon.js`:

```javascript
import pg from 'pg';
import { createNeonWrapper } from './utils/neon-wrapper.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = createNeonWrapper(pool);

// Test a specific query
async function testQuery() {
  try {
    console.log('Testing review/today endpoint...');
    
    const result = await db.all(
      `SELECT * FROM vocabulary 
       WHERE next_review_date IS NOT NULL 
       AND next_review_date <= (NOW() AT TIME ZONE 'Asia/Shanghai')::date
       LIMIT 5`
    );
    
    console.log('✅ Success! Results:', result.length);
    result.forEach(r => console.log(`  - ${r.kana}: ${r.chinese}`));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

testQuery();
```

**Run it:**
```bash
cd api
DATABASE_URL=postgresql://... node test-neon.js
```

---

## Debug Workflow: Compare Implementations

### 1. Find the problem

Deploy to Vercel, see an error:
```
error: invalid input syntax for type date: "..."
```

### 2. Reproduce locally with Neon

```bash
# Set DATABASE_URL in api/.env
cd api
npm run start

# Call the endpoint
curl http://localhost:3001/api/vocabulary/review/today
```

### 3. Watch the logs

Terminal shows:
```
🔄 Converted query: {
  original: 'SELECT ... WHERE next_review_date <= ?',
  converted: 'SELECT ... WHERE next_review_date <= $1',
  cleanParams: [],
  rawParams: { '0': 'raw_sql_expression' }
}
ERROR: invalid input syntax for type date
```

### 4. Fix the code

Update `neon-wrapper.js` or controller to properly handle the parameter.

### 5. Test both paths

```bash
# Test with Neon locally
# (should now work)
curl http://localhost:3001/api/vocabulary/review/today

# Switch back to SQLite
# (should still work)
# (comment DATABASE_URL)
curl http://localhost:3001/api/vocabulary/review/today

# Commit the fix
git add -A
git commit -m "fix: handle date conversion for both SQLite and Neon"
```

---

## Quick Reference: Enable/Disable Neon

### Enable Neon for local testing:
```bash
# Edit api/.env
# Uncomment: DATABASE_URL=postgresql://...
# Restart: cd api && npm run start
```

### Disable Neon (back to SQLite):
```bash
# Edit api/.env
# Comment: # DATABASE_URL=postgresql://...
# Restart: cd api && npm run start
```

---

## Environment Comparison

| Setting | Local SQLite | Local Neon | Vercel |
|---------|---|---|---|
| `DATABASE_URL` | NOT SET | SET | SET (via dashboard) |
| Server | `npm run start` | `npm run start` | Auto |
| Database | `/data/vocabulary.db` | Neon cloud | Neon cloud |
| Speed | ⚡ Fastest | 🌍 Network delay | 🌍 Network delay |
| Schema | Auto-created | Auto-created | Auto-created |
| Debug logs | ✅ Full | ✅ Full | ❌ Limited |

---

## Tips for Efficient Debugging

1. **Keep a terminal open** for server logs while testing:
   ```bash
   cd api && npm run start
   ```

2. **Use curl with jq** for formatted output:
   ```bash
   curl http://localhost:3001/api/vocabulary | jq '.'
   ```

3. **Compare query logs side-by-side:**
   - Terminal 1 (with SQLite): watch SQLite queries
   - Terminal 2 (with Neon): watch PostgreSQL conversions
   - Compare the differences

4. **Test the problematic endpoint first:**
   ```bash
   # Instead of testing all endpoints, focus on the one that fails
   curl http://localhost:3001/api/vocabulary/review/today
   ```

5. **Save query patterns:** If you find and fix a conversion issue, note it:
   ```bash
   # Example: if date conversion needed fixing
   # Add to neon-wrapper.js convertQueryPlaceholders():
   pgQuery = pgQuery.replace(/pattern/g, 'replacement');
   ```

---

## Troubleshooting

### "Can't connect to Neon"
- Check `DATABASE_URL` is correct
- Check internet connection
- Check Neon project is active (not paused)

### "Unknown database" error
- Database name might be wrong in connection string
- Check Neon console for correct database name

### "Permission denied" error
- Username/password in connection string might be wrong
- Reset Neon password in dashboard

### "SSL error" when connecting
```javascript
// Already handled in api/db.js:
ssl: {
  rejectUnauthorized: false  // ← Allows self-signed certs
}
```

---

## Summary

✅ **Test both SQLite and Neon locally without deploying**
✅ **See query conversion logs in real-time**
✅ **Debug SQL syntax issues easily**
✅ **Verify both paths work before committing**
✅ **Fix errors faster with immediate feedback**

This saves you from having to deploy to Vercel for every test! 🚀

---

## Debug Scripts

### Find Data Discrepancies Between SQLite and Neon

After syncing, you may want to verify that SQLite and Neon have the same data:

```bash
# Find records that exist in Neon but not in SQLite
cd api
node scripts/debug/find-extra-neon-records.js
```

**Output example:**
```
🔍 Comparing vocabulary records...

✅ SQLite: 419 records
✅ Neon: 421 records

⚠️  Found 2 extra record(s) at Neon:

ID | Chinese | Original | Kana | Category | Difficulty
---|---------|----------|------|----------|----------
44 | 老师 | 先生 | せんせい | N5 | 1
553 | 火 | 火 | ひ | null | 1
✅ All SQLite records exist at Neon
```

**What this script does:**
- Compares record IDs between SQLite and Neon
- Lists any "extra" records at Neon (shouldn't exist)
- Lists any "missing" records at Neon (should be there)
- Shows full record details for discrepancies

**Why you might have extra records:**
1. Made updates in Neon directly (not through app)
2. Previous sync added records that were later deleted
3. Manual testing data that should be cleaned up

**Resolution:**
- Option A: Delete extra records from Neon
- Option B: Add them to SQLite (if they're valid)
- Option C: Keep as-is (if they're intentional)

See [AUDIT_SYSTEM.md](./AUDIT_SYSTEM.md) for more debugging tools and audit queries.
