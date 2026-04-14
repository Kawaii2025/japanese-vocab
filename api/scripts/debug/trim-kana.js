/**
 * 清理脚本：更新数据库中所有假名字段，去掉前后空格
 * 用法: node trim-kana.js
 */

import pool from '../../db.js';

async function trimKanaInDatabase() {
  let client;
  
  try {
    console.log('📝 开始清理数据库中的假名字段...\n');
    
    client = await pool.connect();
    
    // 1. 查找有前后空格的假名记录
    console.log('🔍 查找有前后空格的假名记录...');
    const findResult = await client.query(`
      SELECT id, kana, original, chinese
      FROM vocabulary
      WHERE kana IS NOT NULL 
      AND (kana != TRIM(kana) OR original != TRIM(original))
      ORDER BY id;
    `);
    
    const recordsToUpdate = findResult.rows;
    console.log(`✅ 找到 ${recordsToUpdate.length} 条需要清理的记录\n`);
    
    if (recordsToUpdate.length === 0) {
      console.log('✨ 数据库已经很干净，无需更新！');
      client.release();
      await pool.end();
      return;
    }
    
    // 2. 显示要更新的记录
    console.log('📋 将要更新的记录：\n');
    recordsToUpdate.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`);
      console.log(`   原 kana: "${record.kana}" (长度: ${record.kana?.length || 0})`);
      console.log(`   新 kana: "${record.kana?.trim()}" (长度: ${record.kana?.trim().length || 0})`);
      console.log(`   原 original: "${record.original}" (长度: ${record.original?.length || 0})`);
      console.log(`   新 original: "${record.original?.trim()}" (长度: ${record.original?.trim().length || 0})`);
      console.log(`   中文: ${record.chinese}\n`);
    });
    
    // 3. 执行更新
    console.log('💾 执行更新...');
    const updateResult = await client.query(`
      UPDATE vocabulary
      SET 
        kana = TRIM(kana),
        original = TRIM(original)
      WHERE kana IS NOT NULL 
      AND (kana != TRIM(kana) OR original != TRIM(original));
    `);
    
    console.log(`✅ 成功更新 ${updateResult.rowCount} 条记录\n`);
    
    // 4. 验证更新结果
    console.log('✔️ 验证更新结果...');
    const verifyResult = await client.query(`
      SELECT id, kana, original, chinese
      FROM vocabulary
      WHERE kana IS NOT NULL 
      AND (kana != TRIM(kana) OR original != TRIM(original))
      ORDER BY id;
    `);
    
    if (verifyResult.rows.length === 0) {
      console.log('✨ 验证成功！所有记录已清理干净\n');
    } else {
      console.log(`⚠️ 警告：还有 ${verifyResult.rows.length} 条记录未能清理`);
      verifyResult.rows.forEach(record => {
        console.log(`- ID: ${record.id}, kana: "${record.kana}", original: "${record.original}"`);
      });
    }
    
    // 5. 统计信息
    console.log('\n📊 统计信息：');
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN kana IS NULL OR kana = '' THEN 1 END) as empty_kana,
        COUNT(CASE WHEN original IS NULL OR original = '' THEN 1 END) as empty_original
      FROM vocabulary;
    `);
    
    const stats = statsResult.rows[0];
    console.log(`- 总单词数: ${stats.total}`);
    console.log(`- 空假名数: ${stats.empty_kana}`);
    console.log(`- 空原文数: ${stats.empty_original}\n`);
    
    console.log('✅ 脚本执行完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      try {
        client.release();
      } catch (err) {
        console.error('释放数据库连接失败:', err.message);
      }
    }
    await pool.end();
  }
}

// 运行脚本
trimKanaInDatabase().catch(console.error);
