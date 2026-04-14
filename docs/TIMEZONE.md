# 时区处理说明

## 概述

本应用采用**数据库存储 UTC 时间、API 返回北京时间、同步保持 UTC** 的三层时区方案。

```
Database (Neon)
    ↓
    存储 UTC 时间 (2026-04-14T07:43:15Z)
    ↓
API Controllers
    ↓
    转换为北京时间 (2026-04-14T15:43:15+08:00)
    ↓
Frontend Client
    ↓
    显示北京时间给用户
```

## 架构设计

### 三层时区处理

| 层 | 时间格式 | 用途 | 文件 |
|---|---------|------|------|
| **数据库** | UTC/ISO (2026-04-14T07:43:15Z) | 标准存储格式 | Neon PostgreSQL |
| **API** | 北京时间 ISO (2026-04-14T15:43:15+08:00) | 用户看到的时间 | `api/utils/beijing-time.js` |
| **同步** | UTC 原始值 | 数据库同步（无影响） | `api/sync-neon.js` |

### 为什么这样设计？

✅ **数据库 UTC**: 国际标准，方便管理，与其他服务兼容  
✅ **API 北京时间**: 用户友好，无需前端转换  
✅ **同步不受影响**: 直接读写数据库，不经过 API 层

## 技术细节

### 后端 API 转换

所有 API 响应自动转换为北京时间。使用 `beijing-time.js` 工具函数：

```javascript
// api/utils/beijing-time.js
import { getBeijingTimeISO, convertArrayTimestampsToBeijing } from '../utils/beijing-time.js';

// 单个对象转换
const vocabWithBeijingTime = convertTimestampsToBeijing(vocabRecord);

// 数组转换
const dataWithBeijingTime = convertArrayTimestampsToBeijing(vocabArray);
```

**API 返回示例：**

```json
{
  "id": 661,
  "chinese": "达慎",
  "kana": "つつしむ",
  "created_at": "2026-04-14T15:43:15.000+08:00",
  "updated_at": "2026-04-14T15:43:15.000+08:00"
}
```

### 前端时间显示

与新 API 时间格式兼容的 Vue 组件示例：

```vue
<template>
  <div>
    <!-- 直接显示 API 返回的北京时间 -->
    <p>添加时间: {{ formatTime(word.created_at) }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const formatTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
};</script>
```

### 过期的时间相关信息

不需要前端手动计算北京时间了，因为 API 已经返回北京时间格式！
    <!-- 显示相对时间 -->
    <span>{{ formatTime(word.created_at) }}</span>
    
    <!-- 显示完整时间 -->
    <span>{{ formatFullTime(word.created_at) }}</span>
  </div>
</template>

<script setup>
import { formatBeijingTime } from '../utils/dateFormatter.js';

function formatTime(time) {
  return formatBeijingTime(time, 'relative');
}

function formatFullTime(time) {
  return formatBeijingTime(time, 'datetime');
}
</script>
```

## 时间转换示例

### 数据库存储的 UTC 时间
```
2025-11-21T10:13:21.357Z
```

### 前端显示（北京时间 UTC+8）
```
完整格式:   2025-11-21 18:13:21
日期格式:   2025-11-21
时间格式:   18:13:21
日期时间:   2025-11-21 18:13
相对时间:   8小时前
```

## 为什么这样设计？

### ✅ 优点

1. **标准化存储**
   - 数据库统一使用 UTC，避免时区混乱
   - 便于跨时区应用扩展

2. **自动适配**
   - 前端自动根据用户浏览器时区显示
   - 如果用户在其他时区，自动显示当地时间

3. **避免夏令时问题**
   - UTC 不受夏令时影响
   - 时间计算更准确

4. **国际化友好**
   - 如果将来支持其他地区，无需修改数据库
   - 只需在前端调整显示时区

### ❌ 不推荐的方案

**方案一：数据库直接存储北京时间**
- ❌ 如果用户在其他时区，显示会出错
- ❌ 无法支持国际化
- ❌ 夏令时调整时可能出现问题

**方案二：修改数据库时区为 Asia/Shanghai**
- ❌ 违反数据库最佳实践
- ❌ 影响其他可能使用该数据库的应用
- ❌ 数据迁移时容易出错

## 已更新的文件

### 新增文件
- ✅ `src/utils/dateFormatter.js` - 时间格式化工具函数

### 已更新文件
- ✅ `src/views/AddWords.vue` - 最近添加列表显示相对时间

### 待更新（如需要）
- 📝 `src/views/Practice.vue` - 练习记录时间
- 📝 `src/components/StatsComponent.vue` - 统计图表时间轴
- 📝 其他需要显示时间的组件

## 测试

运行测试脚本查看时间转换效果：

```bash
cd api
node test-time-format.js
```

## 总结

**无需修改数据库配置**，前端使用 `dateFormatter.js` 工具函数即可正确显示北京时间。这是业界标准做法。
