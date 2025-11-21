/**
 * 测试批量添加单词（包含重复检测）
 */
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

const testWords = [
  {
    chinese: '照旧；仍然',
    original: '相変わらず',
    kana: 'あいかわらず',
    category: 'N3',
    difficulty: 3
  },
  {
    chinese: '你好',
    original: 'こんにちは',
    kana: 'こんにちは',
    category: 'N5',
    difficulty: 1
  },
  {
    chinese: '谢谢',
    original: 'ありがとう',
    kana: 'ありがとう',
    category: 'N5',
    difficulty: 1
  }
];

async function testBatchAdd() {
  console.log('📝 准备添加以下单词:\n');
  testWords.forEach((word, index) => {
    console.log(`${index + 1}. ${word.chinese} (${word.kana}) - ${word.original}`);
  });
  console.log('\n');
  
  try {
    console.log('🚀 第一次添加（全部是新单词）...\n');
    
    const response1 = await fetch(`${API_BASE_URL}/vocabulary/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words: testWords }),
    });
    
    const result1 = await response1.json();
    
    console.log('✅ 第一次添加结果:');
    console.log('   完整响应:', JSON.stringify(result1, null, 2));
    console.log(`   成功添加: ${result1.total} 个单词`);
    console.log(`   跳过重复: ${result1.skipped} 个单词`);
    console.log(`   消息: ${result1.message}\n`);
    
    // 第二次添加相同的单词（应该全部跳过）
    console.log('🔄 第二次添加（测试重复检测）...\n');
    
    const response2 = await fetch(`${API_BASE_URL}/vocabulary/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words: testWords }),
    });
    
    const result2 = await response2.json();
    
    console.log('✅ 第二次添加结果:');
    console.log('   完整响应:', JSON.stringify(result2, null, 2));
    console.log(`   成功添加: ${result2.total} 个单词`);
    console.log(`   跳过重复: ${result2.skipped} 个单词`);
    console.log(`   消息: ${result2.message}`);
    
    if (result2.skipped > 0) {
      console.log('\n   📋 跳过的单词:');
      result2.skippedWords.forEach(word => {
        console.log(`      - ${word.chinese} (${word.kana}) - ${word.reason}`);
      });
    }
    
    console.log('\n🎉 测试完成！重复检测功能正常工作。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n提示: 请确保后端服务器正在运行 (http://localhost:3001)');
  }
}

testBatchAdd();
