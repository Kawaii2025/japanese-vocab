<template>
  <div class="min-h-screen bg-gray-50 p-4 md:p-6">
    <!-- 头部 -->
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">单词管理</h1>
        <button 
          @click="goBack"
          class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-custom flex items-center"
        >
          <i class="fa fa-arrow-left mr-2"></i>返回
        </button>
      </div>

      <!-- 搜索和筛选 -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-3 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">搜索单词</label>
            <input 
              v-model="searchKeyword"
              type="text"
              placeholder="输入日语、中文或英文..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              @keyup.enter="handleSearch"
            />
          </div>
          <!-- 日期筛选 放在搜索框右边 -->
          <DateFilterComponent 
            :model-value="selectedDate"
            :disabled="loading"
            @update:model-value="handleDateChange"
            @reset="resetDateFilter"
            @clear="clearDateFilter"
          />
          <button 
            @click="handleSearch"
            :disabled="loading"
            class="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-custom flex items-center disabled:opacity-50"
          >
            <i class="fa fa-search mr-2"></i>{{ loading ? '搜索中...' : '搜索' }}
          </button>
          <button 
            @click="resetSearch"
            class="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-custom flex items-center"
          >
            <i class="fa fa-refresh mr-2"></i>重置
          </button>
        </div>
      </div>

      <!-- 单词列表 -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden relative">
        <!-- 加载蒙版 -->
        <div v-if="loading" class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div class="flex flex-col items-center gap-2">
            <div class="animate-spin">
              <i class="fa fa-spinner text-2xl text-primary"></i>
            </div>
            <span class="text-sm text-gray-600">加载中...</span>
          </div>
        </div>
        <table class="w-full">
          <thead class="bg-gray-100 border-b">
            <tr class="text-left">
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">日语</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">假名</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">中文</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">英文</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">添加时间</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="vocabularyList.length === 0" class="border-b">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                {{ loading ? '加载中...' : '没有找到单词' }}
              </td>
            </tr>
            <tr v-for="word in vocabularyList" :key="word.id" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3">
                <span v-if="editingId !== word.id" class="text-gray-900">{{ word.original }}</span>
                <input 
                  v-else
                  v-model="editForm.original"
                  type="text"
                  class="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </td>
              <td class="px-4 py-3">
                <span v-if="editingId !== word.id" class="text-gray-700">{{ word.kana }}</span>
                <input 
                  v-else
                  v-model="editForm.kana"
                  type="text"
                  class="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </td>
              <td class="px-4 py-3">
                <span v-if="editingId !== word.id" class="text-gray-900">{{ word.chinese }}</span>
                <input 
                  v-else
                  v-model="editForm.chinese"
                  type="text"
                  class="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </td>
              <td class="px-4 py-3">
                <span v-if="editingId !== word.id" class="text-gray-700">{{ word.english || '-' }}</span>
                <input 
                  v-else
                  v-model="editForm.english"
                  type="text"
                  class="w-full px-2 py-1 border border-gray-300 rounded"
                  placeholder="可选"
                />
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ formatDate(word.input_date) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button 
                    v-if="editingId !== word.id"
                    @click="startEdit(word)"
                    class="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm transition-custom"
                  >
                    <i class="fa fa-edit"></i>
                  </button>
                  <button 
                    v-else
                    @click="saveEdit(word.id)"
                    :disabled="saving"
                    class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm transition-custom disabled:opacity-50"
                  >
                    <i class="fa fa-save"></i>
                  </button>
                  <button 
                    v-if="editingId === word.id"
                    @click="cancelEdit"
                    class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm transition-custom"
                  >
                    <i class="fa fa-times"></i>
                  </button>
                  <button 
                    v-if="editingId !== word.id"
                    @click="confirmDelete(word.id, word.original)"
                    class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition-custom"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 分页 -->
        <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
          <span class="text-sm text-gray-600">
            第 {{ pagination.page }} 页，共 {{ pagination.totalPages }} 页（{{ pagination.total }} 个单词）
          </span>
          <div class="flex gap-2">
            <button 
              @click="previousPage"
              :disabled="pagination.page === 1 || loading"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-custom"
            >
              <i class="fa fa-chevron-left mr-1"></i>上一页
            </button>
            <button 
              @click="nextPage"
              :disabled="!pagination.hasNext || loading"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-custom"
            >
              下一页<i class="fa fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';
import DateFilterComponent from '../components/DateFilterComponent.vue';
import * as api from '../services/api';

const router = useRouter();
const toast = useToast();

const vocabularyList = ref([]);
const searchKeyword = ref('');
const selectedDate = ref('');
const loading = ref(false);
const saving = ref(false);
const editingId = ref(null);
const editForm = ref({});

const pagination = ref({
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  hasNext: false,
  hasPrev: false
});

// 加载单词列表
async function loadVocabulary(page = 1) {
  loading.value = true;
  try {
    const response = await api.getAllVocabulary({ 
      page, 
      pageSize: pagination.value.pageSize 
    });
    vocabularyList.value = response.data || [];
    pagination.value = response.pagination || {};
  } catch (error) {
    console.error('加载单词失败:', error);
    toast.error('加载单词失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 搜索单词
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    toast.warning('请输入搜索关键词');
    return;
  }
  
  loading.value = true;
  try {
    const response = await api.searchVocabulary(searchKeyword.value);
    vocabularyList.value = response.data || [];
    pagination.value = {
      total: response.total || 0,
      page: 1,
      pageSize: pagination.value.pageSize,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };
  } catch (error) {
    console.error('搜索失败:', error);
    toast.error('搜索失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 重置搜索
function resetSearch() {
  searchKeyword.value = '';
  selectedDate.value = '';
  loadVocabulary(1);
}

// 处理日期改变
async function handleDateChange(newDate) {
  selectedDate.value = newDate;
  loading.value = true;
  await loadVocabularyByDate();
}

// 按日期筛选单词
async function loadVocabularyByDate() {
  if (!selectedDate.value) {
    toast.warning('请选择日期');
    loading.value = false;
    return;
  }
  
  try {
    const response = await api.getVocabularyByDate(selectedDate.value);
    vocabularyList.value = response.data || [];
    pagination.value = {
      total: response.total || response.data.length,
      page: 1,
      pageSize: response.data.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };
    
    const dateObj = new Date(selectedDate.value);
    const dateStr = dateObj.toLocaleDateString('zh-CN');
    toast.success(`找到 ${response.data.length} 个单词（${dateStr}）`);
  } catch (error) {
    console.error('按日期筛选失败:', error);
    toast.error('筛选失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 重置日期筛选
async function resetDateFilter() {
  selectedDate.value = getTodayDate();
  loading.value = true;
  await loadVocabularyByDate();
}

// 清空日期条件，查看所有单词
async function clearDateFilter() {
  selectedDate.value = '';
  loadVocabulary(1);
}

// 获取今天日期（北京时区）
function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 开始编辑
function startEdit(word) {
  editingId.value = word.id;
  editForm.value = {
    original: word.original,
    kana: word.kana,
    chinese: word.chinese,
    english: word.english || ''
  };
}

// 取消编辑
function cancelEdit() {
  editingId.value = null;
  editForm.value = {};
}

// 保存编辑
async function saveEdit(id) {
  if (!editForm.value.chinese.trim()) {
    toast.warning('中文翻译不能为空');
    return;
  }

  saving.value = true;
  try {
    await api.updateVocabulary(id, editForm.value);
    toast.success('单词已更新');
    editingId.value = null;
    await loadVocabulary(pagination.value.page);
  } catch (error) {
    console.error('更新失败:', error);
    toast.error('更新失败: ' + error.message);
  } finally {
    saving.value = false;
  }
}

// 删除确认
function confirmDelete(id, word) {
  if (confirm(`确定要删除单词 "${word}" 吗？`)) {
    deleteWord(id);
  }
}

// 删除单词
async function deleteWord(id) {
  loading.value = true;
  try {
    await api.deleteVocabulary(id);
    toast.success('单词已删除');
    await loadVocabulary(pagination.value.page);
  } catch (error) {
    console.error('删除失败:', error);
    toast.error('删除失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 分页
function previousPage() {
  if (pagination.value.page > 1) {
    loading.value = true;
    loadVocabulary(pagination.value.page - 1);
  }
}

function nextPage() {
  if (pagination.value.hasNext) {
    loading.value = true;
    loadVocabulary(pagination.value.page + 1);
  }
}

// 格式化日期
function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
}

// 返回
function goBack() {
  router.push('/');
}

// 初始化
onMounted(() => {
  loadVocabulary();
});
</script>

<style scoped>
/* 样式在全局 CSS 中继承 */
</style>
