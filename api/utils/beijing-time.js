/**
 * 北京时间 (Asia/Shanghai) 时间戳格式化工具
 * 将 UTC/ISO 时间戳转换为北京时间格式
 */

/**
 * Normalize mixed timestamp formats to milliseconds.
 * Supports:
 * - Unix seconds (SQLite default: strftime('%s','now'))
 * - Unix milliseconds
 * - ISO timestamp string
 */
function normalizeTimestampToMs(value) {
  if (value === null || value === undefined || value === '') return null;

  // Numeric string / number path
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const raw = Number(value);
    if (Number.isNaN(raw)) return null;
    // < 1e12 is very likely unix seconds, convert to milliseconds
    return raw < 1e12 ? raw * 1000 : raw;
  }

  // ISO string path
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * 将 ISO 时间戳转换为北京时间字符串
 * @param {string} isoTimestamp - ISO 格式的时间戳 (e.g., "2026-04-14T07:43:15.73Z")
 * @returns {string} 北京时间字符串 (e.g., "2026-04-14 15:43:15")
 */
export function getBeijingTimeString(isoTimestamp) {
  if (!isoTimestamp) return null;
  
  try {
    const normalizedMs = normalizeTimestampToMs(isoTimestamp);
    if (normalizedMs === null) return null;

    const date = new Date(normalizedMs);
    if (isNaN(date.getTime())) return null;
    
    // 转换为北京时间 (UTC+8)
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    
    // 格式: YYYY-MM-DD HH:mm:ss
    const year = beijingTime.getUTCFullYear();
    const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getUTCDate()).padStart(2, '0');
    const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
    const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return null;
  }
}

/**
 * 将 ISO 时间戳转换为北京时间 ISO 格式 (带时区)
 * @param {string} isoTimestamp - ISO 格式的时间戳
 * @returns {string} 北京时间 ISO 格式 (e.g., "2026-04-14T15:43:15+08:00")
 */
export function getBeijingTimeISO(isoTimestamp) {
  if (!isoTimestamp) return null;
  
  try {
    const normalizedMs = normalizeTimestampToMs(isoTimestamp);
    if (normalizedMs === null) return null;

    const date = new Date(normalizedMs);
    if (isNaN(date.getTime())) return null;
    
    // 转换为北京时间 (UTC+8)
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    
    // 格式: YYYY-MM-DDTHH:mm:ss+08:00
    const year = beijingTime.getUTCFullYear();
    const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getUTCDate()).padStart(2, '0');
    const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
    const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
    const ms = String(beijingTime.getUTCMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+08:00`;
  } catch (e) {
    return null;
  }
}

/**
 * 一个对象中的所有时间戳字段转换为北京时间
 * @param {object} obj - 包含时间戳字段的对象
 * @param {array} timestampFields - 要转换的字段名列表 (默认: created_at, updated_at)
 * @returns {object} 转换后的对象
 */
export function convertTimestampsToBeijing(obj, timestampFields = ['created_at', 'updated_at']) {
  if (!obj) return obj;
  
  const converted = { ...obj };
  for (const field of timestampFields) {
    if (converted[field]) {
      converted[field] = getBeijingTimeISO(converted[field]);
    }
  }
  return converted;
}

/**
 * 转换数组中所有对象的时间戳
 * @param {array} items - 对象数组
 * @param {array} timestampFields - 要转换的字段名列表
 * @returns {array} 转换后的对象数组
 */
export function convertArrayTimestampsToBeijing(items, timestampFields = ['created_at', 'updated_at']) {
  if (!Array.isArray(items)) return items;
  
  return items.map(item => convertTimestampsToBeijing(item, timestampFields));
}
