/**
 * 应用配置文件
 * 集中管理所有配置，便于维护和切换
 */

export const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    host: 'localhost', // 本地开发环境，仅监听 localhost
  },

  // CORS 配置
  cors: {
    // 允许的来源列表
    origins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
        ],
    
    // 是否允许来自任何 192.168.x.x 的请求
    allowPrivateNetwork: false,
    
    // 凭证
    credentials: true,
    
    // 允许的方法
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // 允许的请求头
    allowedHeaders: ['Content-Type', 'Authorization'],
    
    // 暴露的响应头
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  },

  // 数据库配置
  database: {
    // 数据库连接配置从 .env 读取
    // 见 db.js
  },

  // API 配置
  api: {
    // 默认分页大小
    defaultPageSize: 20,
    maxPageSize: 100,
    
    // 数据库唤醒超时
    requestTimeout: 30000,
    retries: 1,
  },
};

/**
 * 获取 CORS 配置函数
 * 支持动态检查来源
 */
export function getCorsOptions() {
  return {
    origin: (origin, callback) => {
      // 允许没有 origin 的请求（如移动应用、Postman 等）
      if (!origin) return callback(null, true);

      const { origins, allowPrivateNetwork } = config.cors;

      // 检查是否在允许列表中
      if (origins.includes(origin)) {
        return callback(null, true);
      }

      // 检查是否允许私网请求
      if (allowPrivateNetwork && origin.includes('192.168')) {
        return callback(null, true);
      }

      // 检查是否为 localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: config.cors.credentials,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    exposedHeaders: config.cors.exposedHeaders,
  };
}

export default config;
