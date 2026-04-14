/**
 * 调试脚本：检查数据库中的实际字符编码
 * 用法: node debug-kana.js
 */

import pool from '../../db.js';

async function debugKanaCharacters() {
  let client;
  
  try {
    console.log('🔍 开始调试假名字符编码...\n');
    
    client = await pool.connect();
    
    // 获取前10条记录
    const result = await client.query(`
      SELECT id, kana, original, chinese
      FROM vocabulary
      ORDER BY id
      LIMIT 10;
    `);
    
    console.log('📋 前10条记录的字符分析：\n');
    
    result.rows.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`);
      console.log(`   中文: ${record.chinese}`);
      console.log(`   原文: ${record.original}`);
      console.log(`   假名: ${record.kana}`);
      
      // 分析假名的每个字符
      console.log(`   假名字符分析:`);
      for (let i = 0; i < record.kana.length; i++) {
        const char = record.kana[i];
        const code = char.charCodeAt(0);
        const hex = '0x' + code.toString(16).toUpperCase();
        console.log(`     [${i}] "${char}" - 码点: ${code} (${hex})`);
      }
      
      // 测试规范化
      const normalized = record.kana.normalize('NFC');
      const normalizedLower = normalized.toLowerCase().trim();
      
      console.log(`   规范化前: "${record.kana}" (长度: ${record.kana.length})`);
      console.log(`   规范化后: "${normalizedLower}" (长度: ${normalizedLower.length})`);
      
      if (record.kana !== normalizedLower) {
        console.log(`   ⚠️ 规范化前后不同！`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

debugKanaCharacters().catch(console.error);
