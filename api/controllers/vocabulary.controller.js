/**
 * 单词相关业务逻辑控制器 - SQLite (Async) Version
 */
import { trackChange } from '../services/sync.service.js';
import { parsePaginationParams, buildPaginationInfo } from '../utils/pagination.js';
import { getBeijingCurrentDayStartTimestamp, getCurrentTimestamp } from '../utils/timezone.js';
import { convertArrayTimestampsToBeijing, convertTimestampsToBeijing } from '../utils/beijing-time.js';
import { RawSQL, wrapRawSQL } from '../utils/neon-wrapper.js';

let db = null;

const BEIJING_DATE_FROM_MS = (field) => `date(${field} / 1000, 'unixepoch', '+8 hours')`;

export function setDb(database) {
  db = database;
}

// 获取所有单词（带分页，最新添加的单词优先显示）
export async function getAllVocabulary(req, res) {
  try {
    const { category, difficulty, sortBy, sortOrder } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (category) {
      whereClause += ` AND category = ?`;
      params.push(category);
    }
    
    if (difficulty) {
      whereClause += ` AND difficulty <= ?`;
      params.push(difficulty);
    }
    
    // 查询总数
    const countQuery = `SELECT COUNT(*) as count FROM vocabulary ${whereClause}`;
    const countResult = await db.get(countQuery, ...params);
    const totalCount = countResult.count;
    
    // 解析分页参数
    const pagination = parsePaginationParams(req.query, 20);
    const offset = (pagination.page - 1) * pagination.pageSize;

    // 排序逻辑
    const allowedSortColumns = ['created_at', 'updated_at', 'id'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : null;
    const sortDir = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const orderClause = sortColumn
      ? `ORDER BY ${sortColumn} ${sortDir}, id ${sortDir}`
      : 'ORDER BY created_at DESC, id DESC';
    
    // 查询数据（按日期降序，同一天内按创建时间升序）
    const dataQuery = `
      SELECT * FROM vocabulary 
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, pagination.pageSize, offset];
    const dataResult = await db.all(dataQuery, ...dataParams);
    
    // Convert timestamps to Beijing time
    const dataWithBeijingTime = convertArrayTimestampsToBeijing(dataResult);
    
    const paginationInfo = buildPaginationInfo(totalCount, pagination.page, pagination.pageSize);
    
    res.json({
      success: true,
      data: dataWithBeijingTime,
      pagination: paginationInfo
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取单个单词
export async function getVocabularyById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.get('SELECT * FROM vocabulary WHERE id = ?', id);
    
    if (!result) {
      return res.status(404).json({ success: false, error: '单词不存在' });
    }
    
    // Convert timestamps to Beijing time
    const resultWithBeijingTime = convertTimestampsToBeijing(result);
    
    res.json({ success: true, data: resultWithBeijingTime });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 随机获取单词（用于练习）
export async function getRandomVocabulary(req, res) {
  try {
    const { count } = req.params;
    const { category, difficulty } = req.query;
    
    let query = 'SELECT * FROM vocabulary WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    
    if (difficulty) {
      query += ` AND difficulty <= ?`;
      params.push(difficulty);
    }
    
    query += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(count);
    
    const result = await db.all(query, ...params);
    
    // Convert timestamps to Beijing time
    const dataWithBeijingTime = convertArrayTimestampsToBeijing(result);
    
    res.json({
      success: true,
      data: dataWithBeijingTime,
      total: dataWithBeijingTime.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 搜索单词（带分页）
export async function searchVocabulary(req, res) {
  try {
    const { keyword } = req.params;
    const searchPattern = `%${keyword}%`;
    
    const countResult = await db.get(
      `SELECT COUNT(*) as count FROM vocabulary 
       WHERE chinese LIKE ? OR kana LIKE ? OR original LIKE ?`,
      searchPattern, searchPattern, searchPattern
    );
    const totalCount = countResult.count;
    
    const pagination = parsePaginationParams(req.query, 20);
    const offset = (pagination.page - 1) * pagination.pageSize;
    
    const result = await db.all(
      `SELECT * FROM vocabulary 
       WHERE chinese LIKE ? OR kana LIKE ? OR original LIKE ?
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      searchPattern, searchPattern, searchPattern, pagination.pageSize, offset
    );
    
    const paginationInfo = buildPaginationInfo(totalCount, pagination.page, pagination.pageSize);
    
    // Convert timestamps to Beijing time
    const dataWithBeijingTime = convertArrayTimestampsToBeijing(result);
    
    res.json({
      success: true,
      data: dataWithBeijingTime,
      keyword: keyword,
      pagination: paginationInfo
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 创建单词
export async function createVocabulary(req, res) {
  try {
    const { chinese, original, kana, category, difficulty } = req.body;
    
    if (!chinese || !kana) {
      return res.status(400).json({
        success: false,
        error: '中文意思和假名不能为空'
      });
    }
    
    const currentTs = getCurrentTimestamp();
    const result = await db.run(
      `INSERT INTO vocabulary (chinese, original, kana, category, difficulty, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      chinese, original || null, kana, category || null, difficulty || 1, currentTs, currentTs
    );
    
    const inserted = await db.get('SELECT * FROM vocabulary WHERE id = ?', result.lastID);
    trackChange('vocabulary', result.lastID, 'INSERT');
    
    // Convert timestamps to Beijing time
    const insertedWithBeijingTime = convertTimestampsToBeijing(inserted);
    
    res.status(201).json({ success: true, data: insertedWithBeijingTime });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 批量创建单词
export async function batchCreateVocabulary(req, res) {
  try {
    const { words } = req.body;
    
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        success: false,
        error: '单词列表不能为空'
      });
    }
    
    const insertedWords = [];
    const skippedWords = [];
    
    for (const word of words) {
      const { chinese, original, kana, category, difficulty } = word;
      
      if (!chinese || !kana) continue;
      
      try {
        // Check if already exists
        const existing = await db.get(
          'SELECT id FROM vocabulary WHERE kana = ?',
          kana
        );
        
        if (existing) {
          skippedWords.push({
            chinese,
            kana,
            reason: '已存在'
          });
          continue;
        }
        
        const currentTs = getCurrentTimestamp();
        const result = await db.run(
          `INSERT INTO vocabulary (chinese, original, kana, category, difficulty, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          chinese, original || null, kana, category || null, difficulty || 1, currentTs, currentTs
        );
        
        const inserted = await db.get('SELECT * FROM vocabulary WHERE id = ?', result.lastID);
        insertedWords.push(inserted);
        trackChange('vocabulary', result.lastID, 'INSERT');
      } catch (err) {
        console.error(`插入单词失败: ${chinese} (${kana})`, err.message);
        skippedWords.push({
          chinese,
          kana,
          reason: err.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: convertArrayTimestampsToBeijing(insertedWords),
      total: insertedWords.length,
      skipped: skippedWords.length,
      skippedWords: skippedWords,
      message: `成功添加 ${insertedWords.length} 个单词${skippedWords.length > 0 ? `，跳过 ${skippedWords.length} 个重复单词` : ''}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 更新单词
export async function updateVocabulary(req, res) {
  try {
    const { id } = req.params;
    
    const existing = await db.get('SELECT * FROM vocabulary WHERE id = ?', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: '单词不存在' });
    }

    // Define updatable and read-only fields
    // created_at and updated_at are always excluded (read-only)
    const updatableFields = [
      'chinese', 'original', 'kana', 'category', 'difficulty',
      'mastery_level', 'review_count', 'next_review_date'
    ];

    // Fields with type constraints
    const fieldConstraints = {
      kana: (val) => {
        if (val === null || val === undefined || val === '') {
          throw new Error('kana 不能为空');
        }
        return val;
      },
      difficulty: (val) => {
        if (val !== null && val !== undefined) {
          const num = parseInt(val);
          if (isNaN(num)) throw new Error('difficulty 必须是整数');
          return num;
        }
        return val;
      },
      mastery_level: (val) => {
        if (val !== null && val !== undefined) {
          const num = parseInt(val);
          if (isNaN(num)) throw new Error('mastery_level 必须是整数');
          return num;
        }
        return val;
      },
      review_count: (val) => {
        if (val !== null && val !== undefined) {
          const num = parseInt(val);
          if (isNaN(num)) throw new Error('review_count 必须是整数');
          return num;
        }
        return val;
      }
    };

    // Build dynamic update query - only update fields that are provided
    const updates = [];
    const values = [];
    
    for (const field of updatableFields) {
      if (req.body.hasOwnProperty(field)) {
        let value = req.body[field];
        
        // Apply field-specific constraints if defined
        if (fieldConstraints[field]) {
          value = fieldConstraints[field](value);
        }
        
        updates.push(`${field} = ?`);
        values.push(value);
      }
    }
    
    // If no fields to update, return the existing record
    if (updates.length === 0) {
      return res.json({ success: true, data: existing, message: '没有字段更新' });
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at = ?');
    const currentTime = getCurrentTimestamp();
    values.push(currentTime);
    values.push(id);
    
    const query = `UPDATE vocabulary SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(query, ...values);
    trackChange('vocabulary', parseInt(id), 'UPDATE');
    
    const result = await db.get('SELECT * FROM vocabulary WHERE id = ?', id);
    res.json({ success: true, data: convertTimestampsToBeijing(result) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 删除单词
export async function deleteVocabulary(req, res) {
  try {
    const { id } = req.params;
    
    const existing = await db.get('SELECT * FROM vocabulary WHERE id = ?', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: '单词不存在' });
    }
    
    await db.run('DELETE FROM vocabulary WHERE id = ?', id);
    trackChange('vocabulary', parseInt(id), 'DELETE');
    
    res.json({ success: true, data: convertTimestampsToBeijing(existing), message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取所有分类
export async function getAllCategories(req, res) {
  try {
    const result = await db.all(
      'SELECT DISTINCT category FROM vocabulary WHERE category IS NOT NULL ORDER BY category'
    );
    
    res.json({
      success: true,
      data: result.map(row => row.category)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取今日录入的单词
export async function getTodayVocabulary(req, res) {
  try {
    const dayStart = getBeijingCurrentDayStartTimestamp();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const result = await db.all(
      `SELECT * FROM vocabulary WHERE created_at >= ? AND created_at < ? ORDER BY created_at ASC LIMIT 1000`,
      dayStart,
      dayEnd
    );
    
    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取指定日期的单词
export async function getVocabularyByDate(req, res) {
  try {
    const { date } = req.params;
    const result = await db.all(
      `SELECT * FROM vocabulary
       WHERE DATE(created_at / 1000, 'unixepoch', '+8 hours') = ?
          OR DATE(created_at) = ?
          OR created_at LIKE ?
       ORDER BY created_at ASC`,
      date,
      date,
      `${date}%`
    );
    
    res.json({
      success: true,
      data: result,
      total: result.length,
      date: date
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取日期范围内的单词
export async function getVocabularyByDateRange(req, res) {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: '请提供 start 和 end 参数'
      });
    }
    
    const result = await db.all(
      `SELECT * FROM vocabulary
       WHERE DATE(created_at / 1000, 'unixepoch', '+8 hours') BETWEEN ? AND ?
          OR DATE(created_at) BETWEEN ? AND ?
          OR substr(created_at, 1, 10) BETWEEN ? AND ?
       ORDER BY created_at DESC, id DESC`,
      start,
      end,
      start,
      end,
      start,
      end
    );
    
    res.json({
      success: true,
      data: result,
      total: result.length,
      dateRange: { start, end }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取今日待复习的单词
export async function getTodayReview(req, res) {
  try {
    const dayStart = getBeijingCurrentDayStartTimestamp();
    const result = await db.all(
      `SELECT * FROM vocabulary WHERE next_review_date IS NOT NULL AND next_review_date <= ? ORDER BY next_review_date ASC, mastery_level ASC`,
      dayStart
    );
    
    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取未来N天的复习计划
export async function getReviewPlan(req, res) {
  try {
    const { days = 7 } = req.query;
    const startDay = getBeijingCurrentDayStartTimestamp();
    const endDay = startDay + Number(days) * 24 * 60 * 60 * 1000;
    
    const result = await db.all(`
      SELECT 
        ${BEIJING_DATE_FROM_MS('next_review_date')} as date,
        COUNT(*) as word_count
      FROM vocabulary 
      WHERE next_review_date IS NOT NULL 
        AND next_review_date >= ?
        AND next_review_date <= ?
      GROUP BY ${BEIJING_DATE_FROM_MS('next_review_date')}
      ORDER BY date
    `, startDay, endDay);
    
    // Get words for each date
    const reviewPlan = [];
    for (const row of result) {
      const words = await db.all(
        `SELECT id, chinese, kana, mastery_level FROM vocabulary 
         WHERE ${BEIJING_DATE_FROM_MS('next_review_date')} = ?`,
        row.date
      );
      reviewPlan.push({ ...row, words });
    }
    
    res.json({
      success: true,
      data: reviewPlan,
      total: reviewPlan.length,
      days: parseInt(days)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 标记单词为不熟悉
export async function markAsUnfamiliar(req, res) {
  try {
    const { id } = req.params;
    const { user_id = 1 } = req.body;
    
    // Check if already marked
    const existing = await db.get(
      'SELECT id FROM unfamiliar_words WHERE user_id = ? AND vocabulary_id = ?',
      user_id, id
    );
    
    if (existing) {
      return res.json({
        success: true,
        message: '该单词已在不熟悉列表中'
      });
    }
    
    // Add to unfamiliar_words
    const result = await db.run(
      'INSERT INTO unfamiliar_words (user_id, vocabulary_id, unfamiliar_type) VALUES (?, ?, ?)',
      user_id, id, 'both'
    );
    
    trackChange('unfamiliar_words', result.lastID, 'INSERT');
    
    res.json({
      success: true,
      message: '已添加到不熟悉单词列表'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 获取不熟悉的单词列表
export async function getUnfamiliarWords(req, res) {
  try {
    const { user_id = 1 } = req.query;
    
    const result = await db.all(`
      SELECT 
        v.*,
        uw.unfamiliar_type,
        uw.marked_at
      FROM unfamiliar_words uw
      JOIN vocabulary v ON uw.vocabulary_id = v.id
      WHERE uw.user_id = ?
      ORDER BY uw.marked_at DESC
    `, user_id);
    
    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 取消标记单词为不熟悉
export async function unmarkAsUnfamiliar(req, res) {
  try {
    const { id } = req.params;
    const { user_id = 1 } = req.body;
    
    await db.run(
      'DELETE FROM unfamiliar_words WHERE user_id = ? AND vocabulary_id = ?',
      user_id, id
    );
    
    trackChange('unfamiliar_words', parseInt(id), 'DELETE');
    
    res.json({
      success: true,
      message: '已从不熟悉单词列表中移除'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export default {
  setDb,
  getAllVocabulary,
  getVocabularyById,
  getRandomVocabulary,
  searchVocabulary,
  createVocabulary,
  batchCreateVocabulary,
  updateVocabulary,
  deleteVocabulary,
  getAllCategories,
  getTodayVocabulary,
  getVocabularyByDate,
  getVocabularyByDateRange,
  getTodayReview,
  getReviewPlan,
  markAsUnfamiliar,
  getUnfamiliarWords,
  unmarkAsUnfamiliar
};
/**
 * 单词相关业务逻辑控制器 - SQLite Version
 */
import sqlite from '../db.js';
