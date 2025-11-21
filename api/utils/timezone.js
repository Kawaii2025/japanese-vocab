/**
 * 时区处理工具
 * 
 * 由于数据库时区为 GMT (UTC)，需要转换为北京时间进行日期比较
 */

/**
 * 获取北京时间的当前日期 (SQL 表达式)
 * @returns {string} SQL 表达式
 */
export const BEIJING_CURRENT_DATE = "(NOW() AT TIME ZONE 'Asia/Shanghai')::date";

/**
 * 获取北京时间的当前时间戳 (SQL 表达式)
 * @returns {string} SQL 表达式
 */
export const BEIJING_NOW = "NOW() AT TIME ZONE 'Asia/Shanghai'";

/**
 * 将日期字段转换为北京时区 (SQL 函数)
 * @param {string} dateField - 日期字段名
 * @returns {string} SQL 表达式
 */
export function toBeijingDate(dateField) {
  return `(${dateField} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai')::date`;
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
