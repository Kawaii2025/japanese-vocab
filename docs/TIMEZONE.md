# 时间处理说明（Timestamp 统一方案）

## 概述

当前项目时间策略已统一为：

1. 数据库存储 Unix 毫秒时间戳
2. API 和前端按北京时间展示
3. 同步流程只传递时间戳，不传日期字符串

这套策略同时适用于本地 SQLite 和 Neon PostgreSQL。

## 统一规则

| 层 | 标准 | 示例 |
|---|---|---|
| 数据库存储 | Unix ms (INTEGER/BIGINT) | `1776852664000` |
| API 查询过滤 | 基于时间戳计算日边界 | 北京时间当天 00:00 对应的 ms |
| API/前端展示 | 北京时间格式化 | `2026-04-23 10:30:12` |

## 为什么改成时间戳

- 避免 SQLite 与 Neon 的 DATE/TIMESTAMP 类型差异
- 避免秒/毫秒混用导致 1970 年错误
- 同步逻辑更简单，所有时间字段可直接比较
- 历史迁移可统一处理，不依赖数据库时区配置

## 字段约定

常用时间字段统一为 Unix ms：

- `vocabulary.input_date`
- `vocabulary.next_review_date`
- `vocabulary.created_at`
- `vocabulary.updated_at`
- `users.created_at`
- `practice_records.practice_date`
- `practice_records.practiced_at`

## 北京时间展示

数据库不存北京时间字符串。北京时间只在展示层生成。

后端可使用工具函数进行格式化：

```javascript
import { toBeijingTimeString } from './api/utils/beijing-time.js';

const display = toBeijingTimeString(1776852664000);
// 例如: 2026-04-23 10:31:04
```

前端可直接接收时间戳并转换显示：

```javascript
function formatBeijing(ms) {
  if (ms == null) return '-';
  return new Date(Number(ms)).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}
```

## 日统计与按天查询

"按天"相关查询应基于北京时间边界计算，再转换为时间戳范围。

推荐流程：

1. 计算北京时间某天 00:00 的时间戳
2. 计算次日 00:00 的时间戳
3. 使用 `[startMs, nextStartMs)` 做数据库过滤

这样可以避免时区偏移导致的跨天错误。

## 迁移与验证

### 迁移命令

```bash
npm --prefix api run migrate-timestamp -- --sqlite-only
npm --prefix api run migrate-timestamp -- --neon-only
```

### SQLite 验证

```sql
PRAGMA table_info(vocabulary);
PRAGMA table_info(practice_records);

SELECT typeof(input_date), typeof(next_review_date), typeof(created_at), typeof(updated_at)
FROM vocabulary LIMIT 1;

SELECT typeof(practice_date), typeof(practiced_at)
FROM practice_records
WHERE practice_date IS NOT NULL
LIMIT 1;
```

期望：时间字段列类型为 `INTEGER`，值类型 `typeof(...)` 为 `integer`。

### Neon 验证

检查 `information_schema.columns`，时间字段应为 `bigint`。

## 注意事项

- 不要再写入 ISO 字符串到时间字段
- 不要在业务代码混用秒和毫秒
- 新增时间字段时，默认使用 Unix ms
- 显示层之外不要做时区字符串持久化
