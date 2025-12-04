<template>
  <div class="flex items-end gap-2 relative">
    <div class="relative">
      <label class="block text-xs font-medium text-gray-700 mb-1">按日期筛选</label>
      <button 
        @click="showCalendar = !showCalendar"
        :disabled="disabled"
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-left w-32"
      >
        <span class="flex items-center justify-between">
          <span>{{ formatDisplayDate }}</span>
          <i class="fa fa-calendar ml-2"></i>
        </span>
      </button>
      
      <!-- 日历弹窗 -->
      <div v-if="showCalendar && !disabled" class="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-64">
        <!-- 月份导航 -->
        <div class="flex items-center justify-between mb-3">
          <button 
            @click="previousMonth"
            class="px-2 py-1 hover:bg-gray-100 rounded text-sm transition-custom"
          >
            <i class="fa fa-chevron-left"></i>
          </button>
          <div class="text-sm font-medium text-gray-700">
            {{ currentMonthYear }}
          </div>
          <button 
            @click="nextMonth"
            class="px-2 py-1 hover:bg-gray-100 rounded text-sm transition-custom"
          >
            <i class="fa fa-chevron-right"></i>
          </button>
        </div>
        
        <!-- 星期标题 -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div v-for="day in weekDays" :key="day" class="text-center text-xs font-semibold text-gray-500 w-8 h-8 flex items-center justify-center">
            {{ day }}
          </div>
        </div>
        
        <!-- 日期网格 -->
        <div class="grid grid-cols-7 gap-1">
          <button 
            v-for="day in calendarDays" 
            :key="day.dateStr"
            @click="selectDate(day.dateStr)"
            :class="{
              'bg-primary text-white': day.isSelected,
              'text-gray-400': !day.isCurrentMonth,
              'hover:bg-gray-100': day.isCurrentMonth && !day.isSelected
            }"
            class="w-8 h-8 text-xs rounded flex items-center justify-center transition-custom font-medium"
          >
            {{ day.date }}
          </button>
        </div>
      </div>
    </div>
    
    <button 
      @click="resetFilter" 
      :disabled="disabled"
      class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-custom text-sm flex items-center"
    >
      <i class="fa fa-redo mr-1"></i>重置
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'reset']);

const showCalendar = ref(false);
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const displayDate = ref(new Date(props.modelValue || new Date()));

const formatDisplayDate = computed(() => {
  const date = new Date(props.modelValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

const currentMonthYear = computed(() => {
  const year = displayDate.value.getFullYear();
  const month = displayDate.value.getMonth() + 1;
  return `${year}年 ${month}月`;
});

const calendarDays = computed(() => {
  const year = displayDate.value.getFullYear();
  const month = displayDate.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const currentDate = new Date(startDate);
  
  while (days.length < 42) {
    const dateStr = formatDate(currentDate);
    const isCurrentMonth = currentDate.getMonth() === month;
    const isSelected = dateStr === props.modelValue;
    
    days.push({
      date: currentDate.getDate(),
      dateStr: dateStr,
      isCurrentMonth: isCurrentMonth,
      isSelected: isSelected
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
});

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function selectDate(dateStr) {
  emit('update:modelValue', dateStr);
  showCalendar.value = false;
}

function resetFilter() {
  emit('reset');
  showCalendar.value = false;
}

function previousMonth() {
  displayDate.value = new Date(displayDate.value.getFullYear(), displayDate.value.getMonth() - 1, 1);
}

function nextMonth() {
  displayDate.value = new Date(displayDate.value.getFullYear(), displayDate.value.getMonth() + 1, 1);
}
</script>

<style scoped>
/* 样式在全局 CSS 中继承 */
</style>
