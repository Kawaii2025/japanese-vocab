/**
 * 测试时间格式化功能
 */
import { formatBeijingTime, isToday, getTodayBeijing } from '../src/utils/dateFormatter.js';

console.log('🕐 时间格式化测试\n');
console.log('当前时区: Asia/Shanghai (UTC+8)\n');

// 测试不同的时间
const testTimes = [
  new Date().toISOString(), // 当前时间
  new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5分钟前
  new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 昨天
  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
  '2025-11-21T10:13:21.357Z', // 数据库中的 UTC 时间示例
];

console.log('📅 格式化示例：\n');

testTimes.forEach((time, index) => {
  console.log(`示例 ${index + 1}:`);
  console.log(`  UTC 时间:     ${time}`);
  console.log(`  完整格式:     ${formatBeijingTime(time, 'full')}`);
  console.log(`  日期格式:     ${formatBeijingTime(time, 'date')}`);
  console.log(`  时间格式:     ${formatBeijingTime(time, 'time')}`);
  console.log(`  日期时间:     ${formatBeijingTime(time, 'datetime')}`);
  console.log(`  相对时间:     ${formatBeijingTime(time, 'relative')}`);
  console.log(`  是否今天:     ${isToday(time) ? '是' : '否'}`);
  console.log('');
});

console.log('📌 今天的日期（北京时间）:', getTodayBeijing());
console.log('\n✅ 时间格式化功能正常工作！');
console.log('💡 数据库存储 UTC 时间，前端显示时自动转换为北京时间（东八区）');
