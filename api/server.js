/**
 * Express 应用主文件
 * 只负责应用配置、路由注册和服务器启动
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

// 导入路由
import vocabularyRoutes from './routes/vocabulary.routes.js';
import practiceRoutes from './routes/practice.routes.js';
import statsRoutes from './routes/stats.routes.js';

// 导入中间件
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== 全局中间件 ====================
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*'
}));
app.use(express.json());

// ==================== 路由注册 ====================
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API 运行正常',
    timestamp: new Date().toISOString()
  });
});

// 获取所有分类（独立端点）
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM vocabulary WHERE category IS NOT NULL ORDER BY category'
    );
    
    res.json({
      success: true,
      data: result.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类失败'
    });
  }
});

// ==================== 错误处理 ====================
// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// ==================== 服务器启动 ====================
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📚 API 文档: http://localhost:${PORT}/api`);
  console.log(`\n可用的端点：`);
  console.log(`  - GET  /api/vocabulary          获取所有单词（分页）`);
  console.log(`  - GET  /api/vocabulary/:id      获取单个单词`);
  console.log(`  - POST /api/vocabulary          创建单词`);
  console.log(`  - POST /api/vocabulary/batch    批量创建单词`);
  console.log(`  - PUT  /api/vocabulary/:id      更新单词`);
  console.log(`  - DELETE /api/vocabulary/:id    删除单词`);
  console.log(`  - GET  /api/vocabulary/search/:keyword  搜索单词`);
  console.log(`  - GET  /api/vocabulary/random/:count    随机获取单词`);
  console.log(`  - GET  /api/vocabulary/today/list       今日录入`);
  console.log(`  - GET  /api/vocabulary/review/today     今日待复习`);
  console.log(`  - POST /api/practice            记录练习`);
  console.log(`  - GET  /api/stats/overview      学习概览`);
  console.log(`  - GET  /api/categories          所有分类`);
  console.log(`  - GET  /health                  健康检查\n`);
});

// ==================== 优雅关闭 ====================
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  await pool.end();
  process.exit(0);
});
