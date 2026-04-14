/**
 * 测试数据库连接
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function testConnection() {
  console.log('🔍 开始测试数据库连接...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 15000, // 15秒超时
  });
  
  try {
    console.log('📡 尝试连接到数据库...');
    console.log('🌐 连接字符串:', process.env.DATABASE_URL ? '已配置' : '❌ 未配置');
    
    const startTime = Date.now();
    const client = await pool.connect();
    const connectTime = Date.now() - startTime;
    
    console.log(`✅ 连接成功！耗时: ${connectTime}ms\n`);
    
    // 测试查询
    console.log('📊 执行测试查询...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('✅ 查询成功！');
    console.log('⏰ 数据库时间:', result.rows[0].current_time);
    console.log('📦 数据库版本:', result.rows[0].db_version.split(',')[0]);
    
    // 测试表是否存在
    console.log('\n📋 检查表...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`✅ 找到 ${tables.rowCount} 个表:`);
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // 检查单词数量
    console.log('\n📚 统计数据...');
    const vocabCount = await client.query('SELECT COUNT(*) FROM vocabulary');
    console.log(`   单词总数: ${vocabCount.rows[0].count}`);
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 所有测试通过！数据库连接正常。');
    
  } catch (error) {
    console.error('\n❌ 连接失败！\n');
    console.error('错误类型:', error.code || 'UNKNOWN');
    console.error('错误信息:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 解决建议:');
      console.log('1. 检查网络连接');
      console.log('2. 访问 Neon 控制台唤醒数据库: https://console.neon.tech');
      console.log('3. 检查防火墙或代理设置');
      console.log('4. 确认 .env 文件中的 DATABASE_URL 正确');
      console.log('5. 尝试使用 VPN 或更换网络环境');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 解决建议:');
      console.log('1. 检查 DATABASE_URL 是否正确');
      console.log('2. 确认 Neon 项目未被删除');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();
