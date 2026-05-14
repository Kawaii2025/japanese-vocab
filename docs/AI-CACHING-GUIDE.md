# AI 缓存使用指南

## 📖 目录

1. [缓存关联机制](#缓存关联机制)
2. [请求正确对应性保障](#请求正确对应性保障)
3. [预生成与用户请求冲突处理](#预生成与用户请求冲突处理)
4. [实际应用场景](#实际应用场景)
5. [环境变量配置](#环境变量配置)
6. [模型配置](#模型配置)
7. [超时配置](#超时配置)
8. [常见问题](#常见问题)
9. [最佳实践](#最佳实践)

---

## 缓存关联机制

### 核心原理

**缓存不是跟数据库里的单词 ID 绑定，而是跟「单词的内容」绑定！**

### 缓存匹配字段

| 字段 | 说明 | 必填 |
|------|------|------|
| `original` (word) | 日语单词 | 否 |
| `kana` | 假名 | 是 |
| `chinese` | 中文含义 | 是 |
| `word_class` | 词性 | 否 |

### 代码流程

#### 1️⃣ 保存缓存 (`saveCachedExamples`)

```javascript
async function saveCachedExamples(word, kana, chinese, wordClass, examples) {
  // 把这些作为缓存的 key
  const cacheKeyOriginal = word || null;  // 日语单词
  const cacheKeyKana = kana;             // 假名
  const cacheKeyChinese = chinese;       // 中文含义
  const cacheKeyWordClass = wc || null;  // 词性
  
  // 存入数据库
  INSERT INTO ai_examples_cache 
    (original, kana, chinese, word_class, examples_json, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
}
```

#### 2️⃣ 查询缓存 (`getCachedExamples`)

```javascript
async function getCachedExamples(word, kana, chinese, wordClass) {
  // 用同样的 key 去匹配
  SELECT examples_json FROM ai_examples_cache 
  WHERE 
    COALESCE(original, '') = COALESCE(?, '')  // 单词必须相同
    AND kana = ?                              // 假名必须相同
    AND chinese = ?                           // 中文必须相同
    AND COALESCE(word_class, '') = COALESCE(?, '') // 词性必须相同
}
```

---

## 请求正确对应性保障

### 核心问题

当用户快速点击多个单词的 AI 例句按钮，或者在请求过程中切换单词时，如何确保每个请求的结果正确对应到相应的单词？

### 解决方案

#### 1️⃣ Pending 请求跟踪

使用 Set 数据结构跟踪正在进行的请求：

```javascript
// Practice.vue
const pendingAiRequestWordIds = ref(new Set());

// AddWordsTable.vue
const pendingAiWordIds = ref(new Set());
```

#### 2️⃣ 关键检查点

在所有回调函数中都进行双重检查：

```javascript
// 检查 1: 弹窗是否还打开
if (showAiModal.value) {
  // 检查 2: 当前显示的单词 ID 是否匹配请求的单词 ID
  if (currentAiWord.value?.id === word.id) {
    // 只有两个条件都满足时才更新 UI
    aiExamples.value = [...finalExamples];
    aiLoading.value = false;
  }
}
```

#### 3️⃣ 闭包捕获

使用闭包正确捕获每个请求对应的 `word` 对象，确保回调函数引用正确。

### 具体检查点

| 回调类型 | 检查条件 |
|---------|---------|
| 流式完成回调 | `showAiModal.value && currentAiWord.value?.id === word.id` |
| 流式错误回调 | `showAiModal.value && currentAiWord.value?.id === word.id` |
| 流式文本更新 | `showAiModal.value && currentAiWord.value?.id === word.id` |
| 流式状态更新 | `showAiModal.value && currentAiWord.value?.id === word.id` |
| 非流式完成 | `showAiModal.value && currentAiWord.value?.id === word.id` |
| 非流式错误 | `showAiModal.value && currentAiWord.value?.id === word.id` |

### 防重复请求机制

```javascript
// showAiExample 函数开头
if (pendingAiRequestWordIds.value.has(word.id)) {
  // 如果已经在请求中，只打开弹窗显示 loading，不重复请求
  currentAiWord.value = word;
  showAiModal.value = true;
  // ... 显示 loading 状态
  return;
}

// 标记为正在请求中
pendingAiRequestWordIds.value.add(word.id);
```

---

## 预生成与用户请求冲突处理

### 核心问题

当后台正在预生成某个单词的 AI 例句时，用户此时点击这个单词的按钮，如何处理冲突？

### 解决方案

#### 1️⃣ 共享的 Pending 跟踪

预生成和用户请求使用同一个 `pendingAiRequestWordIds` Set：

```javascript
// preCacheAiExample 函数开头
if (preCachedWordIds.value.has(word.id) || pendingAiRequestWordIds.value.has(word.id)) {
  // 如果已预生成或正在请求中，跳过
  return;
}

// 标记为正在请求中
pendingAiRequestWordIds.value.add(word.id);
```

#### 2️⃣ 用户优先策略

- 用户请求总是优先处理
- 预生成会检查 pending 状态，避免和用户请求冲突
- 如果用户点击时单词正在预生成中，打开弹窗等待结果

#### 3️⃣ 预生成完成时检查 UI

预生成完成后检查用户是否正在查看这个单词的弹窗：

```javascript
// 预生成完成后
preCachedWordIds.value.add(word.id);

// 检查用户是否正在查看这个单词的弹窗
if (showAiModal.value && currentAiWord.value?.id === word.id) {
  // 如果是，更新 UI
  aiExamples.value = response.data?.examples || [];
  aiIsCached.value = response.data?.cached || false;
  aiModel.value = response.data?.model || null;
  aiLoading.value = false;
  aiStatus.value = '';
  aiError.value = null;
}
```

### 冲突场景处理

| 场景 | 处理方式 |
|------|---------|
| 预生成进行中，用户点击这个单词 | 弹窗打开显示 loading，预生成完成时自动更新弹窗内容 |
| 用户正在查看弹窗，预生成也完成了这个单词 | 预生成完成时检查并更新弹窗 UI |
| 用户点击时单词不在 pending | 正常发起用户请求，优先处理 |
| 预生成检查发现单词在 pending | 跳过预生成这个单词 |

### 批量预生成机制

```javascript
async function preCacheCurrentPageAiExamples() {
  if (!enablePreCache.value || preCachingInProgress.value) {
    return;
  }
  
  preCachingInProgress.value = true;
  
  // 逐个预生成，避免并发过多
  for (const word of vocabularyList.value) {
    await preCacheAiExample(word);
    // 简单节流
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  preCachingInProgress.value = false;
}
```

---

## 实际应用场景

### 场景 1：先看例句，再保存单词

| 步骤 | 动作 | 缓存状态 |
|------|------|----------|
| 1️⃣ | 在新增页面输入：<br>`word="振るう"`, `kana="ふるう"`, `chinese="发挥"` | - |
| 2️⃣ | 点击"生成例句" | ✅ **缓存已保存** <br>key: `{word:"振るう", kana:"ふるう", chinese:"发挥"}` |
| 3️⃣ | 点击"保存"，单词存入数据库 | - |
| 4️⃣ | 在单词列表再次点击"生成例句" | ✅ **直接命中缓存** <br>用同样的 key 查询到之前的缓存 |

### 场景 2：修改单词内容

| 步骤 | 动作 | 缓存状态 |
|------|------|----------|
| 1️⃣ | 单词: `振るう`, 中文: `发挥` | 有缓存 |
| 2️⃣ | 修改中文为: `挥动` | 旧缓存仍在，不会被覆盖 |
| 3️⃣ | 再次生成例句 | 会生成新的缓存 |

---

## 环境变量配置

### 前端配置 (`.env`)

```env
# 流式响应开关：true=流式，false=非流式
VITE_USE_STREAMING_AI=false

# 禁用缓存开关：true=禁用，false=启用
VITE_DISABLE_AI_CACHE=false
```

### 后端配置 (`api/.env`)

```env
# 阿里千问 API Key
DASHSCOPE_API_KEY=your_api_key

# 模型名称
QWEN_MODEL=qwen-plus
# 可选: qwen-plus, qwen3.5-plus, qwen3.6-plus, qwen3.6-flash, kimi/kimi-k2.6
```

---

## 模型配置

### 推荐模型

| 模型 | 速度 | 质量 | 推荐场景 |
|------|------|------|----------|
| `qwen-plus` | ⚡ 快 | ✅ 好 | 日常使用，速度优先 |
| `qwen3.6-flash` | ⚡⚡ 快 | ✅✅ 很好 | 更快更强 |
| `qwen3.6-plus` | 🐢 慢 | ✅✅✅ 最好 | 需要高质量时 |
| `kimi/kimi-k2.6` | - | - | 可选替代方案 |

### 切换模型

只需要修改 `api/.env`：

```env
QWEN_MODEL=qwen-plus
# 或者
QWEN_MODEL=kimi/kimi-k2.6
```

---

## 超时配置

### 当前配置

| 层级 | 超时时间 | 文件位置 |
|------|----------|----------|
| 前端浏览器 | 120 秒 | `src/services/api.js` |
| 后端 Express | 120 秒 | `api/server.js` |
| OpenAI 客户端 | 120 秒 | `api/controllers/ai.controller.js` |

### 为什么 120 秒？

- 慢模型（如 qwen3.6-plus）推理时间较长
- 给足够时间完成生成，避免频繁超时

---

## 常见问题

### Q1: 单词还没保存，缓存能用吗？

✅ **可以用！** 缓存是基于内容的，不是基于数据库 ID。

### Q2: 修改了单词内容，缓存还在吗？

✅ **在！** 会保留旧缓存，同时生成新缓存。

### Q3: 如何强制刷新缓存？

点击模态框里的 **"重新生成"** 按钮，或者设置 `forceRefresh: true`。

### Q4: 如何完全禁用缓存？

在前端 `.env` 里设置：

```env
VITE_DISABLE_AI_CACHE=true
```

---

## 最佳实践

1. **默认启用缓存** - 节省 token，提高速度
2. **开发时可禁用缓存** - 方便测试
3. **优先用快模型** - `qwen-plus` 或 `qwen3.6-flash`
4. **用流式响应** - 提升用户体验（看到实时生成过程）
5. **缓存是内容绑定的** - 不用关心单词是否已保存

---

## 📝 总结

| 特性 | 说明 |
|------|------|
| 缓存关联依据 | 单词内容（word + kana + chinese + wordClass） |
| 是否需要数据库 ID | ❌ 不需要 |
| 单词未保存时能用缓存 | ✅ 可以 |
| 请求正确对应性 | ✅ 通过 pending 跟踪 + 双重检查保障 |
| 预生成与用户冲突处理 | ✅ 共享 pending + 用户优先策略 |
| 切换模型 | 只需要改 `api/.env` 里的 `QWEN_MODEL` |
| 超时配置 | 全链路 120 秒 |
