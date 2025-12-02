/**
 * 单词相关业务逻辑控制器
 */
import pool from '../db.js';
import { parsePaginationParams, buildPaginationInfo } from '../utils/pagination.js';
import { BEIJING_CURRENT_DATE } from '../utils/timezone.js';

// 获取所有单词（带分页，最新添加的单词优先显示）
export async function getAllVocabulary(req, res) {
  const { category, difficulty } = req.query;
  
  // 构建 WHERE 条件
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (category) {
    whereClause += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }
  
  if (difficulty) {
    whereClause += ` AND difficulty <= $${paramIndex}`;
    params.push(difficulty);
    paramIndex++;
  }
  
  // 1. 先查询总数
  const countQuery = `SELECT COUNT(*) FROM vocabulary ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const totalCount = parseInt(countResult.rows[0].count);
  
  // 2. 解析分页参数
  const pagination = parsePaginationParams(req.query, 20);
  
  // 3. 计算偏移量
  const offset = (pagination.page - 1) * pagination.pageSize;
  
  // 4. 查询数据（按创建时间降序排列，最新的单词最先显示）
  const dataQuery = `
    SELECT * FROM vocabulary 
    ${whereClause}
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataParams = [...params, pagination.pageSize, offset];
  const dataResult = await pool.query(dataQuery, dataParams);
  
  // 5. 构建分页信息
  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const paginationInfo = buildPaginationInfo(totalCount, pagination.page, pagination.pageSize);
  
  res.json({
    success: true,
    data: dataResult.rows,
    pagination: paginationInfo
  });
}

// 获取单个单词
export async function getVocabularyById(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT * FROM vocabulary WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: '单词不存在'
    });
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}

// 随机获取单词（用于练习）
export async function getRandomVocabulary(req, res) {
  const { count } = req.params;
  const { category, difficulty } = req.query;
  
  let query = 'SELECT * FROM vocabulary WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (category) {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }
  
  if (difficulty) {
    query += ` AND difficulty <= $${paramIndex}`;
    params.push(difficulty);
    paramIndex++;
  }
  
  query += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
  params.push(count);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount
  });
}

// 搜索单词（带分页）
export async function searchVocabulary(req, res) {
  const { keyword } = req.params;
  const searchPattern = `%${keyword}%`;
  
  // 1. 查询总数
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM vocabulary 
     WHERE chinese LIKE $1 OR kana LIKE $1 OR original LIKE $1`,
    [searchPattern]
  );
  const totalCount = parseInt(countResult.rows[0].count);
  
  // 2. 解析分页参数
  const pagination = parsePaginationParams(req.query, 20);
  
  // 3. 查询数据
  const result = await pool.query(
    `SELECT * FROM vocabulary 
     WHERE chinese LIKE $1 OR kana LIKE $1 OR original LIKE $1
     ORDER BY id
     LIMIT $2 OFFSET $3`,
    [searchPattern, pagination.limit, pagination.offset]
  );
  
  // 4. 构建分页信息
  const paginationInfo = buildPaginationInfo(totalCount, pagination.page, pagination.pageSize);
  
  res.json({
    success: true,
    data: result.rows,
    keyword: keyword,
    pagination: paginationInfo
  });
}

// 创建单词
export async function createVocabulary(req, res) {
  const { chinese, original, kana, category, difficulty } = req.body;
  
  if (!chinese || !kana) {
    return res.status(400).json({
      success: false,
      error: '中文意思和假名不能为空'
    });
  }
  
  const result = await pool.query(
    `INSERT INTO vocabulary (chinese, original, kana, category, difficulty)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [chinese, original, kana, category || null, difficulty || 1]
  );
  
  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}

// 批量创建单词
export async function batchCreateVocabulary(req, res) {
  const { words } = req.body;
  
  if (!Array.isArray(words) || words.length === 0) {
    return res.status(400).json({
      success: false,
      error: '单词列表不能为空'
    });
  }
  
  const client = await pool.connect();
  
  try {
    const insertedWords = [];
    const skippedWords = [];
    
    for (const word of words) {
      const { chinese, original, kana, category, difficulty } = word;
      
      if (!chinese || !kana) continue;
      
      try {
        // 使用 INSERT ... ON CONFLICT DO NOTHING 来优雅地处理重复
        const result = await client.query(
          `INSERT INTO vocabulary (chinese, original, kana, category, difficulty)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (chinese, kana) DO NOTHING
           RETURNING *`,
          [chinese, original, kana, category || null, difficulty || 1]
        );
        
        if (result.rows.length > 0) {
          insertedWords.push(result.rows[0]);
        } else {
          // 没有返回行说明发生了冲突（单词已存在）
          skippedWords.push({
            chinese,
            kana,
            reason: '已存在'
          });
        }
      } catch (insertError) {
        // 处理单个插入的错误
        console.error(`插入单词失败: ${chinese} (${kana})`, insertError.message);
        skippedWords.push({
          chinese,
          kana,
          reason: insertError.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: insertedWords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      total: insertedWords.length,
      skipped: skippedWords.length,
      skippedWords: skippedWords,
      message: `成功添加 ${insertedWords.length} 个单词${skippedWords.length > 0 ? `，跳过 ${skippedWords.length} 个重复单词` : ''}`
    });
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// 更新单词
export async function updateVocabulary(req, res) {
  const { id } = req.params;
  const { chinese, original, kana, category, difficulty } = req.body;
  
  const result = await pool.query(
    `UPDATE vocabulary 
     SET chinese = $1, original = $2, kana = $3, category = $4, difficulty = $5
     WHERE id = $6
     RETURNING *`,
    [chinese, original, kana, category, difficulty, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: '单词不存在'
    });
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}

// 删除单词
export async function deleteVocabulary(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM vocabulary WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: '单词不存在'
    });
  }
  
  res.json({
    success: true,
    message: '删除成功'
  });
}

// 获取所有分类
export async function getAllCategories(req, res) {
  const result = await pool.query(
    'SELECT DISTINCT category FROM vocabulary WHERE category IS NOT NULL ORDER BY category'
  );
  
  res.json({
    success: true,
    data: result.rows.map(row => row.category)
  });
}

// ==================== 日期相关功能 ====================

// 获取今日录入的单词
export async function getTodayVocabulary(req, res) {
  const result = await pool.query(
    `SELECT * FROM vocabulary WHERE input_date = ${BEIJING_CURRENT_DATE} ORDER BY created_at DESC LIMIT 1000`
  );
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount
  });
}

// 获取指定日期的单词
export async function getVocabularyByDate(req, res) {
  const { date } = req.params;
  const result = await pool.query(
    'SELECT * FROM vocabulary WHERE input_date = $1 ORDER BY created_at DESC',
    [date]
  );
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount,
    date: date
  });
}

// 获取日期范围内的单词
export async function getVocabularyByDateRange(req, res) {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({
      success: false,
      error: '请提供 start 和 end 参数'
    });
  }
  
  const result = await pool.query(
    'SELECT * FROM vocabulary WHERE input_date BETWEEN $1 AND $2 ORDER BY input_date DESC, created_at DESC',
    [start, end]
  );
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount,
    dateRange: { start, end }
  });
}

// 获取今日待复习的单词
export async function getTodayReview(req, res) {
  const result = await pool.query(
    `SELECT * FROM vocabulary WHERE next_review_date <= ${BEIJING_CURRENT_DATE} ORDER BY next_review_date ASC, mastery_level ASC`
  );
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount
  });
}

// 获取未来N天的复习计划
export async function getReviewPlan(req, res) {
  const { days = 7 } = req.query;
  const result = await pool.query(
    `SELECT 
      next_review_date as date,
      COUNT(*) as word_count,
      json_agg(json_build_object('id', id, 'chinese', chinese, 'kana', kana, 'mastery_level', mastery_level)) as words
    FROM vocabulary 
    WHERE next_review_date BETWEEN ${BEIJING_CURRENT_DATE} AND ${BEIJING_CURRENT_DATE} + $1::integer
    GROUP BY next_review_date
    ORDER BY next_review_date`,
    [days]
  );
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount,
    days: parseInt(days)
  });
}

// 标记单词为不熟悉
export async function markAsUnfamiliar(req, res) {
  const { id } = req.params;
  const { user_id = 1 } = req.body; // 默认用户ID为1
  
  // 检查是否已存在
  const checkResult = await pool.query(
    'SELECT id FROM unfamiliar_words WHERE user_id = $1 AND vocabulary_id = $2',
    [user_id, id]
  );
  
  if (checkResult.rows.length > 0) {
    return res.json({
      success: true,
      message: '该单词已在不熟悉列表中'
    });
  }
  
  // 添加到不熟悉单词表
  await pool.query(
    'INSERT INTO unfamiliar_words (user_id, vocabulary_id) VALUES ($1, $2)',
    [user_id, id]
  );
  
  res.json({
    success: true,
    message: '已标记为不熟悉'
  });
}

// 移除不熟悉标记
export async function removeUnfamiliarMark(req, res) {
  const { id } = req.params;
  const { user_id = 1 } = req.body; // 默认用户ID为1
  
  const result = await pool.query(
    'DELETE FROM unfamiliar_words WHERE user_id = $1 AND vocabulary_id = $2',
    [user_id, id]
  );
  
  res.json({
    success: true,
    message: '已移除不熟悉标记',
    deleted: result.rowCount
  });
}

// 获取不熟悉单词列表
export async function getUnfamiliarWords(req, res) {
  const { user_id = 1 } = req.query;
  
  const result = await pool.query(`
    SELECT 
      v.*,
      uw.marked_at,
      uw.review_count
    FROM unfamiliar_words uw
    JOIN vocabulary v ON uw.vocabulary_id = v.id
    WHERE uw.user_id = $1
    ORDER BY uw.marked_at DESC
  `, [user_id]);
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount
  });
}
