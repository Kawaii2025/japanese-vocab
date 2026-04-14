/**
 * 数据库预热脚本
 * 唤醒 Neon 数据库（免费版会自动休眠）
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function warmupDatabase() {
  console.log('🔥 开始预热数据库...\n');
  
  try {
    console.log('📡 发送健康检查请求...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(30000) // 30秒超时
    });
    
    const endTime = Date.now();
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ 数据库已唤醒！耗时: ${endTime - startTime}ms`);
      console.log(`⏰ 服务器时间: ${data.database.serverTime}`);
      console.log('\n💡 提示: 数据库已经准备好，现在可以正常使用了');
    } else {
      console.error('❌ 预热失败:', data.message);
    }
    
  } catch (error) {
    console.error('❌ 预热失败:', error.message);
    console.log('\n💡 可能原因:');
    console.log('1. 后端服务器未启动 (运行 node server.js)');
    console.log('2. 网络连接问题');
    console.log('3. 数据库连接超时');
  }
}

warmupDatabase();
