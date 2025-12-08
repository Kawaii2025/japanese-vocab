import { ref, computed } from 'vue';
import * as api from '../services/api.js';

export function useVocabulary() {
  // 核心数据
  const vocabularyList = ref([]);
  const userInputs = ref([]);
  const lastInputIndex = ref(-1);
  const mistakesList = ref([]);
  const unfamiliarWords = ref([]);
  const practiceResults = ref([]);
  
  // 显示状态
  const kanaHidden = ref(true);
  const originalHidden = ref(true);
  const rowVisibility = ref({ original: [], kana: [] });
  
  // 加载状态
  const loading = ref(false);
  const error = ref(null);
  
  // 统计数据
  const stats = ref({
    total: 0,
    practiced: 0,
    correct: 0,
    totalMistakes: 0
  });
  
  // 计算属性
  const hasOriginalText = computed(() => {
    return vocabularyList.value.some(item => item.original && item.original.trim() !== '');
  });
  
  const activeMistakes = computed(() => {
    return mistakesList.value.filter(m => !m.corrected).length;
  });
  
  const accuracy = computed(() => {
    return stats.value.practiced > 0 
      ? Math.round((stats.value.correct / stats.value.practiced) * 100) 
      : 0;
  });
  
  // 初始化单词列表
  function initVocabulary(list) {
    vocabularyList.value = list;
    userInputs.value = new Array(list.length).fill('');
    // 每个元素都是独立对象，避免批量变色 bug
    practiceResults.value = Array.from({ length: list.length }, () => ({
      practiced: false,
      correct: false
    }));
    lastInputIndex.value = -1;
    mistakesList.value = [];
    unfamiliarWords.value = [];
    stats.value = {
      total: list.length,
      practiced: 0,
      correct: 0,
      totalMistakes: 0
    };
    rowVisibility.value.original = new Array(list.length).fill(!originalHidden.value);
    rowVisibility.value.kana = new Array(list.length).fill(!kanaHidden.value);
  }
  
  // 保存用户输入
  function saveUserInput(index, value) {
    userInputs.value[index] = value;
    if (value.trim() !== '') {
      lastInputIndex.value = index;
    }
  }
  
  // 检查答案
  async function checkAnswer(index, userAnswer) {
    const wordData = vocabularyList.value[index];
    
    practiceResults.value[index].practiced = true;
    stats.value.practiced++;
    
    // 统一处理：都转换为小写并去掉前后空格
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedKana = wordData.kana.toLowerCase().trim();
    
    const isCorrect = normalizedUserAnswer === normalizedKana;
    
    if (isCorrect) {
      practiceResults.value[index].correct = true;
      stats.value.correct++;
      markMistakesAsCorrected(wordData);
      
      // 记录练习结果到后端
      try {
        await api.recordPractice({
          vocabulary_id: wordData.id,
          user_answer: userAnswer,
          is_correct: true
        });
      } catch (err) {
        console.error('记录练习失败:', err);
      }
    } else {
      stats.value.totalMistakes++;
      practiceResults.value[index].correct = false;
      
      // 记录错误练习到后端
      try {
        await api.recordPractice({
          vocabulary_id: wordData.id,
          user_answer: userAnswer,
          is_correct: false
        });
      } catch (err) {
        console.error('记录练习失败:', err);
      }
    }
    
    return isCorrect;
  }
  
  // 添加到错题列表
  function addToMistakes(wordData, userAnswer, diff) {
    const isAlreadyInMistakes = mistakesList.value.some(item => 
      item.chinese === wordData.chinese && 
      item.kana === wordData.kana &&
      item.userAnswer === userAnswer &&
      !item.corrected
    );
    
    if (!isAlreadyInMistakes) {
      mistakesList.value.push({
        ...wordData,
        userAnswer: userAnswer,
        diff: diff,
        corrected: false,
        timestamp: new Date()
      });
    }
  }
  
  // 标记错题为已纠正
  function markMistakesAsCorrected(wordData) {
    mistakesList.value.forEach(mistake => {
      if (mistake.chinese === wordData.chinese && mistake.kana === wordData.kana) {
        mistake.corrected = true;
      }
    });
  }
  
  // 记录不熟悉的单词
  function recordUnfamiliarWord(index, type) {
    const wordData = vocabularyList.value[index];
    const existingIndex = unfamiliarWords.value.findIndex(item => 
      item.chinese === wordData.chinese && item.kana === wordData.kana
    );
    
    if (existingIndex === -1) {
      unfamiliarWords.value.push({
        ...wordData,
        unfamiliarTypes: [type]
      });
    } else {
      if (!unfamiliarWords.value[existingIndex].unfamiliarTypes.includes(type)) {
        unfamiliarWords.value[existingIndex].unfamiliarTypes.push(type);
      }
    }
  }
  
  // 移除不熟悉的单词
  function removeUnfamiliarWord(index, type) {
    const wordData = vocabularyList.value[index];
    const existingIndex = unfamiliarWords.value.findIndex(item => 
      item.chinese === wordData.chinese && item.kana === wordData.kana
    );
    
    if (existingIndex !== -1) {
      unfamiliarWords.value[existingIndex].unfamiliarTypes = 
        unfamiliarWords.value[existingIndex].unfamiliarTypes.filter(t => t !== type);
      
      if (unfamiliarWords.value[existingIndex].unfamiliarTypes.length === 0) {
        unfamiliarWords.value.splice(existingIndex, 1);
      }
    }
  }
  
  // 启用编辑功能
  function enableEditing(index) {
    if (practiceResults.value[index].practiced) {
      stats.value.practiced--;
      if (practiceResults.value[index].correct) {
        stats.value.correct--;
      }
      practiceResults.value[index] = { practiced: false, correct: false };
    }
  }
  
  // 打乱单词顺序
  function shuffleWords() {
    for (let i = vocabularyList.value.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      
      [vocabularyList.value[i], vocabularyList.value[j]] = [vocabularyList.value[j], vocabularyList.value[i]];
      [userInputs.value[i], userInputs.value[j]] = [userInputs.value[j], userInputs.value[i]];
      [practiceResults.value[i], practiceResults.value[j]] = [practiceResults.value[j], practiceResults.value[i]];
      [rowVisibility.value.original[i], rowVisibility.value.original[j]] = [rowVisibility.value.original[j], rowVisibility.value.original[i]];
      [rowVisibility.value.kana[i], rowVisibility.value.kana[j]] = [rowVisibility.value.kana[j], rowVisibility.value.kana[i]];
      
      if (lastInputIndex.value === i) {
        lastInputIndex.value = j;
      } else if (lastInputIndex.value === j) {
        lastInputIndex.value = i;
      }
    }
  }
  
  // 切换假名显示
  function toggleKanaVisibility() {
    kanaHidden.value = !kanaHidden.value;
    rowVisibility.value.kana = vocabularyList.value.map(() => !kanaHidden.value);
    
    unfamiliarWords.value = unfamiliarWords.value.map(word => {
      return {
        ...word,
        unfamiliarTypes: word.unfamiliarTypes.filter(type => type !== 'kana')
      };
    }).filter(word => word.unfamiliarTypes.length > 0);
  }
  
  // 切换原文显示
  function toggleOriginalVisibility() {
    originalHidden.value = !originalHidden.value;
    rowVisibility.value.original = vocabularyList.value.map(() => !originalHidden.value);
    
    unfamiliarWords.value = unfamiliarWords.value.map(word => {
      return {
        ...word,
        unfamiliarTypes: word.unfamiliarTypes.filter(type => type !== 'original')
      };
    }).filter(word => word.unfamiliarTypes.length > 0);
  }
  
  // 清空所有内容
  function clearAll() {
    vocabularyList.value = [];
    userInputs.value = [];
    practiceResults.value = [];
    lastInputIndex.value = -1;
    mistakesList.value = [];
    unfamiliarWords.value = [];
    stats.value = { total: 0, practiced: 0, correct: 0, totalMistakes: 0 };
    kanaHidden.value = true;
    originalHidden.value = true;
    rowVisibility.value.original = [];
    rowVisibility.value.kana = [];
  }
  
  // 清空错题
  function clearMistakes() {
    mistakesList.value = [];
  }
  
  // 清空不熟悉单词
  function clearUnfamiliarWords() {
    unfamiliarWords.value = [];
  }
  
  // ==================== API 集成方法 ====================
  
  /**
   * 从 API 加载单词列表
   */
  async function loadVocabularyFromAPI(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.getAllVocabulary(params);
      const words = response.data.map(word => ({
        id: word.id,
        chinese: word.chinese,
        original: word.original || '',
        kana: word.kana,
        category: word.category || '',
        difficulty: word.difficulty || 1
      }));
      
      initVocabulary(words);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  /**
   * 批量添加单词到后端
   */
  async function batchAddVocabulary(words) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.batchCreateVocabulary(words);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  /**
   * 获取随机单词用于练习
   */
  async function loadRandomWords(count = 10, params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.getRandomVocabulary(count, params);
      const words = response.data.map(word => ({
        id: word.id,
        chinese: word.chinese,
        original: word.original || '',
        kana: word.kana,
        category: word.category || '',
        difficulty: word.difficulty || 1
      }));
      
      initVocabulary(words);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  /**
   * 获取今日待复习的单词
   */
  async function loadTodayReview() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.getTodayReview();
      const words = response.data.map(word => ({
        id: word.id,
        chinese: word.chinese,
        original: word.original || '',
        kana: word.kana,
        category: word.category || '',
        difficulty: word.difficulty || 1,
        mastery_level: word.mastery_level,
        next_review_date: word.next_review_date
      }));
      
      initVocabulary(words);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  return {
    // 数据
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
    
    // 计算属性
    hasOriginalText,
    activeMistakes,
    accuracy,
    
    // 方法
    initVocabulary,
    saveUserInput,
    checkAnswer,
    addToMistakes,
    markMistakesAsCorrected,
    recordUnfamiliarWord,
    removeUnfamiliarWord,
    enableEditing,
    shuffleWords,
    toggleKanaVisibility,
    toggleOriginalVisibility,
    clearAll,
    clearMistakes,
    clearUnfamiliarWords,
    
    // API 方法
    loadVocabularyFromAPI,
    batchAddVocabulary,
    loadRandomWords,
    loadTodayReview
  };
}
