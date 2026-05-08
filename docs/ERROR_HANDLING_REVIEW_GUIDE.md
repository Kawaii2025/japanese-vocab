# 异常处理流程复盘指南

## 概述

本文档是对日语单词学习项目中异常处理流程的全面复盘和分析。

## 更新记录

### 2026-05-08: Critical Error Middleware Added
- Added critical error tracking and middleware
- Distinguished between critical (core table failure) and non-critical (index failure) errors
- API now returns 500 errors with details when critical errors occur

---

## 1. AI Controller (ai.controller.js) 分析

### 已完善的异常处理

| 函数 | 异常处理 | 策略 |
|------|---------|------|
| `getCachedExamples` | ✅ 有 try-catch | 失败返回 null，不影响主流程 |
| `saveCachedExamples` | ✅ 有 try-catch | 失败只打印警告，不影响返回 |
| `clearCachedExamples` | ✅ 有 try-catch | 失败只打印警告，不影响主流程 |
| `generateExamples` | ✅ 有外层 try-catch | 捕获所有异常，返回 JSON 错误 |
| `generateExamplesStream` | ✅ 有外层 try-catch | 捕获所有异常，通过 SSE 发送错误 |

### 容错策略设计

```
用户请求
    ↓
检查缓存 → [失败] → 降级到调用 AI → [失败] → 返回错误
    ↓ [成功]
使用缓存 → 返回结果
    ↓
保存缓存 → [失败] → 忽略，不影响返回
```

---

## 2. Neon Wrapper (neon-wrapper.js) 分析

### 已完善的异常处理

| 方法 | 异常处理 |
|------|---------|
| `get` | ✅ try-catch + 日志 |
| `all` | ✅ try-catch + 日志 |
| `run` | ✅ try-catch + 日志 |
| `exec` | ✅ try-catch + 日志 |

### 智能查询检测
- 自动检测查询是否已经是 PostgreSQL 格式
- 避免重复转换导致的语法错误

---

## 3. 全局错误处理 (middleware/errorHandler.js)

### 已完善的异常处理

| 功能 | 说明 |
|------|------|
| `asyncHandler` | 包装异步路由，自动捕获异常 |
| `errorHandler` | 处理常见数据库错误（23505, 23503, 22P02） |
| `notFoundHandler` | 404 处理 |

---

## 4. Server (server.js) 分析

### 已完善的异常处理

| 功能 | 说明 |
|------|------|
| `startServer` | 数据库初始化失败会退出进程 |
| `/api/health` | 有 try-catch，数据库失败返回 503 |
| `/api/categories` | 有 try-catch |
| 优雅关闭 | SIGINT 处理 |

---

## 5. 分层容错架构

```
┌─────────────────────────────────────┐
│   用户请求层                        │
│   (前端不会看到数据库错误)          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   控制器层                          │
│   (外层 try-catch 兜底)             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   缓存层                            │
│   (失败降级，不影响主流程)          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   数据库层                          │
│   (每个操作都有 try-catch)          │
└─────────────────────────────────────┘
```

---

## 6. 异常处理流程图解

### 非流式响应

```
用户请求
    ↓
[try] 检查缓存
    ↓ [缓存成功]
返回缓存结果 → 结束
    ↓ [缓存失败]
继续执行
    ↓
调用 AI API
    ↓
解析结果
    ↓
[try] 保存缓存 → [失败] 忽略
    ↓
返回结果 → 结束
    ↓
[catch] 任何错误 → 返回错误响应
```

### 流式响应

```
用户请求
    ↓
[try] 检查缓存
    ↓ [缓存成功]
启动 setInterval 模拟流式输出
    ↓
发送完成 → clearInterval → res.end()
    ↓ [缓存失败]
继续执行
    ↓
调用 AI API (stream)
    ↓
逐块发送
    ↓
解析最终结果
    ↓
[try] 保存缓存 → [失败] 忽略
    ↓
发送完成 → res.end()
    ↓
[catch] 任何错误 → 发送错误消息 → res.end()
```

---

## 7. 总结

### 优点

1. ✅ **分层容错**：每层都有自己的异常处理
2. ✅ **降级策略**：缓存失败不影响主流程
3. ✅ **用户友好**：错误信息清晰，不会暴露技术细节
4. ✅ **日志完整**：所有错误都有日志记录
5. ✅ **资源清理**：流式响应中的 interval 会被清理
6. ✅ **数据库检测**：避免重复转换 PostgreSQL 查询

### 没有遗漏的关键点

1. ✅ 所有异步操作都有 try-catch
2. ✅ 缓存失败有降级方案
3. ✅ 流式响应有完整的错误处理
4. ✅ 全局错误处理兜底
5. ✅ 数据库连接失败有处理

**结论：异常处理流程非常完善，没有发现明显的遗漏！** 🎉

---

## 8. 微小改进建议（非必须）

### AI 路由与其他路由保持一致

**当前状态**：ai.routes.js 直接使用控制器函数

**建议**：可以考虑使用 `asyncHandler` 包装（虽然不是必须的，因为控制器已经有 try-catch）

```javascript
// 可选改进：保持一致性
import { asyncHandler } from '../middleware/errorHandler.js';

router.post('/generate-examples', asyncHandler(generateExamples));
router.post('/generate-examples/stream', asyncHandler(generateExamplesStream));
```

---

## 10. Critical Error Handling (db.js)

### Overview

Added a critical error tracking system to distinguish between:
- **Critical Errors**: Failure to create core tables (would break the app)
- **Non-Critical Errors**: Failure to create indexes (performance impact only)

### Functions

```javascript
// Track critical initialization errors
let criticalError = null;

export function hasCriticalError() {
  return criticalError !== null;
}

export function getCriticalError() {
  return criticalError;
}
```

### Middleware

```javascript
export function criticalErrorMiddleware(req, res, next) {
  if (hasCriticalError()) {
    const error = getCriticalError();
    return res.status(500).json({
      error: 'Service Unavailable',
      message: error.message,
      details: error.error
    });
  }
  next();
}
```

### Error Classification

| Error Type | Behavior | API Response |
|-----------|---------|--------------|
| Core Table Creation Failure | Sets criticalError | 500 Service Unavailable |
| Index Creation Failure | Warns only | Normal operation |
| Connection Failure | Throws at startup | Server doesn't start |

### Usage in server.js

The middleware is added before all routes:

```javascript
import { criticalErrorMiddleware } from './db.js';

// ...

app.use(criticalErrorMiddleware);  // First middleware
app.use('/api/vocabulary', vocabularyRoutes);
```

## 11. 相关文件

- `api/controllers/ai.controller.js` - AI 控制器，包含主要的异常处理逻辑
- `api/utils/neon-wrapper.js` - 数据库包装层，处理查询转换和异常
- `api/middleware/errorHandler.js` - 全局错误处理中间件
- `api/db.js` - 数据库初始化和 critical error 处理
- `api/server.js` - 服务器主文件
- `api/routes/ai.routes.js` - AI 路由文件
