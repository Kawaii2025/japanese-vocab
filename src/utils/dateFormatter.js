/**
 * 日期时间格式化工具
 */

/**
 * 将 UTC 时间转换为北京时间（东八区 UTC+8）
 * @param {string|Date} utcTime - UTC 时间字符串或 Date 对象
 * @returns {Date} 北京时间 Date 对象
 */
export function toBeijingTime(utcTime) {
  const date = new Date(utcTime);
  return date;
}

/**
 * 格式化日期时间为北京时间字符串
 * @param {string|Date} utcTime - UTC 时间
 * @param {string} format - 格式类型: 'full'(完整), 'date'(仅日期), 'time'(仅时间), 'relative'(相对时间)
 * @returns {string} 格式化后的时间字符串
 */
export function formatBeijingTime(utcTime, format = 'full') {
  if (!utcTime) return '-';
  
  const date = new Date(utcTime);
  
  // 检查是否为有效日期
  if (isNaN(date.getTime())) return '-';
  
  const options = {
    timeZone: 'Asia/Shanghai',
    hour12: false
  };
  
  switch (format) {
    case 'full':
      // 完整格式：2025-11-22 18:30:45
      return date.toLocaleString('zh-CN', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-');
      
    case 'date':
      // 仅日期：2025-11-22
      return date.toLocaleString('zh-CN', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      
    case 'time':
      // 仅时间：18:30:45
      return date.toLocaleString('zh-CN', {
        ...options,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
    case 'datetime':
      // 日期时间（无秒）：2025-11-22 18:30
      return date.toLocaleString('zh-CN', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\//g, '-');
      
    case 'relative':
      // 相对时间：刚刚、5分钟前、3小时前、昨天、3天前
      return getRelativeTime(date);
      
    default:
      return date.toLocaleString('zh-CN', options);
  }
}

/**
 * 获取相对时间描述
 * @param {Date} date - 日期对象
 * @returns {string} 相对时间字符串
 */
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    // 超过7天显示具体日期
    return formatBeijingTime(date, 'date');
  }
}

/**
 * 判断日期是否为今天
 * @param {string|Date} date - 日期
 * @returns {boolean}
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  
  return d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }) === today.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 获取今天的日期字符串（北京时间）
 * @returns {string} YYYY-MM-DD 格式
 */
export function getTodayBeijing() {
  return formatBeijingTime(new Date(), 'date');
}
