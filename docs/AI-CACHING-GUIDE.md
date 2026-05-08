# AI 缓存使用指南

## 📖 目录

1. [缓存关联机制](#缓存关联机制)
2. [实际应用场景](#实际应用场景)
3. [环境变量配置](#环境变量配置)
4. [模型配置](#模型配置)
5. [超时配置](#超时配置)
6. [常见问题](#常见问题)
7. [最佳实践](#最佳实践)

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
| 切换模型 | 只需要改 `api/.env` 里的 `QWEN_MODEL` |
| 超时配置 | 全链路 120 秒 |
