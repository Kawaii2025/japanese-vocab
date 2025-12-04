import { ref } from 'vue';
import { useToast } from './useToast';
import * as api from '../services/api';

export function useDateFilter() {
  const toast = useToast();
  const selectedDate = ref('');

  /**
   * 获取今天日期（YYYY-MM-DD格式）
   */
  function getTodayDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 按日期查询单词
   * @returns 包含数据和分页信息的响应对象
   */
  async function getVocabularyByDate(date) {
    if (!date) {
      toast.warning('请选择日期');
      return null;
    }

    try {
      const response = await api.getVocabularyByDate(date);
      const dateStr = new Date(date).toLocaleDateString('zh-CN');
      
      if (response.data && response.data.length > 0) {
        toast.success(`找到 ${response.data.length} 个单词（${dateStr}）`);
      } else {
        toast.info(`${dateStr} 没有添加任何单词`);
      }
      
      return response;
    } catch (error) {
      console.error('按日期筛选失败:', error);
      toast.error('筛选失败: ' + error.message);
      return null;
    }
  }

  /**
   * 格式化分页信息
   * @param {Array} data 数据数组
   * @returns 分页对象
   */
  function formatPagination(data) {
    return {
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };
  }

  return {
    selectedDate,
    getTodayDate,
    getVocabularyByDate,
    formatPagination
  };
}
