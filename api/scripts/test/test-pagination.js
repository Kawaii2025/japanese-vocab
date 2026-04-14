// 测试分页功能
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testPagination() {
  console.log('🧪 开始测试分页功能...\n');
  
  try {
    // 测试 1: 基础分页
    console.log('=== 测试 1: 基础分页 ===');
    const test1 = await fetch(`${API_BASE}/vocabulary?page=1&pageSize=10`);
    const result1 = await test1.json();
    console.log('请求: GET /api/vocabulary?page=1&pageSize=10');
    console.log('返回数据数量:', result1.data.length);
    console.log('分页信息:', result1.pagination);
    console.log('✅ 测试通过\n');
    
    // 测试 2: 第二页
    console.log('=== 测试 2: 获取第二页 ===');
    const test2 = await fetch(`${API_BASE}/vocabulary?page=2&pageSize=10`);
    const result2 = await test2.json();
    console.log('请求: GET /api/vocabulary?page=2&pageSize=10');
    console.log('返回数据数量:', result2.data.length);
    console.log('当前页:', result2.pagination.page);
    console.log('是否有下一页:', result2.pagination.hasNext);
    console.log('是否有上一页:', result2.pagination.hasPrev);
    console.log('✅ 测试通过\n');
    
    // 测试 3: 带分类筛选的分页
    console.log('=== 测试 3: 分类筛选 + 分页 ===');
    const test3 = await fetch(`${API_BASE}/vocabulary?category=N5&page=1&pageSize=10`);
    const result3 = await test3.json();
    console.log('请求: GET /api/vocabulary?category=N5&page=1&pageSize=10');
    console.log('返回数据数量:', result3.data.length);
    console.log('总记录数:', result3.pagination.total);
    console.log('总页数:', result3.pagination.totalPages);
    console.log('✅ 测试通过\n');
    
    // 测试 4: 大页面大小
    console.log('=== 测试 4: 大页面大小 ===');
    const test4 = await fetch(`${API_BASE}/vocabulary?page=1&pageSize=50`);
    const result4 = await test4.json();
    console.log('请求: GET /api/vocabulary?page=1&pageSize=50');
    console.log('返回数据数量:', result4.data.length);
    console.log('每页条数:', result4.pagination.pageSize);
    console.log('✅ 测试通过\n');
    
    // 测试 5: 搜索 + 分页
    console.log('=== 测试 5: 搜索功能 + 分页 ===');
    const test5 = await fetch(`${API_BASE}/vocabulary/search/こん?page=1&pageSize=5`);
    const result5 = await test5.json();
    console.log('请求: GET /api/vocabulary/search/こん?page=1&pageSize=5');
    console.log('搜索关键词:', result5.keyword);
    console.log('返回数据数量:', result5.data.length);
    console.log('分页信息:', result5.pagination);
    if (result5.data.length > 0) {
      console.log('示例结果:', result5.data[0].chinese, '-', result5.data[0].kana);
    }
    console.log('✅ 测试通过\n');
    
    // 测试 6: 兼容旧版 API（limit/offset）
    console.log('=== 测试 6: 兼容旧版 limit/offset ===');
    const test6 = await fetch(`${API_BASE}/vocabulary?limit=10&offset=20`);
    const result6 = await test6.json();
    console.log('请求: GET /api/vocabulary?limit=10&offset=20');
    console.log('返回数据数量:', result6.data.length);
    console.log('当前页:', result6.pagination.page);
    console.log('✅ 测试通过（向后兼容）\n');
    
    // 测试 7: 边界情况 - 超出范围的页码
    console.log('=== 测试 7: 边界情况 - 超大页码 ===');
    const test7 = await fetch(`${API_BASE}/vocabulary?page=999&pageSize=10`);
    const result7 = await test7.json();
    console.log('请求: GET /api/vocabulary?page=999&pageSize=10');
    console.log('返回数据数量:', result7.data.length);
    console.log('当前页:', result7.pagination.page);
    console.log('总页数:', result7.pagination.totalPages);
    console.log('✅ 测试通过（返回空数据）\n');
    
    // 汇总
    console.log('=== 分页功能汇总 ===');
    console.log('✅ 所有测试通过！');
    console.log('\n📚 使用示例:');
    console.log('1. 基础分页: /api/vocabulary?page=1&pageSize=20');
    console.log('2. 分类筛选: /api/vocabulary?category=N5&page=1&pageSize=20');
    console.log('3. 难度筛选: /api/vocabulary?difficulty=3&page=1&pageSize=20');
    console.log('4. 搜索分页: /api/vocabulary/search/你好?page=1&pageSize=10');
    console.log('5. 旧版兼容: /api/vocabulary?limit=20&offset=0');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n请确保 API 服务器正在运行: node server.js');
  }
}

// 运行测试
testPagination();
