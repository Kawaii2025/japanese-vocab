<template>
  <Teleport to="body">
    <Transition name="toast-container">
      <div v-if="toasts.length > 0" class="toast-container">
        <TransitionGroup name="toast" tag="div">
          <div 
            v-for="toast in toasts" 
            :key="toast.id"
            :class="['toast', `toast-${toast.type}`]"
            @click="removeToast(toast.id)"
          >
            <div class="toast-icon">
              <i :class="getIcon(toast.type)"></i>
            </div>
            <div class="toast-content">
              <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
              <div class="toast-message">{{ toast.message }}</div>
            </div>
            <button class="toast-close" @click.stop="removeToast(toast.id)">
              <i class="fa fa-times"></i>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const toasts = ref([]);
let nextId = 1;

function getIcon(type) {
  const icons = {
    success: 'fa fa-check-circle',
    error: 'fa fa-exclamation-circle',
    warning: 'fa fa-exclamation-triangle',
    info: 'fa fa-info-circle'
  };
  return icons[type] || icons.info;
}

function addToast({ type = 'info', message, title = '', duration = 3000 }) {
  const id = nextId++;
  const toast = { id, type, message, title };
  
  toasts.value.push(toast);
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  return id;
}

function removeToast(id) {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
}

function clearAll() {
  toasts.value = [];
}

defineExpose({
  addToast,
  removeToast,
  clearAll,
  // 快捷方法
  success: (message, title) => addToast({ type: 'success', message, title }),
  error: (message, title) => addToast({ type: 'error', message, title, duration: 5000 }),
  warning: (message, title) => addToast({ type: 'warning', message, title, duration: 4000 }),
  info: (message, title) => addToast({ type: 'info', message, title })
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  min-width: 300px;
  max-width: 400px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: #1f2937;
}

.toast-message {
  font-size: 14px;
  color: #4b5563;
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

/* Toast 类型样式 */
.toast-success {
  border-left: 4px solid #10b981;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式 */
@media (max-width: 640px) {
  .toast-container {
    left: 20px;
    right: 20px;
    top: 20px;
  }
  
  .toast {
    min-width: auto;
    max-width: 100%;
  }
}
</style>
