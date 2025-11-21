# 消息提示系统升级 - Toast & Confirm Dialog

## 📌 问题

之前使用的消息提示方式过于粗暴：
- ❌ 使用 `alert()` 弹窗 - 阻塞用户操作
- ❌ 内联提示框 - 占用页面空间，需要手动管理状态
- ❌ 用户体验不佳 - 不够优雅和现代化

## ✅ 解决方案

实现了现代化的通知系统，包含两个核心组件：

### 1. Toast 通知组件
**文件：** `src/components/ToastNotification.vue`

**特性：**
- 🎨 优雅的右上角浮动通知
- 🎯 四种类型：success / error / warning / info
- ⏱️ 自动消失（可配置时长）
- 📚 可堆叠显示多条
- 📱 移动端响应式
- 🖱️ 点击即可关闭

**使用示例：**
```javascript
toast.success('保存成功！');
toast.error('保存失败: ' + error.message);
toast.warning('请注意！');
toast.info('提示信息');
```

### 2. 确认对话框组件
**文件：** `src/components/ConfirmDialog.vue`

**特性：**
- 💬 现代化的模态对话框
- ⚠️ 三种类型：warning / danger / info
- 🎭 优雅的遮罩和动画
- 📱 移动端自适应
- ⌨️ ESC 键取消

**使用示例：**
```javascript
// 警告确认
await confirm.warning('确定要清空所有内容吗？', '确认清空');

// 危险操作
await confirm.danger('删除后无法恢复，确定要删除吗？', '确认删除');

// 返回 Promise，用户取消时 reject(false)
try {
  await confirm.danger('删除吗？');
  // 用户确认，执行删除
  await deleteItem();
} catch {
  // 用户取消，不执行
}
```

## 📦 文件结构

### 新增文件
```
src/
├── components/
│   ├── ToastNotification.vue      # Toast 通知组件
│   └── ConfirmDialog.vue          # 确认对话框组件
├── composables/
│   ├── useToast.js                # Toast 组合式函数
│   └── useConfirm.js              # Confirm 组合式函数
├── utils/
│   └── toast.js                   # Vue 插件（同时安装 Toast 和 Confirm）
└── views/
    └── ToastTest.vue              # 测试页面
```

### 修改文件
```
src/
├── main.js                        # 注册插件
├── components/
│   └── VocabInputComponent.vue    # 使用 Toast
└── views/
    ├── Practice.vue               # 使用 Toast + Confirm
    └── AddWords.vue               # 使用 Toast + Confirm
```

## 🔄 迁移对照

### Toast 替换

**之前 - 内联提示框：**
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

**之后 - Toast：**
```vue
<script setup>
import { useToast } from '@/composables/useToast';

const toast = useToast();

function doSomething() {
  toast.error('操作失败');
}
</script>
```

### Confirm 替换

**之前 - 原生 confirm：**
```javascript
if (confirm('确定删除吗？')) {
  await deleteItem();
}
```

**之后 - ConfirmDialog：**
```javascript
import { useConfirm } from '@/composables/useConfirm';

const confirm = useConfirm();

try {
  await confirm.danger('确定删除吗？', '确认删除');
  await deleteItem();
  toast.success('删除成功');
} catch {
  // 用户取消
}
```

## 📊 改进效果

### 代码简化
- ❌ 之前：需要管理 `successMessage`、`errorMessage`、`showMessage` 等多个状态
- ✅ 之后：一行代码 `toast.success('成功')`

### 用户体验
- ❌ 之前：`alert()` 阻塞页面，内联提示占用空间
- ✅ 之后：优雅的浮动通知，不干扰用户操作

### 视觉效果
- ❌ 之前：简陋的浏览器原生弹窗
- ✅ 之后：现代化设计，流畅动画，图标提示

## 🎨 视觉设计

### Toast 样式
- **位置**：右上角浮动
- **尺寸**：最小 300px，最大 400px
- **动画**：从右侧滑入，淡出消失
- **颜色**：
  - Success: 绿色 (#10b981)
  - Error: 红色 (#ef4444)
  - Warning: 黄色 (#f59e0b)
  - Info: 蓝色 (#3b82f6)

### Confirm Dialog 样式
- **位置**：屏幕居中
- **背景**：半透明黑色遮罩
- **动画**：缩放 + 淡入淡出
- **按钮**：
  - 取消：灰色边框按钮
  - 确认：彩色填充按钮（根据类型）

## 🚀 使用建议

### 适用场景

**Toast - 用于：**
- ✅ 操作成功/失败反馈
- ✅ 加载状态提示
- ✅ 警告信息
- ✅ 一般性通知

**Confirm - 用于：**
- ✅ 删除操作确认
- ✅ 清空数据确认
- ✅ 危险操作警告
- ✅ 重要决策询问

### 不适用场景

**Toast 不适合：**
- ❌ 需要用户确认的操作（用 Confirm）
- ❌ 长篇幅的说明文字
- ❌ 需要用户输入的场景

**Confirm 不适合：**
- ❌ 简单的成功提示（用 Toast）
- ❌ 需要复杂表单的场景（用专门的 Modal）

## 📝 完整示例

```vue
<template>
  <div>
    <button @click="handleSave">保存</button>
    <button @click="handleDelete">删除</button>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import * as api from '@/services/api';

const toast = useToast();
const confirm = useConfirm();

async function handleSave() {
  try {
    await api.saveData(data);
    toast.success('数据保存成功！', '保存成功');
  } catch (error) {
    toast.error(error.message || '保存失败', '错误');
  }
}

async function handleDelete() {
  try {
    await confirm.danger(
      '删除后无法恢复，确定要删除吗？',
      '确认删除'
    );
    
    await api.deleteData(id);
    toast.success('删除成功');
  } catch (error) {
    if (error !== false) { // false 表示用户取消
      toast.error('删除失败: ' + error.message);
    }
  }
}
</script>
```

## 🔧 技术细节

### 实现原理
- 使用 Vue 3 `<Teleport>` 渲染到 body
- 通过 `createApp` 创建独立实例
- 使用 `provide/inject` 注入到应用
- Promise 化的异步确认流程

### 动画实现
- CSS Transition 实现进入/离开动画
- Transform + Opacity 实现流畅过渡
- TransitionGroup 实现列表堆叠效果

## 📚 参考文档

详细使用文档：`docs/TOAST.md`
