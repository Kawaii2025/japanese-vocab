<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleCancel">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <div class="modal-icon" :class="`modal-icon-${type}`">
              <i :class="getIcon()"></i>
            </div>
            <h3 class="modal-title">{{ title }}</h3>
          </div>
          
          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>
          
          <div class="modal-footer">
            <button 
              @click="handleCancel" 
              class="modal-btn modal-btn-cancel"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>
            <button 
              @click="handleConfirm" 
              class="modal-btn modal-btn-confirm"
              :class="`modal-btn-${type}`"
              :disabled="loading"
            >
              <i v-if="loading" class="fa fa-spinner fa-spin mr-1"></i>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const isOpen = ref(false);
const title = ref('');
const message = ref('');
const type = ref('warning'); // 'warning' | 'danger' | 'info'
const confirmText = ref('确定');
const cancelText = ref('取消');
const loading = ref(false);
const resolvePromise = ref(null);
const rejectPromise = ref(null);

function getIcon() {
  const icons = {
    warning: 'fa fa-exclamation-triangle',
    danger: 'fa fa-exclamation-circle',
    info: 'fa fa-info-circle'
  };
  return icons[type.value] || icons.warning;
}

function show(options) {
  return new Promise((resolve, reject) => {
    title.value = options.title || '确认操作';
    message.value = options.message || '确定要执行此操作吗？';
    type.value = options.type || 'warning';
    confirmText.value = options.confirmText || '确定';
    cancelText.value = options.cancelText || '取消';
    loading.value = false;
    
    resolvePromise.value = resolve;
    rejectPromise.value = reject;
    isOpen.value = true;
  });
}

async function handleConfirm() {
  if (resolvePromise.value) {
    loading.value = true;
    try {
      await resolvePromise.value(true);
      isOpen.value = false;
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  }
}

function handleCancel() {
  if (rejectPromise.value) {
    rejectPromise.value(false);
  }
  isOpen.value = false;
}

defineExpose({
  show,
  // 快捷方法
  warning: (message, title) => show({ 
    type: 'warning', 
    message, 
    title: title || '警告' 
  }),
  danger: (message, title) => show({ 
    type: 'danger', 
    message, 
    title: title || '危险操作',
    confirmText: '确认删除' 
  }),
  info: (message, title) => show({ 
    type: 'info', 
    message, 
    title: title || '提示' 
  })
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 100%;
  overflow: hidden;
}

.modal-header {
  padding: 24px 24px 16px;
  text-align: center;
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 24px;
}

.modal-icon-warning {
  background: #fef3c7;
  color: #f59e0b;
}

.modal-icon-danger {
  background: #fee2e2;
  color: #ef4444;
}

.modal-icon-info {
  background: #dbeafe;
  color: #3b82f6;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-body {
  padding: 0 24px 24px;
  text-align: center;
}

.modal-message {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.modal-footer {
  padding: 16px 24px;
  background: #f9fafb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-btn-cancel {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.modal-btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.modal-btn-confirm {
  color: white;
}

.modal-btn-warning {
  background: #f59e0b;
}

.modal-btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.modal-btn-danger {
  background: #ef4444;
}

.modal-btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.modal-btn-info {
  background: #3b82f6;
}

.modal-btn-info:hover:not(:disabled) {
  background: #2563eb;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 640px) {
  .modal-container {
    max-width: calc(100vw - 40px);
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .modal-btn {
    width: 100%;
  }
}
</style>
