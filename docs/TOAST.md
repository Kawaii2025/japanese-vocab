# Toast 通知组件使用文档

## 概述

Toast 通知组件提供优雅、非侵入式的消息提示功能，替代传统的 `alert()` 弹窗。

## 特性

- ✅ **轻量优雅**：流畅的动画和现代化设计
- ✅ **类型丰富**：成功、错误、警告、信息四种类型
- ✅ **自动消失**：可配置的显示时长
- ✅ **可堆叠**：支持同时显示多条通知
- ✅ **响应式**：移动端自适应
- ✅ **可交互**：点击通知或关闭按钮即可关闭

## 使用方法

### 1. 在组件中使用（推荐）

```vue
<script setup>
import { useToast } from '@/composables/useToast.js';

const toast = useToast();

function handleSave() {
  try {
    // ... 保存逻辑
    toast.success('保存成功！');
  } catch (error) {
    toast.error('保存失败：' + error.message);
  }
}
</script>
```

### 2. 在 Options API 中使用

```vue
<script>
export default {
  methods: {
    handleSave() {
      this.$toast.success('保存成功！');
    }
  }
}
</script>
```

## API

### 快捷方法

```javascript
// 成功提示（绿色，3秒）
toast.success(message, title?)

// 错误提示（红色，5秒）
toast.error(message, title?)

// 警告提示（黄色，4秒）
toast.warning(message, title?)

// 信息提示（蓝色，3秒）
toast.info(message, title?)
```

### 完整配置

```javascript
toast.addToast({
  type: 'success',      // 'success' | 'error' | 'warning' | 'info'
  message: '消息内容',
  title: '标题',        // 可选
  duration: 3000        // 显示时长（毫秒），0 表示不自动关闭
})
```

### 手动控制

```javascript
// 显示通知并获取 ID
const id = toast.addToast({ ... });

// 手动关闭特定通知
toast.removeToast(id);

// 关闭所有通知
toast.clearAll();
```

## 示例

### 基础用法

```javascript
// 简单提示
toast.success('操作成功！');
toast.error('操作失败！');
toast.warning('请注意！');
toast.info('提示信息');
```

### 带标题

```javascript
toast.success('您的数据已成功保存到服务器', '保存成功');
toast.error('无法连接到服务器，请检查网络', '连接失败');
```

### 异步操作

```javascript
async function saveData() {
  try {
    await api.save(data);
    toast.success('数据保存成功！', '完成');
  } catch (error) {
    toast.error(error.message || '保存失败', '错误');
  }
}
```

### 批量操作反馈

```javascript
async function batchImport(words) {
  const total = words.length;
  let success = 0;
  
  for (const word of words) {
    try {
      await api.addWord(word);
      success++;
    } catch (error) {
      console.error(error);
    }
  }
  
  if (success === total) {
    toast.success(`全部 ${total} 个单词导入成功！`, '导入完成');
  } else if (success > 0) {
    toast.warning(`成功 ${success} 个，失败 ${total - success} 个`, '部分成功');
  } else {
    toast.error('所有单词导入失败', '导入失败');
  }
}
```

## 迁移指南

### 从内联提示迁移

**之前：**
```vue
<template>
  <div v-if="errorMessage" class="error-box">
    {{ errorMessage }}
  </div>
</template>

<script setup>
const errorMessage = ref('');

function doSomething() {
  errorMessage.value = '操作失败';
  setTimeout(() => errorMessage.value = '', 3000);
}
</script>
```

**之后：**
```vue
<script setup>
import { useToast } from '@/composables/useToast.js';

const toast = useToast();

function doSomething() {
  toast.error('操作失败');
}
</script>
```

### 从 alert/confirm 迁移

**之前：**
```javascript
alert('保存成功！');
if (confirm('确定要删除吗？')) {
  // ...
}
```

**之后：**
```javascript
// 提示信息
toast.success('保存成功！');

// 确认对话框（需要另外实现 Modal 组件）
// Toast 主要用于提示，不适合用于确认操作
```

## 最佳实践

### ✅ 推荐

```javascript
// 1. 清晰的消息
toast.success('保存成功');
toast.error('网络连接失败');

// 2. 适当的类型
toast.error('删除失败');  // 错误用 error
toast.warning('余额不足'); // 警告用 warning
toast.info('新消息');     // 通知用 info

// 3. 简洁的文本
toast.success('操作成功');  // ✓
toast.success('您的操作已经成功完成！'); // ✗ 太长
```

### ❌ 避免

```javascript
// 1. 过长的消息
toast.info('这是一条非常非常长的消息...');  // ✗

// 2. 频繁的通知
for (let i = 0; i < 100; i++) {
  toast.info('消息 ' + i);  // ✗ 会造成堆积
}

// 3. 敏感信息
toast.error('密码错误：' + password);  // ✗ 不要显示密码
```

## 样式定制

Toast 组件使用 Tailwind CSS 和自定义样式，可以通过修改 `ToastNotification.vue` 中的样式来定制外观。

### 自定义颜色

```vue
<!-- ToastNotification.vue -->
<style scoped>
.toast-success {
  border-left: 4px solid #10b981;  /* 修改成功颜色 */
}
</style>
```

### 自定义位置

```vue
<style scoped>
.toast-container {
  top: 20px;     /* 距离顶部 */
  right: 20px;   /* 距离右侧 */
  /* 改为左上角：left: 20px; */
  /* 改为底部：bottom: 20px; top: auto; */
}
</style>
```

## 技术细节

- **框架**：Vue 3 Composition API
- **传送**：使用 `<Teleport>` 渲染到 body
- **动画**：CSS Transition + Transform
- **图标**：Font Awesome 4.7
- **响应式**：移动端自适应（< 640px）

## 浏览器支持

- Chrome/Edge ≥ 90
- Firefox ≥ 88
- Safari ≥ 14
- 移动端浏览器

## 相关文件

- `src/components/ToastNotification.vue` - Toast 组件
- `src/composables/useToast.js` - 组合式函数
- `src/utils/toast.js` - Vue 插件
- `src/main.js` - 插件注册
