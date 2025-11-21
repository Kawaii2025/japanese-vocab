/**
 * Toast 通知插件
 * 提供全局的 $toast 和 $confirm 方法
 */
import { createApp, h } from 'vue';
import ToastNotification from '../components/ToastNotification.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

let toastInstance = null;
let confirmInstance = null;

export function setupToast() {
  if (toastInstance) return toastInstance;

  // 创建容器
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 创建 Toast 组件实例
  const app = createApp({
    render() {
      return h(ToastNotification, { ref: 'toast' });
    }
  });

  const vm = app.mount(container);
  toastInstance = vm.$refs.toast;

  return toastInstance;
}

export function setupConfirm() {
  if (confirmInstance) return confirmInstance;

  // 创建容器
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 创建 Confirm 组件实例
  const app = createApp({
    render() {
      return h(ConfirmDialog, { ref: 'confirm' });
    }
  });

  const vm = app.mount(container);
  confirmInstance = vm.$refs.confirm;

  return confirmInstance;
}

export function useToast() {
  if (!toastInstance) {
    toastInstance = setupToast();
  }
  return toastInstance;
}

export function useConfirm() {
  if (!confirmInstance) {
    confirmInstance = setupConfirm();
  }
  return confirmInstance;
}

// Vue 插件
export default {
  install(app) {
    const toast = setupToast();
    const confirm = setupConfirm();
    
    // 添加全局属性
    app.config.globalProperties.$toast = toast;
    app.config.globalProperties.$confirm = confirm;
    
    // 提供注入
    app.provide('toast', toast);
    app.provide('confirm', confirm);
  }
};
