<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark pb-4 md:pb-8">
    <div class="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
      <!-- 页面标题 -->
      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-4xl font-bold mb-2 flex items-center justify-center">
          <i class="fa fa-plus-circle text-primary mr-2 sm:mr-3"></i>
          <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            添加单词
          </span>
        </h1>
        <p class="text-sm sm:text-base text-gray-600">批量导入单词到数据库</p>
        <button 
          @click="$router.push('/')"
          class="mt-4 text-primary hover:text-primary/80 transition-custom text-sm sm:text-base active:scale-95 transition-transform"
        >
          <i class="fa fa-arrow-left mr-2"></i>返回练习页面
        </button>
      </div>
      
      <!-- 输入区域 -->
      <VocabInputComponent 
        ref="vocabInputRef"
        :batchAddVocabulary="batchAddVocabulary"
        :showGenerateButton="false"
      />
      
      
      <!-- 最近添加的单词 -->
      <section v-if="recentWords.length > 0" class="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mt-4 sm:mt-6">
        <h2 class="text-lg sm:text-xl font-semibold mb-4 flex items-center">
          <i class="fa fa-history text-primary mr-2"></i>最近添加（{{ recentWords.length }}个）
        </h2>
        <!-- 移动端卡片视图 -->
        <div class="sm:hidden space-y-3">
          <div 
            v-for="word in recentWords" 
            :key="word.id" 
            class="bg-gray-50 border border-gray-200 rounded-lg p-3 active:bg-gray-100 transition-colors"
          >
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                <p class="font-semibold text-base text-dark">{{ word.original }}</p>
                <p class="text-sm text-gray-600 mb-1">{{ word.chinese }}</p>
                <p class="text-xs text-gray-500">{{ word.kana }}</p>
              </div>
              <button 
                @click="deleteWord(word.id)"
                class="text-red-600 active:text-red-800 p-2 active:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
              >
                <i class="fa fa-trash text-lg"></i>
              </button>
            </div>
            <div class="flex gap-2 text-xs">
              <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {{ word.category || '-' }}
              </span>
              <span class="px-2 py-1 bg-gray-200 text-gray-700 rounded">
                难度: {{ word.difficulty || 1 }}
              </span>
              <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded ml-auto">
                {{ formatTime(word.created_at) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 桌面端表格视图 -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">中文</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">日文</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">假名</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">分类</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">难度</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">添加时间</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="word in recentWords" :key="word.id" class="border-b hover:bg-gray-50">
                <td class="px-4 py-2">{{ word.chinese }}</td>
                <td class="px-4 py-2">{{ word.original }}</td>
                <td class="px-4 py-2">{{ word.kana }}</td>
                <td class="px-4 py-2">
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {{ word.category || '-' }}
                  </span>
                </td>
                <td class="px-4 py-2">{{ word.difficulty || 1 }}</td>
                <td class="px-4 py-2 text-sm text-gray-600">
                  {{ formatTime(word.created_at) }}
                </td>
                <td class="px-4 py-2">
                  <button 
                    @click="deleteWord(word.id)"
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast.js';
import { useConfirm } from '../composables/useConfirm.js';
import VocabInputComponent from '../components/VocabInputComponent.vue';
import * as api from '../services/api.js';
import { formatBeijingTime } from '../utils/dateFormatter.js';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const vocabInputRef = ref(null);
const recentWords = ref([]);

// 格式化时间为相对时间
function formatTime(time) {
  return formatBeijingTime(time, 'relative');
}

// 加载最近添加的单词
async function loadRecentWords() {
  try {
    const response = await api.getTodayVocabulary();
    recentWords.value = response.data;
  } catch (error) {
    console.error('加载最近单词失败:', error);
  }
}

// 批量添加单词
async function batchAddVocabulary(words) {
  const response = await api.batchCreateVocabulary(words);
  
  // 显示添加结果（包括跳过的单词）
  if (response.skipped > 0) {
    const skippedList = response.skippedWords
      .map(w => `${w.chinese}(${w.kana})`)
      .join('、');
    toast.warning(
      `${response.message}\n跳过的单词: ${skippedList}`,
      '部分单词已存在'
    );
  }
  
  // 刷新最近添加的单词列表
  await loadRecentWords();
  return response;
}

// 删除单词
async function deleteWord(id) {
  try {
    await confirm.danger('删除后无法恢复，确定要删除这个单词吗？', '确认删除');
    await api.deleteVocabulary(id);
    recentWords.value = recentWords.value.filter(w => w.id !== id);
    toast.success('删除成功');
  } catch (error) {
    if (error !== false) { // false 表示用户取消
      toast.error('删除失败: ' + error.message);
    }
  }
}

onMounted(() => {
  loadRecentWords();
});
</script>
