/**
 * Merge Conflict Detection & Resolution for Partial Sync
 * Similar to git merge - detects conflicts when both local and remote changed
 */

import readline from 'readline';

/**
 * Detect merge conflicts in vocabulary
 * Conflicts occur when a record was updated in both SQLite and Neon
 * @param {Array} sqliteRecords - SQLite vocabulary records with id, updated_at
 * @param {Map} neonTimestampMap - Map of id -> neon_updated_at_ms
 * @param {Object} neonDataMap - Map of id -> full neon record
 * @returns {Array} Conflict records with local and remote data
 */
export function detectMergeConflicts(sqliteRecords, neonTimestampMap, neonDataMap) {
  const conflicts = [];
  const MIN_DIFF = 1000; // 1 second minimum difference to be considered a conflict

  for (const localRecord of sqliteRecords) {
    const neonMs = neonTimestampMap.get(localRecord.id);
    // Only check records that exist in both databases
    if (neonMs === undefined) continue;

    const localMs = localRecord.updated_at;
    const diff = Math.abs(localMs - neonMs);

    // Conflict: both have been updated (different timestamps, not recent noise)
    if (diff > MIN_DIFF && localMs !== neonMs) {
      const neonRecord = neonDataMap.get(localRecord.id);
      if (neonRecord) {
        conflicts.push({
          id: localRecord.id,
          local: localRecord,
          remote: neonRecord,
          localUpdatedAt: new Date(localMs).toISOString(),
          remoteUpdatedAt: neonRecord.updated_at_display || new Date(neonMs).toISOString(),
          isLocalNewer: localMs > neonMs
        });
      }
    }
  }

  return conflicts;
}

/**
 * Display a conflict record to user
 */
function displayConflict(conflict, conflictNum, totalConflicts) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`⚠️  CONFLICT ${conflictNum}/${totalConflicts} - Word ID: ${conflict.id}`);
  console.log(`${'─'.repeat(70)}`);

  // Determine which is newer
  const newerLabel = conflict.isLocalNewer ? '🔵 LOCAL (Newer)' : '🔴 REMOTE (Newer)';
  const olderLabel = conflict.isLocalNewer ? '🔴 REMOTE (Older)' : '🔵 LOCAL (Older)';

  console.log(`\n${newerLabel}`);
  console.log(`  Updated: ${conflict.isLocalNewer ? conflict.localUpdatedAt : conflict.remoteUpdatedAt}`);
  console.log(`  Chinese: ${conflict.isLocalNewer ? conflict.local.chinese : conflict.remote.chinese}`);
  console.log(`  Original: ${conflict.isLocalNewer ? conflict.local.original : conflict.remote.original}`);
  console.log(`  Kana: ${conflict.isLocalNewer ? conflict.local.kana : conflict.remote.kana}`);
  console.log(`  Category: ${conflict.isLocalNewer ? conflict.local.category : conflict.remote.category}`);
  console.log(`  Difficulty: ${conflict.isLocalNewer ? conflict.local.difficulty : conflict.remote.difficulty}`);

  console.log(`\n${olderLabel}`);
  console.log(`  Updated: ${!conflict.isLocalNewer ? conflict.localUpdatedAt : conflict.remoteUpdatedAt}`);
  console.log(`  Chinese: ${!conflict.isLocalNewer ? conflict.local.chinese : conflict.remote.chinese}`);
  console.log(`  Original: ${!conflict.isLocalNewer ? conflict.local.original : conflict.remote.original}`);
  console.log(`  Kana: ${!conflict.isLocalNewer ? conflict.local.kana : conflict.remote.kana}`);
  console.log(`  Category: ${!conflict.isLocalNewer ? conflict.local.category : conflict.remote.category}`);
  console.log(`  Difficulty: ${!conflict.isLocalNewer ? conflict.local.difficulty : conflict.remote.difficulty}`);
}

/**
 * Ask user how to resolve a conflict
 */
async function askConflictResolution(conflict, conflictNum, totalConflicts, hasApplyAll = false) {
  displayConflict(conflict, conflictNum, totalConflicts);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const question = `
Options:
  l) Keep LOCAL (newer: ${conflict.isLocalNewer ? 'yes' : 'no'})
  r) Keep REMOTE (newer: ${!conflict.isLocalNewer ? 'yes' : 'no'})
  s) Skip this record
  ${hasApplyAll ? 'L) Apply LOCAL to all remaining\n  R) Apply REMOTE to all remaining\n  S) Skip all remaining\n' : ''}
Enter choice [l/r/s${hasApplyAll ? '/L/R/S' : ''}]: `;

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

/**
 * Resolve merge conflicts interactively
 * @param {Array} conflicts - Array of conflict objects
 * @returns {Object} Resolution map: { id: 'local'|'remote'|'skip' }
 */
export async function resolveConflicts(conflicts) {
  if (conflicts.length === 0) {
    return {};
  }

  console.log(`\n🔀 MERGE CONFLICTS DETECTED - ${conflicts.length} word(s) changed in both LOCAL and REMOTE\n`);
  console.log('Please resolve conflicts before syncing...\n');

  const resolutions = {};
  let applyAllChoice = null;

  for (let i = 0; i < conflicts.length; i++) {
    const conflict = conflicts[i];
    
    if (applyAllChoice) {
      // Apply previous "apply all" choice
      const choice = applyAllChoice === 'L' ? 'local' : applyAllChoice === 'R' ? 'remote' : 'skip';
      resolutions[conflict.id] = choice;
      console.log(`⭕ Applying ${choice.toUpperCase()} to ID ${conflict.id}`);
    } else {
      // Ask user
      let answer = await askConflictResolution(conflict, i + 1, conflicts.length, true);
      
      if (answer === 'l') {
        resolutions[conflict.id] = 'local';
      } else if (answer === 'r') {
        resolutions[conflict.id] = 'remote';
      } else if (answer === 's') {
        resolutions[conflict.id] = 'skip';
      } else if (answer === 'L') {
        resolutions[conflict.id] = 'local';
        applyAllChoice = 'L';
        console.log('\n📌 Applying LOCAL to all remaining conflicts...\n');
      } else if (answer === 'R') {
        resolutions[conflict.id] = 'remote';
        applyAllChoice = 'R';
        console.log('\n📌 Applying REMOTE to all remaining conflicts...\n');
      } else if (answer === 'S') {
        resolutions[conflict.id] = 'skip';
        applyAllChoice = 'S';
        console.log('\n📌 Skipping all remaining conflicts...\n');
      } else {
        // Invalid input, ask again
        console.log('❌ Invalid choice. Please try again.\n');
        i--;
        continue;
      }
    }
  }

  // Summary
  const localCount = Object.values(resolutions).filter(v => v === 'local').length;
  const remoteCount = Object.values(resolutions).filter(v => v === 'remote').length;
  const skipCount = Object.values(resolutions).filter(v => v === 'skip').length;

  console.log(`\n${'─'.repeat(70)}`);
  console.log('✅ Conflict Resolution Summary:');
  console.log(`   🔵 Keep LOCAL: ${localCount}`);
  console.log(`   🔴 Keep REMOTE: ${remoteCount}`);
  console.log(`   ⭕ Skip: ${skipCount}`);
  console.log(`${'─'.repeat(70)}\n`);

  return resolutions;
}

/**
 * Apply conflict resolution to sync records
 * @param {Array} recordsToSync - IDs that would be synced
 * @param {Object} resolutions - Map from resolveConflicts
 * @param {Array} conflicts - Array of conflict objects
 * @returns {Object} { toSync: Array, toSkip: Array, toReverse: Array }
 */
export function applyMergeResolution(recordsToSync, resolutions, conflicts) {
  const conflictIds = new Set(conflicts.map(c => c.id));
  const toSync = [];
  const toSkip = [];
  const toReverse = []; // Records to keep remote (not sync local)

  for (const id of recordsToSync) {
    if (!conflictIds.has(id)) {
      // Not a conflict, sync normally
      toSync.push(id);
    } else {
      // Conflict - apply resolution
      const resolution = resolutions[id];
      if (resolution === 'local') {
        toSync.push(id); // Sync local version
      } else if (resolution === 'remote') {
        toReverse.push(id); // Don't sync, keep remote
      } else if (resolution === 'skip') {
        toSkip.push(id); // Don't touch
      }
    }
  }

  return { toSync, toSkip, toReverse };
}
