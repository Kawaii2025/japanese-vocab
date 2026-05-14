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
                  <th class="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-10">#</th>
                  <th class="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">かな</th>
                  <th class="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">日文</th>
                  <th class="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">中文</th>
                  <th class="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">词性</th>
                  <th class="px-2 py-3 text-center text-sm font-semibold text-gray-700 w-10">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(word, index) in words" 
                  :key="index"
                  class="border-b border-gray-200 hover:bg-blue-50/30 transition-colors"
                >
                  <td class="px-2 py-3 text-sm text-gray-500 font-medium">{{ index + 1 }}</td>
                  <!-- かな输入 + 朗读按钮 -->
                  <td class="px-2 py-3">
                    <div class="flex gap-2 items-center">
                      <input 
                        v-model="word.kana"
                        type="text"
                        placeholder="输入かな"
                        lang="ja"
                        autocorrect="off"
                        autocapitalize="off"
                        spellcheck="false"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-xs"
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
                  <td class="px-2 py-3">
                    <input 
                      v-model="word.original"
                      type="text"
                      placeholder="输入日文原文"
                      lang="ja"
                      autocorrect="off"
                      autocapitalize="off"
                      spellcheck="false"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-xs"
                    />
                  </td>
                  <!-- 中文输入 -->
                  <td class="px-2 py-3">
                    <input 
                      v-model="word.chinese"
                      type="text"
                      placeholder="输入中文意思"
                      lang="zh-Hans"
                      autocorrect="off"
                      autocapitalize="off"
                      spellcheck="false"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-xs"
                    />
                  </td>
                  <!-- 词类选择 -->
                  <td class="px-2 py-3">
                    <div class="relative">
                      <button 
                        type="button"
                        @click="toggleDropdown(index)"
                        class="w-full px-3 py-2 text-left border border-gray-300 rounded bg-white flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs"
                      >
                        <div class="flex flex-wrap gap-1">
                          <span 
                            v-for="cls in word.word_class" 
                            :key="cls"
                            :class="['inline-block px-2 py-1 rounded text-xs', getWordClassColor(cls)]"
                          >
                            {{ getWordClassShort([cls])[0] }}
                          </span>
                          <span v-if="word.word_class.length === 0" class="text-gray-400">请选择</span>
                        </div>
                        <i class="fa fa-chevron-down text-xs text-gray-400 ml-2"></i>
                      </button>
                      <div 
                        v-if="openDropdownIndex === index"
                        class="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10"
                      >
                        <div 
                          v-for="wc in WORD_CLASSES" 
                          :key="wc.key"
                          @click="toggleWordClass(word.word_class, wc.key)"
                          class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
                        >
                          <input 
                            type="checkbox"
                            :checked="word.word_class.includes(wc.key)"
                            class="rounded pointer-events-none"
                          />
                          <span :class="['inline-block px-2 py-1 rounded text-xs', wc.color]">{{ wc.short }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <!-- 操作按钮 -->
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button 
                        @click="showAiExample(word)"
                        :disabled="isRowEmpty(word)"
                        :class="(word.id && pendingAiWordIds.has(word.id))
                          ? 'px-3 py-2 bg-gray-200 text-gray-500 rounded transition-colors font-medium text-sm cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-200'
                          : 'px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-100'"
                        :title="(word.id && pendingAiWordIds.has(word.id)) ? '正在生成AI例句...' : '生成AI例句'"
                      >
                        <i :class="(word.id && pendingAiWordIds.has(word.id)) ? 'fa fa-spinner fa-spin' : 'fa fa-lightbulb-o'"></i>
                      </button>
                      <button 
                        @click="deleteRow(index)"
                        :disabled="isRowCompletelyEmpty(word)"
                        class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-100"
                        title="删除"
                      >
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
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
                <div class="absolute right-3 top-3 flex items-center gap-2">
                  <button
                    @click="showAiExample(word)"
                    :class="pendingAiWordIds.has(word.id)
                      ? 'flex-shrink-0 bg-gray-200 text-gray-500 px-2 py-1 rounded cursor-not-allowed'
                      : (word.hasAiExamples
                        ? 'flex-shrink-0 bg-green-100 hover:bg-green-200 text-green-600 px-2 py-1 rounded transition-custom'
                        : 'flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-600 px-2 py-1 rounded transition-custom')"
                    :title="pendingAiWordIds.has(word.id) 
                      ? '正在生成AI例句...' 
                      : (word.hasAiExamples ? '查看AI例句（已缓存）' : '生成AI例句')"
                  >
                    <i :class="pendingAiWordIds.has(word.id) 
                      ? 'fa fa-spinner fa-spin' 
                      : (word.hasAiExamples ? 'fa fa-check-circle' : 'fa fa-lightbulb-o')"></i>
                  </button>
                  <button
                    @click="handleVoiceClick(word.kana, $event)"
                    class="flex-shrink-0 bg-accent/10 hover:bg-accent/20 text-accent px-2 py-1 rounded transition-custom"
                    title="朗读假名"
                  >
                    <i class="fa fa-volume-up"></i>
                  </button>
                </div>
                <p class="font-medium text-sm text-dark truncate">{{ word.original }}</p>
                <p class="text-xs text-gray-600 mt-1">{{ word.chinese }}</p>
                <p class="text-xs text-gray-500 mt-1 pr-20 truncate">{{ word.kana }}</p>
                <p class="text-xs text-gray-400 mt-2">{{ formatTime(word.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI例句弹窗 -->
    <div v-if="showAiModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold flex items-center">
              <i class="fa fa-lightbulb-o text-yellow-500 mr-2"></i>
              AI 例句 - {{ currentAiWord?.original || currentAiWord?.kana }}
            </h3>
            <span v-if="aiIsCached && !aiLoading" class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <i class="fa fa-check-circle mr-1"></i>缓存
            </span>
            <span v-if="aiModel" class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <i class="fa fa-robot mr-1"></i>{{ aiModel }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              v-if="!aiLoading && aiExamples.length > 0"
              @click.stop="showAiExample(currentAiWord, true)"
              class="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-sm font-medium transition-colors"
              title="重新生成"
            >
              <i class="fa fa-refresh mr-1"></i>重新生成
            </button>
            <button @click="closeAiModal" class="text-gray-500 hover:text-gray-700">
              <i class="fa fa-times text-xl"></i>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="aiError" class="text-center py-8 text-red-600">
            <i class="fa fa-exclamation-circle text-3xl mb-4"></i>
            <p>{{ aiError }}</p>
          </div>
          <div v-else class="space-y-4">
            <!-- 状态提示 -->
            <div v-if="aiStatus" class="flex items-center justify-center gap-2 text-gray-600">
              <i class="fa fa-spinner fa-spin"></i>
              <span>{{ aiStatus }}</span>
            </div>
            
            <!-- 流式响应模式：打字机效果 + 完成的例句 -->
            <template v-if="USE_STREAMING_AI">
              <!-- 已完成的例句 -->
              <div 
                v-for="(example, index) in aiExamplesWithRuby" 
                :key="index"
                class="p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <template v-if="example.loading">
                      <div class="space-y-2">
                        <div class="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        <div class="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </template>
                    <template v-else>
                      <p class="text-lg font-medium text-dark" v-html="example.japaneseWithRuby"></p>
                      <p class="text-sm text-gray-600 mt-1">{{ example.kana }}</p>
                      <p class="text-sm text-gray-500 mt-2">{{ example.chinese }}</p>
                    </template>
                  </div>
                  <button 
                    v-if="!example.loading"
                    @click="handleVoiceClick(example.kana || example.japanese, $event)"
                    class="flex-shrink-0 bg-accent/10 hover:bg-accent/20 text-accent px-2 py-1 rounded ml-4 transition-custom"
                    title="朗读"
                  >
                    <i class="fa fa-volume-up"></i>
                  </button>
                </div>
              </div>
              <!-- 打字机效果的原始文本 -->
              <div v-if="aiLoading && aiTypingText" class="p-4 border border-primary/30 rounded-lg bg-primary/5">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <pre class="text-sm font-mono text-gray-700 whitespace-pre-wrap">{{ aiTypingText }}</pre>
                  </div>
                </div>
              </div>
            </template>
            <!-- 非流式模式：占位符骨架屏 -->
            <template v-else>
              <div 
                v-for="(example, index) in aiExamplesWithRuby" 
                :key="index"
                class="p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <template v-if="example.loading">
                      <div class="space-y-2">
                        <div class="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        <div class="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </template>
                    <template v-else>
                      <p class="text-lg font-medium text-dark" v-html="example.japaneseWithRuby"></p>
                      <p class="text-sm text-gray-600 mt-1">{{ example.kana }}</p>
                      <p class="text-sm text-gray-500 mt-2">{{ example.chinese }}</p>
                    </template>
                  </div>
                  <button 
                    v-if="!example.loading"
                    @click="handleVoiceClick(example.kana || example.japanese, $event)"
                    class="flex-shrink-0 bg-accent/10 hover:bg-accent/20 text-accent px-2 py-1 rounded ml-4 transition-custom"
                    title="朗读"
                  >
                    <i class="fa fa-volume-up"></i>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { WORD_CLASSES, normalizeWordClasses, getWordClassLabel, getWordClassColor, getWordClassShort } from '../constants/wordClasses';
import * as api from '../services/api.js';
import { readJapanese, furiganaToRuby } from '../utils/helpers.js';
import { useToast } from '../composables/useToast.js';
import { useConfirm } from '../composables/useConfirm.js';

function handleClickOutside(event) {
  if (openDropdownIndex.value !== null && !event.target.closest('.relative')) {
    openDropdownIndex.value = null;
  }
  if (showAiModal.value && !event.target.closest('.bg-white')) {
    closeAiModal();
  }
}

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const DRAFT_KEY = 'add-words-table-draft-v1';
const DEFAULT_ROW_COUNT = 30;

const createEmptyRows = (count = DEFAULT_ROW_COUNT) =>
  Array.from({ length: count }, () => ({ chinese: '', original: '', kana: '', word_class: [] }));

const words = ref(createEmptyRows());
const recentWords = ref([]);
const loading = ref(false);
const openDropdownIndex = ref(null);

// AI 例句相关
const showAiModal = ref(false);
const currentAiWord = ref(null);
const aiExamples = ref([]);
const aiLoading = ref(false);
const aiError = ref(null);
const aiTypingText = ref(''); // 打字机效果显示的文本
const aiIsCached = ref(false); // 是否使用了缓存
const aiModel = ref(null); // 当前使用的AI模型
const aiStatus = ref(''); // 状态提示文本
const pendingAiWordIds = ref(new Set()); // 正在进行AI请求的单词ID集合

// 转换 AI 例句为 HTML ruby 标签
const aiExamplesWithRuby = computed(() => {
  return aiExamples.value.map(example => ({
    ...example,
    japaneseWithRuby: furiganaToRuby(example.japanese)
  }));
});

function toggleDropdown(index) {
  openDropdownIndex.value = openDropdownIndex.value === index ? null : index;
}

function toggleWordClass(wordClassesArray, key) {
  const index = wordClassesArray.indexOf(key);
  if (index === -1) {
    wordClassesArray.push(key);
  } else {
    wordClassesArray.splice(index, 1);
  }
}

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
        kana: (item?.kana || '').toString(),
        word_class: normalizeWordClasses(item?.word_class)
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

const isRowEmpty = (word) => {
  return (!word?.chinese || word.chinese.trim() === '') &&
    (!word?.original || word.original.trim() === '') &&
    (!word?.kana || word.kana.trim() === '');
};

const isRowCompletelyEmpty = (word) => {
  return isRowEmpty(word) && normalizeWordClasses(word?.word_class).length === 0;
};

// 配置：是否使用流式响应（false = 使用非流式）
const USE_STREAMING_AI = import.meta.env.VITE_USE_STREAMING_AI === 'true';

// AI 例句功能
const showAiExample = async (word, forceRefresh = false) => {
  // 如果单词没有 id，不使用 pending 逻辑（新建单词的情况）
  if (word.id) {
    // 检查是否已经在请求中
    if (pendingAiWordIds.value.has(word.id)) {
      // 如果已经在请求中，只打开弹窗，不重复请求
      currentAiWord.value = word;
      showAiModal.value = true;
      document.body.style.overflow = 'hidden';
      
      // 显示加载状态
      aiExamples.value = [
        { japanese: '', kana: '', chinese: '', loading: true },
        { japanese: '', kana: '', chinese: '', loading: true },
        { japanese: '', kana: '', chinese: '', loading: true }
      ];
      aiLoading.value = true;
      aiError.value = null;
      aiIsCached.value = false;
      aiStatus.value = '正在生成例句...';
      aiModel.value = null;
      aiTypingText.value = '';
      return;
    }
    
    // 标记为正在请求中
    pendingAiWordIds.value.add(word.id);
  }
  
  currentAiWord.value = word;
  showAiModal.value = true;
  document.body.style.overflow = 'hidden';
  
  // 初始化：无论是否流式，都先显示骨架屏
  aiExamples.value = [
    { japanese: '', kana: '', chinese: '', loading: true },
    { japanese: '', kana: '', chinese: '', loading: true },
    { japanese: '', kana: '', chinese: '', loading: true }
  ];
  
  aiLoading.value = true;
  aiError.value = null;
  aiIsCached.value = false;
  aiStatus.value = '正在初始化...';
  aiModel.value = null;
  aiTypingText.value = '';
  
  let finalExamples = [];
  let cached = false;
  let model = null;
  let hasError = false;
  
  const finishRequest = () => {
    // 无论弹窗是否关闭，都清理 pending 标记
    if (word.id) {
      pendingAiWordIds.value.delete(word.id);
    }
    
    // 只有弹窗还打开时才更新 UI
    if (showAiModal.value && currentAiWord.value?.id === word.id) {
      if (hasError) {
        // 错误已经处理过了
      } else {
        aiExamples.value = [...finalExamples];
        aiLoading.value = false;
        aiTypingText.value = '';
        aiIsCached.value = cached || false;
        aiModel.value = model || null;
        aiStatus.value = '';
      }
    }
  };
  
  if (USE_STREAMING_AI) {
    // ========== 流式响应逻辑 ==========
    let fullText = '';
    let typingInterval = null;
    
    // 尝试从文本中解析已完成的例句
    const extractExamples = (text) => {
      try {
        // 找到第一个 [ 和最后一个 ]
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const jsonStr = text.substring(startIndex, endIndex + 1);
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            const result = parsed
              .map(ex => ({
                japanese: ex.japanese || ex.jp || '',
                kana: ex.kana || '',
                chinese: ex.chinese || ex.cn || ex.zh || '',
              }))
              .filter(ex => ex.japanese && ex.kana && ex.chinese);
            
            // 确保有3个占位符
            while (result.length < 3) {
              result.push({ japanese: '', kana: '', chinese: '', loading: true });
            }
            return result;
          }
        }
      } catch (e) {
        // 忽略解析错误
      }
      return [
        { japanese: '', kana: '', chinese: '', loading: true },
        { japanese: '', kana: '', chinese: '', loading: true },
        { japanese: '', kana: '', chinese: '', loading: true }
      ];
    };
    
    // 打字机效果函数
    const startTyping = () => {
      if (typingInterval) clearInterval(typingInterval);
      
      typingInterval = setInterval(() => {
        if (aiTypingText.value.length < fullText.length) {
          aiTypingText.value = fullText.substring(0, aiTypingText.value.length + 1);
        }
      }, 30); // 30ms 每个字符，打字机速度
    };
    
    try {
      await api.generateAiExamplesStream(
        {
          word: word.original,
          kana: word.kana,
          chinese: word.chinese,
          wordClass: word.word_class || [],
        },
        null, // onExamples 不再使用
        (finalExamplesResult, cachedResult, modelResult) => {
          // 完成时
          finalExamples = finalExamplesResult;
          cached = cachedResult;
          model = modelResult;
          
          if (showAiModal.value && currentAiWord.value?.id === word.id) {
            aiExamples.value = [...finalExamples];
            aiLoading.value = false;
            aiTypingText.value = ''; // 完成后清空打字机文本
            aiIsCached.value = cached || false;
            aiModel.value = model || null;
            aiStatus.value = '';
          }
          
          if (typingInterval) clearInterval(typingInterval);
          finishRequest();
        },
        (error) => {
          hasError = true;
          if (showAiModal.value && currentAiWord.value?.id === word.id) {
            aiError.value = error.message || '生成例句失败，请稍后重试';
            aiLoading.value = false;
            aiStatus.value = '';
          }
          if (typingInterval) clearInterval(typingInterval);
          console.error('AI 例句生成失败:', error);
          finishRequest();
        },
        (rawText) => {
          // 收到原始文本更新
          fullText = rawText;
          // 尝试解析已完成的例句 - 只有弹窗还打开时才更新
          if (showAiModal.value && currentAiWord.value?.id === word.id) {
            aiExamples.value = extractExamples(rawText);
            // 启动打字机
            if (!typingInterval) {
              startTyping();
            }
          }
        },
        (status) => {
          // 收到状态更新 - 只有弹窗还打开时才更新
          if (showAiModal.value && currentAiWord.value?.id === word.id) {
            aiStatus.value = status;
          }
        },
        forceRefresh
      );
    } catch (error) {
      hasError = true;
      if (showAiModal.value && currentAiWord.value?.id === word.id) {
        aiError.value = error.message || '生成例句失败，请稍后重试';
        aiLoading.value = false;
        aiStatus.value = '';
      }
      if (typingInterval) clearInterval(typingInterval);
      console.error('AI 例句生成失败:', error);
      finishRequest();
    }
  } else {
    // ========== 非流式响应逻辑 ==========
    aiStatus.value = '正在生成例句...';
    try {
      const response = await api.generateAiExamples({
        word: word.original,
        kana: word.kana,
        chinese: word.chinese,
        wordClass: word.word_class || [],
        forceRefresh
      });
      
      finalExamples = response.data?.examples || [];
      cached = response.data?.cached || false;
      model = response.data?.model || null;
      
      if (showAiModal.value && currentAiWord.value?.id === word.id) {
        aiExamples.value = finalExamples;
        aiIsCached.value = cached;
        aiModel.value = model;
        aiLoading.value = false;
        aiStatus.value = '';
      }
    } catch (error) {
      hasError = true;
      if (showAiModal.value && currentAiWord.value?.id === word.id) {
        aiError.value = error.message || '生成例句失败，请稍后重试';
        aiLoading.value = false;
        aiStatus.value = '';
      }
      console.error('AI 例句生成失败:', error);
    }
    finishRequest();
  }
};

const closeAiModal = () => {
  showAiModal.value = false;
  // 恢复背景滚动
  document.body.style.overflow = 'auto';
  currentAiWord.value = null;
  aiExamples.value = [];
  aiError.value = null;
  aiIsCached.value = false;
  aiModel.value = null;
  aiTypingText.value = '';
  aiStatus.value = '';
};

// 加载示例数据
const loadSampleData = () => {
  words.value = [
    { chinese: '日本', original: '日本', kana: 'にほん', word_class: ['noun'] },
    { chinese: '中国', original: '中国', kana: 'ちゅうごく', word_class: ['noun'] },
    { chinese: '学生', original: '学生', kana: 'がくせい', word_class: ['noun'] },
    { chinese: '先生', original: '先生', kana: 'せんせい', word_class: ['noun'] },
    { chinese: '水', original: '水', kana: 'みず', word_class: ['noun'] },
    { chinese: '火', original: '火', kana: 'ひ', word_class: ['noun'] },
    { chinese: '木', original: '木', kana: 'き', word_class: ['noun'] },
    { chinese: '金', original: '金', kana: 'きん', word_class: ['noun'] },
    { chinese: '土', original: '土', kana: 'つち', word_class: ['noun'] },
    { chinese: '日', original: '日', kana: 'ひ', word_class: ['noun'] }
  ];
};

// 添加新行
const addRow = () => {
  words.value.push({
    chinese: '',
    original: '',
    kana: '',
    word_class: []
  });
};

// 添加多行
const addMultipleRows = (count) => {
  for (let i = 0; i < count; i++) {
    words.value.push({
      chinese: '',
      original: '',
      kana: '',
      word_class: []
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
    if (error.status === 409 && error.data?.skippedWords?.length) {
      const skippedList = error.data.skippedWords
        .map(w => `${w.kana}(${w.chinese})`)
        .join('、');
      toast.warning(
        `${error.message}\n\n重复单词：${skippedList}`
      );
      await loadRecentWords();
      return;
    }
    toast.error('保存失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 页面初始化
onMounted(() => {
  restoreDraftFromLocal();
  loadRecentWords();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  // 组件卸载时恢复滚动
  document.body.style.overflow = 'auto';
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
