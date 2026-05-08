# 豆包模型接入指南

本项目已支持接入豆包（Doubao）AI 模型！

## 快速开始

### 1. 获取 API Key

1. 访问 [火山引擎方舟平台](https://console.volcengine.com/ark)
2. 创建项目和 API Key
3. 获取 `ARK_API_KEY`

### 2. 配置环境变量

在 `api/.env` 文件中添加或修改以下配置：

```env
# 选择 AI 提供商
AI_PROVIDER=doubao

# 豆包 API 配置
ARK_API_KEY=your_ark_api_key_here
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-seed-2-0-lite-260428
```

### 3. 重启服务

重启你的 API 服务即可使用豆包模型！

---

## 配置说明

### AI 提供商切换

| 配置值 | 说明 |
|-------|------|
| `qwen` | 使用千问模型（默认） |
| `doubao` | 使用豆包模型 |

### 豆包可选模型

| 模型名称 | 说明 |
|---------|------|
| `doubao-seed-2-0-lite-260428` | 豆包 Seed Lite 2.0（推荐） |
| `doubao-seed-2-0-260215` | 豆包 Seed 2.0 |
| 其他模型 | 参考火山引擎方舟平台文档 |

### 配置参数详解

| 参数 | 必填 | 默认值 | 说明 |
|------|------|-------|------|
| `AI_PROVIDER` | 否 | `qwen` | 选择 AI 提供商 |
| `ARK_API_KEY` | 是（使用豆包时） | - | 火山引擎方舟的 API Key |
| `DOUBAO_API_URL` | 否 | 北京区域地址 | 豆包 API 端点 |
| `DOUBAO_MODEL` | 否 | `doubao-seed-2-0-lite-260428` | 使用的模型名称 |

---

## 从千问迁移到豆包

如果你之前已经使用千问，现在想切换到豆包：

1. 修改 `api/.env`：
```env
AI_PROVIDER=doubao
ARK_API_KEY=your_ark_key
```

2. 重启服务

3. 开始使用！

---

## Node.js 示例代码

豆包使用 OpenAI 兼容的 API，所以可以使用 `openai` npm 包：

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.ARK_API_KEY,
});

const completion = await client.chat.completions.create({
  model: 'doubao-seed-2-0-lite-260428',
  messages: [
    { role: 'system', content: '你是一个日语教师' },
    { role: 'user', content: '帮我生成例句' },
  ],
  temperature: 0.7,
  max_tokens: 1000,
});

console.log(completion.choices[0].message.content);
```

### 流式响应示例

```javascript
const stream = await client.chat.completions.create({
  model: 'doubao-seed-2-0-lite-260428',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

---

## 常见问题

### Q: 可以在千问和豆包之间切换吗？
A: 可以！只需要修改 `AI_PROVIDER` 配置并重启服务即可。

### Q: 缓存会有问题吗？
A: 不会！缓存是按单词内容而非模型存储的，切换模型后仍然可以使用之前的缓存。

### Q: 支持 deep thinking 吗？
A: 目前本项目没有特别配置 deep thinking，但你可以在 `ai.controller.js` 中添加 `extra_body` 参数：

```javascript
const stream = await openai.chat.completions.create({
  model: modelName,
  messages: [...],
  extra_body: {
    thinking: { type: 'disabled' } // 或者 'enabled'
  }
});
```

---

## 对比：千问 vs 豆包

| 特性 | 千问 (Qwen) | 豆包 (Doubao) |
|------|------------|--------------|
| 服务商 | 阿里云 | 火山引擎 |
| API | OpenAI 兼容 | OpenAI 兼容 |
| 可用模型 | qwen-turbo, qwen-plus, qwen-max | doubao-seed-2-0-lite, doubao-seed-2-0 |
| 本项目支持 | ✅ | ✅ |

---

## 参考链接

- [火山引擎方舟平台](https://console.volcengine.com/ark)
- [豆包 API 文档](https://www.volcengine.com/docs/82379/1298454)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
