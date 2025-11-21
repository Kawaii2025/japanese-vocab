/**
 * 统一错误处理中间件
 */

/**
 * 异步路由处理器包装器
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(err, req, res, next) {
  console.error('错误详情:', err);
  
  // 数据库错误
  if (err.code) {
    switch (err.code) {
      case '23505': // 唯一约束违反
        return res.status(409).json({
          success: false,
          error: '数据已存在'
        });
      case '23503': // 外键约束违反
        return res.status(400).json({
          success: false,
          error: '相关数据不存在'
        });
      case '22P02': // 无效输入语法
        return res.status(400).json({
          success: false,
          error: '输入数据格式错误'
        });
    }
  }
  
  // 默认服务器错误
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
}

/**
 * 404 错误处理
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: '请求的资源不存在'
  });
}
