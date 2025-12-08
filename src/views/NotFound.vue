<template>
  <div class="bg-gradient-to-br from-light to-gray-100 min-h-screen font-sans text-dark flex items-center justify-center px-4">
    <div class="max-w-2xl w-full">
      <!-- 主卡片 -->
      <div class="bg-white rounded-lg shadow-lg p-12 text-center mb-6">
        <!-- 大型日文表示 -->
        <div class="mb-8">
          <div class="text-7xl font-bold text-primary mb-3">
            <ruby>見<rt>み</rt></ruby><ruby>つ<rt></rt></ruby><ruby>か<rt></rt></ruby><ruby>ら<rt></rt></ruby><ruby>な<rt></rt></ruby><ruby>い<rt></rt></ruby>
          </div>
          <p class="text-sm text-gray-600">みつからない - 找不到</p>
        </div>

        <!-- 404 数字 -->
        <div class="text-9xl font-bold text-primary/10 -my-8">404</div>

        <!-- 标题 -->
        <h1 class="text-3xl font-bold mb-4 mt-4 text-gray-800">
          ページが見つかりません
        </h1>
        <p class="text-lg text-gray-600 mb-2">ページが見つかりません</p>
        <p class="text-sm text-gray-500 mb-8">ページが見つかりません - 页面不存在或已被删除</p>

        <!-- 日语学习卡片样式的错误说明 -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-4xl mb-2">404</p>
              <p class="text-xs text-gray-600">エラーコード</p>
              <p class="text-xs text-gray-500">错误代码</p>
            </div>
            <div class="text-center border-l border-r border-blue-200 md:border-l-0 md:border-r-0 md:border-l md:border-r px-4">
              <p class="text-2xl mb-2">😕</p>
              <p class="text-xs text-gray-600">ページなし</p>
              <p class="text-xs text-gray-500">页面消失</p>
            </div>
            <div class="text-center">
              <p class="text-2xl mb-2">🔍</p>
              <p class="text-xs text-gray-600">探してください</p>
              <p class="text-xs text-gray-500">请搜寻</p>
            </div>
          </div>
        </div>

        <!-- 返回按钮 -->
        <div class="flex flex-col gap-3">
          <button 
            @click="$router.push('/')"
            class="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <i class="fa fa-home"></i>ホームに戻る（返回首页）
          </button>
          <button 
            @click="$router.back()"
            class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <i class="fa fa-arrow-left"></i>戻る（返回上一页）
          </button>
        </div>
      </div>

      <!-- 快速导航 - 日语学习卡片风格 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          @click="$router.push('/')"
          class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 text-center border-2 border-transparent hover:border-primary"
        >
          <p class="text-2xl mb-2">📚</p>
          <p class="text-xs font-medium text-gray-700">学習</p>
          <p class="text-xs text-gray-500">学习</p>
        </button>
        <button 
          @click="$router.push('/add')"
          class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 text-center border-2 border-transparent hover:border-green-500"
        >
          <p class="text-2xl mb-2">➕</p>
          <p class="text-xs font-medium text-gray-700">追加</p>
          <p class="text-xs text-gray-500">添加</p>
        </button>
        <button 
          @click="$router.push('/management')"
          class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 text-center border-2 border-transparent hover:border-purple-500"
        >
          <p class="text-2xl mb-2">⚙️</p>
          <p class="text-xs font-medium text-gray-700">管理</p>
          <p class="text-xs text-gray-500">管理</p>
        </button>
        <button 
          @click="$router.push('/add-table')"
          class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 text-center border-2 border-transparent hover:border-lime-500"
        >
          <p class="text-2xl mb-2">📊</p>
          <p class="text-xs font-medium text-gray-700">一括</p>
          <p class="text-xs text-gray-500">批量</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
/* 可选：添加一些动画效果 */
i {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
