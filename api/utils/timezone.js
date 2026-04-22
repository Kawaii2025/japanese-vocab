/**
 * 时区处理工具
 * 
 * 由于数据库时区为 GMT (UTC)，需要转换为北京时间进行日期比较
 */

import { wrapRawSQL } from './neon-wrapper.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Detect which database is being used
let isNeon = false;
export function setDatabaseType(neon) {
  isNeon = neon;
}

/**
 * 获取北京时间的当前日期 (SQL 表达式或值)
 * PostgreSQL: "(NOW() AT TIME ZONE 'Asia/Shanghai')::date"
 * SQLite: "YYYY-MM-DD" string
 */
export function getBeijingCurrentDate() {
  if (isNeon) {
    return "(NOW() AT TIME ZONE 'Asia/Shanghai')::date";
  } else {
    // SQLite: Return current date as YYYY-MM-DD string
    // Shanghai timezone is UTC+8
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return beijingTime.toISOString().split('T')[0];
  }
}



/**
 * 获取北京时间的当前时间戳 (SQL 表达式)
 * @returns {string} SQL 表达式
 */
export function getBeijingNow() {
  if (isNeon) {
    return "NOW() AT TIME ZONE 'Asia/Shanghai'";
  } else {
    // SQLite: Return current ISO timestamp
    return new Date().toISOString();
  }
}

export const BEIJING_NOW = getBeijingNow();

/**
 * Get Beijing date value, properly wrapped for the current database
 * SQLite: Returns plain date string (no wrapping needed)
 * Neon: Returns RawSQL object for SQL expression injection
 */
export function getBeijingCurrentDateParam() {
  const date = getBeijingCurrentDate();
  
  if (isNeon) {
    // For Neon, wrap the SQL expression so it's injected directly
    return wrapRawSQL(date);
  } else {
    // For SQLite, return plain string (it's already a date, not SQL)
    return date;
  }
}

/**
 * 将日期字段转换为北京时区 (SQL 函数)
 * @param {string} dateField - 日期字段名
 * @returns {string} SQL 表达式
 */
export function toBeijingDate(dateField) {
  if (isNeon) {
    return `(${dateField} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai')::date`;
  } else {
    // SQLite doesn't support timezone, just return the field
    return dateField;
  }
}

/**
 * Get current timestamp suitable for the database
 * SQLite: Returns JavaScript milliseconds (integer)
 * Neon: Returns ISO timestamp string
 */
export function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Get Beijing day-start timestamp (Unix ms) for today.
 */
export function getBeijingCurrentDayStartTimestamp() {
  const now = new Date();
  const beijingShifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  beijingShifted.setUTCHours(0, 0, 0, 0);
  return beijingShifted.getTime() - 8 * 60 * 60 * 1000;
}

/**
 * Get Beijing day-start timestamp (Unix ms) for a YYYY-MM-DD date.
 */
export function getBeijingDayStartTimestamp(dateString) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day, -8, 0, 0, 0);
}

/**
 * Get Beijing day-start timestamp (Unix ms) for N days ago.
 */
export function getBeijingDayStartDaysAgo(days) {
  return getBeijingCurrentDayStartTimestamp() - Number(days || 0) * DAY_MS;
}

/**
 * 获取指定天数后的北京日期 (SQL 表达式)
 * @param {number} days - 天数
 * @returns {string} SQL 表达式
 */
export function beijingDateAfter(days) {
  return `(NOW() AT TIME ZONE 'Asia/Shanghai' + INTERVAL '${days} days')::date`;
}

/**
 * 获取指定天数前的北京日期 (SQL 表达式)
 * @param {number} days - 天数
 * @returns {string} SQL 表达式
 */
export function beijingDateBefore(days) {
  return `(NOW() AT TIME ZONE 'Asia/Shanghai' - INTERVAL '${days} days')::date`;
}
