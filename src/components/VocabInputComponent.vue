<template>
  <section class="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 transform hover:shadow-xl transition-custom">
    <h2 class="text-lg sm:text-xl font-semibold mb-4 flex items-center">
      <i class="fa fa-pencil-square-o text-primary mr-2"></i>输入单词信息
    </h2>
    <div class="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs sm:text-sm">
      <p class="text-gray-600 font-medium mb-1">支持两种输入格式（任选一种）：</p>
      <p class="text-gray-600 mb-1">1. 文本格式：<span class="text-dark">中文意思,日语原文,纯假名</span>（每行一个，日语原文可选）</p>
      <p class="text-gray-600">2. Markdown表格格式（智能识别各列）：</p>
      <pre class="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-1 mb-0 overflow-x-auto">|日文|中文|假名|
| ---- | ---- | ---- |
|相変わらず|照旧；仍然|あいかわらず|
|こんにちは|你好|こんにちは|</pre>
    </div>
    
    <div class="mb-4">
      <textarea 
        v-model="inputValue" 
        class="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-custom resize-none outline-none text-sm sm:text-base touch-manipulation" 
        :style="{ minHeight: isMobile ? '200px' : '208px' }"
        placeholder="请输入单词信息..."
        @keydown.ctrl.enter="handleSubmit"
        @keydown.meta.enter="handleSubmit"
        :disabled="loading"
      ></textarea>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <button 
        @click="handleSubmit"
        :disabled="loading"
        class="flex-1 bg-primary hover:bg-primary/90 active:bg-primary text-white font-medium py-3 sm:py-2 px-4 sm:px-6 rounded-lg transition-custom flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        <i class="fa fa-table mr-2"></i>{{ loading ? '处理中...' : '生成练习表格' }}
      </button>
      
      <button 
        @click="handleSaveToAPI"
        :disabled="loading"
        class="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-600 text-white font-medium py-3 sm:py-2 px-4 sm:px-6 rounded-lg transition-custom flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        <i class="fa fa-save mr-2"></i>{{ loading ? '保存中...' : '保存到数据库' }}
      </button>
    </div>
    
    <!-- 解析信息提示 -->
    <div v-if="parseInfo" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-xs sm:text-sm text-blue-700 flex items-start">
        <i class="fa fa-info-circle mr-2 flex-shrink-0 mt-0.5"></i>
        <span>{{ parseInfo }}</span>
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { parseVocabularyInput } from '../utils/parser.js';
import { useToast } from '../composables/useToast.js';

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

// 检测是否是移动设备
const isMobile = computed(() => {
  return typeof window !== 'undefined' && window.innerWidth < 640;
});

// 使用 Toast
const toast = useToast();

function handleSubmit() {
  emit('submit', inputValue.value);
}

async function handleSaveToAPI() {
  if (!props.batchAddVocabulary) {
    toast.error('批量添加功能未初始化');
    return;
  }
  
  if (!inputValue.value.trim()) {
    toast.warning('请输入单词信息');
    return;
  }
  
  loading.value = true;
  parseInfo.value = '';
  
  try {
    // 解析输入
    const { words, info } = parseVocabularyInput(inputValue.value);
    
    if (words.length === 0) {
      throw new Error('没有解析到有效的单词');
    }
    
    // 保存到数据库
    const response = await props.batchAddVocabulary(words);
    
    toast.success(`成功保存 ${response.total} 个单词到数据库！`, '保存成功');
    parseInfo.value = info;
    
    // 清空输入
    setTimeout(() => {
      inputValue.value = '';
      parseInfo.value = '';
    }, 2000);
  } catch (error) {
    toast.error(error.message || '保存失败，请重试', '保存失败');
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
}

defineExpose({
  setParseInfo,
  clearInput,
  isMobile
});
</script>
