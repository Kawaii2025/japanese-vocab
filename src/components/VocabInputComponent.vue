<template>
  <section class="bg-white rounded-xl shadow-lg p-6 mb-6 transform hover:shadow-xl transition-custom">
    <h2 class="text-xl font-semibold mb-4 flex items-center">
      <i class="fa fa-pencil-square-o text-primary mr-2"></i>输入单词信息
    </h2>
    <div class="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
      <p class="text-gray-600 text-sm font-medium mb-1">支持两种输入格式（任选一种）：</p>
      <p class="text-gray-600 text-sm mb-1">1. 文本格式：<span class="text-dark">中文意思,日语原文,纯假名</span>（每行一个，日语原文可选）</p>
      <p class="text-gray-600 text-sm">2. Markdown表格格式（智能识别各列）：</p>
      <pre class="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-1 mb-0">|日文|中文|假名|
| ---- | ---- | ---- |
|相変わらず|照旧；仍然|あいかわらず|
|こんにちは|你好|こんにちは|</pre>
    </div>
    
    <div class="mb-4">
      <textarea 
        v-model="inputValue" 
        class="w-full h-52 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-custom resize-none outline-none" 
        placeholder="请输入单词信息..."
        @keydown.ctrl.enter="handleSubmit"
        @keydown.meta.enter="handleSubmit"
        :disabled="loading"
      ></textarea>
    </div>
    
    <div class="flex gap-2">
      <button 
        @click="handleSubmit"
        :disabled="loading"
        class="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg transition-custom flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i class="fa fa-table mr-2"></i>{{ loading ? '处理中...' : '生成练习表格' }}
      </button>
      
      <button 
        @click="handleSaveToAPI"
        :disabled="loading"
        class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-custom flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i class="fa fa-save mr-2"></i>{{ loading ? '保存中...' : '保存到数据库' }}
      </button>
    </div>
    
    <!-- 解析信息提示 -->
    <div v-if="parseInfo" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-sm text-blue-700 flex items-center">
        <i class="fa fa-info-circle mr-2"></i>
        <span>{{ parseInfo }}</span>
      </p>
    </div>
    
    <!-- 成功提示 -->
    <div v-if="successMessage" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-sm text-green-700 flex items-center">
        <i class="fa fa-check-circle mr-2"></i>
        <span>{{ successMessage }}</span>
      </p>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700 flex items-center">
        <i class="fa fa-exclamation-circle mr-2"></i>
        <span>{{ errorMessage }}</span>
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { parseVocabularyInput } from '../utils/parser.js';

const props = defineProps({
  defaultValue: {
    type: String,
    default: `|日文|中文|假名|
| ---- | ---- | ---- |
|相変わらず|照旧；仍然|あいかわらず|
|こんにちは|你好|こんにちは|
|ありがとう|谢谢|ありがとう|
|さようなら|再见|さようなら|
|すみません|对不起|すみません|
|おはよう|早上好|おはよう|
|こんばんは|晚上好|こんばんは|
|はい|是的|はい|
|いいえ|不是|いいえ|
|ください|请|ください|`
  },
  batchAddVocabulary: {
    type: Function,
    required: false
  }
});

const emit = defineEmits(['submit']);

const inputValue = ref(props.defaultValue);
const parseInfo = ref('');
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

function handleSubmit() {
  emit('submit', inputValue.value);
}

async function handleSaveToAPI() {
  if (!props.batchAddVocabulary) {
    errorMessage.value = '批量添加功能未初始化';
    setTimeout(() => errorMessage.value = '', 3000);
    return;
  }
  
  if (!inputValue.value.trim()) {
    errorMessage.value = '请输入单词信息';
    setTimeout(() => errorMessage.value = '', 3000);
    return;
  }
  
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  parseInfo.value = '';
  
  try {
    // 解析输入
    const { words, info } = parseVocabularyInput(inputValue.value);
    
    if (words.length === 0) {
      throw new Error('没有解析到有效的单词');
    }
    
    // 保存到数据库
    const response = await props.batchAddVocabulary(words);
    
    successMessage.value = `成功保存 ${response.total} 个单词到数据库！`;
    parseInfo.value = info;
    
    // 清空输入
    setTimeout(() => {
      inputValue.value = '';
      successMessage.value = '';
      parseInfo.value = '';
    }, 3000);
  } catch (error) {
    errorMessage.value = `保存失败: ${error.message}`;
    setTimeout(() => errorMessage.value = '', 5000);
  } finally {
    loading.value = false;
  }
}

function setParseInfo(info) {
  parseInfo.value = info;
}

function clearInput() {
  inputValue.value = '';
  parseInfo.value = '';
  successMessage.value = '';
  errorMessage.value = '';
}

defineExpose({
  setParseInfo,
  clearInput
});
</script>
