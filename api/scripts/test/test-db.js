// 测试 Neon 数据库连接
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 创建数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔄 正在连接数据库...');
    console.log('📍 连接字符串:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // 隐藏密码
    
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 1. 检查数据库版本
    const versionResult = await client.query('SELECT version()');
    console.log('📦 PostgreSQL 版本:');
    console.log(versionResult.rows[0].version);
    console.log('');
    
    // 2. 检查所有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('📋 数据库表列表:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    console.log('');
    
    // 3. 检查单词数据
    const vocabCountResult = await client.query('SELECT COUNT(*) FROM vocabulary');
    console.log('📚 单词数据统计:');
    console.log(`   总单词数: ${vocabCountResult.rows[0].count}`);
    
    const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count
      FROM vocabulary
      GROUP BY category
      ORDER BY 
        CASE 
          WHEN category = 'N5' THEN 1
          WHEN category = 'N4' THEN 2
          WHEN category = 'N3' THEN 3
          WHEN category = 'N2' THEN 4
          WHEN category = 'N1' THEN 5
          ELSE 6
        END
    `);
    console.log('   按分类统计:');
    categoryResult.rows.forEach(row => {
      console.log(`   - ${row.category}: ${row.count} 个单词`);
    });
    console.log('');
    
    // 4. 检查用户数据
    const userCountResult = await client.query('SELECT COUNT(*) FROM users');
    console.log('👥 用户数据统计:');
    console.log(`   总用户数: ${userCountResult.rows[0].count}`);
    console.log('');
    
    // 5. 检查练习记录
    const practiceCountResult = await client.query('SELECT COUNT(*) FROM practice_records');
    console.log('📝 练习记录统计:');
    console.log(`   总练习次数: ${practiceCountResult.rows[0].count}`);
    
    const accuracyResult = await client.query(`
      SELECT 
        ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 1) as accuracy
      FROM practice_records
    `);
    console.log(`   总体准确率: ${accuracyResult.rows[0].accuracy}%`);
    console.log('');
    
    // 6. 检查单词集合
    const setsCountResult = await client.query('SELECT COUNT(*) FROM vocabulary_sets');
    console.log('📦 单词集合统计:');
    console.log(`   总集合数: ${setsCountResult.rows[0].count}`);
    console.log('');
    
    // 7. 测试随机查询（API 会用到）
    const randomWordResult = await client.query(`
      SELECT chinese, kana, category 
      FROM vocabulary 
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    console.log('🎲 随机单词测试:');
    console.log(`   ${randomWordResult.rows[0].chinese} - ${randomWordResult.rows[0].kana} (${randomWordResult.rows[0].category})`);
    console.log('');
    
    // 8. 测试日期功能
    const todayWordsResult = await client.query(`
      SELECT COUNT(*) 
      FROM vocabulary 
      WHERE input_date = CURRENT_DATE
    `);
    console.log('📅 日期功能测试:');
    console.log(`   今日录入: ${todayWordsResult.rows[0].count} 个单词`);
    
    const reviewWordsResult = await client.query(`
      SELECT COUNT(*) 
      FROM vocabulary 
      WHERE next_review_date <= CURRENT_DATE
    `);
    console.log(`   待复习: ${reviewWordsResult.rows[0].count} 个单词`);
    console.log('');
    
    // 9. 测试触发器功能
    console.log('⚡ 测试复习触发器:');
    
    // 获取一个单词的初始状态
    const wordBeforeResult = await client.query(`
      SELECT id, chinese, mastery_level, next_review_date 
      FROM vocabulary 
      WHERE id = 1
    `);
    const wordBefore = wordBeforeResult.rows[0];
    console.log(`   单词: ${wordBefore.chinese}`);
    console.log(`   练习前 - 掌握程度: ${wordBefore.mastery_level}, 下次复习: ${wordBefore.next_review_date}`);
    
    // 插入一条练习记录（答对）
    await client.query(`
      INSERT INTO practice_records (user_id, vocabulary_id, user_answer, is_correct)
      VALUES (1, 1, 'test', true)
    `);
    
    // 检查单词是否自动更新
    const wordAfterResult = await client.query(`
      SELECT mastery_level, next_review_date, review_count
      FROM vocabulary 
      WHERE id = 1
    `);
    const wordAfter = wordAfterResult.rows[0];
    console.log(`   练习后 - 掌握程度: ${wordAfter.mastery_level}, 下次复习: ${wordAfter.next_review_date}, 复习次数: ${wordAfter.review_count}`);
    
    if (wordAfter.mastery_level > wordBefore.mastery_level) {
      console.log('   ✅ 触发器工作正常！掌握程度自动提升');
    } else {
      console.log('   ⚠️  触发器可能未正常工作');
    }
    console.log('');
    
    // 释放连接
    client.release();
    
    console.log('✅ 所有测试通过！数据库连接正常');
    console.log('🚀 可以启动 API 服务器了: node api/server.js\n');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(error.message);
    console.error('\n请检查:');
    console.error('1. .env 文件中的 DATABASE_URL 是否正确');
    console.error('2. Neon 数据库是否正常运行');
    console.error('3. 是否已运行 schema.sql 和 insert-words.sql\n');
  } finally {
    await pool.end();
  }
}

// 运行测试
testConnection();
