# Sync Merge Conflicts Guide

## Overview

The partial sync now includes **git-like merge conflict detection**, similar to how `git merge` detects conflicts when both branches modify the same file. This ensures data consistency when words are updated in both local (SQLite) and remote (Neon) databases.

## When Conflicts Occur

A merge conflict is detected when:

1. **Word exists in both databases** (local SQLite and remote Neon)
2. **Both were updated** (both have different `updated_at` timestamps)
3. **Timestamps differ** (more than 1 second difference)

```
Example Timeline:
─────────────────────────────────────────────────────

Word ID: 44 (先生)
Created: 2026-04-16 10:00:00

Update 1 (Local):        Update 2 (Remote):
2026-04-17 08:00:00      2026-04-17 14:00:00
Difficulty: 2 ───────────Difficulty: 1
              ❌ CONFLICT!
```

## Conflict Detection Logic

### What Gets Compared

```javascript
// For each record that needs syncing
if (recordExistsInBoth && timestampsDiffer) {
  → CONFLICT DETECTED
}
```

### What Gets Displayed

When a conflict is found, the system shows:

```
──────────────────────────────────────
⚠️  CONFLICT 1/2 - Word ID: 44
──────────────────────────────────────

🔵 LOCAL (Newer)
  Updated: 2026-04-17T15:30:00Z
  Chinese: 老师
  Original: 先生
  Kana: せんせい
  Category: N5
  Difficulty: 2

🔴 REMOTE (Older)
  Updated: 2026-04-16T10:00:00Z
  Chinese: 老师
  Original: 先生
  Kana: せんせい
  Category: N4
  Difficulty: 1
```

## Resolution Options

### Interactive Choices

For each conflict, you can choose:

```
l) Keep LOCAL
   - Use local version (SQLite)
   - Sync to Neon
   - Remote version is overwritten

r) Keep REMOTE
   - Use remote version (Neon)
   - Don't sync local
   - Local version stays as-is

s) Skip
   - Don't touch either
   - No sync, no change
   - Revisit later

L) Apply LOCAL to all remaining
   - Batch apply to remaining conflicts
   - Faster for bulk operations

R) Apply REMOTE to all remaining
   - Keep all remaining remote versions

S) Skip all remaining
   - Leave all remaining as-is
```

### Summary After Resolution

```
──────────────────────────────────────
✅ Conflict Resolution Summary:
──────────────────────────────────────
   🔵 Keep LOCAL: 5
   🔴 Keep REMOTE: 2
   ⭕ Skip: 1
──────────────────────────────────────
```

## How to Use

### 1. Run Partial Sync

```bash
cd api
npm run sync-to-neon-partial
```

### 2. System Detects Conflicts

If both databases have changes:

```
📝 Checking vocabulary...
   Total: 449 | To sync: 45 | Skipped: 404

🔀 MERGE CONFLICTS DETECTED - 3 word(s) changed in both LOCAL and REMOTE

Please resolve conflicts before syncing...
```

### 3. Resolve Each Conflict

```
⚠️  CONFLICT 1/3 - Word ID: 44
[Shows LOCAL vs REMOTE]

Options:
  l) Keep LOCAL (newer: yes)
  r) Keep REMOTE (newer: no)
  s) Skip this record
  L) Apply LOCAL to all remaining
  R) Apply REMOTE to all remaining
  S) Skip all remaining
Enter choice [l/r/s/L/R/S]: l
```

### 4. After Resolution

```
📊 After conflict resolution: 42 records to sync

✅ 42 vocabulary items synced

✅ Partial sync complete!
```

## Decision Guide

### When to Choose LOCAL

**Use LOCAL when:**
- ✅ Local changes are more recent
- ✅ Local data is more accurate
- ✅ You trust local edits more
- ✅ Remote version is outdated

**Example:**
```
LOCAL:  Difficulty: 2, Updated: 5 minutes ago ← More recent
REMOTE: Difficulty: 1, Updated: yesterday

→ Choose LOCAL (l)
```

### When to Choose REMOTE

**Use REMOTE when:**
- ✅ Remote changes are more recent
- ✅ Remote data is more accurate
- ✅ You made edits on Vercel/web
- ✅ Local version is outdated

**Example:**
```
LOCAL:  Difficulty: 1, Updated: yesterday
REMOTE: Difficulty: 2, Updated: 2 hours ago ← More recent

→ Choose REMOTE (r)
```

### When to Skip

**Use SKIP when:**
- ✅ You need to manually merge
- ✅ You're unsure which version to keep
- ✅ You need to check something else first
- ✅ Neither version is correct

**What happens:**
- Record is NOT synced
- Both versions stay unchanged
- Run sync again later to retry

## Workflow Examples

### Scenario 1: Local is Always Correct

```bash
npm run sync-to-neon-partial

🔀 MERGE CONFLICTS DETECTED - 5 word(s) changed

⚠️  CONFLICT 1/5 - Word ID: 44
Enter choice [l/r/s/L/R/S]: L

📌 Applying LOCAL to all remaining conflicts...

✅ 5 vocabulary items synced
```

**Result:** All conflicts resolved by keeping local versions.

---

### Scenario 2: Mixed Resolution

```bash
npm run sync-to-neon-partial

🔀 MERGE CONFLICTS DETECTED - 3 word(s) changed

⚠️  CONFLICT 1/3 - Word ID: 44
[LOCAL newer]
Enter choice: l

⚠️  CONFLICT 2/3 - Word ID: 696
[REMOTE newer]
Enter choice: r

⚠️  CONFLICT 3/3 - Word ID: 999
[Unsure]
Enter choice: s

📊 After conflict resolution:
   🔵 Keep LOCAL: 1
   🔴 Keep REMOTE: 1
   ⭕ Skip: 1

✅ 2 vocabulary items synced
```

**Result:** Mixed resolution with one record skipped for later.

---

### Scenario 3: Skip Everything

```bash
npm run sync-to-neon-partial

🔀 MERGE CONFLICTS DETECTED - 5 word(s) changed

⚠️  CONFLICT 1/5 - Word ID: 44
Enter choice [l/r/s/L/R/S]: S

📌 Skipping all remaining conflicts...

📊 After conflict resolution: 0 records to sync

📌 Note: Zero records needed syncing (all up to date)

✅ Partial sync complete!
```

**Result:** No changes synced, all conflicts preserved.

## Technical Details

### Conflict Detection Algorithm

```javascript
function detectMergeConflicts(sqliteRecords, neonTimestampMap, neonDataMap) {
  const conflicts = [];
  const MIN_DIFF = 1000; // 1 second threshold
  
  for (const localRecord of sqliteRecords) {
    const neonMs = neonTimestampMap.get(localRecord.id);
    
    // Only check records in both databases
    if (neonMs === undefined) continue;
    
    const localMs = localRecord.updated_at;
    const diff = Math.abs(localMs - neonMs);
    
    // Conflict: different timestamps (not noise)
    if (diff > MIN_DIFF && localMs !== neonMs) {
      conflicts.push({
        id: localRecord.id,
        local: localRecord,
        remote: neonRecord,
        isLocalNewer: localMs > neonMs
      });
    }
  }
  
  return conflicts;
}
```

### Resolution Application

```javascript
function applyMergeResolution(recordsToSync, resolutions, conflicts) {
  const toSync = [];      // Will sync (keep local)
  const toSkip = [];      // Won't touch
  const toReverse = [];   // Keep remote (don't sync)
  
  for (const id of recordsToSync) {
    const resolution = resolutions[id];
    
    if (resolution === 'local') {
      toSync.push(id);        // ← Sync local version
    } else if (resolution === 'remote') {
      toReverse.push(id);     // ← Keep remote version
    } else if (resolution === 'skip') {
      toSkip.push(id);        // ← Don't touch
    }
  }
  
  return { toSync, toSkip, toReverse };
}
```

## Important Notes

### Auto-Retry on Next Sync

```
Scenario: User chooses REMOTE for a conflict
─────────────────────────────────────────────

Run 1 (this sync):
  Word 44: LOCAL ≠ REMOTE
  User: "Keep REMOTE (r)"
  Action: Skip, don't sync

Run 2 (next sync):
  Word 44: LOCAL == NEON (no change to local)
  Result: Not a conflict anymore ✅
```

### Data Safety

- ✅ No data is deleted
- ✅ User always chooses action
- ✅ Both versions available even after sync
- ✅ Can always run sync again

### Audit Trail

All conflicts and resolutions are recorded in sync audit:

```json
{
  "sync_type": "partial",
  "conflicts_detected": 3,
  "conflicts_resolved": {
    "44": "local",
    "696": "remote",
    "999": "skip"
  },
  "records_synced": 2,
  "audit_id": 7
}
```

## Troubleshooting

### Issue: Conflicts Keep Appearing

**Cause:** One database keeps changing after syncing

**Solution:**
1. Understand why both are updating
2. Agree on a single source of truth
3. Use AUTO-RESOLVE options (L, R, S) for next sync

---

### Issue: Unsure Which to Keep

**Options:**
1. Choose SKIP (s) - preserve both, decide later
2. Check the data in both databases
3. Run sync again after clarification

---

### Issue: Need to Manual Merge

**If conflict needs custom data:**
1. Choose SKIP for this record
2. Manually edit in whichever database
3. Make versions identical
4. Run sync again

---

## See Also

- [SYNC_INTEGRATION_GUIDE.md](SYNC_INTEGRATION_GUIDE.md) - Partial sync overview
- [SYNC_ERROR_RECOVERY.md](SYNC_ERROR_RECOVERY.md) - Error handling
- [SYNC_AUDIT_GUIDE.md](SYNC_AUDIT_GUIDE.md) - Audit tracking
- [USAGE.md](USAGE.md) - General usage

## Implementation Files

- `api/utils/sync-merge-conflicts.js` - Conflict detection & resolution
- `api/scripts/sync/sync-to-neon-partial.js` - Integration point
- `api/utils/sync-audit.js` - Conflict logging

## Questions?

For issues or questions about merge conflicts:

1. Check conflict details in audit records
2. Review sync logs
3. Verify both database versions
4. Re-run sync with explicit choices
