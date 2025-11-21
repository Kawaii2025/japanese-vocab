import { ref, computed } from 'vue';

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
    practiceResults.value = new Array(list.length).fill({ 
      practiced: false, 
      correct: false 
    });
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
  function checkAnswer(index, userAnswer) {
    const wordData = vocabularyList.value[index];
    
    practiceResults.value[index].practiced = true;
    stats.value.practiced++;
    
    const isCorrect = userAnswer === wordData.kana;
    
    if (isCorrect) {
      practiceResults.value[index].correct = true;
      stats.value.correct++;
      markMistakesAsCorrected(wordData);
    } else {
      stats.value.totalMistakes++;
      practiceResults.value[index].correct = false;
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
    clearUnfamiliarWords
  };
}
