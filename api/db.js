import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 创建数据库连接池（增加超时和重试配置）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // 连接超时设置
  connectionTimeoutMillis: 10000, // 10秒连接超时
  idleTimeoutMillis: 30000, // 30秒空闲超时
  max: 20, // 最大连接数
  // 查询超时
  query_timeout: 30000, // 30秒查询超时
  // 连接重试
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// 测试连接
pool.on('connect', () => {
  console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err.message);
  // 不要立即退出，让应用继续运行
});

// 优雅关闭
process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('📊 数据库连接池已关闭');
    process.exit(0);
  });
});

export default pool;
