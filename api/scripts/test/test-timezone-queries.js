import pool from '../../db.js';
import { BEIJING_CURRENT_DATE } from '../../utils/timezone.js';

async function testTimezoneQueries() {
  try {
    console.log('🧪 测试时区查询...\n');
    
    // 1. 测试 BEIJING_CURRENT_DATE 常量
    console.log('1️⃣ BEIJING_CURRENT_DATE 表达式:');
    console.log(BEIJING_CURRENT_DATE);
    
    // 2. 测试查询
    const result = await pool.query(`
      SELECT 
        CURRENT_DATE as utc_date,
        ${BEIJING_CURRENT_DATE} as beijing_date,
        NOW() as utc_now,
        NOW() AT TIME ZONE 'Asia/Shanghai' as beijing_now
    `);
    
    console.log('\n2️⃣ 查询结果:');
    console.log(result.rows[0]);
    
    // 3. 测试今日录入查询
    const todayInput = await pool.query(`
      SELECT COUNT(*) as count 
      FROM vocabulary 
      WHERE (to_timestamp(created_at / 1000) AT TIME ZONE 'Asia/Shanghai')::date = ${BEIJING_CURRENT_DATE}
    `);
    
    console.log('\n3️⃣ 今日录入单词数:', todayInput.rows[0].count);
    
    // 4. 测试今日复习查询
    const todayReview = await pool.query(`
      SELECT COUNT(*) as count 
      FROM vocabulary 
      WHERE next_review_date <= ${BEIJING_CURRENT_DATE}
    `);
    
    console.log('4️⃣ 今日待复习单词数:', todayReview.rows[0].count);
    
    console.log('\n✅ 时区查询测试完成！');
    
    await pool.end();
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

testTimezoneQueries();
