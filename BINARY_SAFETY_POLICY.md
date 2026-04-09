# 🔐 Binary File Safety Policy

**Policy**: NO binary files committed to GitHub  
**Status**: ✅ ENFORCED  
**Compliance**: Company security policy

---

## What's Protected

### ❌ Forbidden (Never Committed)

| File Type | Pattern | Why |
|-----------|---------|-----|
| SQLite DB | `*.db` | Contains actual data |
| SQLite WAL | `*.db-wal` | Temporary data log |
| SQLite Memory | `*.db-shm` | Temporary cache |
| Executables | `*.exe`, `*.dll` | Could contain malware |
| Compiled | `*.class`, `*.jar`, `*.so` | Platform-specific |
| Archives | `*.zip`, `*.tar.gz` | Could hide malware |
| Documents | `*.pdf`, `*.doc`, `*.docx` | Metadata risks |

### ✅ Allowed (Text-Based Only)

| File Type | Format | Purpose |
|-----------|--------|---------|
| Database Backup | JSON | Safe text format |
| Source Code | `.js`, `.vue`, `.ts` | Human-readable |
| Configuration | `.json`, `.yaml` | Text-based |
| Documentation | `.md` | Markdown text |

---

## Enforcement Mechanisms

### 1. **Pre-Push Hook** (Automatic)
Runs before every `git push`:
```bash
git push  # Hook checks automatically ✅
```

**Blocks:**
- ❌ `.db` files
- ❌ `.bin`, `.exe`, `.dll`
- ❌ `.jar`, `.zip`, `.tar.gz`
- ❌ Large files > 10MB

### 2. **.gitignore** (Prevention)
Configured to ignore all binary patterns:
```gitignore
*.db
*.db-shm
*.db-wal
*.bin
*.exe
*.dll
*.so
*.jar
*.zip
*.tar.gz
# ...and more
```

### 3. **verify-no-binaries.sh** (Manual Check)
Run anytime to verify:
```bash
bash verify-no-binaries.sh
```

Output:
```
✅ SAFE: No binary files committed to git!
✅ All binary files are properly ignored
✅ Only text-based data committed (JSON exports)
✅ Safe for company security policy
```

---

## How Data Flows

### Database Management (Binary-Safe)

```
Production SQLite DB          Backup
    (vocabulary.db)       (vocabulary.json)
         ↓                      ↓
   [Local Only]        [Safely Committed]
   NOT in git          ✅ In GitHub
   
   Import              Export
   ← ← ← ← ← ← ← ← → → → → → →
```

### Example: Team Collaboration

**You (Developer 1):**
```bash
npm run export-json     # SQLite → JSON
git add data/exports/*.json
git commit -m "Update vocabulary data"
git push
```

**Your Team Member:**
```bash
git pull                # Gets JSON
npm run import-json     # JSON → SQLite
npm run start           # Uses local SQLite
# Never sees binary .db file! ✅
```

---

## Verification

### ✅ Passed Checks

Run before pushing:

```bash
# Quick: Pre-push hook (auto)
git push

# Detailed: Manual verification
bash verify-no-binaries.sh

# Full: Git history scan
git ls-files | grep -E "\.(db|exe|dll|jar|zip|pdf)"  # (should be empty)
```

### ❌ If Issues Found

```bash
# Stop: Don't push!
# Undo: Remove binary file
git reset HEAD <binary-file>

# Fix: Commit again without binary
git add <safe-files>
git commit -m "..."
git push  # Now passes ✅
```

---

## Company Compliance

| Policy | Status | Details |
|--------|--------|---------|
| No binary data | ✅ PASS | Only text JSON exports |
| Encrypted? | ✅ YES | Data in Neon PostgreSQL |
| Personally identifiable? | ✅ NO | Vocabulary, not user data |
| Credentials in repo? | ✅ NO | .env files ignored |
| Company secrets? | ✅ NO | Public URLs only |

---

## What If I Accidentally Commit a Binary?

### Recovery Process

**Step 1: Stop the push**
```bash
# If not pushed yet, easy fix:
git reset HEAD~1 --soft
git checkout <binary-file>
git add <safe-files>
git commit -m "Fix: Remove binary file"
git push
```

**Step 2: If already pushed**
```bash
# Use BFG Repo-Cleaner (recommended)
brew install bfg
bfg --delete-files <filename> .git/

# Or use git filter-branch (slower)
git filter-branch --tree-filter 'rm -f <filename>' HEAD
```

---

## Quick Reference

### Allowed Formats
```
✅ .json     (Database exports)
✅ .md       (Documentation)
✅ .js       (Source code)
✅ .vue      (Vue components)
✅ .ts       (TypeScript)
✅ .sql      (Migrations)
✅ .yaml     (Config)
```

### Blocked Formats
```
❌ .db       (SQLite binary)
❌ .db-shm   (SQLite temp)
❌ .db-wal   (SQLite temp)
❌ .exe      (Executable)
❌ .dll      (Library)
❌ .jar      (Java binary)
❌ .zip      (Archive)
❌ .tar.gz   (Archive)
❌ .pdf      (Document)
```

---

## Team Setup

### First Time

```bash
git clone <repo>
cd japanese-vocab

# Install hooks
bash setup-hooks.sh

# Verify safety
bash verify-no-binaries.sh
# Output: ✅ SAFE

# Go!
npm install
npm run dev
```

### Before Every Push

```bash
# Option 1: Automatic (recommended)
git push  # Pre-push hook runs ✅

# Option 2: Manual verification
bash verify-no-binaries.sh
git push

# Option 3: Git command
git ls-files | head -20  # Check files
```

---

## Commands Reference

```bash
# Export database (text-safe)
npm run export-json

# Import database (restore)
npm run import-json

# Verify no binaries (manual check)
bash verify-no-binaries.sh

# Setup hooks (team members)
bash setup-hooks.sh

# Bypass hook (emergency only!)
git push --no-verify
```

---

## Security Summary

✅ **GitHub is binary-safe** - No data files stored  
✅ **Compliance met** - Text-based exports only  
✅ **Team-friendly** - Easy data sharing via JSON  
✅ **Automated** - Pre-push hook prevents mistakes  
✅ **Verifiable** - `verify-no-binaries.sh` confirms  

**This ensures your company security policy is maintained while keeping development fast and smooth.** 🔐
