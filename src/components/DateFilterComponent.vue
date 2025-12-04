<template>
  <div class="relative">
    <button 
      type="button"
      @click="showCalendar = !showCalendar"
      :disabled="disabled"
      class="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-left"
    >
      <span class="flex items-center gap-2">
        <span>{{ formatDisplayDate }}</span>
        <i class="fa fa-calendar"></i>
      </span>
    </button>
    
    <!-- 日历弹窗 -->
    <div v-if="showCalendar && !disabled" class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-64">
      <!-- 月份导航 -->
      <div class="flex items-center justify-between mb-3">
        <button 
          type="button"
          @click="previousMonth"
          class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
        >
          <i class="fa fa-chevron-left"></i>
        </button>
        <div class="text-sm font-medium">
          {{ currentMonthYear }}
        </div>
        <button 
          type="button"
          @click="nextMonth"
          class="px-2 py-1 hover:bg-gray-100 rounded text-sm"
        >
          <i class="fa fa-chevron-right"></i>
        </button>
      </div>
      
      <!-- 星期标题 -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div v-for="day in weekDays" :key="day" class="text-center text-xs font-semibold text-gray-500 h-8 flex items-center justify-center">
          {{ day }}
        </div>
      </div>
      
      <!-- 日期网格 -->
      <div class="grid grid-cols-7 gap-1 mb-3">
        <button 
          v-for="day in calendarDays" 
          :key="day.dateStr"
          type="button"
          @click="selectDate(day.dateStr)"
          :disabled="!day.isCurrentMonth || day.isFuture"
          :class="{
            'bg-primary text-white': day.isSelected,
            'ring-2 ring-primary': day.isCurrentDay && !day.isSelected,
            'text-gray-400': !day.isCurrentMonth || day.isFuture,
            'hover:bg-gray-100': day.isCurrentMonth && !day.isSelected && !day.isFuture
          }"
          class="h-8 text-xs rounded font-medium transition-colors"
        >
          {{ day.date }}
        </button>
      </div>
      
      <!-- 按钮组 -->
      <div class="flex gap-2">
        <button 
          type="button"
          @click="resetFilter"
          class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
        >
          <i class="fa fa-redo mr-1"></i>今日
        </button>
        <button 
          type="button"
          @click="clearFilter"
          class="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
        >
          全部
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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

const emit = defineEmits(['update:modelValue', 'reset', 'clear']);

const showCalendar = ref(false);
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const displayDate = ref(new Date(props.modelValue || new Date()));

// 监听 modelValue 变化，同步更新 displayDate
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const date = new Date(newValue);
    if (!isNaN(date.getTime())) {
      displayDate.value = date;
    }
  } else {
    displayDate.value = new Date();
  }
});

const formatDisplayDate = computed(() => {
  if (!props.modelValue) {
    return '选择日期';
  }
  const date = new Date(props.modelValue);
  if (isNaN(date.getTime())) {
    return '选择日期';
  }
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
  
  // 获取今天的日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);
  
  const days = [];
  const currentDate = new Date(startDate);
  
  while (days.length < 42) {
    const dateStr = formatDate(currentDate);
    const isCurrentMonth = currentDate.getMonth() === month;
    const isSelected = dateStr === props.modelValue;
    const isCurrentDay = dateStr === todayStr;
    const isFuture = currentDate > today;
    
    days.push({
      date: currentDate.getDate(),
      dateStr: dateStr,
      isCurrentMonth: isCurrentMonth,
      isSelected: isSelected,
      isCurrentDay: isCurrentDay,
      isFuture: isFuture
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

function clearFilter() {
  emit('clear');
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
