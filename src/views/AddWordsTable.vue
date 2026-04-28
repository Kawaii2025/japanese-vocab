<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark pb-8">
    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2 flex items-center">
          <i class="fa fa-plus-circle text-primary mr-3"></i>
          <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            批量添加单词
          </span>
        </h1>
        <p class="text-gray-600">表格形式快速输入和管理单词</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:max-h-[calc(100vh-200px)]">
        <!-- 主输入区域 -->
        <div class="lg:col-span-2 overflow-y-auto">
          <!-- 操作按钮 -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex gap-3 mb-6">
              <button 
                @click="addRow"
                class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fa fa-plus"></i>添加新行
              </button>
              <button 
                @click="addMultipleRows(10)"
                class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fa fa-bars"></i>添加10行
              </button>
              <button 
                @click="clearEmpty"
                class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fa fa-broom"></i>清空空行
              </button>
              <button 
                @click="saveAll"
                :disabled="loading || words.length === 0"
                class="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <i class="fa fa-save"></i>{{ loading ? '保存中...' : '保存' }}
              </button>
            </div>

            <!-- 示例提示 -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div class="flex justify-between items-start">
                <div class="flex-1 text-sm">
                  <p class="text-blue-700 font-semibold mb-2">📝 汉字示例：</p>
                  <div class="space-y-1 text-blue-600 text-xs">
                    <p>• 中文：日本 | 日文：日本 | 假名：にほん</p>
                    <p>• 中文：学生 | 日文：学生 | 假名：がくせい</p>
                    <p>• 中文：先生 | 日文：先生 | 假名：せんせい</p>
                  </div>
                </div>
                <button 
                  @click="loadSampleData"
                  class="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  加载示例
                </button>
              </div>
            </div>
          </div>

          <!-- 表格容器 -->
          <div class="bg-white rounded-lg shadow-lg overflow-hidden relative">
            <!-- 加载覆盖层 -->
            <div v-if="loading" class="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div class="text-center">
                <div class="inline-flex items-center justify-center">
                  <i class="fa fa-spinner fa-spin text-primary text-3xl mr-3"></i>
                  <span class="text-lg font-semibold text-gray-700">保存中...</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-100 border-b-2 border-gray-300">
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-12">#</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-40">かな</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-40">日文</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-40">中文</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-16">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(word, index) in words" 
                    :key="index"
                    class="border-b border-gray-200 hover:bg-blue-50/30 transition-colors"
                  >
                    <td class="px-4 py-3 text-sm text-gray-500 font-medium">{{ index + 1 }}</td>
                    <!-- かな输入 + 朗读按钮 -->
                    <td class="px-4 py-3">
                      <div class="flex gap-2 items-center">
                        <input 
                          v-model="word.kana"
                          type="text"
                          placeholder="输入かな"
                          lang="ja"
                          autocorrect="off"
                          autocapitalize="off"
                          spellcheck="false"
                          class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                        />
                        <button 
                          @click="handleVoiceClick(word.kana, $event)"
                          :disabled="isKanaEmpty(word)"
                          class="flex-shrink-0 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-2 rounded transition-custom font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent/10"
                          title="朗读假名"
                        >
                          <i class="fa fa-volume-up"></i>
                        </button>
                      </div>
                    </td>
                    <!-- 日文原文输入 -->
                    <td class="px-4 py-3">
                      <input 
                        v-model="word.original"
                        type="text"
                        placeholder="输入日文原文"
                        lang="ja"
                        autocorrect="off"
                        autocapitalize="off"
                        spellcheck="false"
                        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                      />
                    </td>
                    <!-- 中文输入 -->
                    <td class="px-4 py-3">
                      <input 
                        v-model="word.chinese"
                        type="text"
                        placeholder="输入中文意思"
                        lang="zh-Hans"
                        autocorrect="off"
                        autocapitalize="off"
                        spellcheck="false"
                        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                      />
                    </td>
                    <!-- 删除按钮 -->
                    <td class="px-4 py-3 text-center">
                      <button 
                        @click="deleteRow(index)"
                        :disabled="isRowCompletelyEmpty(word)"
                        class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-100"
                      >
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 无数据提示 -->
            <div v-if="words.length === 0" class="p-8 text-center text-gray-500">
              <i class="fa fa-inbox text-4xl mb-3 block opacity-30"></i>
              <p class="text-lg">还没有添加任何单词，点击"添加新行"开始输入</p>
            </div>
          </div>
        </div>

        <!-- 右侧信息栏 -->
        <div class="lg:col-span-1">
          <!-- 统计信息 -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <i class="fa fa-chart-bar text-primary mr-2"></i>统计信息
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center pb-3 border-b border-gray-200">
                <span class="text-gray-600">总行数</span>
                <span class="text-2xl font-bold text-primary">{{ words.length }}</span>
              </div>
              <div class="flex justify-between items-center pb-3 border-b border-gray-200">
                <span class="text-gray-600">有效单词</span>
                <span class="text-2xl font-bold text-green-600">{{ validWordCount }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">空行</span>
                <span class="text-2xl font-bold text-yellow-600">{{ words.length - validWordCount }}</span>
              </div>
            </div>
          </div>

          <!-- 最近添加的单词 -->
          <div v-if="recentWords.length > 0" class="bg-white rounded-lg shadow-lg p-6 lg:sticky lg:top-0 lg:max-h-[calc(100vh-200px)]">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <i class="fa fa-history text-primary mr-2"></i>最近添加
            </h3>
            <div class="space-y-3 overflow-y-auto" style="max-height: calc(100vh - 300px)">
              <div 
                v-for="word in recentWords" 
                :key="word.id"
                class="relative bg-gray-50 p-3 rounded border border-gray-200 hover:border-primary/50 transition-colors"
              >
                <button
                  @click="handleVoiceClick(word.kana, $event)"
                  class="absolute right-3 top-3 flex-shrink-0 bg-accent/10 hover:bg-accent/20 text-accent px-2 py-1 rounded transition-custom"
                  title="朗读假名"
                >
                  <i class="fa fa-volume-up"></i>
                </button>
                <p class="font-medium text-sm text-dark truncate">{{ word.original }}</p>
                <p class="text-xs text-gray-600 mt-1">{{ word.chinese }}</p>
                <p class="text-xs text-gray-500 mt-1 pr-10 truncate">{{ word.kana }}</p>
                <p class="text-xs text-gray-400 mt-2">{{ formatTime(word.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as api from '../services/api.js';
import { readJapanese } from '../utils/helpers.js';
import { useToast } from '../composables/useToast.js';
import { useConfirm } from '../composables/useConfirm.js';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const DRAFT_KEY = 'add-words-table-draft-v1';
const DEFAULT_ROW_COUNT = 30;

const createEmptyRows = (count = DEFAULT_ROW_COUNT) =>
  Array.from({ length: count }, () => ({ chinese: '', original: '', kana: '' }));

const words = ref(createEmptyRows());
const recentWords = ref([]);
const loading = ref(false);

// 计算有效单词数
const validWordCount = computed(() => {
  return words.value.filter(w => w.chinese && w.kana).length;
});

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

// 加载最近添加的单词
const loadRecentWords = async () => {
  try {
    const response = await api.getAllVocabulary({ pageSize: 10, sortBy: 'id', sortOrder: 'DESC' });
    recentWords.value = response.data;
  } catch (error) {
    console.error('加载最近单词失败:', error);
  }
};

// 初始化行
const initializeRows = () => {
  words.value = createEmptyRows();
};

const saveDraftToLocal = () => {
  const hasContent = words.value.some(w => w.chinese || w.original || w.kana);
  if (!hasContent) {
    localStorage.removeItem(DRAFT_KEY);
    return;
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(words.value));
};

const restoreDraftFromLocal = () => {
  const rawDraft = localStorage.getItem(DRAFT_KEY);
  if (!rawDraft) return;

  try {
    const parsed = JSON.parse(rawDraft);
    if (!Array.isArray(parsed)) return;

    const sanitized = parsed
      .map(item => ({
        chinese: (item?.chinese || '').toString(),
        original: (item?.original || '').toString(),
        kana: (item?.kana || '').toString()
      }))
      .filter(item => item.chinese || item.original || item.kana);

    if (sanitized.length > 0) {
      words.value = sanitized;
      toast.success('已恢复未保存输入');
    }
  } catch (error) {
    console.error('恢复草稿失败:', error);
    localStorage.removeItem(DRAFT_KEY);
  }
};

const clearDraftCache = () => {
  localStorage.removeItem(DRAFT_KEY);
};

const isKanaEmpty = (word) => {
  return !word?.kana || word.kana.trim() === '';
};

const isRowCompletelyEmpty = (word) => {
  return (!word?.chinese || word.chinese.trim() === '') &&
    (!word?.original || word.original.trim() === '') &&
    (!word?.kana || word.kana.trim() === '');
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

// 添加多行
const addMultipleRows = (count) => {
  for (let i = 0; i < count; i++) {
    words.value.push({
      chinese: '',
      original: '',
      kana: ''
    });
  }
};

// 删除行
const deleteRow = async (index) => {
  try {
    await confirm.danger('删除后无法恢复，确定要删除这一行吗？', '确认删除');
    words.value.splice(index, 1);
  } catch (error) {
    if (error !== false) {
      toast.error('删除失败: ' + (error?.message || error));
    }
  }
};

// 清空空行
const clearEmpty = () => {
  words.value = words.value.filter(w => w.chinese || w.original || w.kana);
  if (words.value.length === 0) {
    initializeRows();
  }
};

// 朗读假名
const handleVoiceClick = (kana, event) => {
  if (!kana) {
    toast.warning('请输入假名');
    return;
  }
  readJapanese(kana);
  event.target.closest('button').classList.add('btn-pulse');
  setTimeout(() => event.target.closest('button').classList.remove('btn-pulse'), 500);
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
      clearDraftCache();
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

// 页面初始化
onMounted(() => {
  restoreDraftFromLocal();
  loadRecentWords();
});

watch(words, () => {
  saveDraftToLocal();
}, { deep: true });
</script>

<style scoped>
/* 表格行悬停效果 */
tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

/* 输入框焦点效果 */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
