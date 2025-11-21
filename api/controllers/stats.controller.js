/**
 * 统计相关业务逻辑控制器
 */
import pool from '../db.js';

// 获取每日录入统计
export async function getDailyInputStats(req, res) {
  const { days = 30 } = req.query;
  const result = await pool.query(
    `SELECT 
      input_date,
      COUNT(*) as word_count,
      COUNT(CASE WHEN mastery_level >= 3 THEN 1 END) as mastered_count
    FROM vocabulary
    WHERE input_date >= CURRENT_DATE - $1::integer
    GROUP BY input_date
    ORDER BY input_date DESC`,
    [days]
  );
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount,
    days: parseInt(days)
  });
}

// 获取每日练习统计
export async function getDailyPracticeStats(req, res) {
  const { user_id = 1, days = 30 } = req.query;
  const result = await pool.query(
    `SELECT 
      practice_date,
      COUNT(*) as practice_count,
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
      ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 2) as accuracy_rate
    FROM practice_records
    WHERE user_id = $1 AND practice_date >= CURRENT_DATE - $2::integer
    GROUP BY practice_date
    ORDER BY practice_date DESC`,
    [user_id, days]
  );
  
  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount,
    days: parseInt(days)
  });
}

// 获取掌握程度分布
export async function getMasteryDistribution(req, res) {
  const result = await pool.query(
    `SELECT 
      mastery_level,
      COUNT(*) as word_count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vocabulary), 2) as percentage
    FROM vocabulary
    GROUP BY mastery_level
    ORDER BY mastery_level`
  );
  
  res.json({
    success: true,
    data: result.rows
  });
}

// 获取学习概览
export async function getOverview(req, res) {
  const { user_id = 1 } = req.query;
  
  // 获取多个统计数据
  const [totalWords, todayInput, todayReview, totalPractice, recentAccuracy] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM vocabulary'),
    pool.query('SELECT COUNT(*) as count FROM vocabulary WHERE input_date = CURRENT_DATE'),
    pool.query('SELECT COUNT(*) as count FROM vocabulary WHERE next_review_date <= CURRENT_DATE'),
    pool.query('SELECT COUNT(*) as count FROM practice_records WHERE user_id = $1', [user_id]),
    pool.query(
      `SELECT ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 2) as rate
       FROM practice_records 
       WHERE user_id = $1 AND practice_date >= CURRENT_DATE - 7`,
      [user_id]
    )
  ]);
  
  res.json({
    success: true,
    data: {
      totalWords: parseInt(totalWords.rows[0].count),
      todayInput: parseInt(todayInput.rows[0].count),
      todayReview: parseInt(todayReview.rows[0].count),
      totalPractice: parseInt(totalPractice.rows[0].count),
      recentAccuracy: parseFloat(recentAccuracy.rows[0].rate) || 0
    }
  });
}
