<template>
  <div class="flex items-end gap-2">
    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">按日期筛选</label>
      <input 
        :value="modelValue" 
        @change="$emit('update:modelValue', $event.target.value)"
        type="date" 
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
    <button 
      @click="$emit('reset')" 
      :disabled="disabled"
      class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-custom text-sm flex items-center"
    >
      <i class="fa fa-redo mr-1"></i>重置
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue', 'reset']);
</script>

<style scoped>
/* 样式在全局 CSS 中继承 */
</style>
