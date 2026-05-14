// 工具函数：生成掩膜文本
export function createMaskText(text) {
  if (!text || text.trim() === '') return text;
  return '*'.repeat(text.length);
}

// 工具函数：日语振假名转换为 HTML ruby 标签
// 把「汉字（假名）」格式转换成 <ruby>汉字<rt>假名</rt></ruby>
export function furiganaToRuby(text) {
  if (!text) return text;
  
  // 匹配「汉字/汉字+假名混合（假名）」格式，替换为 <ruby>...<rt>...</rt></ruby>
  // 正则解释：
  // ([一-龯][一-龯ぁ-んァ-ン]*) - 以汉字开头，后面可以跟着汉字、平假名、片假名
  // （                        - 匹配中文左括号
  // ([^）]+)                  - 匹配一个或多个非右括号的字符（假名）
  // ）                        - 匹配中文右括号
  return text.replace(
    /([一-龯][一-龯ぁ-んァ-ン]*)（([^）]+)）/g,
    '<ruby>$1<rt>$2</rt></ruby>'
  );
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
  
  let html = '<div class="inline-flex flex-wrap gap-1">';
  diff.forEach(item => {
    let styleClass = '';
    
    if (item.type === 'equal') {
      styleClass = 'bg-gray-100 text-gray-700';
    } else if (item.type === 'delete') {
      styleClass = 'bg-red-200 text-red-700 line-through';
    } else if (item.type === 'insert') {
      styleClass = 'bg-green-200 text-green-700';
    }
    
    html += `<span class="px-1 py-0.5 rounded text-sm ${styleClass}">${item.value}</span>`;
  });
  html += '</div>';
  return html;
}

// 日语朗读函数
export function readJapanese(text) {
  console.log('🎙️ readJapanese called with:', text);
  
  if (!window.speechSynthesis) {
    console.error('❌ Speech Synthesis API not supported');
    alert('您的浏览器不支持语音合成');
    return null;
  }

  console.log('✅ Speech Synthesis API available');
  console.log('   speaking:', window.speechSynthesis.speaking);
  console.log('   pending:', window.speechSynthesis.pending);
  
  // Check if running on Android
  const isAndroid = /Android/.test(navigator.userAgent);
  console.log('📱 Device type: ' + (isAndroid ? 'Android' : 'Other'));
  
  // Check available voices count
  const initialVoices = window.speechSynthesis.getVoices();
  console.log('📢 Initial voices available: ' + initialVoices.length);
  
  // If no voices available, try waiting a bit for Android to load them
  if (initialVoices.length === 0 && isAndroid) {
    console.log('⏳ Android detected with no voices yet, waiting for voice loading...');
    // Give Android time to load voices
    return new Promise((resolve) => {
      const checkVoices = setInterval(() => {
        const voices = window.speechSynthesis.getVoices();
        console.log('  Checking voices... count:', voices.length);
        if (voices.length > 0) {
          clearInterval(checkVoices);
          console.log('✅ Voices loaded!');
          performSpeechSynthesis(text);
          resolve();
        }
      }, 500);
      
      // Timeout after 3 seconds
      setTimeout(() => {
        clearInterval(checkVoices);
        console.warn('⚠️ Timeout waiting for voices, proceeding without them');
        performSpeechSynthesis(text);
        resolve();
      }, 3000);
    });
  }

  
  performSpeechSynthesis(text);
}

function performSpeechSynthesis(text) {
  if (window.speechSynthesis.speaking) {
    console.log('⏹️ Cancelling previous speech');
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 1;     // Faster, more energetic speech
  utterance.pitch = 1.5;  // Higher pitch for louder, clearer sound
  utterance.volume = 1;   // Maximum volume

  // 获取所有可用声音并选择日语声音
  const getJapaneseVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log(`📢 Total voices available: ${voices.length}`);
    
    if (voices.length === 0) {
      console.warn('⚠️ No voices available yet');
      return null;
    }
    
    // 优先使用 Kyoko (日语声音 - 清晰自然)
    const kyokoVoice = voices.find(v => v.name.toLowerCase().includes('kyoko'));
    if (kyokoVoice) {
      console.log('✓ Using Kyoko voice:', kyokoVoice.name, kyokoVoice.lang);
      return kyokoVoice;
    }
    
    // 备用：查找任何 ja-JP 声音
    const jaJPVoices = voices.filter(v => v.lang === 'ja-JP');
    if (jaJPVoices.length > 0) {
      console.log('✓ Using first ja-JP voice:', jaJPVoices[0].name);
      return jaJPVoices[0];
    }
    
    const jaVoice = voices.find(v => v.lang.startsWith('ja-'));
    if (jaVoice) {
      console.log('✓ Found ja-* voice:', jaVoice.name, jaVoice.lang);
      return jaVoice;
    }
    
    console.warn('⚠️ No Japanese voice found, using first available');
    return voices[0] || null;
  };

  // 设置初始声音（如果可用）
  const japaneseVoice = getJapaneseVoice();
  if (japaneseVoice) {
    utterance.voice = japaneseVoice;
    console.log('🔊 Selected voice:', japaneseVoice.name, `(${japaneseVoice.lang})`);
  } else {
    console.warn('⚠️ No suitable voice found');
  }

  // 监听声音加载完成事件
  const handleVoicesChanged = () => {
    console.log('🔄 Voices changed event fired');
    const voice = getJapaneseVoice();
    if (voice && !utterance.voice) {
      utterance.voice = voice;
      console.log('✓ Voice updated on voiceschanged:', voice.name);
    }
  };

  window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

  // 设置错误处理
  utterance.onerror = (event) => {
    console.error('❌ Speech synthesis error:', event.error);
  };

  utterance.onend = () => {
    console.log('✅ Speech synthesis completed');
  };

  // 立即尝试播放，如果失败会由voice loaded后重试
  try {
    console.log('▶️ Starting speech synthesis');
    window.speechSynthesis.speak(utterance);
    console.log('✓ Speech synthesis queued successfully');
  } catch (error) {
    console.error('❌ Exception during speech synthesis:', error);
  }

  return utterance;
}
