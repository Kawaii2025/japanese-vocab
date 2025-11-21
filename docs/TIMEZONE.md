# 时区处理说明

## 概述

本应用采用**数据库存储 UTC 时间，前端显示北京时间**的标准方案。

## 技术细节

### 数据库层
- **存储格式**: UTC 时间（协调世界时）
- **字段类型**: TIMESTAMP
- **PostgreSQL 默认**: 自动转换为 UTC 存储

### 前端层
- **显示时区**: Asia/Shanghai (UTC+8)
- **自动转换**: JavaScript Date API 自动根据浏览器时区显示
- **工具函数**: `src/utils/dateFormatter.js`

## 使用方法

### 导入工具函数

```javascript
import { formatBeijingTime, isToday, getTodayBeijing } from '../utils/dateFormatter.js';
```

### 格式化选项

```javascript
// 1. 完整格式：2025-11-22 18:30:45
formatBeijingTime(utcTime, 'full')

// 2. 仅日期：2025-11-22
formatBeijingTime(utcTime, 'date')

// 3. 仅时间：18:30:45
formatBeijingTime(utcTime, 'time')

// 4. 日期时间（无秒）：2025-11-22 18:30
formatBeijingTime(utcTime, 'datetime')

// 5. 相对时间：刚刚、5分钟前、3小时前、昨天、3天前
formatBeijingTime(utcTime, 'relative')
```

### 示例：在 Vue 组件中使用

```vue
<template>
  <div>
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
