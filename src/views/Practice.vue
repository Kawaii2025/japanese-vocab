<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- 页面标题 -->
      <HeaderComponent />
      
      <!-- 功能区域 -->
      <section class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div class="flex gap-2">
            <button 
              @click="$router.push('/add')"
              class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-custom flex items-center shadow-md hover:shadow-lg"
            >
              <i class="fa fa-plus mr-2"></i>添加单词
            </button>
            
            <button 
              @click="loadRandomPractice"
              :disabled="loading"
              class="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-custom flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <i class="fa fa-random mr-2"></i>{{ loading ? '加载中...' : '随机练习' }}
            </button>
            
            <button 
              @click="loadTodayReview"
              :disabled="loading"
              class="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-custom flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <i class="fa fa-clock-o mr-2"></i>今日复习
            </button>
          </div>
          
          <!-- 分页控件 -->
          <div v-if="pagination.total > 0" class="flex items-center gap-2">
            <button 
              @click="loadPage(pagination.page - 1)"
              :disabled="!pagination.hasPrev || loading"
              class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fa fa-chevron-left"></i>
            </button>
            
            <span class="text-sm text-gray-600">
              第 {{ pagination.page }} / {{ pagination.totalPages }} 页
              （共 {{ pagination.total }} 个单词）
            </span>
            
            <button 
              @click="loadPage(pagination.page + 1)"
              :disabled="!pagination.hasNext || loading"
              class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fa fa-chevron-right"></i>
            </button>
            
            <select 
              v-model="pageSize" 
              @change="changePageSize"
              class="ml-2 px-2 py-1 border rounded text-sm"
            >
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
              <option :value="100">100条/页</option>
            </select>
          </div>
        </div>
      </section>
      
      <!-- 表格区域 -->
      <VocabTableComponent 
        v-if="vocabularyList.length > 0"
        ref="vocabTableRef"
        :vocabularyList="vocabularyList"
        :practiceResults="practiceResults"
        :rowVisibility="rowVisibility"
        :kanaHidden="kanaHidden"
        :originalHidden="originalHidden"
        :hasOriginalText="hasOriginalText"
        :activeMistakes="activeMistakes"
        @shuffle="handleShuffle"
        @toggleKana="handleToggleKana"
        @toggleOriginal="handleToggleOriginal"
        @exportUnfinished="handleExportUnfinished"
        @exportCombined="handleExportCombined"
        @clear="handleClearAll"
        @checkAnswer="handleCheckAnswer"
        @enableEditing="handleEnableEditing"
        @toggleRowOriginal="handleToggleRowOriginal"
        @toggleRowKana="handleToggleRowKana"
        @updateInput="handleUpdateInput"
      />
      
      <!-- 加载提示 -->
      <div v-else-if="loading" class="text-center py-12">
        <i class="fa fa-spinner fa-spin text-4xl text-primary mb-4"></i>
        <p class="text-gray-600">加载中...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="bg-white rounded-xl shadow-lg p-12 text-center">
        <i class="fa fa-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 mb-4">还没有单词，开始添加吧！</p>
        <button 
          @click="$router.push('/add')"
          class="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg transition-custom"
        >
          <i class="fa fa-plus mr-2"></i>添加单词
        </button>
      </div>
      
      <!-- 不熟悉单词总结区域 -->
      <UnfamiliarWordsComponent 
        v-if="vocabularyList.length > 0"
        :unfamiliarWords="unfamiliarWords"
        @review="handleReviewUnfamiliar"
        @clear="handleClearUnfamiliar"
        @sync="syncUnfamiliarToAPI"
      />
      
      <!-- 错题表格 -->
      <MistakesTableComponent 
        v-if="vocabularyList.length > 0"
        :mistakesList="mistakesList"
        :canGoToLastInput="lastInputIndex !== -1"
        @goToLastInput="handleGoToLastInput"
        @copy="handleCopyMistakes"
        @clear="handleClearMistakes"
        @loadFromAPI="loadMistakesFromAPI"
      />
      
      <!-- 统计信息 -->
      <StatsComponent 
        v-if="vocabularyList.length > 0"
        :stats="stats"
        :accuracy="accuracy"
        :unfamiliarCount="unfamiliarWords.length"
      />
      
      <!-- 页脚 -->
      <footer class="mt-10 text-center text-gray-500 text-sm">
        <p>日语单词记忆练习工具 | 支持智能表格解析</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import HeaderComponent from '../components/HeaderComponent.vue';
import VocabTableComponent from '../components/VocabTableComponent.vue';
import UnfamiliarWordsComponent from '../components/UnfamiliarWordsComponent.vue';
import MistakesTableComponent from '../components/MistakesTableComponent.vue';
import StatsComponent from '../components/StatsComponent.vue';
import { useVocabulary } from '../composables/useVocabulary';
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';
import { getDiff } from '../utils/helpers';
import * as api from '../services/api.js';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// 使用组合式函数
const {
  vocabularyList,
  userInputs,
  lastInputIndex,
  mistakesList,
  unfamiliarWords,
  practiceResults,
  kanaHidden,
  originalHidden,
  rowVisibility,
  stats,
  loading,
  error,
  hasOriginalText,
  activeMistakes,
  accuracy,
  initVocabulary,
  saveUserInput,
  checkAnswer,
  addToMistakes,
  recordUnfamiliarWord,
  removeUnfamiliarWord,
  enableEditing,
  shuffleWords,
  toggleKanaVisibility,
  toggleOriginalVisibility,
  clearAll,
  clearMistakes,
  clearUnfamiliarWords,
  loadVocabularyFromAPI,
  loadRandomWords,
  loadTodayReview: loadTodayReviewAPI
} = useVocabulary();

// 组件引用
const vocabTableRef = ref(null);

// 分页状态
const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
});

const pageSize = ref(20);

// 加载指定页
async function loadPage(page) {
  try {
    const response = await loadVocabularyFromAPI({ 
      page, 
      pageSize: pageSize.value 
    });
    pagination.value = response.pagination;
    toast.success(`已加载第 ${page} 页`);
  } catch (err) {
    toast.error('加载失败: ' + err.message);
  }
}

// 改变每页条数
async function changePageSize() {
  pagination.value.page = 1;
  await loadPage(1);
}

// 加载随机练习
async function loadRandomPractice() {
  try {
    await loadRandomWords(20);
    toast.success('已加载20个随机单词');
  } catch (err) {
    toast.error('加载失败: ' + err.message);
  }
}

// 加载今日复习
async function loadTodayReview() {
  try {
    const response = await loadTodayReviewAPI();
    if (response.total === 0) {
      toast.info('今天没有需要复习的单词！');
    } else {
      toast.success(`已加载${response.total}个待复习单词`);
    }
  } catch (err) {
    toast.error('加载失败: ' + err.message);
  }
}

// 同步不熟悉单词到 API
async function syncUnfamiliarToAPI() {
  loading.value = true;
  try {
    // TODO: 批量同步不熟悉单词
    // 这里需要根据本地的 unfamiliarWords 数组调用 API
    for (const word of unfamiliarWords.value) {
      await api.markAsUnfamiliar(word.id);
    }
    toast.success(`已同步 ${unfamiliarWords.value.length} 个不熟悉单词`);
  } catch (err) {
    toast.error('同步失败: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// 从 API 加载错题
async function loadMistakesFromAPI() {
  loading.value = true;
  try {
    const response = await api.getMistakes(1, 50);
    // 转换为前端格式
    const apiMistakes = response.data.map(m => ({
      chinese: m.chinese,
      original: m.original,
      kana: m.kana,
      userAnswer: m.user_answer,
      diff: '', // 需要重新计算
      corrected: false
    }));
    
    // 合并到当前错题列表
    mistakesList.value = [...apiMistakes, ...mistakesList.value];
    toast.success(`已加载 ${response.total} 个错题`);
  } catch (err) {
    toast.error('加载失败: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// 初始化
onMounted(async () => {
  console.log('Practice.vue mounted, loading vocabulary...');
  try {
    const response = await loadVocabularyFromAPI({ 
      page: 1, 
      pageSize: pageSize.value 
    });
    console.log('API response:', response);
    pagination.value = response.pagination;
    toast.success(`已加载 ${response.data.length} 个单词`);
  } catch (err) {
    console.error('无法连接到API服务器:', err);
    toast.error('无法连接到服务器，请检查后端是否启动');
  }
});

// 事件处理器
async function handleCheckAnswer(index, userAnswer) {
  const isCorrect = await checkAnswer(index, userAnswer);
  const wordData = vocabularyList.value[index];
  
  if (!isCorrect) {
    const diff = getDiff(wordData.kana, userAnswer);
    addToMistakes(wordData, userAnswer, diff);
  }
}

function handleEnableEditing(index) {
  enableEditing(index);
}

function handleUpdateInput({ index, value }) {
  saveUserInput(index, value);
}

function handleToggleRowOriginal(index) {
  rowVisibility.value.original[index] = !rowVisibility.value.original[index];
  
  if (rowVisibility.value.original[index]) {
    removeUnfamiliarWord(index, 'original');
  } else {
    recordUnfamiliarWord(index, 'original');
  }
}

function handleToggleRowKana(index) {
  rowVisibility.value.kana[index] = !rowVisibility.value.kana[index];
  
  if (rowVisibility.value.kana[index]) {
    removeUnfamiliarWord(index, 'kana');
  } else {
    recordUnfamiliarWord(index, 'kana');
  }
}

function handleShuffle() {
  shuffleWords();
  toast.info('已打乱顺序');
}

function handleToggleKana() {
  toggleKanaVisibility();
}

function handleToggleOriginal() {
  toggleOriginalVisibility();
}

function handleExportUnfinished() {
  // 导出未完成的单词
  const unfinished = vocabularyList.value.filter((_, index) => !practiceResults.value[index].practiced);
  const text = unfinished.map(w => `${w.chinese},${w.original},${w.kana}`).join('\n');
  
  navigator.clipboard.writeText(text);
  toast.success(`已复制${unfinished.length}个未完成单词`);
}

function handleExportCombined() {
  // 导出所有单词
  const text = vocabularyList.value.map(w => `${w.chinese},${w.original},${w.kana}`).join('\n');
  
  navigator.clipboard.writeText(text);
  toast.success(`已复制${vocabularyList.value.length}个单词`);
}

async function handleClearAll() {
  try {
    await confirm.warning('清空后将无法恢复，确定要清空所有内容吗？', '确认清空');
    clearAll();
    toast.info('已清空');
  } catch (error) {
    // 用户取消，不做任何操作
  }
}

function handleReviewUnfamiliar() {
  toast.info('复习不熟悉单词...');
}

function handleClearUnfamiliar() {
  clearUnfamiliarWords();
  toast.info('已清空不熟悉单词');
}

function handleGoToLastInput() {
  if (vocabTableRef.value) {
    vocabTableRef.value.focusInput(lastInputIndex.value);
  }
}

function handleCopyMistakes() {
  const text = mistakesList.value
    .filter(m => !m.corrected)
    .map(m => `${m.chinese},${m.original},${m.kana}`)
    .join('\n');
  
  navigator.clipboard.writeText(text);
  toast.success(`已复制${mistakesList.value.filter(m => !m.corrected).length}个错题`);
}

function handleClearMistakes() {
  clearMistakes();
  toast.info('已清空错题');
}
</script>
