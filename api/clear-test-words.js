/**
 * 清除测试单词
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function clearTestWords() {
  console.log('🗑️  清除测试单词...\n');
  
  const testKanas = ['あいかわらず', 'こんにちは', 'ありがとう'];
  
  try {
    const result = await pool.query(
      'DELETE FROM vocabulary WHERE kana = ANY($1::text[]) RETURNING chinese, kana',
      [testKanas]
    );
    
    console.log(`✅ 已删除 ${result.rowCount} 个单词:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.chinese} (${row.kana})`);
    });
    
  } catch (error) {
    console.error('❌ 删除失败:', error.message);
  } finally {
    await pool.end();
  }
}

clearTestWords();
