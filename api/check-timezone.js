import pool from './db.js';

async function checkTimezone() {
  try {
    console.log('🔍 检查数据库时区配置...\n');
    
    // 1. 检查时区设置
    const tzResult = await pool.query('SHOW TIMEZONE');
    console.log('数据库时区:', tzResult.rows[0].TimeZone);
    
    // 2. 检查当前时间
    const timeResult = await pool.query(`
      SELECT 
        NOW() as utc_now,
        CURRENT_TIMESTAMP as current_timestamp,
        CURRENT_DATE as current_date,
        CURRENT_TIME as current_time
    `);
    console.log('\n当前数据库时间:');
    console.log(timeResult.rows[0]);
    
    // 3. 比较北京时间
    const beijingResult = await pool.query(`
      SELECT 
        NOW() AT TIME ZONE 'Asia/Shanghai' as beijing_time,
        (NOW() AT TIME ZONE 'Asia/Shanghai')::date as beijing_date
    `);
    console.log('\n北京时间 (UTC+8):');
    console.log(beijingResult.rows[0]);
    
    // 4. 本地时间
    const localNow = new Date();
    console.log('\n本地计算机时间:');
    console.log('当前时间:', localNow.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('日期:', localNow.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    
    await pool.end();
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

checkTimezone();
