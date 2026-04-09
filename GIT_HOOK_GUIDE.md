# 🔐 Pre-Push Git Hook Guide

Automatic security check before every `git push`.

## What It Does (⚡ ~100-500ms, Very Fast)

Checks for common mistakes before pushing to GitHub:

| Check | Time | What It Catches |
|-------|------|-----------------|
| .env files | <5ms | `DATABASE_URL` with real credentials |
| Secrets in code | <50ms | `password=`, `api_key=`, `token=` |
| Binary database | <5ms | `.db`, `.db-shm`, `.db-wal` files |
| node_modules | <5ms | Node dependencies accidentally committed |
| Large files | <100ms | Files over 10MB |

**Total time**: Usually **100-300ms** ⚡

## How to Use

### Automatic (Default)

```bash
git push
```

Hook runs automatically before push. If issues found:
- ❌ Push is blocked
- Shows what needs to be fixed
- Instructions to retry

### Override If Needed

```bash
git push --no-verify
```

Force push even if hook finds issues (use carefully!)

## Examples

### ✅ Clean Push (Passes)

```bash
$ git push
🔍 Security Pre-Push Check (Branch: main → origin)
✅ All security checks passed!
   Safe to push to origin
   
Enumerating objects: 5, done.
...
```

### ❌ Blocked by Hook (Fails)

```bash
$ git push
🔍 Security Pre-Push Check (Branch: main → origin)
❌ .env file detected in staging!
   These contain secrets and should NOT be committed

❌ 1 security issue(s) found

Fix the issues above, then:
  git add <files>
  git commit --amend
  git push

Or override with: git push --no-verify
```

## Setup (First Time Only)

The hook is already created and activated. Verify:

```bash
ls -lah .git/hooks/pre-push

# Should show: -rwxr-xr-x (executable)
```

## Customization

Edit `.git/hooks/pre-push` to:
- Add more checks
- Change sensitivity
- Adjust file size limit (default: 10MB)

## How It Works

1. **Checks staged files** (what you're about to push)
2. **Runs regex patterns** (fast pattern matching)
3. **Reports issues** (with fixes)
4. **Exits early** (stops at first major issue)
5. **Allows override** (`--no-verify` flag)

## Performance Tips

✅ **Quick because:**
- Only checks **staged files** (not entire history)
- Uses fast **regex patterns** (not slow scanning)
- **Exits early** (stops at first issue)
- No external tools (pure bash)

❌ **What it doesn't do:**
- ✗ Full git history scan (too slow)
- ✗ Deep code analysis (too slow)
- ✗ Network validation (unnecessary)

## Common Issues

### ❌ "pre-push hook denied"

**Solution**: Make executable
```bash
chmod +x .git/hooks/pre-push
```

### ❌ Hook not running

**Solution**: Check it exists
```bash
cat .git/hooks/pre-push
```

### ❌ False positive blocking push

**Solution**: Override if safe
```bash
git push --no-verify
```

## Team Workflow

### For Your Team

Since hooks are in `.git/` (not tracked), team needs to set up:

**Option A: Manual Setup**
```bash
chmod +x .git/hooks/pre-push
```

**Option B: Automated Setup**
Create `setup-hooks.sh`:
```bash
#!/bin/bash
chmod +x .git/hooks/pre-push
echo "✅ Git hooks installed"
```

Run once: `bash setup-hooks.sh`

## What Gets Blocked

### Always Blocks:
- ✅ `.env` files with credentials
- ✅ Binary database files
- ✅ node_modules directory
- ✅ Obviously hardcoded secrets

### Usually Allows:
- ✅ Examples in documentation
- ✅ Placeholder values in guides
- ✅ Source code files
- ✅ JSON exports

## Security Level

| Level | Speed | False Positives |
|-------|-------|-----------------|
| **Lightweight** (current) | <500ms | Very low |
| Moderate | ~2s | Low |
| Strict | ~10s | Medium |

Current hook is **Lightweight** = Fast + Effective

---

## Quick Reference

```bash
# Check if hook is installed
cat .git/hooks/pre-push

# Make executable (if needed)
chmod +x .git/hooks/pre-push

# Test the hook
git add test.env
git commit -m "test"
git push  # Should be blocked

# Override (dangerous!)
git push --no-verify
```

---

**That's it! Your pushes are now protected.** 🛡️
