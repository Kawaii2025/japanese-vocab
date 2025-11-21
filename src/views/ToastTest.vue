<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Toast 通知测试</h1>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">基础用法</h2>
        <div class="flex flex-wrap gap-3">
          <button @click="showSuccess" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            ✓ 成功提示
          </button>
          <button @click="showError" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            ✗ 错误提示
          </button>
          <button @click="showWarning" class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            ⚠ 警告提示
          </button>
          <button @click="showInfo" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            ℹ 信息提示
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">带标题</h2>
        <div class="flex flex-wrap gap-3">
          <button @click="showSuccessWithTitle" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            成功（带标题）
          </button>
          <button @click="showErrorWithTitle" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            错误（带标题）
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">长文本测试</h2>
        <button @click="showLongText" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          显示长文本
        </button>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">多条通知</h2>
        <button @click="showMultiple" class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          连续显示 5 条
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast.js';

const toast = useToast();

function showSuccess() {
  toast.success('操作成功完成！');
}

function showError() {
  toast.error('发生了一个错误');
}

function showWarning() {
  toast.warning('这是一个警告信息');
}

function showInfo() {
  toast.info('这是一条普通信息');
}

function showSuccessWithTitle() {
  toast.success('您的数据已经成功保存到服务器', '保存成功');
}

function showErrorWithTitle() {
  toast.error('网络连接失败，请检查您的网络设置', '连接错误');
}

function showLongText() {
  toast.info('这是一条很长很长的提示信息，用来测试当文本内容超过容器宽度时的显示效果。Toast 组件会自动换行并调整高度以适应内容。', '长文本提示');
}

function showMultiple() {
  toast.success('第 1 条消息');
  setTimeout(() => toast.info('第 2 条消息'), 300);
  setTimeout(() => toast.warning('第 3 条消息'), 600);
  setTimeout(() => toast.error('第 4 条消息'), 900);
  setTimeout(() => toast.success('第 5 条消息', '完成'), 1200);
}
</script>
