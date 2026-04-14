# Error Recovery Implementation Checklist

## Phase 1: Foundation (✅ COMPLETED)

### Error Handling Utilities
- [x] `api/utils/error-handler.js` - Contextual error formatting
- [x] `api/utils/timestamp-sync.js` - Timestamp comparison utilities
- [x] `api/utils/sync-progress.js` - Per-record error handling with progress

### Documentation
- [x] `SYNC_ERROR_RECOVERY.md` - How recovery works, safe retry patterns
- [x] `SYNC_INTEGRATION_GUIDE.md` - Implementation guide for developers
- [x] `ERROR_HANDLING_GUIDE.md` - Error interpretation and debugging
- [x] `api/scripts/README.md` - Script organization and navigation

---

## Phase 2: Integration (RECOMMENDED NEXT STEPS)

### Script Updates

#### A. Partial Sync (Recommended first update)
- [ ] `api/scripts/sync/sync-to-neon-partial.js`
  - [ ] Import `syncRecordsWithProgress`, `displaySyncResults`, sync functions from `sync-progress.js`
  - [ ] Replace vocabulary record loop with `syncRecordsWithProgress()`
  - [ ] Replace users record loop with `syncRecordsWithProgress()`
  - [ ] Replace practice_records loop with `syncRecordsWithProgress()`
  - [ ] Update sync count tracking from results
  - [ ] Test: `npm run sync-neon`

#### B. Full Sync
- [ ] `api/scripts/sync/sync-to-neon.js`
  - [ ] Apply same pattern as partial sync
  - [ ] Test: `npm run sync-full`

#### C. Individual Table Syncs
- [ ] `api/scripts/sync/sync-vocabulary-to-neon.js`
  - [ ] Update with per-record error handling
  - [ ] Test: `npm run sync-vocabulary`

- [ ] `api/scripts/sync/sync-users-to-neon.js`
  - [ ] Update with per-record error handling
  - [ ] Test: `npm run sync-users`

- [ ] `api/scripts/sync/sync-practice-records-to-neon.js`
  - [ ] Update with per-record error handling
  - [ ] Test: `npm run sync-practice-records`

#### D. Specialized Syncs
- [ ] `api/scripts/sync/sync-vocabulary-to-neon.js` (Already done above)
- [ ] `api/scripts/sync/sync-users-to-neon.js` (Already done above)
- [ ] `api/scripts/sync/sync-practice-records-to-neon.js` (Already done above)

---

## Phase 3: Testing

### Unit Tests
- [ ] Test `syncRecordsWithProgress()` with success case (all records sync)
- [ ] Test `syncRecordsWithProgress()` with mixed success/failure
- [ ] Test `syncRecordsWithProgress()` with all failures
- [ ] Test `displaySyncResults()` formatting for various scenarios

### Integration Tests
- [ ] Manual test partial sync with 100% success
  ```bash
  npm run sync-neon
  # Verify: Shows dots, all succeeded
  ```

- [ ] Manual test partial sync with injected failure
  - [ ] Modify sync function to fail on record ID X
  - [ ] Run sync, verify shows mix of dots and crosses
  - [ ] Remove the failure injection
  - [ ] Run sync again, verify record X is retried

- [ ] Manual test full sync
  ```bash
  npm run sync-full
  ```

- [ ] Manual test after real error
  - [ ] Create a database constraint that causes failure (e.g., remove a category)
  - [ ] Run sync, verify error is shown
  - [ ] Fix the constraint
  - [ ] Run sync again, verify recovery

---

## Phase 4: Documentation Updates

### Update Existing Docs
- [ ] `ERROR_HANDLING_GUIDE.md`
  - [ ] Add section on new progress indicator format
  - [ ] Add example of partial failure and recovery
  - [ ] Show new output format

- [ ] `api/scripts/README.md`
  - [ ] Add note about progress indicator
  - [ ] Add section on error recovery
  - [ ] Add link to SYNC_ERROR_RECOVERY.md

### Create New Docs
- [ ] `TROUBLESHOOTING.md` - Common error scenarios and solutions
  - [ ] Progress indicator didn't show (terminal width)
  - [ ] Some records keep failing
  - [ ] How to manually fix a bad record

---

## Phase 5: User Communication

### README Updates
- [ ] Update root `README.md` with:
  - [ ] Sync error recovery capabilities
  - [ ] Link to SYNC_ERROR_RECOVERY.md
  - [ ] Progress indicator explanation

- [ ] Add quick reference section:
  ```
  ## Quick Sync Help
  
  **Sync failed?** → Just run it again: `npm run sync-neon`
  **Want details?** → `DEBUG_SYNC=1 npm run sync-neon`
  **Check progress** → Look for dots (✓) and crosses (✗)
  ```

---

## Verification Checklist

### Before Deploying
- [ ] All sync scripts updated with error handling
- [ ] All tests pass
- [ ] Manual testing completed successfully
- [ ] Documentation is complete and accurate
- [ ] No breaking changes to existing APIs
- [ ] Error recovery behavior tested with real failures

### After Deploying
- [ ] Monitor production syncs for errors
- [ ] Collect feedback from users on progress indicator usefulness
- [ ] Track if failed records are successfully retried
- [ ] Document any new error patterns discovered

---

## Expected Benefits

### Visibility ✅
Before: `✅ 5 vocabulary items synced`  
After: `Progress: . . . ✗ . . . . . .` → Shows exactly which records had issues

### Reliability ✅
Before: If record 5 fails, records 6-10 never processed  
After: Record 5 fails but shows error; user can fix and retry; records 6-10 eventually synced

### User Experience ✅
Before: User doesn't know which record failed or why  
After: Shows failed record ID, error message, automatic retry hint

### Developer Experience ✅
Before: Have to read full error stack trace  
After: Concise error message + link to fix + automatic retry suggestion

---

## Risk Assessment

### Low Risk ✅
- Error handling doesn't change existing logic, only adds visibility
- `ON CONFLICT` upserts ensure idempotency - retries are safe
- Progress display is visual only, doesn't affect sync logic
- Utilities are separate from active sync code

### No Breaking Changes ✅
- Existing sync scripts still work
- New utilities are additive
- Timestamp comparison logic unchanged
- Verification logic unchanged

### Rollback Plan ✅
If issues occur:
1. Remove import of sync-progress utilities
2. Revert record loops to original `for (const row of records)` style
3. Sync continues to work as before

---

## Success Criteria

✅ All updates complete when:
1. All sync scripts use per-record error handling
2. Progress indicator shows during sync
3. Failed records are automatically retried on next sync
4. User can see exactly which records failed and why
5. Documentation clearly explains recovery process
6. All tests pass
7. Production syncs show improved reliability

---

## Timeline Estimate

| Phase | Effort | Time |
|-------|--------|------|
| Foundation (utilities + docs) | DONE | Done |
| Script integration (5 files) | Medium | 1-2 hours |
| Testing (manual + edge cases) | Medium | 1-2 hours |
| Documentation updates | Low | 30 min |
| User communication | Low | 15 min |
| **TOTAL** | **Medium** | **3-4 hours** |

---

## Implementation Tips

### Quick First Update
Start with `sync-to-neon-partial.js` only:
1. Add imports
2. Replace vocabulary loop
3. Test thoroughly
4. Then move to other tables/scripts

### Avoid Common Issues
- ⚠️ Don't forget to pass `msToDate` and `msToTimestamp` helpers
- ⚠️ Make sure record object structure matches what sync functions expect
- ⚠️ Test with actual database failures, not just mock errors
- ⚠️ Verify progress indicator appears (check terminal width)

### Testing Tips
```bash
# Test sync with failures
DEBUG_SYNC=1 npm run sync-neon

# Check specific record
node scripts/debug/check-id1.js [record-id]

# Verify timestamps
sqlite3 data/vocabulary.db "SELECT id, updated_at FROM vocabulary LIMIT 5"
```

---

## Related Files

| File | Purpose |
|------|---------|
| `SYNC_ERROR_RECOVERY.md` | How recovery works, retry patterns |
| `SYNC_INTEGRATION_GUIDE.md` | Step-by-step integration instructions |
| `ERROR_HANDLING_GUIDE.md` | Error codes and troubleshooting |
| `api/scripts/README.md` | Script organization and quick start |
| `api/utils/sync-progress.js` | Per-record error handling utility |
| `api/utils/error-handler.js` | Error formatting and logging |
| `api/utils/timestamp-sync.js` | Timestamp comparison utilities |

---

## Questions & Answers

**Q: Will this slow down syncs?**
A: No, just adds error handling. Progress indicator is real-time, no overhead.

**Q: What if a record fails multiple times?**
A: It will retry on every sync until fixed. User should investigate and fix the underlying issue.

**Q: Do I need to change record comparison logic?**
A: No, timestamp-based comparison unchanged. Only sync loop is improved.

**Q: Can I mix old and new sync scripts?**
A: Yes, but recommended to update all together for consistent behavior.

**Q: How do I test error scenarios?**
A: Add a deliberate failure (e.g., break a foreign key), run sync, verify error appears, fix it, rerun.
