<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">🐛 答案检查调试工具</h1>

      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">测试答案检查</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-2">用户输入</label>
            <input 
              v-model="userInput"
              type="text"
              placeholder="输入假名"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p class="text-xs text-gray-500 mt-1">长度: {{ userInput.length }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">正确答案</label>
            <input 
              v-model="correctAnswer"
              type="text"
              placeholder="输入假名"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p class="text-xs text-gray-500 mt-1">长度: {{ correctAnswer.length }}</p>
          </div>
        </div>

        <button 
          @click="analyzeAnswers"
          class="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-medium"
        >
          分析
        </button>
      </div>

      <div v-if="analysisResult" class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-bold mb-4">📊 分析结果</h3>
        
        <!-- 原始数据 -->
        <div class="mb-6 p-4 bg-gray-50 rounded">
          <h4 class="font-bold mb-2">1. 原始数据</h4>
          <div class="space-y-2 text-sm font-mono">
            <div>用户输入: <span class="text-blue-600">{{ analysisResult.original.userAnswer }}</span></div>
            <div>正确答案: <span class="text-green-600">{{ analysisResult.original.correctAnswer }}</span></div>
            <div>相等: <span :class="analysisResult.original.equal ? 'text-green-600' : 'text-red-600'">{{ analysisResult.original.equal }}</span></div>
          </div>
        </div>

        <!-- 字符级分析 -->
        <div class="mb-6 p-4 bg-gray-50 rounded">
          <h4 class="font-bold mb-2">2. 字符级分析</h4>
          <div class="space-y-3">
            <div>
              <p class="font-medium">用户输入字符:</p>
              <div class="text-sm font-mono bg-white p-2 rounded mt-1 overflow-x-auto">
                {{ analysisResult.charCodes.userAnswerChars.join(', ') }}
              </div>
            </div>
            <div>
              <p class="font-medium">正确答案字符:</p>
              <div class="text-sm font-mono bg-white p-2 rounded mt-1 overflow-x-auto">
                {{ analysisResult.charCodes.correctAnswerChars.join(', ') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 规范化处理 -->
        <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 class="font-bold mb-2">3. 规范化处理 (NFC + toLowerCase + trim)</h4>
          <div class="space-y-2 text-sm font-mono">
            <div>用户输入: <span class="text-blue-600">{{ analysisResult.normalized.userAnswer }}</span></div>
            <div>正确答案: <span class="text-green-600">{{ analysisResult.normalized.correctAnswer }}</span></div>
            <div>相等: <span :class="analysisResult.normalized.equal ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">{{ analysisResult.normalized.equal }}</span></div>
          </div>
        </div>

        <!-- 规范化字符 -->
        <div class="mb-6 p-4 bg-gray-50 rounded">
          <h4 class="font-bold mb-2">4. 规范化后的字符码点</h4>
          <div class="space-y-3">
            <div>
              <p class="font-medium">用户输入:</p>
              <div class="text-xs font-mono bg-white p-2 rounded mt-1 overflow-x-auto flex flex-wrap gap-2">
                <span v-for="(char, i) in analysisResult.normalizedCharCodes.userChars" :key="`u${i}`" class="bg-blue-100 px-2 py-1 rounded">
                  {{ char }}
                </span>
              </div>
            </div>
            <div>
              <p class="font-medium">正确答案:</p>
              <div class="text-xs font-mono bg-white p-2 rounded mt-1 overflow-x-auto flex flex-wrap gap-2">
                <span v-for="(char, i) in analysisResult.normalizedCharCodes.correctChars" :key="`c${i}`" class="bg-green-100 px-2 py-1 rounded">
                  {{ char }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 结论 -->
        <div :class="['p-4 rounded', analysisResult.normalized.equal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200']">
          <h4 class="font-bold mb-2">✅ 结论</h4>
          <p :class="analysisResult.normalized.equal ? 'text-green-700' : 'text-red-700'">
            {{ analysisResult.normalized.equal ? '✅ 答案相同' : '❌ 答案不同' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const userInput = ref('にほん');
const correctAnswer = ref('にほん');
const analysisResult = ref(null);

function analyzeAnswers() {
  const user = userInput.value;
  const correct = correctAnswer.value;

  // 原始比较
  const originalEqual = user === correct;

  // 字符码点分析
  const userChars = [];
  const correctChars = [];
  for (let i = 0; i < user.length; i++) {
    userChars.push(`"${user[i]}" (U+${user.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')})`);
  }
  for (let i = 0; i < correct.length; i++) {
    correctChars.push(`"${correct[i]}" (U+${correct.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')})`);
  }

  // 规范化处理
  const normalizedUser = user.normalize('NFC').toLowerCase().trim();
  const normalizedCorrect = correct.normalize('NFC').toLowerCase().trim();
  const normalizedEqual = normalizedUser === normalizedCorrect;

  // 规范化后的字符码点
  const normalizedUserChars = [];
  const normalizedCorrectChars = [];
  for (let i = 0; i < normalizedUser.length; i++) {
    normalizedUserChars.push(`"${normalizedUser[i]}" (U+${normalizedUser.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')})`);
  }
  for (let i = 0; i < normalizedCorrect.length; i++) {
    normalizedCorrectChars.push(`"${normalizedCorrect[i]}" (U+${normalizedCorrect.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')})`);
  }

  analysisResult.value = {
    original: {
      userAnswer: user,
      correctAnswer: correct,
      equal: originalEqual
    },
    charCodes: {
      userAnswerChars: userChars,
      correctAnswerChars: correctChars
    },
    normalized: {
      userAnswer: normalizedUser,
      correctAnswer: normalizedCorrect,
      equal: normalizedEqual
    },
    normalizedCharCodes: {
      userChars: normalizedUserChars,
      correctChars: normalizedCorrectChars
    }
  };

  console.log('分析结果:', analysisResult.value);
}

// 页面加载时自动分析
analyzeAnswers();
</script>
