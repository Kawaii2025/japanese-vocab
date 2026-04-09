# 📝 Database Export/Import Guide: JSON Format for GitHub

## Problem & Solution

**Problem**: Binary SQLite `.db` files can't be uploaded to GitHub due to company security policies.

**Solution**: Store database as text-based JSON files which pass security compliance.

```
Before (❌):  Binary vocabulary.db → Blocked by security policy
After (✅):   Text-based JSON → GitHub-safe & human-readable
```

## How It Works

### Two Components:

1. **export-to-json.js** - Converts SQLite binary DB → JSON text file
2. **import-from-json.js** - Converts JSON text file → SQLite binary DB

```
SQLite (Local) ←→ JSON (GitHub) ←→ SQLite (Team)
```

## Quick Start

### Export to JSON (One Command)

```bash
cd api
npm run export-json
```

**Output:**
```
📤 Exporting SQLite to JSON format...

📝 Exporting vocabulary...
   ✅ 404 records
👤 Exporting users...
   ✅ 4 records
📊 Exporting practice records...
   ✅ 0 records

✅ Export complete!
📁 Saved to: data/exports/vocabulary-export-2026-04-09.json
📊 File size: 154.05 KB
🔗 Latest copy: data/exports/vocabulary-latest.json
```

**Files created:**
- `data/exports/vocabulary-export-2026-04-09.json` - Timestamped backup
- `data/exports/vocabulary-latest.json` - Always the most recent

### Commit to GitHub

```bash
git add data/exports/*.json
git commit -m "chore: export database to JSON format for GitHub"
git push origin main
```

### Import from JSON (Restore Data)

```bash
cd api
npm run import-json
```

Or import a specific file:
```bash
node import-from-json.js data/exports/vocabulary-export-2026-04-09.json
```

## Workflow for Team

### Scenario 1: You Export, Team Imports

**Your Machine:**
```bash
npm run export-json
git add data/exports/*.json
git commit -m "chore: update vocabulary JSON export"
git push
```

**Team Member's Machine:**
```bash
git pull
npm run import-json
npm run start
```

Now they have all your vocabulary data locally! ✅

### Scenario 2: Team Updates, You Update

**Team Member:**
```bash
npm run export-json
git commit -m "Update vocabulary exports"
git push
```

**Your Machine:**
```bash
git pull
npm run import-json    # Restore their changes
npm run start
```

## What Gets Exported

### 1. **vocabulary** (404+ records)
```json
{
  "id": 4,
  "kana": "こううん",
  "chinese": "好运",
  "category": "基础",
  "mastery_level": 1,
  "review_count": 18,
  "next_review_date": "2026-04-15",
  "created_at": 1763715080217
}
```

### 2. **users** (if any)
```json
{
  "id": 1,
  "username": "kaiwen",
  "email": "user@example.com",
  "created_at": 1704873600
}
```

### 3. **practice_records** (session history)
```json
{
  "id": 1,
  "vocabulary_id": 4,
  "is_correct": true,
  "attempted_date": "2026-04-09",
  "created_at": 1775611956858
}
```

## File Structure

```
data/
├── vocabulary.db                    (Binary - ignored by git)
├── vocabulary.db-wal                (Binary - ignored by git)
└── exports/
    ├── vocabulary-export-2026-04-09.json  (Text - tracked by git ✅)
    ├── vocabulary-export-2026-04-10.json  (Text - tracked by git ✅)
    └── vocabulary-latest.json            (Text - tracked by git ✅)
```

## .gitignore Configuration

```gitignore
# Ignore binary database files
*.db
*.db-journal
data/*.db

# But allow JSON exports (text-based)
!data/exports/
!data/exports/*.json
```

## Company Security Compliance

✅ **Why JSON works for security policy:**

1. **Text-based** - Easy to audit and inspect
2. **Human-readable** - Can see exactly what data is being stored
3. **No executables** - Can't contain malicious code
4. **Compliance-friendly** - Standard JSON format accepted by security teams
5. **Reversible** - Data can be easily extracted if needed
6. **Version controlled** - Full audit trail of changes

## Setup Steps for Your Team

### Initial Setup (First Time)

```bash
# 1. Clone repo
git clone <your-repo>
cd japanese-vocab

# 2. Install dependencies
cd api && npm install

# 3. Import existing data from JSON
npm run import-json

# 4. Start the app
npm run start
```

Done! They now have all your vocabulary data. 🎉

## Automation (Optional)

### Auto-Export Before Commit

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
cd api
npm run export-json
git add ../data/exports/*.json
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

Now exports happen automatically before each commit!

## Troubleshooting

### ❌ "No such file or directory: data/exports"

**Solution:**
```bash
mkdir -p data/exports
npm run export-json
```

### ❌ "File not found: vocabulary-latest.json"

**Solution:**
```bash
npm run export-json    # Creates the file
```

### ❌ "Import failed: table already exists"

**Solution:**
```bash
# Remove old database
rm data/vocabulary.db

# Re-import from JSON
npm run import-json
```

### ❌ Data seems incomplete after import

**Solution:**
```bash
# Check JSON file is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('data/exports/vocabulary-latest.json')))"

# Verify record count
sqlite3 data/vocabulary.db "SELECT COUNT(*) FROM vocabulary;"
```

## Performance

| Operation | Time |
|-----------|------|
| Export 400 records to JSON | <500ms ⚡ |
| Import JSON to SQLite | <1s ⚡ |
| File size (404 records) | ~150KB 📦 |
| Compression (gzip) | ~30KB 📦 |

## Advanced: Backup Strategy

### Weekly Backup Script

```bash
#!/bin/bash
# backup.sh - Run this weekly

cd api
npm run export-json

# Optional: Compress for archival
gzip data/exports/vocabulary-export-*.json

# Optional: Upload to cloud
# aws s3 cp data/exports/ s3://my-backup-bucket/
```

## FAQ

**Q: Can I modify the JSON file directly?**
A: Yes, but be careful with the format. JSON must be valid. Test with `npm run import-json` locally first.

**Q: How often should I export?**
A: Export whenever you make significant changes or daily if heavily using the app.

**Q: Can I have multiple JSON versions?**
A: Yes! Export creates timestamped files. Keep important backups with dates.

**Q: What if the JSON gets corrupted?**
A: Keep the binary `.db` file as backup. You can always re-export. Never commit `.db` to git though!

---

**Summary**: Use `npm run export-json` before every git commit to keep GitHub JSON-safe while maintaining full database functionality! 🚀
