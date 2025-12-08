<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- 页面标题 -->
      <HeaderComponent />
      
      <!-- 功能区域 -->
      <section class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <!-- 总是显示的操作按钮和日期筛选区 -->
        <div class="flex flex-wrap gap-3 mb-6 items-end pb-4 border-b border-gray-200">
          <button 
            @click="$router.push('/add')"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
          >
            <i class="fa fa-plus mr-2"></i>添加单词
          </button>
          <button 
            @click="$router.push('/add-mobile')"
            class="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center md:hidden"
          >
            <i class="fa fa-table mr-2"></i>快速添加
          </button>
          <button 
            @click="$router.push('/add-table')"
            class="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center hidden md:flex"
          >
            <i class="fa fa-table mr-2"></i>批量添加
          </button>
          <button 
            @click="$router.push('/management')"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
          >
            <i class="fa fa-cog mr-2"></i>管理单词
          </button>
          <button 
            @click="loadRandomPractice"
            :disabled="loading"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
          >
            <i class="fa fa-random mr-2"></i>
            {{ loading ? '加载中...' : '随机练习' }}
          </button>
          <button 
            @click="loadTodayReview"
            :disabled="loading"
            class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-custom flex items-center relative"
          >
            <i class="fa fa-calendar-check-o mr-2"></i>
            <span>今日复习</span>
            <span v-if="todayReviewCount > 0" class="absolute top-0 right-0 -mt-2 -mr-2 bg-white text-orange-500 text-xs rounded-full h-5 w-5 flex items-center justify-center border border-orange-300 shadow">{{ todayReviewCount }}</span>
          </button>
          
          <!-- 日期筛选组件 - 放在右边 -->
          <div class="ml-auto">
            <DateFilterComponent 
              :model-value="selectedDate"
              :disabled="loading"
              @update:model-value="handleDateChange"
              @reset="resetFilter"
              @clear="clearFilter"
            />
          </div>
        </div>
        
        <!-- 单词列表内容 -->
        <template v-if="vocabularyList.length > 0">
          <!-- 之前的操作按钮区（现在只用于显示下方内容） -->
          <VocabTableComponent 
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
            @checkAnswer="handleCheckAnswer"
            @enableEditing="handleEnableEditing"
            @toggleRowOriginal="handleToggleRowOriginal"
            @toggleRowKana="handleToggleRowKana"
            @updateInput="handleUpdateInput"
          />
          <!-- 分页控件（表格下方） -->
          <div v-if="pagination.total > 0" class="pagination-container mt-8">
            <div class="pagination-info">
              <i class="fa fa-book text-primary mr-2"></i>
              <span class="text-sm font-medium text-gray-700">
                共 <span class="text-primary font-bold">{{ pagination.total }}</span> 个单词
              </span>
            </div>
            <div class="pagination-controls">
              <button 
                @click="loadPage(1)"
                :disabled="!pagination.hasPrev || loading"
                class="pagination-btn"
                title="第一页"
              >
                <i class="fa fa-angle-double-left"></i>
              </button>
              <button 
                @click="loadPage(pagination.page - 1)"
                :disabled="!pagination.hasPrev || loading"
                class="pagination-btn"
                title="上一页"
              >
                <i class="fa fa-angle-left"></i>
              </button>
              <div class="pagination-current">
                <span class="text-primary font-bold">{{ pagination.page }}</span>
                <span class="text-gray-400 mx-1">/</span>
                <span class="text-gray-600">{{ pagination.totalPages }}</span>
              </div>
              <button 
                @click="loadPage(pagination.page + 1)"
                :disabled="!pagination.hasNext || loading"
                class="pagination-btn"
                title="下一页"
              >
                <i class="fa fa-angle-right"></i>
              </button>
              <button 
                @click="loadPage(pagination.totalPages)"
                :disabled="!pagination.hasNext || loading"
                class="pagination-btn"
                title="最后一页"
              >
                <i class="fa fa-angle-double-right"></i>
              </button>
            </div>
            <!-- 分页条数选择器（下方） -->
            <div class="pagination-size mt-4">
              <select 
                v-model="pageSize" 
                @change="changePageSize"
                class="page-size-select"
              >
                <option :value="10">10条/页</option>
                <option :value="20">20条/页</option>
                <option :value="50">50条/页</option>
                <option :value="100">100条/页</option>
              </select>
            </div>
          </div>
        </template>
        <template v-else-if="loading">
          <div class="text-center py-12">
            <i class="fa fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p class="text-gray-600">加载中...</p>
          </div>
        </template>
        <template v-else>
          <div class="bg-white rounded-xl p-12 text-center">
            <i class="fa fa-inbox text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600 mb-4">还没有单词，开始添加吧！</p>
            <button 
              @click="$router.push('/add')"
              class="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg transition-custom"
            >
              <i class="fa fa-plus mr-2"></i>添加单词
            </button>
          </div>
        </template>
      </section>
      
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
import DateFilterComponent from '../components/DateFilterComponent.vue';
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

// 今日复习数量
const todayReviewCount = ref(0);

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

// 日期筛选
const selectedDate = ref('');

// 获取今天的日期（北京时区格式：YYYY-MM-DD）
function getTodayDate() {
  const now = new Date();
  const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const year = beijingTime.getFullYear();
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 初始化日期为今天
function initializeDate() {
  selectedDate.value = getTodayDate();
}

// 处理日期改变事件
async function handleDateChange(newDate) {
  selectedDate.value = newDate;
  vocabularyList.value = [];
  loading.value = true;
  await filterByDate();
}

// 按日期筛选单词
async function filterByDate() {
  if (!selectedDate.value) {
    toast.warning('请选择日期');
    loading.value = false;
    return;
  }
  
  try {
    const response = await api.getVocabularyByDate(selectedDate.value);
    
    if (response.data && response.data.length > 0) {
      // 更新词汇列表 - 使用正确的初始化方式
      initVocabulary(response.data);
      
      pagination.value = {
        total: response.total || response.data.length,
        page: 1,
        pageSize: response.data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };
      
      const dateObj = new Date(selectedDate.value);
      const dateStr = dateObj.toLocaleDateString('zh-CN');
      toast.success(`找到 ${response.data.length} 个单词（${dateStr}）`);
    } else {
      initVocabulary([]);
      toast.info(`${new Date(selectedDate.value).toLocaleDateString('zh-CN')} 没有添加任何单词`);
    }
  } catch (error) {
    console.error('筛选单词失败:', error);
    toast.error('筛选失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 重置筛选
async function resetFilter() {
  try {
    loading.value = true;
    selectedDate.value = getTodayDate();
    const response = await loadVocabularyFromAPI({ 
      page: 1, 
      pageSize: pageSize.value 
    });
    pagination.value = response.pagination;
    toast.success('已重置为首页列表');
  } catch (error) {
    console.error('重置筛选失败:', error);
    toast.error('重置失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 清空日期条件，查看所有单词
async function clearFilter() {
  try {
    loading.value = true;
    selectedDate.value = '';
    const response = await loadVocabularyFromAPI({ 
      page: 1, 
      pageSize: pageSize.value 
    });
    pagination.value = response.pagination;
    toast.success('已清空日期筛选，显示所有单词');
  } catch (error) {
    console.error('清空筛选失败:', error);
    toast.error('清空失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

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
    todayReviewCount.value = response.total || 0; // 更新数量
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
  initializeDate();  // 初始化日期选择器为今天
  try {
    const response = await loadVocabularyFromAPI({ 
      page: 1, 
      pageSize: pageSize.value 
    });
    console.log('API response:', response);
    pagination.value = response.pagination;
    toast.success(`已加载 ${response.data.length} 个单词`);
    
    // 加载今日复习数量
    loadTodayReviewCount();
  } catch (err) {
    console.error('无法连接到API服务器:', err);
    toast.error('无法连接到服务器，请检查后端是否启动');
  }
});

// 加载今日复习数量（不显示单词，只获取数量）
async function loadTodayReviewCount() {
  try {
    const response = await api.getTodayReview();
    todayReviewCount.value = response.total || 0;
  } catch (err) {
    console.error('获取今日复习数量失败:', err);
  }
}

// 事件处理器
async function handleCheckAnswer(index, userAnswer) {
  const isCorrect = await checkAnswer(index, userAnswer);
  const wordData = vocabularyList.value[index];
  
  if (!isCorrect) {
    // 规范化两边的数据用于展示对比
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedKana = wordData.kana.toLowerCase().trim();
    const diff = getDiff(normalizedUserAnswer, normalizedKana);
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

<style scoped>
/* 操作按钮样式 */
.btn-action {
  position: relative;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  color: white;
}

.btn-action:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  transform: translateY(-1px);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-success {
  background: linear-gradient(to right, #10b981, #059669);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(to right, #059669, #047857);
}

.btn-primary {
  background: linear-gradient(to right, #3b82f6, #2563eb);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(to right, #2563eb, #1d4ed8);
}

.btn-warning {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.btn-warning:hover:not(:disabled) {
  background: linear-gradient(to right, #d97706, #b45309);
}

/* 今日复习徽章 */
.badge-count {
  margin-left: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 分页容器 */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.pagination-info {
  display: flex;
  align-items: center;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pagination-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: white;
  border: 2px solid #d1d5db;
  color: #6b7280;
  transition: all 0.2s;
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-current {
  margin: 0 0.5rem;
  padding: 0.375rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-current .text-primary {
  color: #3b82f6;
  font-weight: 700;
}

.pagination-current .text-gray-400 {
  color: #9ca3af;
}

.pagination-current .text-gray-600 {
  color: #4b5563;
}

.pagination-size {
  display: flex;
  align-items: center;
}

.page-size-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.page-size-select:hover {
  border-color: #3b82f6;
}

.page-size-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .pagination-info,
  .pagination-controls,
  .pagination-size {
    justify-content: center;
  }
  
  .page-size-select {
    width: 100%;
  }
}
</style>
