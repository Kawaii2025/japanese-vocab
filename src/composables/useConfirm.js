/**
 * Confirm 组合式函数
 * 在组合式 API 中使用确认对话框
 */
import { inject, getCurrentInstance } from 'vue';

export function useConfirm() {
  // 尝试从 inject 获取
  let confirm = inject('confirm', null);
  
  // 如果 inject 失败，从全局属性获取
  if (!confirm) {
    const instance = getCurrentInstance();
    confirm = instance?.appContext.config.globalProperties.$confirm;
  }
  
  // 如果还是没有，返回空函数（避免报错）
  if (!confirm) {
    console.warn('Confirm not initialized');
    return {
      show: () => Promise.reject('Confirm not initialized'),
      warning: () => Promise.reject('Confirm not initialized'),
      danger: () => Promise.reject('Confirm not initialized'),
      info: () => Promise.reject('Confirm not initialized')
    };
  }
  
  return confirm;
}
