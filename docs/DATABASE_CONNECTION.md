# 数据库连接问题解决方案

## 问题描述

Neon 免费版数据库会在不活动后自动休眠，导致首次连接时出现超时错误：
```
Error: connect ETIMEDOUT
```

## 已实施的解决方案

### 1. ✅ 增加数据库连接超时配置

**文件**: `api/db.js`

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,  // 10秒连接超时
  idleTimeoutMillis: 30000,        // 30秒空闲超时
  query_timeout: 30000,            // 30秒查询超时
  keepAlive: true
});
```

### 2. ✅ 前端请求增加超时和重试

**文件**: `src/services/api.js`

- 默认超时: 30秒（足够数据库唤醒）
- 自动重试: 1次
- 友好的错误提示

### 3. ✅ 添加健康检查端点

**端点**: `GET /api/health`

测试 API 和数据库连接状态。

### 4. ✅ 数据库预热脚本

**文件**: `api/warmup-db.js`

在开始使用前唤醒数据库。

## 使用指南

### 方案 A：推荐方式（自动处理）

1. **启动后端服务器**
   ```bash
   cd api
   node server.js
   ```

2. **启动前端**
   ```bash
   npm run dev
   ```

3. **第一次访问可能较慢**
   - 数据库唤醒需要 1-3 秒
   - 前端会自动重试
   - 显示友好的加载提示

### 方案 B：手动预热（推荐）

如果长时间未使用，先预热数据库：

```bash
cd api

# 1. 测试数据库连接
node test-db-connection.js

# 2. 预热数据库（需要先启动 server.js）
node warmup-db.js
```

### 方案 C：保持数据库活跃

**方法 1: 定时 Ping**
使用在线服务每5分钟访问一次 `/api/health`：
- https://uptimerobot.com/
- https://cron-job.org/

**方法 2: 升级到付费版**
- Neon Pro: 数据库不休眠
- 费用: $19/月起

## 测试工具

### 1. 测试数据库连接
```bash
cd api
node test-db-connection.js
```

**输出**:
- ✅ 连接成功/失败
- 耗时统计
- 数据库版本
- 表列表
- 单词总数

### 2. 预热数据库
```bash
cd api
node warmup-db.js
```

### 3. 健康检查（浏览器）
访问: http://localhost:3001/api/health

**正常响应**:
```json
{
  "success": true,
  "message": "API 和数据库运行正常",
  "timestamp": "2025-11-22T02:30:00.000Z",
  "database": {
    "connected": true,
    "serverTime": "2025-11-22T02:30:00.123Z"
  }
}
```

## 故障排查

### 错误 1: ETIMEDOUT

**原因**: 数据库休眠，连接超时

**解决**:
1. 等待 30 秒让前端自动重试
2. 手动运行预热脚本
3. 刷新页面重新加载

### 错误 2: ENOTFOUND

**原因**: DATABASE_URL 配置错误

**解决**:
1. 检查 `.env` 文件
2. 确认 DATABASE_URL 正确
3. 访问 Neon 控制台获取最新连接字符串

### 错误 3: 后端服务器未启动

**解决**:
```bash
cd api
node server.js
```

## 监控和调试

### 查看连接日志

后端启动时会显示:
```
✅ 数据库连接成功
🚀 服务器运行在 http://localhost:3001
```

### 前端 Console 日志

打开浏览器开发者工具（F12）查看:
- 请求是否超时
- 自动重试情况
- 错误详情

## 生产环境建议

### 选项 1: 使用付费数据库
- ✅ Neon Pro: 无休眠
- ✅ Supabase Pro: 更稳定
- ✅ Railway/Heroku Postgres

### 选项 2: 保持活跃
- 定时任务每 5 分钟访问一次
- 使用监控服务（UptimeRobot）

### 选项 3: 本地数据库
开发环境使用本地 PostgreSQL：
```bash
# 安装 PostgreSQL
# 修改 .env.development
DATABASE_URL=postgresql://localhost:5432/japanese_vocab
```

## 总结

| 方案 | 优点 | 缺点 |
|------|------|------|
| 自动重试（已实现）| ✅ 无需干预 | ⚠️ 首次加载慢 |
| 手动预热 | ✅ 启动快 | ⚠️ 需要额外操作 |
| 定时 Ping | ✅ 始终就绪 | ⚠️ 需要第三方服务 |
| 付费数据库 | ✅ 最稳定 | ❌ 需要费用 |

**当前推荐**: 使用已实现的自动重试方案 + 长时间未用时手动预热。
