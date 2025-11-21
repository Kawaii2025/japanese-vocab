/**
 * 数据库迁移脚本
 * 为 vocabulary 表添加唯一约束
 */
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🔄 开始执行数据库迁移...\n');
  
  const client = await pool.connect();
  
  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'add-unique-constraint.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 执行 SQL:\n');
    console.log(sql);
    console.log('\n');
    
    // 执行迁移
    await client.query(sql);
    
    console.log('✅ 迁移成功完成！');
    console.log('📊 已为 vocabulary 表添加唯一约束 (chinese + kana)');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    
    if (error.code === '23505') {
      console.log('\n提示: 约束已存在，无需重复添加');
    } else if (error.code === '42P07') {
      console.log('\n提示: 约束名称已存在');
    } else {
      console.error('\n详细错误:', error);
    }
    
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行迁移
runMigration();
