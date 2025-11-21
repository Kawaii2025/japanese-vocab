/**
 * API 服务层
 * 封装所有与后端 API 的交互
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * 通用请求处理（带超时和重试）
 */
async function request(url, options = {}) {
  const timeout = options.timeout || 30000; // 默认30秒超时（应对数据库唤醒）
  const retries = options.retries || 1; // 默认重试1次
  
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      return data;
    } catch (error) {
      // 如果是最后一次重试，抛出错误
      if (i === retries) {
        if (error.name === 'AbortError') {
          console.error('API 请求超时:', url);
          throw new Error('请求超时，数据库可能正在唤醒，请稍后重试');
        }
        console.error('API 请求错误:', error);
        throw error;
      }
      
      // 等待后重试
      console.log(`请求失败，${i + 1}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
    }
  }
}

// ==================== 单词相关 API ====================

/**
 * 获取所有单词（带分页）
 */
export async function getAllVocabulary(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.pageSize) queryParams.append('pageSize', params.pageSize);
  if (params.category) queryParams.append('category', params.category);
  if (params.difficulty) queryParams.append('difficulty', params.difficulty);
  
  const queryString = queryParams.toString();
  return request(`/vocabulary${queryString ? `?${queryString}` : ''}`);
}

/**
 * 获取单个单词
 */
export async function getVocabularyById(id) {
  return request(`/vocabulary/${id}`);
}

/**
 * 随机获取单词
 */
export async function getRandomVocabulary(count, params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.category) queryParams.append('category', params.category);
  if (params.difficulty) queryParams.append('difficulty', params.difficulty);
  
  const queryString = queryParams.toString();
  return request(`/vocabulary/random/${count}${queryString ? `?${queryString}` : ''}`);
}

/**
 * 搜索单词
 */
export async function searchVocabulary(keyword, params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.pageSize) queryParams.append('pageSize', params.pageSize);
  
  const queryString = queryParams.toString();
  return request(`/vocabulary/search/${encodeURIComponent(keyword)}${queryString ? `?${queryString}` : ''}`);
}

/**
 * 创建单词
 */
export async function createVocabulary(word) {
  return request('/vocabulary', {
    method: 'POST',
    body: JSON.stringify(word),
  });
}

/**
 * 批量创建单词
 */
export async function batchCreateVocabulary(words) {
  return request('/vocabulary/batch', {
    method: 'POST',
    body: JSON.stringify({ words }),
  });
}

/**
 * 更新单词
 */
export async function updateVocabulary(id, word) {
  return request(`/vocabulary/${id}`, {
    method: 'PUT',
    body: JSON.stringify(word),
  });
}

/**
 * 删除单词
 */
export async function deleteVocabulary(id) {
  return request(`/vocabulary/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取所有分类
 */
export async function getAllCategories() {
  return request('/categories');
}

// ==================== 日期相关 API ====================

/**
 * 获取今日录入的单词
 */
export async function getTodayVocabulary() {
  return request('/vocabulary/today/list');
}

/**
 * 获取指定日期的单词
 */
export async function getVocabularyByDate(date) {
  return request(`/vocabulary/by-date/${date}`);
}

/**
 * 获取日期范围内的单词
 */
export async function getVocabularyByDateRange(start, end) {
  return request(`/vocabulary/date-range/query?start=${start}&end=${end}`);
}

/**
 * 获取今日待复习的单词
 */
export async function getTodayReview() {
  return request('/vocabulary/review/today');
}

/**
 * 获取未来N天的复习计划
 */
export async function getReviewPlan(days = 7) {
  return request(`/vocabulary/review/plan?days=${days}`);
}

// ==================== 练习相关 API ====================

/**
 * 记录练习结果
 */
export async function recordPractice(practice) {
  return request('/practice', {
    method: 'POST',
    body: JSON.stringify(practice),
  });
}

// ==================== 统计相关 API ====================

/**
 * 获取每日录入统计
 */
export async function getDailyInputStats(days = 30) {
  return request(`/stats/daily-input?days=${days}`);
}

/**
 * 获取每日练习统计
 */
export async function getDailyPracticeStats(userId = 1, days = 30) {
  return request(`/stats/daily-practice?user_id=${userId}&days=${days}`);
}

/**
 * 获取掌握程度分布
 */
export async function getMasteryDistribution() {
  return request('/stats/mastery-distribution');
}

/**
 * 获取学习概览
 */
export async function getOverview(userId = 1) {
  return request(`/stats/overview?user_id=${userId}`);
}

// ==================== 不熟悉单词管理 ====================

/**
 * 获取不熟悉单词列表
 */
export async function getUnfamiliarWords(userId = 1) {
  return request(`/vocabulary/unfamiliar/list?user_id=${userId}`);
}

/**
 * 标记单词为不熟悉
 */
export async function markAsUnfamiliar(vocabularyId, userId = 1) {
  return request(`/vocabulary/${vocabularyId}/unfamiliar`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

/**
 * 移除不熟悉标记
 */
export async function removeUnfamiliarMark(vocabularyId, userId = 1) {
  return request(`/vocabulary/${vocabularyId}/unfamiliar`, {
    method: 'DELETE',
    body: JSON.stringify({ user_id: userId }),
  });
}

/**
 * 获取错题列表
 */
export async function getMistakes(userId = 1, limit = 50) {
  return request(`/practice/mistakes?user_id=${userId}&limit=${limit}`);
}
