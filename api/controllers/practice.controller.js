/**
 * 练习记录相关业务逻辑控制器 - SQLite (Async) Version
 */
import { trackChange } from '../services/sync.service.js';
import { getBeijingCurrentDateParam, getBeijingCurrentDate, getCurrentTimestamp } from '../utils/timezone.js';
import { convertArrayTimestampsToBeijing, convertTimestampsToBeijing } from '../utils/beijing-time.js';
import { wrapRawSQL } from '../utils/neon-wrapper.js';

let db = null;

export function setDb(database) {
  db = database;
}

// 记录练习结果
export async function recordPractice(req, res) {
  try {
    const { user_id = 1, vocabulary_id, user_answer, is_correct, attempt_count = 1 } = req.body;
    
    if (!vocabulary_id || user_answer === undefined || is_correct === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：vocabulary_id, user_answer, is_correct'
      });
    }
    
    // Insert practice record
    const practiceResult = await db.run(`
      INSERT INTO practice_records (user_id, vocabulary_id, user_answer, is_correct, attempt_count, practice_date, practiced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      user_id, 
      vocabulary_id, 
      user_answer, 
      is_correct ? 1 : 0, 
      attempt_count,
      getBeijingCurrentDateParam(),
      getCurrentTimestamp()  // ISO string for Neon, milliseconds for SQLite
    );
    
    trackChange('practice_records', practiceResult.lastID, 'INSERT');
    
    // Get vocabulary info
    const vocabResult = await db.get(
      'SELECT id, chinese, kana, mastery_level, next_review_date, review_count FROM vocabulary WHERE id = ?',
      vocabulary_id
    );
    
    // Get the inserted record
    const practiceRecord = await db.get('SELECT * FROM practice_records WHERE id = ?', practiceResult.lastID);
    
    // Convert timestamps to Beijing time
    const practiceWithBeijingTime = convertTimestampsToBeijing(practiceRecord, ['practiced_at']);
    const vocabWithBeijingTime = convertTimestampsToBeijing(vocabResult);
    
    res.json({
      success: true,
      data: {
        practice: practiceWithBeijingTime,
        vocabulary: vocabWithBeijingTime
      },
      message: is_correct ? '回答正确！' : '继续加油！'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

// 获取错题列表（最近的练习错误）
export async function getMistakes(req, res) {
  try {
    const { user_id = 1, limit = 50 } = req.query;
    
    const result = await db.all(`
      SELECT 
        v.*,
        pr.user_answer,
        pr.practice_date,
        pr.attempt_count,
        pr.practiced_at
      FROM practice_records pr
      JOIN vocabulary v ON pr.vocabulary_id = v.id
      WHERE pr.user_id = ? 
        AND pr.is_correct = 0
      ORDER BY pr.practiced_at DESC
      LIMIT ?
    `, user_id, limit);
    
    // Convert timestamps to Beijing time
    const dataWithBeijingTime = convertArrayTimestampsToBeijing(result, ['practiced_at', 'created_at', 'updated_at']);
    
    res.json({
      success: true,
      data: dataWithBeijingTime,
      total: dataWithBeijingTime.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

// 获取练习记录统计
export async function getPracticeStats(req, res) {
  try {
    const { user_id = 1, days = 7 } = req.query;
    
    // Total practice count
    const totalStats = await db.get(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count
      FROM practice_records
      WHERE user_id = ?
    `, user_id);
    
    // Daily stats
    const dailyStats = await db.all(`
      SELECT 
        practice_date as date,
        COUNT(*) as attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
      FROM practice_records
      WHERE user_id = ? 
        AND practice_date >= date('now', '-' || ? || ' days')
      GROUP BY practice_date
      ORDER BY practice_date DESC
    `, user_id, days);
    
    // Accuracy by vocabulary
    const vocabAccuracy = await db.all(`
      SELECT 
        v.id,
        v.chinese,
        v.kana,
        COUNT(*) as attempts,
        SUM(CASE WHEN pr.is_correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN pr.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
      FROM practice_records pr
      JOIN vocabulary v ON pr.vocabulary_id = v.id
      WHERE pr.user_id = ?
      GROUP BY v.id
      ORDER BY accuracy DESC
      LIMIT 20
    `, user_id);
    
    const accuracy = totalStats.total_attempts > 0 
      ? Math.round(100 * totalStats.correct_count / totalStats.total_attempts)
      : 0;
    
    res.json({
      success: true,
      data: {
        summary: {
          ...totalStats,
          accuracy: accuracy
        },
        daily: dailyStats,
        byVocabulary: vocabAccuracy
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

// 获取练习历史
export async function getPracticeHistory(req, res) {
  try {
    const { user_id = 1, vocabulary_id, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        pr.*,
        v.chinese,
        v.kana,
        v.original
      FROM practice_records pr
      JOIN vocabulary v ON pr.vocabulary_id = v.id
      WHERE pr.user_id = ?
    `;
    const params = [user_id];
    
    if (vocabulary_id) {
      query += ` AND pr.vocabulary_id = ?`;
      params.push(vocabulary_id);
    }
    
    query += ` ORDER BY pr.practiced_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await db.all(query, ...params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM practice_records WHERE user_id = ?`;
    const countParams = [user_id];
    
    if (vocabulary_id) {
      countQuery += ` AND vocabulary_id = ?`;
      countParams.push(vocabulary_id);
    }
    
    const countResult = await db.get(countQuery, ...countParams);
    
    // Convert timestamps to Beijing time
    const dataWithBeijingTime = convertArrayTimestampsToBeijing(result, ['practiced_at', 'created_at', 'updated_at']);
    
    res.json({
      success: true,
      data: dataWithBeijingTime,
      pagination: {
        total: countResult.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(countResult.count / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

// 获取今日练习进度
export async function getTodayProgress(req, res) {
  try {
    const { user_id = 1 } = req.query;
    
    const result = await db.get(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        COUNT(DISTINCT vocabulary_id) as unique_words
      FROM practice_records
      WHERE user_id = ? AND practice_date = ?
    `, user_id, getBeijingCurrentDateParam());
    
    const accuracy = result.total_attempts > 0
      ? Math.round(100 * result.correct_count / result.total_attempts)
      : 0;

    // Get today's date in Beijing timezone
    const today = getBeijingCurrentDate();
    
    res.json({
      success: true,
      data: {
        ...result,
        accuracy: accuracy,
        date: today
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

export default {
  setDb,
  recordPractice,
  getMistakes,
  getPracticeStats,
  getPracticeHistory,
  getTodayProgress
};
