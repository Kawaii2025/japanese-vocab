/**
 * 练习记录相关业务逻辑控制器
 */
import pool from '../db.js';

// 记录练习结果（会自动触发复习计划更新）
export async function recordPractice(req, res) {
  const { user_id = 1, vocabulary_id, user_answer, is_correct, attempt_count = 1 } = req.body;
  
  if (!vocabulary_id || user_answer === undefined || is_correct === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少必要参数：vocabulary_id, user_answer, is_correct'
    });
  }
  
  const result = await pool.query(
    `INSERT INTO practice_records (user_id, vocabulary_id, user_answer, is_correct, attempt_count, practice_date)
     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
     RETURNING *`,
    [user_id, vocabulary_id, user_answer, is_correct, attempt_count]
  );
  
  // 获取更新后的单词信息
  const vocabResult = await pool.query(
    'SELECT id, chinese, kana, mastery_level, next_review_date, review_count FROM vocabulary WHERE id = $1',
    [vocabulary_id]
  );
  
  res.json({
    success: true,
    data: {
      practice: result.rows[0],
      vocabulary: vocabResult.rows[0]
    },
    message: is_correct ? '回答正确！' : '继续加油！'
  });
}
