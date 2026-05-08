/**
 * Express 应用主文件 - SQLite Version
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import initDB, { getDatabaseInfo, criticalErrorMiddleware } from './db.js';
import { config, getCorsOptions } from './config.js';

dotenv.config();

// 获取 AI 模型配置
const AI_PROVIDER = process.env.AI_PROVIDER || 'qwen';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-plus';
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || 'doubao-seed-2-0-lite-260428';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const ARK_API_KEY = process.env.ARK_API_KEY;

const currentModel = AI_PROVIDER === 'doubao' ? DOUBAO_MODEL : QWEN_MODEL;
const currentApiKey = AI_PROVIDER === 'doubao' ? ARK_API_KEY : DASHSCOPE_API_KEY;

import vocabularyRoutes from './routes/vocabulary.routes.js';
import practiceRoutes from './routes/practice.routes.js';
import statsRoutes from './routes/stats.routes.js';
import syncRoutes, { setSyncDb } from './routes/sync.routes.js';
import aiRoutes from './routes/ai.routes.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import * as vocabController from './controllers/vocabulary.controller.js';
import * as practiceController from './controllers/practice.controller.js';
import * as statsController from './controllers/stats.controller.js';

const app = express();
let db = null;

async function startServer() {
  try {
    db = await initDB();
    vocabController.setDb(db);
    practiceController.setDb(db);
    statsController.setDb(db);
    setSyncDb(db);
    console.log('✅ 数据库初始化成功');
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message);
    process.exit(1);
  }

  app.use(cors(getCorsOptions()));
  app.use(express.json());
  
  // Check for critical initialization errors
  app.use(criticalErrorMiddleware);
  
  // 设置服务器超时为 120 秒（适配更慢的 AI 模型）
  app.use((req, res, next) => {
    req.setTimeout(120000);
    res.setTimeout(120000);
    next();
  });

  // Root endpoint - health status for preview/monitoring
  app.get('/', (req, res) => {
    const dbInfo = getDatabaseInfo();
    res.json({
      success: true,
      message: 'Japanese Vocab API is running',
      status: 'healthy',
      database: dbInfo.type,
      ai: {
        provider: AI_PROVIDER,
        model: currentModel
      },
      endpoints: {
        health: '/health',
        api_health: '/api/health',
        vocabulary: '/api/vocabulary',
        practice: '/api/practice',
        stats: '/api/stats'
      },
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  });

  app.use('/api/vocabulary', vocabularyRoutes);
  app.use('/api/practice', practiceRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/ai', aiRoutes);

  app.get('/health', (req, res) => {
    const dbInfo = getDatabaseInfo();
    res.json({
      success: true,
      message: 'API 运行正常',
      database: dbInfo.type,
      ai: {
        provider: AI_PROVIDER,
        model: currentModel
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/health', async (req, res) => {
    try {
      const result = await db.get('SELECT datetime("now") as now');
      const dbInfo = getDatabaseInfo();
      res.json({
        success: true,
        message: 'API 和数据库运行正常',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          type: dbInfo.type,
          serverTime: result.now
        },
        ai: {
          provider: AI_PROVIDER,
          model: currentModel
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: '数据库连接失败',
        error: error.message,
        ai: {
          provider: AI_PROVIDER,
          model: currentModel
        }
      });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const result = await db.all(
        'SELECT DISTINCT category FROM vocabulary WHERE category IS NOT NULL ORDER BY category'
      );
      res.json({
        success: true,
        data: result.map(row => row.category)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取分类失败'
      });
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(config.server.port, () => {
    console.log(`\n🚀 服务器启动成功！`);
    console.log(`   本机访问: http://localhost:${config.server.port}\n`);
    
    // 显示 AI 模型配置
    console.log(`🤖 AI 配置：`);
    console.log(`   提供商: ${AI_PROVIDER === 'doubao' ? '豆包' : '千问'}`);
    console.log(`   模型: ${currentModel}`);
    const apiKeyStatus = currentApiKey ? '✅ 已配置' : '⚠️ 未配置';
    console.log(`   API Key: ${apiKeyStatus}\n`);
    
    console.log(`可用的端点：`);
    console.log(`  - GET    /api/vocabulary          获取所有单词`);
    console.log(`  - GET    /api/vocabulary/:id      获取单个单词`);
    console.log(`  - POST   /api/vocabulary          创建单词`);
    console.log(`  - PUT    /api/vocabulary/:id      更新单词`);
    console.log(`  - DELETE /api/vocabulary/:id      删除单词`);
    console.log(`  - POST   /api/practice            记录练习`);
    console.log(`  - GET    /api/stats               获取统计信息`);
    console.log(`  - POST   /api/sync/push-to-neon   推送到Neon`);
    console.log(`  - POST   /api/sync/pull-from-neon 从Neon拉取`);
    console.log(`  - POST   /api/ai/generate-examples      生成例句（非流式）`);
    console.log(`  - POST   /api/ai/generate-examples/stream 生成例句（流式）`);
    console.log(`  - GET    /health                  健康检查\n`);
  });

  process.on('SIGINT', async () => {
    console.log('\n📊 关闭服务器...');
    server.close(async () => {
      if (db) await db.close();
      console.log('✅ 数据库已关闭');
      process.exit(0);
    });
  });
}

startServer().catch(err => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});
