/**
 * 统计相关业务逻辑控制器 - SQLite (Async) Version
 */
import { getBeijingCurrentDayStartTimestamp, getBeijingDayStartDaysAgo } from '../utils/timezone.js';

let db = null;

export function setDb(database) {
  db = database;
}

// 获取每日录入统计
export async function getDailyInputStats(req, res) {
  try {
    const { days = 30 } = req.query;
    const cutoffDayStart = getBeijingDayStartDaysAgo(days);
    const result = await db.all(`
      SELECT 
        date(input_date / 1000, 'unixepoch', '+8 hours') as input_date,
        COUNT(*) as word_count,
        COUNT(CASE WHEN mastery_level >= 3 THEN 1 END) as mastered_count
      FROM vocabulary
      WHERE input_date >= ?
      GROUP BY date(input_date / 1000, 'unixepoch', '+8 hours')
      ORDER BY input_date DESC
    `, cutoffDayStart);
    
    res.json({
      success: true,
      data: result,
      total: result.length,
      days: parseInt(days)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取每日练习统计
export async function getDailyPracticeStats(req, res) {
  try {
    const { user_id = 1, days = 30 } = req.query;
    const cutoffDayStart = getBeijingDayStartDaysAgo(days);
    const result = await db.all(`
      SELECT 
        date(practice_date / 1000, 'unixepoch', '+8 hours') as practice_date,
        COUNT(*) as practice_count,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(100.0 * SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_rate
      FROM practice_records
      WHERE user_id = ? AND practice_date >= ?
      GROUP BY date(practice_date / 1000, 'unixepoch', '+8 hours')
      ORDER BY practice_date DESC
    `, user_id, cutoffDayStart);
    
    res.json({
      success: true,
      data: result,
      total: result.length,
      days: parseInt(days)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取掌握程度分布
export async function getMasteryDistribution(req, res) {
  try {
    const totalCount = await db.get('SELECT COUNT(*) as count FROM vocabulary');
    
    const result = await db.all(`
      SELECT 
        mastery_level,
        COUNT(*) as word_count,
        ROUND(COUNT(*) * 100.0 / ?, 2) as percentage
      FROM vocabulary
      GROUP BY mastery_level
      ORDER BY mastery_level
    `, totalCount.count);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取学习概览
export async function getOverview(req, res) {
  try {
    const { user_id = 1 } = req.query;
    const todayStart = getBeijingCurrentDayStartTimestamp();
    const recentStart = getBeijingDayStartDaysAgo(7);
    
    // Get all stats
    const totalWords = await db.get('SELECT COUNT(*) as count FROM vocabulary');
    const todayInput = await db.get(
      'SELECT COUNT(*) as count FROM vocabulary WHERE input_date = ?',
      todayStart
    );
    const todayReview = await db.get(
      'SELECT COUNT(*) as count FROM vocabulary WHERE next_review_date IS NOT NULL AND next_review_date <= ?',
      todayStart
    );
    const totalPractice = await db.get(
      'SELECT COUNT(*) as count FROM practice_records WHERE user_id = ?',
      user_id
    );
    const recentAccuracy = await db.get(`
      SELECT ROUND(100.0 * SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as rate
      FROM practice_records 
      WHERE user_id = ? AND practice_date >= ?
    `, user_id, recentStart);
    
    res.json({
      success: true,
      data: {
        totalWords: totalWords.count,
        todayInput: todayInput.count,
        todayReview: todayReview.count,
        totalPractice: totalPractice.count,
        recentAccuracy: recentAccuracy.rate || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export default {
  setDb,
  getDailyInputStats,
  getDailyPracticeStats,
  getMasteryDistribution,
  getOverview
};
