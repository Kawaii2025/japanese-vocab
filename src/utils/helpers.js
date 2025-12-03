// 工具函数：生成掩膜文本
export function createMaskText(text) {
  if (!text || text.trim() === '') return text;
  return '*'.repeat(text.length);
}

// 工具函数：判断文本是否为中文
export function isChinese(text) {
  if (!text) return false;
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text);
}

// 工具函数：判断文本是否为日语假名
export function isKana(text) {
  if (!text) return false;
  const kanaRegex = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
  return kanaRegex.test(text);
}

// 工具函数：判断文本是否为日语原文
export function isJapaneseOriginal(text) {
  if (!text) return false;
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;
  return japaneseRegex.test(text) && !isKana(text);
}

// 计算两个字符串的差异
export function getDiff(userAnswer, correctAnswer) {
  const diff = [];
  
  // 找到两个字符串的公共前缀
  let prefixLen = 0;
  while (prefixLen < userAnswer.length && prefixLen < correctAnswer.length && 
         userAnswer[prefixLen] === correctAnswer[prefixLen]) {
    prefixLen++;
  }
  
  // 添加公共前缀
  if (prefixLen > 0) {
    diff.push({
      type: 'equal',
      value: userAnswer.substring(0, prefixLen)
    });
  }
  
  // 处理剩余部分
  const userRemaining = userAnswer.substring(prefixLen);
  const correctRemaining = correctAnswer.substring(prefixLen);
  
  // 添加用户输入的多余部分（删除）
  if (userRemaining.length > 0) {
    diff.push({
      type: 'delete',
      value: userRemaining
    });
  }
  
  // 添加正确答案中用户缺失的部分（插入）
  if (correctRemaining.length > 0) {
    diff.push({
      type: 'insert',
      value: correctRemaining
    });
  }
  
  return diff;
}

// 生成差异对比的HTML
export function generateDiffHtml(diff) {
  if (!diff || diff.length === 0) return '';
  
  let html = '<div class="diff-container">';
  diff.forEach(item => {
    html += `<span class="diff-item diff-${item.type}">${item.value}</span>`;
  });
  html += '</div>';
  return html;
}

// 日语朗读函数
export function readJapanese(text) {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  utterance.volume = 1;

  // 获取所有可用声音并选择日语声音
  const getJapaneseVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    
    // 优先选择日语(日本)的声音
    return voices.find(v => v.lang === 'ja-JP') ||
           // 次选其他日语变体
           voices.find(v => v.lang.startsWith('ja-')) ||
           // 最后选任何日语
           voices.find(v => v.lang.includes('ja')) ||
           // 如果没有日语，选择第一个可用声音
           voices[0] ||
           null;
  };

  // 设置初始声音（如果可用）
  const japaneseVoice = getJapaneseVoice();
  if (japaneseVoice) {
    utterance.voice = japaneseVoice;
  }

  // 监听声音加载完成事件
  const handleVoicesChanged = () => {
    const voice = getJapaneseVoice();
    if (voice && !utterance.voice) {
      utterance.voice = voice;
    }
  };

  // 在某些浏览器上，voiceschanged事件可能被多次触发
  window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

  // 立即尝试播放，如果失败会由voice loaded后重试
  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }

  return utterance;
}
