<template>
  <section class="mt-6 bg-white rounded-xl shadow-lg p-6">
    <h2 class="text-xl font-semibold mb-4 flex items-center">
      <i class="fa fa-bar-chart text-primary mr-2"></i>学习统计
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="bg-light p-4 rounded-lg border border-gray-200">
        <p class="text-gray-600 text-sm">总单词数</p>
        <p class="text-2xl font-bold text-primary">{{ stats.total }}</p>
      </div>
      <div class="bg-light p-4 rounded-lg border border-gray-200">
        <p class="text-gray-600 text-sm">已练习</p>
        <p class="text-2xl font-bold text-primary">{{ stats.practiced }}</p>
      </div>
      <div class="bg-light p-4 rounded-lg border border-gray-200">
        <p class="text-gray-600 text-sm">正确率</p>
        <p class="text-2xl font-bold text-primary">{{ accuracy }}%</p>
      </div>
      <div class="bg-light p-4 rounded-lg border border-gray-200">
        <p class="text-gray-600 text-sm">总错误</p>
        <p class="text-2xl font-bold text-error">{{ stats.totalMistakes }}</p>
      </div>
      <div class="bg-light p-4 rounded-lg border border-gray-200">
        <p class="text-gray-600 text-sm">不熟悉</p>
        <p class="text-2xl font-bold text-amber">{{ unfamiliarCount }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  unfamiliarCount: {
    type: Number,
    required: true
  }
});
</script>
