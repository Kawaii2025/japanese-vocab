<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark pb-4">
    <div class="max-w-2xl mx-auto px-3 py-4">
      <!-- 页面标题 -->
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold mb-2 flex items-center justify-center">
          <i class="fa fa-plus-circle text-primary mr-2"></i>
          <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            快速添加
          </span>
        </h1>
        <p class="text-sm text-gray-600">表格形式快速输入</p>
      </div>

      <!-- 输入表格 -->
      <div class="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div class="flex gap-2 mb-4">
          <button 
            @click="addRow"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
          >
            <i class="fa fa-plus"></i>添加行
          </button>
          <button 
            @click="saveAll"
            :disabled="loading || words.length === 0"
            class="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <i class="fa fa-save"></i>{{ loading ? '保存中...' : '保存' }}
          </button>
        </div>

        <!-- 示例提示 -->
        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
          <div class="flex justify-between items-start">
            <div class="flex-1 text-xs">
              <p class="text-blue-700 font-medium mb-2">汉字示例：</p>
              <div class="space-y-1 text-blue-600">
                <p>• 中文：日本 / 日文：日本 / 假名：にほん</p>
                <p>• 中文：学生 / 日文：学生 / 假名：がくせい</p>
                <p>• 中文：先生 / 日文：先生 / 假名：せんせい</p>
              </div>
            </div>
            <button 
              @click="loadSampleData"
              class="ml-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium whitespace-nowrap flex-shrink-0"
            >
              加载示例
            </button>
          </div>
        </div>

        <!-- 表格头 -->
        <div class="grid gap-2 mb-3 pb-3 border-b border-gray-200 text-xs font-semibold text-gray-700" style="grid-template-columns: 1fr 1fr 1fr 40px;">
          <div>中文</div>
          <div>日文</div>
          <div>假名</div>
          <div></div>
        </div>

        <!-- 输入行 -->
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="(word, index) in words" :key="index" class="grid gap-2 items-center" style="grid-template-columns: 1fr 1fr 1fr 40px;">
            <!-- 中文输入 -->
            <input 
              v-model="word.chinese"
              type="text"
              placeholder="中文意思"
              class="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <!-- 日文输入 -->
            <input 
              v-model="word.original"
              type="text"
              placeholder="日文原文"
              class="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <!-- 假名输入 -->
            <input 
              v-model="word.kana"
              type="text"
              placeholder="假名"
              class="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <!-- 删除按钮 -->
            <button 
              @click="deleteRow(index)"
              class="px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm flex items-center justify-center"
            >
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 最近添加的单词 -->
      <div v-if="recentWords.length > 0" class="bg-white rounded-lg shadow-lg p-4">
        <h2 class="text-lg font-semibold mb-3 flex items-center">
          <i class="fa fa-history text-primary mr-2"></i>最近添加（{{ recentWords.length }}）
        </h2>
        <div class="space-y-2 max-h-80 overflow-y-auto">
          <div 
            v-for="word in recentWords" 
            :key="word.id"
            class="bg-gray-50 p-3 rounded border border-gray-200 flex justify-between items-start"
          >
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm text-dark truncate">{{ word.original }}</p>
              <p class="text-xs text-gray-600">{{ word.chinese }}</p>
              <p class="text-xs text-gray-500">{{ word.kana }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatTime(word.created_at) }}</p>
            </div>
            <button 
              @click="deleteWord(word.id)"
              class="ml-2 px-2 py-2 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
            >
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 返回按钮 -->
      <button 
        @click="$router.push('/')"
        class="w-full mt-4 py-2 text-primary hover:text-primary/80 transition-colors text-sm flex items-center justify-center gap-1"
      >
        <i class="fa fa-arrow-left"></i>返回练习页面
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '../composables/useToast';
import * as api from '../services/api';

const toast = useToast();
const loading = ref(false);
const words = ref([]);
const recentWords = ref([]);

// 初始化时创建一行空输入
const initializeRows = () => {
  words.value = Array(5).fill(null).map(() => ({
    chinese: '',
    original: '',
    kana: ''
  }));
};

// 加载示例数据
const loadSampleData = () => {
  words.value = [
    { chinese: '日本', original: '日本', kana: 'にほん' },
    { chinese: '中国', original: '中国', kana: 'ちゅうごく' },
    { chinese: '学生', original: '学生', kana: 'がくせい' },
    { chinese: '先生', original: '先生', kana: 'せんせい' },
    { chinese: '水', original: '水', kana: 'みず' },
    { chinese: '火', original: '火', kana: 'ひ' },
    { chinese: '木', original: '木', kana: 'き' },
    { chinese: '金', original: '金', kana: 'きん' },
    { chinese: '土', original: '土', kana: 'つち' },
    { chinese: '日', original: '日', kana: 'ひ' }
  ];
};

// 添加新行
const addRow = () => {
  words.value.push({
    chinese: '',
    original: '',
    kana: ''
  });
};

// 删除行
const deleteRow = (index) => {
  words.value.splice(index, 1);
};

// 保存所有单词
const saveAll = async () => {
  // 过滤掉空行
  const validWords = words.value.filter(w => w.chinese && w.kana);
  
  if (validWords.length === 0) {
    toast.warning('请至少输入一个单词');
    return;
  }

  loading.value = true;
  try {
    // 检查重复单词
    const allWords = await api.getAllVocabulary({ pageSize: 10000 });
    const existingKanas = new Set(allWords.data.map(w => w.kana));
    
    const duplicates = validWords.filter(w => existingKanas.has(w.kana));
    
    // 直接保存，不弹出确认框
    const response = await api.batchCreateVocabulary(validWords);
    
    if (response.success) {
      // 生成消息显示已存在的单词
      let message = `成功添加 ${validWords.length} 个单词`;
      if (duplicates.length > 0) {
        const dupList = duplicates.map(w => `${w.kana}(${w.chinese})`).join('、');
        message += `\n\n已存在的单词：${dupList}`;
      }
      toast.success(message);
      // 清空输入
      initializeRows();
      // 重新加载最近添加的单词
      await loadRecentWords();
    }
  } catch (error) {
    console.error('保存失败:', error);
    toast.error('保存失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 加载最近添加的单词
const loadRecentWords = async () => {
  try {
    const response = await api.getAllVocabulary({ page: 1, pageSize: 10 });
    recentWords.value = response.data || [];
  } catch (error) {
    console.error('加载最近单词失败:', error);
  }
};

// 删除单词
const deleteWord = async (id) => {
  if (!confirm('确定要删除这个单词吗？')) {
    return;
  }

  try {
    await api.deleteVocabulary(id);
    toast.success('已删除');
    await loadRecentWords();
  } catch (error) {
    console.error('删除失败:', error);
    toast.error('删除失败: ' + error.message);
  }
};

// 格式化时间
const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 初始化
onMounted(() => {
  initializeRows();
  loadRecentWords();
});
</script>

<style scoped>
/* 隐藏滚动条但保持功能 */
.space-y-3 {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.space-y-3::-webkit-scrollbar {
  width: 4px;
}

.space-y-3::-webkit-scrollbar-track {
  background: transparent;
}

.space-y-3::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}
</style>
