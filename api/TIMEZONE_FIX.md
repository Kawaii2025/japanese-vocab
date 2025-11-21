# 时区问题修复说明

## 问题描述

数据库时区为 **GMT (UTC)**，但用户使用 **北京时间 (UTC+8)**，导致以下问题：

- `CURRENT_DATE` 返回 UTC 的日期，与北京时间相差 8 小时
- 在北京时间 08:00 之前，日期会差 1 天
- 今日录入、今日复习等功能显示不准确

## 解决方案

### 1. 创建时区工具函数 (`api/utils/timezone.js`)

```javascript
// 北京时间的当前日期
export const BEIJING_CURRENT_DATE = "(NOW() AT TIME ZONE 'Asia/Shanghai')::date";
```

### 2. 更新所有查询

**修改前：**
```javascript
WHERE input_date = CURRENT_DATE
WHERE next_review_date <= CURRENT_DATE
VALUES (..., CURRENT_DATE)
```

**修改后：**
```javascript
import { BEIJING_CURRENT_DATE } from '../utils/timezone.js';

WHERE input_date = ${BEIJING_CURRENT_DATE}
WHERE next_review_date <= ${BEIJING_CURRENT_DATE}
VALUES (..., ${BEIJING_CURRENT_DATE})
```

## 修改的文件

### 控制器文件

1. **`api/controllers/vocabulary.controller.js`**
   - `getTodayVocabulary()` - 获取今日录入
   - `getTodayReview()` - 获取今日待复习
   - `getReviewPlan()` - 获取复习计划

2. **`api/controllers/practice.controller.js`**
   - `recordPractice()` - 记录练习（插入 practice_date）

3. **`api/controllers/stats.controller.js`**
   - `getDailyInputStats()` - 每日录入统计
   - `getDailyPracticeStats()` - 每日练习统计
   - `getOverview()` - 学习概览

### 新增文件

- **`api/utils/timezone.js`** - 时区工具函数

## 测试验证

运行测试脚本验证修复：

```bash
cd api
node test-timezone-queries.js
```

**预期结果：**
- `utc_date`: UTC 的日期
- `beijing_date`: 北京时间的日期（应该与本地日期一致）

## 注意事项

### ✅ 已修复
- 所有 `CURRENT_DATE` 查询已改为北京时区
- 日期比较准确性提升
- 今日录入/复习功能正常

### ⚠️ 重要提示
1. **数据库字段存储不变**：仍然存储 DATE 类型（无时区信息）
2. **仅查询时转换**：通过 SQL 表达式在查询时转换为北京时区
3. **向后兼容**：已存储的数据不受影响

### 🔄 其他方案（未采用）

**方案 A：修改数据库时区** ❌
```sql
ALTER DATABASE SET timezone = 'Asia/Shanghai';
```
- ❌ 需要数据库管理员权限
- ❌ Neon 可能不支持

**方案 B：应用层转换** ❌
```javascript
const beijingDate = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
```
- ❌ 每次查询都需要转换
- ❌ 代码复杂度高

**方案 C：SQL 表达式转换** ✅ (已采用)
```javascript
const BEIJING_CURRENT_DATE = "(NOW() AT TIME ZONE 'Asia/Shanghai')::date";
```
- ✅ 一次定义，多处使用
- ✅ 数据库层面处理，性能好
- ✅ 代码简洁

## 更新日志

- **2025-11-22**: 发现时区问题并修复
- 创建 `timezone.js` 工具
- 更新所有控制器的日期查询
- 添加测试验证脚本
