#!/usr/bin/env node

/**
 * Test Error Handling Scenarios
 * Run this to see improved error messages for different failure types
 * Usage: DEBUG_SYNC=1 node test-error-handling.js
 */

import { formatSyncError, logSyncError } from './utils/error-handler.js';

console.log('\n📋 Testing Error Handling System\n');
console.log('=' .repeat(70));

// Test 1: Connection Error
console.log('\n🧪 Test 1: Connection Refused Error\n');
const connErr = new Error('connect ECONNREFUSED 127.0.0.1:5432');
connErr.code = 'ECONNREFUSED';
logSyncError(connErr, 'Failed to connect to database', {
  table: 'vocabulary',
  operation: 'test connection'
});

// Test 2: Permission Error
console.log('\n🧪 Test 2: Permission/Constraint Error\n');
const permErr = new Error('permission denied for schema public');
permErr.code = 'EACCES';
permErr.detail = 'User lacks permissions';
logSyncError(permErr, 'Database access denied', {
  table: 'users',
  operation: 'insert user record',
  attemptedRecordCount: 42
});

// Test 3: Missing File Error
console.log('\n🧪 Test 3: File Not Found Error\n');
const fileErr = new Error('ENOENT: no such file or directory, open \'vocabulary.db\'');
fileErr.code = 'ENOENT';
logSyncError(fileErr, 'Cannot initialize databases', {
  operation: 'database initialization'
});

// Test 4: Network/Connection Timeout
console.log('\n🧪 Test 4: Network Timeout\n');
const timeoutErr = new Error('Query timeout: request cancelled');
timeoutErr.code = 'ETIMEDOUT';
logSyncError(timeoutErr, 'Network timeout during sync', {
  table: 'practice_records',
  operation: 'fetch practice records from Neon',
  attemptedRecordCount: 62
});

// Test 5: Constraint Error (Foreign Key)
console.log('\n🧪 Test 5: Foreign Key Constraint Violation\n');
const constraintErr = new Error('violates foreign key constraint "practice_records_user_id_fkey"');
constraintErr.code = '23503';
constraintErr.detail = 'Key (user_id)=(999) is not present in table "users".';
logSyncError(constraintErr, 'Data integrity violation', {
  table: 'practice_records',
  operation: 'insert practice record',
  attemptedRecordCount: 1
});

// Test 6: Unique Constraint Error
console.log('\n🧪 Test 6: Unique Constraint Violation\n');
const uniqueErr = new Error('duplicate key value violates unique constraint "vocabulary_pkey"');
uniqueErr.code = '23505';
logSyncError(uniqueErr, 'Duplicate record detected', {
  table: 'vocabulary',
  operation: 'insert vocabulary',
  attemptedRecordCount: 1
});

// Test 7: Generic Unknown Error
console.log('\n🧪 Test 7: Unknown/Generic Error\n');
const unknownErr = new Error('Something went wrong');
logSyncError(unknownErr, 'Unexpected error during sync', {
  table: 'vocabulary',
  operation: 'unknown'
});

console.log('\n' + '='.repeat(70));
console.log('\n✅ All error scenarios tested!\n');
console.log('💡 Tips:');
console.log('  • Each error shows context (what operation failed)');
console.log('  • Specific troubleshooting suggestions for each error type');
console.log('  • Use DEBUG_SYNC=1 to see full stack traces');
console.log('  • Use in actual sync failures for real error messages\n');
