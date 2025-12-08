import pool from './db.js';

const client = await pool.connect();

// 查询 "日本" 的记录
const result = await client.query("SELECT * FROM vocabulary WHERE chinese = '日本' LIMIT 1");

console.log('日本 的记录:');
console.log(JSON.stringify(result.rows[0], null, 2));

// 详细的字符分析
if (result.rows[0]) {
  const kana = result.rows[0].kana;
  console.log('\n假名字符码点分析:');
  for (let i = 0; i < kana.length; i++) {
    console.log(`[${i}] "${kana[i]}" - U+${kana.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')}`);
  }
}

client.release();
await pool.end();
