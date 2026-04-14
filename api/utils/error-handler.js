/**
 * Error handling utilities for sync operations
 * Provides detailed, helpful error messages for debugging
 */

/**
 * Format error with context and suggestions
 * @param {Error} err - The error object
 * @param {string} context - What was being done when error occurred
 * @param {object} options - Additional context (table name, etc.)
 */
export function formatSyncError(err, context, options = {}) {
  const { table, operation, attemptedRecordCount } = options;
  
  let message = `\n❌ ${context}\n`;
  message += '─'.repeat(60) + '\n';
  
  // Show error details
  message += `Error: ${err.message}\n`;
  if (err.code) message += `Code: ${err.code}\n`;
  if (err.detail) message += `Details: ${err.detail}\n`;
  
  // Add context if available
  if (table) message += `Table: ${table}\n`;
  if (operation) message += `Operation: ${operation}\n`;
  if (attemptedRecordCount !== undefined) message += `Records attempted: ${attemptedRecordCount}\n`;
  
  // Add suggestions based on error type
  message += '\n💡 Troubleshooting:\n';
  
  if (err.code === 'ECONNREFUSED' || err.message.includes('ENOTFOUND')) {
    message += '  • Check Neon database is running\n';
    message += '  • Verify DATABASE_URL is correct\n';
    message += '  • Check internet connection\n';
    message += '  • Ensure .env.neon file exists and has valid credentials\n';
  } else if (err.code === 'EACCES' || err.message.includes('permission')) {
    message += '  • Check database user has necessary permissions\n';
    message += '  • Verify PostgreSQL connection string\n';
    message += '  • Ensure tables exist in Neon database\n';
  } else if (err.message.includes('FOREIGN KEY') || err.message.includes('constraint')) {
    message += '  • Check data integrity before syncing\n';
    message += '  • Verify related records exist in Neon\n';
    message += '  • Run full sync instead of partial: node sync-to-neon.js\n';
  } else if (err.message.includes('ENOENT') || err.message.includes('no such file')) {
    message += '  • Check SQLite database file exists\n';
    message += '  • Verify path: ./data/vocabulary.db\n';
  } else {
    message += '  • Check sync logs above for context\n';
    message += '  • Try running sync again\n';
    message += '  • Review database connection settings\n';
  }
  
  message += '─'.repeat(60) + '\n';
  
  // Show full stack trace for debugging
  if (process.env.DEBUG_SYNC) {
    message += '\n🔍 Full Stack Trace (DEBUG mode):\n';
    message += err.stack + '\n';
  } else {
    message += '\n💽 For full error details, run with DEBUG mode:\n';
    message += '   DEBUG_SYNC=1 npm run sync-neon\n';
  }
  
  return message;
}

/**
 * Log error with context
 */
export function logSyncError(err, context, options = {}) {
  console.error(formatSyncError(err, context, options));
}

/**
 * Handle sync operation with try/catch wrapper
 * @param {Function} operation - Async function to run
 * @param {string} context - Error context message
 * @param {object} options - Additional options
 */
export async function trySyncOperation(operation, context, options = {}) {
  try {
    return await operation();
  } catch (err) {
    logSyncError(err, context, options);
    throw err; // Re-throw for outer catch block
  }
}
