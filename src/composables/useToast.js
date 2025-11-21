/**
 * Toast 组合式函数
 * 在组合式 API 中使用 Toast
 */
import { inject, getCurrentInstance } from 'vue';

export function useToast() {
  // 尝试从 inject 获取
  let toast = inject('toast', null);
  
  // 如果 inject 失败，从全局属性获取
  if (!toast) {
    const instance = getCurrentInstance();
    toast = instance?.appContext.config.globalProperties.$toast;
  }
  
  // 如果还是没有，返回空函数（避免报错）
  if (!toast) {
    console.warn('Toast not initialized');
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      addToast: () => {},
      removeToast: () => {},
      clearAll: () => {}
    };
  }
  
  return toast;
}
