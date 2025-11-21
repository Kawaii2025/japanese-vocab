<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- 页面标题 -->
      <HeaderComponent />
      
      <!-- 输入区域 -->
      <VocabInputComponent 
        ref="vocabInputRef"
        :batchAddVocabulary="batchAddVocabulary"
        @submit="handleSubmit"
      />
      
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
      
      <!-- 不熟悉单词总结区域 -->
      <UnfamiliarWordsComponent 
        v-if="vocabularyList.length > 0"
        :unfamiliarWords="unfamiliarWords"
        @review="handleReviewUnfamiliar"
        @clear="handleClearUnfamiliar"
      />
      
      <!-- 错题表格 -->
      <MistakesTableComponent 
        v-if="vocabularyList.length > 0"
        :mistakesList="mistakesList"
        :canGoToLastInput="lastInputIndex !== -1"
        @goToLastInput="handleGoToLastInput"
        @copy="handleCopyMistakes"
        @clear="handleClearMistakes"
      />
      
      <!-- 消息提示 -->
      <div 
        v-if="message.show"
        class="mt-4 text-center font-medium px-4 py-2 rounded-lg transition-custom"
        :class="messageClasses"
      >
        {{ message.text }}
      </div>
      
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
import HeaderComponent from './components/HeaderComponent.vue';
import VocabInputComponent from './components/VocabInputComponent.vue';
import VocabTableComponent from './components/VocabTableComponent.vue';
import UnfamiliarWordsComponent from './components/UnfamiliarWordsComponent.vue';
import MistakesTableComponent from './components/MistakesTableComponent.vue';
import StatsComponent from './components/StatsComponent.vue';
import { useVocabulary } from './composables/useVocabulary';
import { parseInput } from './utils/parser';
import { getDiff } from './utils/helpers';

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
  batchAddVocabulary,
  loadRandomWords,
  loadTodayReview
} = useVocabulary();

// 组件引用
const vocabInputRef = ref(null);
const vocabTableRef = ref(null);

// 消息提示
const message = ref({
  show: false,
  text: '',
  type: 'info'
});

const messageClasses = computed(() => {
  const classes = [];
  switch (message.value.type) {
    case 'success':
      classes.push('bg-green-50', 'text-green-700', 'border', 'border-green-200');
      break;
    case 'error':
      classes.push('bg-red-50', 'text-red-700', 'border', 'border-red-200');
      break;
    case 'info':
      classes.push('bg-blue-50', 'text-blue-700', 'border', 'border-blue-200');
      break;
  }
  return classes;
});

// 初始化：尝试从 API 加载数据
onMounted(async () => {
  try {
    // 尝试加载今日录入的单词
    await loadVocabularyFromAPI({ pageSize: 50 });
    showMessage(`已加载 ${vocabularyList.value.length} 个单词`, 'success');
  } catch (err) {
    console.warn('无法连接到API服务器，使用离线模式');
    // API 不可用时，用户仍然可以手动输入单词进行练习
  }
});

// 显示消息
function showMessage(text, type = 'info') {
  message.value = { show: true, text, type };
  const timeout = type === 'error' ? 5000 : 3000;
  setTimeout(() => {
    message.value.show = false;
  }, timeout);
}

// 处理提交
function handleSubmit(input) {
  if (!input || !input.trim()) {
    showMessage('请输入单词信息', 'error');
    return;
  }
  
  const { parsedList, analysisDetails } = parseInput(input);
  
  if (parsedList.length === 0) {
    showMessage('未能识别有效单词信息，请检查格式', 'error');
    return;
  }
  
  initVocabulary(parsedList);
  
  if (analysisDetails.length > 0 && vocabInputRef.value) {
    vocabInputRef.value.setParseInfo(analysisDetails.join('；'));
  }
  
  showMessage(`成功解析 ${parsedList.length} 个单词`, 'success');
}

// 处理检查答案
function handleCheckAnswer(index, userAnswer) {
  const wordData = vocabularyList.value[index];
  const isCorrect = checkAnswer(index, userAnswer);
  
  if (isCorrect) {
    showMessage('回答正确！', 'success');
  } else {
    const diff = getDiff(userAnswer, wordData.kana);
    addToMistakes(wordData, userAnswer, diff);
    showMessage('回答错误，请查看差异对比', 'error');
  }
  
  return isCorrect;
}

// 处理启用编辑
function handleEnableEditing(index) {
  enableEditing(index);
  showMessage('已重新启用编辑，请再次尝试', 'info');
}

// 处理更新输入
function handleUpdateInput(index, value) {
  saveUserInput(index, value);
}

// 处理打乱顺序
function handleShuffle() {
  if (vocabularyList.value.length <= 1) {
    showMessage('单词数量太少，无需打乱', 'info');
    return;
  }
  shuffleWords();
  showMessage('单词顺序已打乱，输入内容已同步调整', 'info');
}

// 处理切换假名显示
function handleToggleKana() {
  toggleKanaVisibility();
  showMessage(kanaHidden.value ? '已用星号隐藏所有假名' : '已显示所有假名', 'info');
}

// 处理切换原文显示
function handleToggleOriginal() {
  toggleOriginalVisibility();
  showMessage(originalHidden.value ? '已用星号隐藏所有单词' : '已显示所有单词', 'info');
}

// 处理单行原文切换
function handleToggleRowOriginal(index) {
  const newState = !rowVisibility.value.original[index];
  rowVisibility.value.original[index] = newState;
  
  if (newState) {
    recordUnfamiliarWord(index, 'original');
  } else {
    removeUnfamiliarWord(index, 'original');
  }
}

// 处理单行假名切换
function handleToggleRowKana(index) {
  const newState = !rowVisibility.value.kana[index];
  rowVisibility.value.kana[index] = newState;
  
  if (newState) {
    recordUnfamiliarWord(index, 'kana');
  } else {
    removeUnfamiliarWord(index, 'kana');
  }
}

// 处理导出未完成单词
function handleExportUnfinished() {
  if (vocabularyList.value.length === 0) {
    showMessage('没有单词可导出，请先生成表格', 'info');
    return;
  }
  
  const unfinishedWords = vocabularyList.value.filter((_, index) => 
    !practiceResults.value[index].practiced
  );
  
  if (unfinishedWords.length === 0) {
    showMessage('所有单词都已完成练习', 'info');
    return;
  }
  
  let markdown = "| 中文意思 | 日语原文 | 假名 |\n";
  markdown += "| ---- | ---- | ---- |\n";
  
  unfinishedWords.forEach(item => {
    markdown += `| ${item.chinese} | ${item.original || '-'} | ${item.kana} |\n`;
  });
  
  navigator.clipboard.writeText(markdown).then(() => {
    showMessage(`已将 ${unfinishedWords.length} 个未完成单词以Markdown格式复制到剪贴板`, 'success');
  }).catch(() => {
    showMessage('复制失败，请手动复制', 'error');
  });
}

// 处理合并导出
function handleExportCombined() {
  if (unfamiliarWords.value.length === 0 && mistakesList.value.length === 0) {
    showMessage('没有不熟悉或背错的单词可导出', 'info');
    return;
  }
  
  const uniqueWords = new Map();
  
  unfamiliarWords.value.forEach(word => {
    const key = `${word.chinese}-${word.kana}`;
    if (!uniqueWords.has(key)) {
      uniqueWords.set(key, {
        ...word,
        type: '不熟悉'
      });
    }
  });
  
  mistakesList.value.forEach(word => {
    const key = `${word.chinese}-${word.kana}`;
    if (uniqueWords.has(key)) {
      uniqueWords.set(key, {
        ...uniqueWords.get(key),
        type: '不熟悉+背错'
      });
    } else {
      uniqueWords.set(key, {
        ...word,
        type: word.corrected ? '已纠正错误' : '背错'
      });
    }
  });
  
  let markdown = "| 中文意思 | 日语原文 | 假名 | 类型 |\n";
  markdown += "| ---- | ---- | ---- | ---- |\n";
  
  Array.from(uniqueWords.values()).forEach(item => {
    markdown += `| ${item.chinese} | ${item.original || '-'} | ${item.kana} | ${item.type} |\n`;
  });
  
  navigator.clipboard.writeText(markdown).then(() => {
    showMessage(`已将 ${uniqueWords.size} 个合并单词（去重）以Markdown格式复制到剪贴板`, 'success');
  }).catch(() => {
    showMessage('复制失败，请手动复制', 'error');
  });
}

// 处理清空所有
function handleClearAll() {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  clearAll();
  if (vocabInputRef.value) {
    vocabInputRef.value.clearInput();
  }
  showMessage('已清空所有内容', 'info');
}

// 处理复习不熟悉单词
function handleReviewUnfamiliar() {
  if (unfamiliarWords.value.length === 0) {
    showMessage('没有需要复习的不熟悉单词', 'info');
    return;
  }
  showMessage(`已定位到 ${unfamiliarWords.value.length} 个需要复习的单词`, 'info');
}

// 处理清空不熟悉单词
function handleClearUnfamiliar() {
  clearUnfamiliarWords();
  showMessage('已清空所有不熟悉单词记录', 'info');
}

// 处理跳转到最后输入
function handleGoToLastInput() {
  if (lastInputIndex.value === -1 || lastInputIndex.value >= vocabularyList.value.length) {
    showMessage('没有找到最近的输入位置', 'info');
    return;
  }
  
  if (vocabTableRef.value) {
    vocabTableRef.value.scrollToRow(lastInputIndex.value);
    showMessage(`已跳转到最后输入位置（第 ${lastInputIndex.value + 1} 项）`, 'info');
  }
}

// 处理复制错题
function handleCopyMistakes() {
  if (mistakesList.value.length === 0) {
    showMessage('没有错题可复制', 'info');
    return;
  }
  
  let markdown = "| 中文意思 | 日语原文 | 正确答案 | 你的答案 | 状态 |\n";
  markdown += "| ---- | ---- | ---- | ---- | ---- |\n";
  
  mistakesList.value.forEach(item => {
    markdown += `| ${item.chinese} | ${item.original || '-'} | ${item.kana} | ${item.userAnswer || '未输入'} | ${item.corrected ? '已纠正' : '未纠正'} |\n`;
  });
  
  navigator.clipboard.writeText(markdown).then(() => {
    showMessage('错题已以Markdown格式复制到剪贴板', 'success');
  }).catch(() => {
    showMessage('复制失败，请手动复制', 'error');
  });
}

// 处理清空错题
function handleClearMistakes() {
  clearMistakes();
  showMessage('已清空所有错题记录', 'info');
}
</script>
