/**
 * Sync API Routes - Two-way sync between SQLite and Neon
 */
import express from 'express';
import * as syncService from '../services/sync.service.js';

const router = express.Router();
let syncDb = null;

export function setSyncDb(db) {
  syncDb = db;
}

/**
 * GET /api/sync/status
 * Get current sync status and pending changes
 */
router.get('/status', (req, res) => {
  try {
    const status = syncService.getSyncStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/sync/push-to-neon
 * Push pending local changes to Neon
 */
router.post('/push-to-neon', async (req, res) => {
  try {
    const result = await syncService.syncToNeon();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully synced ${result.synced} changes to Neon`,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.reason || 'Sync failed',
        error: result.error
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/sync/pull-from-neon
 * Pull changes from Neon to local SQLite
 */
router.post('/pull-from-neon', async (req, res) => {
  try {
    const result = await syncService.syncFromNeon();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully pulled ${result.pulled} changes from Neon`,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Pull from Neon failed',
        error: result.error
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/sync/export-to-neon
 * Full backup: Export all local SQLite data to Neon
 */
router.post('/export-to-neon', async (req, res) => {
  try {
    const result = await syncService.fullExportToNeon();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Successfully exported all data to Neon',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Export failed',
        error: result.error
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/sync/import-from-neon
 * Full restore: Import all data from Neon to local SQLite
 */
router.post('/import-from-neon', async (req, res) => {
  if (!syncDb) {
    return res.status(500).json({
      success: false,
      error: 'Database not initialized'
    });
  }

  try {
    const result = await syncService.fullImportFromNeon(syncDb);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        imported: result.imported,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Import failed',
        reason: result.reason,
        error: result.error
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/sync/clear-local
 * Clear all local data (be careful!)
 */
router.post('/clear-local', async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'YES_DELETE_ALL') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Send { "confirm": "YES_DELETE_ALL" } to proceed'
      });
    }
    
    // This endpoint is intentionally not fully implemented
    // Users should use import-from-neon instead
    res.json({
      success: false,
      message: 'For safety, use /api/sync/import-from-neon to restore from Neon instead'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
