/**
 * 脚本：使用 Unicode NFC 规范化清理数据库中所有假名
 * 用法: node normalize-kana.js
 */

import pool from './db.js';

async function normalizeKanaInDatabase() {
  let client;
  
  try {
    console.log('📝 开始使用 NFC 规范化假名...\n');
    
    client = await pool.connect();
    
    // 查询所有记录
    const allResult = await client.query(`
      SELECT id, kana, original
      FROM vocabulary
      WHERE kana IS NOT NULL
      ORDER BY id;
    `);
    
    const records = allResult.rows;
    console.log(`✅ 获取 ${records.length} 条记录\n`);
    
    let changedCount = 0;
    const changedRecords = [];
    
    // 检查需要变化的记录
    for (const record of records) {
      // 使用 JavaScript normalize 来模拟 SQL 端的处理
      const normalizedKana = record.kana.normalize('NFC');
      const normalizedOriginal = record.original?.normalize('NFC') || null;
      
      if (record.kana !== normalizedKana || record.original !== normalizedOriginal) {
        changedCount++;
        changedRecords.push({
          id: record.id,
          kanaChanged: record.kana !== normalizedKana,
          originalChanged: record.original !== normalizedOriginal,
          oldKana: record.kana,
          newKana: normalizedKana,
          oldOriginal: record.original,
          newOriginal: normalizedOriginal
        });
      }
    }
    
    if (changedCount === 0) {
      console.log('✨ 所有记录已经是 NFC 规范化格式，无需更新\n');
      client.release();
      await pool.end();
      return;
    }
    
    console.log(`📊 需要规范化的记录: ${changedCount}\n`);
    console.log('📋 变化的记录列表：\n');
    
    changedRecords.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`);
      if (record.kanaChanged) {
        console.log(`   假名: "${record.oldKana}" → "${record.newKana}"`);
      }
      if (record.originalChanged) {
        console.log(`   原文: "${record.oldOriginal}" → "${record.newOriginal}"`);
      }
      console.log('');
    });
    
    // 注意: PostgreSQL 的 TRIM 和 normalize 不完全相同
    // 这里我们需要逐条更新并在 JavaScript 中进行规范化
    console.log('💾 开始更新数据库...');
    
    let updateCount = 0;
    for (const record of changedRecords) {
      await client.query(
        `UPDATE vocabulary 
         SET kana = $1, original = $2
         WHERE id = $3`,
        [record.newKana, record.newOriginal, record.id]
      );
      updateCount++;
      if (updateCount % 50 === 0) {
        console.log(`  已更新 ${updateCount}/${changedCount} 条记录...`);
      }
    }
    
    console.log(`✅ 成功更新 ${updateCount} 条记录\n`);
    
    // 验证
    console.log('✔️ 验证更新结果...');
    const verifyResult = await client.query(`
      SELECT COUNT(*) as total FROM vocabulary WHERE kana IS NOT NULL;
    `);
    
    console.log(`✨ 验证完成！共 ${verifyResult.rows[0].total} 条记录\n`);
    console.log('✅ 规范化完成！');
    
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

normalizeKanaInDatabase().catch(console.error);
