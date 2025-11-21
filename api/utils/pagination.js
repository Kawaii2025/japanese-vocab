/**
 * 分页工具函数
 */

/**
 * 解析分页参数
 * @param {Object} query - 请求查询参数
 * @param {number} query.page - 页码（从 1 开始）
 * @param {number} query.pageSize - 每页条数
 * @param {number} query.limit - 每页条数（旧版参数）
 * @param {number} query.offset - 偏移量（旧版参数）
 * @param {number} defaultPageSize - 默认每页条数
 * @returns {Object} 分页参数对象
 */
export function parsePaginationParams(query, defaultPageSize = 20) {
  const { page, pageSize, limit, offset } = query;
  
  let actualLimit, actualOffset, currentPage;
  
  // 优先使用 page/pageSize（推荐），否则使用 limit/offset（兼容旧版）
  if (limit !== undefined || offset !== undefined) {
    // 兼容旧版 API
    actualLimit = limit ? parseInt(limit) : defaultPageSize;
    actualOffset = offset ? parseInt(offset) : 0;
    currentPage = Math.floor(actualOffset / actualLimit) + 1;
  } else {
    // 使用页码分页（默认第1页，每页 defaultPageSize 条）
    currentPage = page ? parseInt(page) : 1;
    const currentPageSize = pageSize ? parseInt(pageSize) : defaultPageSize;
    actualLimit = currentPageSize;
    actualOffset = (currentPage - 1) * currentPageSize;
  }
  
  return {
    limit: actualLimit,
    offset: actualOffset,
    page: currentPage,
    pageSize: actualLimit
  };
}

/**
 * 构建分页响应信息
 * @param {number} totalCount - 总记录数
 * @param {number} currentPage - 当前页码
 * @param {number} pageSize - 每页条数
 * @returns {Object} 分页信息对象
 */
export function buildPaginationInfo(totalCount, currentPage, pageSize) {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return {
    total: totalCount,           // 总记录数
    page: currentPage,            // 当前页码
    pageSize: pageSize,           // 每页条数
    totalPages: totalPages,       // 总页数
    hasNext: currentPage < totalPages,    // 是否有下一页
    hasPrev: currentPage > 1              // 是否有上一页
  };
}

/**
 * 构建分页 SQL 语句
 * @param {number} paramIndex - 当前参数索引
 * @returns {Object} SQL 片段和参数
 */
export function buildPaginationSQL(paramIndex) {
  return {
    sql: `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    paramCount: 2
  };
}
