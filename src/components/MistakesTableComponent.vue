<template>
  <div class="mt-8">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-error flex items-center">
        <i class="fa fa-exclamation-circle mr-2"></i>错题历史记录
      </h3>
      <div class="flex items-center gap-2">
        <button 
          @click="$emit('goToLastInput')"
          :disabled="!canGoToLastInput"
          class="text-gray-600 hover:text-primary text-sm transition-custom flex items-center"
          :class="canGoToLastInput ? '' : 'opacity-50 cursor-not-allowed'"
        >
          <i class="fa fa-arrow-up mr-1"></i>返回最后输入
        </button>
        <button 
          @click="$emit('copy')"
          class="text-gray-600 hover:text-primary text-sm transition-custom flex items-center"
        >
          <i class="fa fa-copy mr-1"></i>复制为Markdown
        </button>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 border border-error/20">
        <thead class="bg-error/10">
          <tr>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">序号</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">中文意思</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">日语原文</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">正确答案</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">你的答案</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">差异对比</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">状态</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-error uppercase tracking-wider">朗读</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="sortedMistakes.length === 0">
            <td colspan="8" class="px-3 py-8 text-center text-gray-500">
              暂无错题记录
            </td>
          </tr>
          <tr 
            v-for="(item, index) in sortedMistakes" 
            :key="index"
            class="transition-custom"
            :class="item.corrected ? 'hover:bg-green-50 bg-green-50/50' : 'hover:bg-red-50'"
          >
            <td class="px-3 py-4 whitespace-nowrap table-cell">
              <div class="text-sm font-medium" :class="item.corrected ? 'text-secondary' : 'text-error'">
                {{ index + 1 }}
              </div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm text-dark">{{ item.chinese }}</div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm font-medium text-gray-800">{{ item.original || '-' }}</div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm font-semibold" :class="item.corrected ? 'text-secondary' : 'text-error'">
                {{ item.kana }}
              </div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm font-medium" :class="item.corrected ? 'text-secondary' : 'text-error'">
                {{ item.userAnswer || '未输入' }}
              </div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm" v-html="generateDiffHtml(item.diff)"></div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm font-medium" :class="item.corrected ? 'text-secondary' : 'text-error'">
                {{ item.corrected ? '已纠正' : '未纠正' }}
              </div>
            </td>
            <td class="px-3 py-4 whitespace-nowrap table-cell">
              <button 
                @click="handleRead(item.kana, $event)"
                class="bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1 rounded transition-custom"
                title="朗读正确答案"
              >
                <i class="fa fa-volume-up"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <button 
      @click="$emit('clear')"
      class="mt-4 text-error hover:text-error/80 text-sm transition-custom flex items-center"
    >
      <i class="fa fa-trash-o mr-1"></i>清空错题记录
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { generateDiffHtml, readJapanese } from '../utils/helpers';

const props = defineProps({
  mistakesList: {
    type: Array,
    required: true
  },
  canGoToLastInput: {
    type: Boolean,
    default: false
  }
});

defineEmits(['goToLastInput', 'copy', 'clear']);

const sortedMistakes = computed(() => {
  return [...props.mistakesList].sort((a, b) => b.timestamp - a.timestamp);
});

function handleRead(kana, event) {
  readJapanese(kana);
  event.target.classList.add('btn-pulse');
  setTimeout(() => event.target.classList.remove('btn-pulse'), 500);
}
</script>
