<template>
  <div class="mt-8">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-amber flex items-center">
        <i class="fa fa-question-circle mr-2"></i>不熟悉的单词
      </h3>
      <div class="flex items-center gap-2">
        <button 
          @click="$emit('review')"
          class="text-amber hover:text-amber/80 text-sm transition-custom flex items-center"
        >
          <i class="fa fa-repeat mr-1"></i>集中复习
        </button>
        <button 
          @click="$emit('clear')"
          class="text-amber hover:text-amber/80 text-sm transition-custom flex items-center"
        >
          <i class="fa fa-trash-o mr-1"></i>清空记录
        </button>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 border border-amber/20">
        <thead class="bg-amber/10">
          <tr>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-amber uppercase tracking-wider">序号</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-amber uppercase tracking-wider">中文意思</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-amber uppercase tracking-wider">日语原文</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-amber uppercase tracking-wider">纯假名</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-amber uppercase tracking-wider">不熟悉项</th>
            <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-amber uppercase tracking-wider">朗读</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="unfamiliarWords.length === 0">
            <td colspan="6" class="px-3 py-8 text-center text-gray-500">
              暂无需要特别复习的单词
            </td>
          </tr>
          <tr 
            v-for="(item, index) in unfamiliarWords" 
            :key="index"
            class="hover:bg-amber-50 transition-custom"
          >
            <td class="px-3 py-4 whitespace-nowrap table-cell">
              <div class="text-sm font-medium text-amber">{{ index + 1 }}</div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm text-dark">{{ item.chinese }}</div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm font-medium text-gray-800">{{ item.original || '-' }}</div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm font-semibold text-primary">{{ item.kana }}</div>
            </td>
            <td class="px-3 py-4 table-cell">
              <div class="text-sm text-amber font-medium">
                {{ item.unfamiliarTypes.map(t => t === 'original' ? '单词' : '假名').join('、') }}
              </div>
            </td>
            <td class="px-3 py-4 whitespace-nowrap table-cell">
              <button 
                @click="handleRead(item.kana, $event)"
                class="bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1 rounded transition-custom"
              >
                <i class="fa fa-volume-up"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { readJapanese } from '../utils/helpers';

defineProps({
  unfamiliarWords: {
    type: Array,
    required: true
  }
});

defineEmits(['review', 'clear']);

function handleRead(kana, event) {
  readJapanese(kana);
  event.target.classList.add('btn-pulse');
  setTimeout(() => event.target.classList.remove('btn-pulse'), 500);
}
</script>
