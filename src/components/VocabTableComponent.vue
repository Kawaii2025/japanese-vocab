<template>
  <section class="bg-white rounded-xl shadow-lg p-6 transform hover:shadow-xl transition-custom">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h2 class="text-xl font-semibold flex items-center">
        <i class="fa fa-list-alt text-primary mr-2"></i>单词练习表
      </h2>
      <!-- 移动端：按钮分为两行 -->
      <div class="hidden sm:flex flex-wrap gap-2 w-full sm:w-auto">
        <button 
          @click="$emit('shuffle')"
          class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
        >
          <i class="fa fa-random mr-1"></i>打乱顺序
        </button>
        <button 
          @click="$emit('toggleKana')"
          class="bg-kana hover:bg-kana/90 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
        >
          <i class="fa fa-eye mr-1"></i>{{ kanaHidden ? '显示假名' : '隐藏假名' }}
        </button>
        <button 
          v-if="hasOriginalText"
          @click="$emit('toggleOriginal')"
          class="bg-original hover:bg-original/90 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
        >
          <i class="fa fa-eye mr-1"></i>{{ originalHidden ? '显示单词' : '隐藏单词' }}
        </button>
        <span class="bg-error/10 text-error px-4 py-2 rounded-lg flex items-center">
          <i class="fa fa-exclamation-circle mr-1"></i>错题
          <span class="ml-1 bg-white text-error text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {{ activeMistakes }}
          </span>
        </span>
        <button 
          @click="$emit('exportUnfinished')"
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
        >
          <i class="fa fa-file-text-o mr-1"></i>导出未完成
        </button>
        <button 
          @click="$emit('exportCombined')"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-custom flex items-center"
        >
          <i class="fa fa-files-o mr-1"></i>合并导出
        </button>
        <button 
          @click="$emit('clear')"
          class="bg-gray-200 hover:bg-gray-300 text-dark px-4 py-2 rounded-lg transition-custom flex items-center"
        >
          <i class="fa fa-trash mr-1"></i>清空
        </button>
      </div>
      
      <!-- 移动端：按钮分两行 -->
      <div class="flex flex-wrap gap-2 w-full sm:hidden">
        <button 
          @click="$emit('shuffle')"
          class="flex-1 min-w-20 bg-gray-600 hover:bg-gray-700 text-white px-2 py-2 rounded text-sm flex items-center justify-center transition-custom"
        >
          <i class="fa fa-random mr-1"></i><span>打乱</span>
        </button>
        <button 
          @click="$emit('toggleKana')"
          class="flex-1 min-w-20 bg-kana hover:bg-kana/90 text-white px-2 py-2 rounded text-sm flex items-center justify-center transition-custom"
          :title="kanaHidden ? '显示假名' : '隐藏假名'"
        >
          <i class="fa fa-eye mr-1"></i><span>{{ kanaHidden ? '假名' : '隐假' }}</span>
        </button>
        <button 
          v-if="hasOriginalText"
          @click="$emit('toggleOriginal')"
          class="flex-1 min-w-20 bg-original hover:bg-original/90 text-white px-2 py-2 rounded text-sm flex items-center justify-center transition-custom"
          :title="originalHidden ? '显示单词' : '隐藏单词'"
        >
          <i class="fa fa-eye mr-1"></i><span>{{ originalHidden ? '单词' : '隐词' }}</span>
        </button>
        <span class="flex-1 min-w-20 bg-error/10 text-error px-2 py-2 rounded text-sm flex items-center justify-center">
          <i class="fa fa-exclamation-circle mr-1"></i><span>错{{ activeMistakes }}</span>
        </span>
      </div>
      <div class="flex flex-wrap gap-2 w-full sm:hidden">
        <button 
          @click="$emit('exportUnfinished')"
          class="flex-1 min-w-20 bg-purple-600 hover:bg-purple-700 text-white px-2 py-2 rounded text-sm flex items-center justify-center transition-custom"
        >
          <i class="fa fa-file-text-o mr-1"></i><span>未完成</span>
        </button>
        <button 
          @click="$emit('exportCombined')"
          class="flex-1 min-w-20 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-2 rounded text-sm flex items-center justify-center transition-custom"
        >
          <i class="fa fa-files-o mr-1"></i><span>合并</span>
        </button>
        <button 
          @click="$emit('clear')"
          class="flex-1 min-w-20 bg-gray-200 hover:bg-gray-300 text-dark px-2 py-2 rounded text-sm flex items-center justify-center transition-custom"
        >
          <i class="fa fa-trash mr-1"></i><span>清空</span>
        </button>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文意思</th>
            <th v-if="hasOriginalText || !originalHidden" scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日语原文</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">纯假名</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">朗读</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">练习（输入假名）</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="(item, index) in vocabularyList" 
            :key="index" 
            :ref="el => rowRefs[index] = el"
            class="hover:bg-gray-50 transition-custom"
          >
            <td class="px-3 py-4 whitespace-nowrap table-cell">
              <div class="text-sm font-medium text-dark">{{ index + 1 }}</div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm text-dark">{{ item.chinese }}</div>
            </td>
            <td v-if="hasOriginalText || !originalHidden" class="px-3 py-4 table-cell">
              <div 
                @click="toggleRowOriginal(index)"
                class="text-sm font-medium cursor-pointer user-select-none transition-colors rounded px-2 py-1"
                :class="rowVisibility.original[index] ? 'hover:bg-original/5' : 'text-gray-400 italic hover:bg-original/10'"
                :title="rowVisibility.original[index] ? '点击隐藏' : '点击显示'"
              >
                {{ item.original ? (rowVisibility.original[index] ? item.original : createMaskText(item.original)) : '-' }}
              </div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div 
                @click="toggleRowKana(index)"
                class="text-sm font-semibold cursor-pointer user-select-none transition-colors rounded px-2 py-1"
                :class="rowVisibility.kana[index] ? 'hover:bg-kana/5' : 'text-gray-400 italic hover:bg-kana/10'"
                :title="rowVisibility.kana[index] ? '点击隐藏' : '点击显示'"
              >
                {{ rowVisibility.kana[index] ? item.kana : createMaskText(item.kana) }}
              </div>
            </td>
            <td class="px-3 py-4 whitespace-nowrap table-cell">
              <button 
                @click="handleRead(item.kana, $event)"
                class="read-kana-btn bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1 rounded transition-custom"
                title="朗读假名"
              >
                <i class="fa fa-volume-up"></i>
              </button>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="practice-container w-full">
                <input 
                  v-if="!practiceResults[index].practiced || isEditing[index]"
                  v-model="localInputs[index]"
                  type="text" 
                  class="practice-input w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/50 focus:border-primary transition-custom outline-none" 
                  :class="isEditing[index] ? '' : inputClasses[index]"
                  placeholder="请输入纯假名..."
                  @input="handleInput(index)"
                />
                <div 
                  v-else-if="diffHtml[index]"
                  class="w-full p-2 border border-error bg-red-50 rounded text-sm text-error"
                  v-html="diffHtml[index]"
                ></div>
              </div>
            </td>
            <!-- 操作列 -->
            <td class="px-3 py-4 whitespace-nowrap text-sm table-cell">
              <button 
                v-if="!practiceResults[index].practiced || isEditing[index]"
                @click="handleCheck(index)"
                class="check-btn bg-secondary hover:bg-secondary/90 text-white px-3 py-1 rounded transition-custom"
                title="检查答案"
              >
                <i class="fa fa-check"></i>
              </button>
              <button 
                v-else
                @click="handleEdit(index, $event)"
                class="edit-btn bg-edit hover:bg-edit/90 text-white px-3 py-1 rounded transition-custom"
                title="重新编辑答案"
              >
                <i class="fa fa-pencil"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { createMaskText, getDiff, generateDiffHtml, readJapanese } from '../utils/helpers';

const props = defineProps({
  vocabularyList: {
    type: Array,
    required: true
  },
  practiceResults: {
    type: Array,
    required: true
  },
  rowVisibility: {
    type: Object,
    required: true
  },
  kanaHidden: {
    type: Boolean,
    required: true
  },
  originalHidden: {
    type: Boolean,
    required: true
  },
  hasOriginalText: {
    type: Boolean,
    required: true
  },
  activeMistakes: {
    type: Number,
    required: true
  }
});

const emit = defineEmits([
  'shuffle', 'toggleKana', 'toggleOriginal', 'exportUnfinished', 
  'exportCombined', 'clear', 'checkAnswer', 'enableEditing', 
  'toggleRowOriginal', 'toggleRowKana', 'updateInput'
]);

const localInputs = ref([]);
const isEditing = ref([]);
const diffHtml = ref([]);
const rowRefs = ref([]);

const inputClasses = computed(() => {
  return props.practiceResults.map((result, index) => {
    // 如果正在编辑，不应用任何背景色
    if (isEditing.value[index]) {
      return '';
    }
    // 如果已经练习过且不在编辑状态，应用结果颜色
    if (result.practiced) {
      return result.correct ? 'border-secondary bg-green-50' : 'border-error bg-red-50';
    }
    return '';
  });
});

// 初始化本地输入
watch(() => props.vocabularyList.length, (newLen) => {
  localInputs.value = new Array(newLen).fill('');
  isEditing.value = new Array(newLen).fill(false);
  diffHtml.value = new Array(newLen).fill('');
}, { immediate: true });

// 监听 practiceResults 的变化，重置编辑状态
watch(() => props.practiceResults, (newResults) => {
  
  const anyNeedReset = newResults.some((result, index) => !result.practiced && isEditing.value[index]);
  
  if (anyNeedReset) {
    const newEditing = [...isEditing.value];
    newResults.forEach((result, index) => {
      if (!result.practiced && isEditing.value[index]) {
        newEditing[index] = false;
      }
    });
    isEditing.value = newEditing;
  }
}, { deep: true });

function handleInput(index) {
  emit('updateInput', index, localInputs.value[index]);
}

function handleCheck(index) {
  
  const userAnswer = localInputs.value[index].trim();
  const wordData = props.vocabularyList[index];
  
  const isCorrect = emit('checkAnswer', index, userAnswer);
  
  if (!isCorrect) {
    const diff = getDiff(userAnswer, wordData.kana);
    const html = `<div class="mb-1 text-xs text-gray-500">你的答案 vs 正确答案</div>${generateDiffHtml(diff)}`;
    diffHtml.value = [...diffHtml.value];
    diffHtml.value[index] = html;
  }
  
  // 确保响应式更新
  const newEditing = [...isEditing.value];
  newEditing[index] = false;
  isEditing.value = newEditing;
}

function handleEdit(index, event) {
  
  // 确保响应式更新
  const newEditing = [...isEditing.value];
  newEditing[index] = true;
  isEditing.value = newEditing;
  
  diffHtml.value = [...diffHtml.value];
  diffHtml.value[index] = '';
  emit('enableEditing', index);
  
  event.target.classList.add('btn-pulse');
  setTimeout(() => event.target.classList.remove('btn-pulse'), 500);
}

function handleRead(kana, event) {
  readJapanese(kana);
  event.target.classList.add('btn-pulse');
  setTimeout(() => event.target.classList.remove('btn-pulse'), 500);
}

function toggleRowOriginal(index) {
  emit('toggleRowOriginal', index);
}

function toggleRowKana(index) {
  emit('toggleRowKana', index);
}

function scrollToRow(index) {
  if (rowRefs.value[index]) {
    rowRefs.value[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    rowRefs.value[index].classList.add('highlight-transition');
    setTimeout(() => {
      rowRefs.value[index].classList.remove('highlight-transition');
    }, 1500);
  }
}

defineExpose({
  scrollToRow
});
</script>
