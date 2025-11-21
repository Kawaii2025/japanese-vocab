# API 使用文档

## 基础信息

- **Base URL**: `http://localhost:3001` (开发环境)
- **Content-Type**: `application/json`
- **返回格式**: JSON

## 重要提示：PowerShell 中正确调用 API

### 中日文字符显示问题

在 Windows PowerShell 中使用 `curl` 命令可能导致中文和日文字符显示为问号（`???`）。

**❌ 错误方式：**
```powershell
curl http://localhost:3001/api/vocabulary/1 | ConvertFrom-Json
# 输出: "chinese": "???????????"
```

**✅ 正确方式：**

使用 `Invoke-RestMethod` 代替 `curl`：

```powershell
# 方法1：直接调用
Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary/1"

# 方法2：格式化输出
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary/1"
$response | ConvertTo-Json -Depth 3

# 方法3：表格显示
$result = Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary?pageSize=5"
$result.data | Format-Table id, chinese, kana, category
```

**POST/PUT/DELETE 请求示例：**

```powershell
# POST 创建单词
$body = @{
    chinese = "测试"
    kana = "テスト"
    original = "test"
    category = "测试"
    difficulty = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# PUT 更新单词
$body = @{
    chinese = "更新测试"
    kana = "テストアップデート"
    original = "test update"
    category = "测试"
    difficulty = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary/148" `
    -Method PUT `
    -ContentType "application/json" `
    -Body $body

# DELETE 删除单词
Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary/148" `
    -Method DELETE
```

### 常用查询示例

```powershell
# 搜索单词并格式化显示
$result = Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary/search/こん"
Write-Host "找到 $($result.pagination.total) 个结果:"
$result.data | Select-Object chinese, kana, category | Format-Table

# 获取分类列表
$categories = Invoke-RestMethod -Uri "http://localhost:3001/api/categories"
$categories.data

# 获取学习统计
$stats = Invoke-RestMethod -Uri "http://localhost:3001/api/stats/overview"
$stats.data

# 记录练习
$practice = @{
    vocabulary_id = 10
    user_answer = "みず"
    is_correct = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/practice" `
    -Method POST `
    -ContentType "application/json" `
    -Body $practice
```

## 响应格式

### 成功响应（带分页）
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,        // 总记录数
    "page": 1,           // 当前页码
    "pageSize": 20,      // 每页条数
    "totalPages": 5,     // 总页数
    "hasNext": true,     // 是否有下一页
    "hasPrev": false     // 是否有上一页
  }
}
```

### 成功响应（无分页）
```json
{
  "success": true,
  "data": {...}
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 分页参数说明

所有列表类 API 都支持分页，有两种方式：

### 方式 1：页码分页（推荐）
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | integer | 1 | 页码（从1开始） |
| pageSize | integer | 20 | 每页条数 |

**示例**: `/api/vocabulary?page=2&pageSize=10`

### 方式 2：偏移分页（向后兼容）
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | integer | 20 | 返回条数 |
| offset | integer | 0 | 跳过条数 |

**示例**: `/api/vocabulary?limit=10&offset=20`

---

## API 端点

### 1. 健康检查

**GET** `/health`

检查 API 服务是否正常运行

**响应示例:**
```json
{
  "success": true,
  "message": "API 运行正常",
  "timestamp": "2025-11-22T12:00:00.000Z"
}
```

---

### 2. 获取所有单词（带分页）

**GET** `/api/vocabulary`

**查询参数:**
| 参数 | 类型 | 默认值 | 说明 | 示例 |
|------|------|--------|------|------|
| page | integer | 1 | 页码 | `1` |
| pageSize | integer | 20 | 每页条数 | `20` |
| category | string | - | 分类筛选 | `N5` |
| difficulty | integer | - | 难度筛选（<=） | `2` |
| limit | integer | 20 | 返回数量（兼容旧版） | `10` |
| offset | integer | 0 | 偏移量（兼容旧版） | `0` |

**请求示例:**
```
# 推荐方式：页码分页
GET /api/vocabulary?page=1&pageSize=20
GET /api/vocabulary?category=N5&page=2&pageSize=10

# 兼容旧版：偏移分页
GET /api/vocabulary?limit=10&offset=0
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "chinese": "你好",
      "original": "こんにちは",
      "kana": "こんにちは",
      "category": "N5",
      "difficulty": 1,
      "input_date": "2025-11-22",
      "next_review_date": "2025-11-23",
      "mastery_level": 0,
      "created_at": "2025-11-22T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 147,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "chinese": "你好",
      "original": "こんにちは",
      "kana": "こんにちは",
      "category": "基础",
      "difficulty": 1,
      "created_at": "2025-11-22T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 3. 获取单个单词

**GET** `/api/vocabulary/:id`

**请求示例:**
```
GET /api/vocabulary/1
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "chinese": "你好",
    "original": "こんにちは",
    "kana": "こんにちは",
    "category": "基础",
    "difficulty": 1,
    "created_at": "2025-11-22T12:00:00.000Z"
  }
}
```

---

### 4. 随机获取单词

**GET** `/api/vocabulary/random/:count`

用于生成练习题

**路径参数:**
- `count`: 要获取的单词数量

**查询参数:**
- `category`: 分类筛选（可选）
- `difficulty`: 难度筛选（可选）

**请求示例:**
```
GET /api/vocabulary/random/10?category=基础
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "chinese": "谢谢",
      "original": "ありがとう",
      "kana": "ありがとう",
      "category": "基础",
      "difficulty": 1,
      "created_at": "2025-11-22T12:00:00.000Z"
    }
  ],
  "total": 10
}
```

---

### 5. 搜索单词

**GET** `/api/vocabulary/search/:keyword`

**路径参数:**
- `keyword`: 搜索关键词（支持中文、日语原文、假名）

**请求示例:**
```
GET /api/vocabulary/search/你好
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "chinese": "你好",
      "original": "こんにちは",
      "kana": "こんにちは",
      "category": "基础",
      "difficulty": 1,
      "created_at": "2025-11-22T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 6. 创建单词

**POST** `/api/vocabulary`

**请求体:**
```json
{
  "chinese": "你好",
  "original": "こんにちは",
  "kana": "こんにちは",
  "category": "基础",
  "difficulty": 1
}
```

**必填字段:**
- `chinese`: 中文意思
- `kana`: 纯假名

**可选字段:**
- `original`: 日语原文
- `category`: 分类
- `difficulty`: 难度（默认 1）

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": 11,
    "chinese": "你好",
    "original": "こんにちは",
    "kana": "こんにちは",
    "category": "基础",
    "difficulty": 1,
    "created_at": "2025-11-22T12:00:00.000Z"
  }
}
```

---

### 7. 批量创建单词

**POST** `/api/vocabulary/batch`

**请求体:**
```json
{
  "words": [
    {
      "chinese": "你好",
      "original": "こんにちは",
      "kana": "こんにちは",
      "category": "基础",
      "difficulty": 1
    },
    {
      "chinese": "谢谢",
      "original": "ありがとう",
      "kana": "ありがとう",
      "category": "基础",
      "difficulty": 1
    }
  ]
}
```

**响应示例:**
```json
{
  "success": true,
  "data": [...],
  "total": 2
}
```

---

### 8. 更新单词

**PUT** `/api/vocabulary/:id`

**请求体:**
```json
{
  "chinese": "你好",
  "original": "こんにちは",
  "kana": "こんにちは",
  "category": "基础",
  "difficulty": 1
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "chinese": "你好",
    "original": "こんにちは",
    "kana": "こんにちは",
    "category": "基础",
    "difficulty": 1,
    "created_at": "2025-11-22T12:00:00.000Z"
  }
}
```

---

### 9. 删除单词

**DELETE** `/api/vocabulary/:id`

**请求示例:**
```
DELETE /api/vocabulary/1
```

**响应示例:**
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

### 10. 获取所有分类

**GET** `/api/categories`

**响应示例:**
```json
{
  "success": true,
  "data": ["基础", "进阶", "高级"]
}
```

---

## 日期相关 API

### 11. 获取今日录入的单词

**GET** `/api/vocabulary/today`

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "chinese": "你好",
      "kana": "こんにちは",
      "input_date": "2025-11-22",
      "next_review_date": "2025-11-23",
      "mastery_level": 0
    }
  ],
  "total": 1
}
```

---

### 12. 获取指定日期的单词

**GET** `/api/vocabulary/by-date/:date`

**路径参数:**
- `date`: 日期（YYYY-MM-DD）

**请求示例:**
```
GET /api/vocabulary/by-date/2025-11-22
```

**响应示例:**
```json
{
  "success": true,
  "data": [...],
  "total": 5,
  "date": "2025-11-22"
}
```

---

### 13. 获取日期范围内的单词

**GET** `/api/vocabulary/date-range`

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | string | 是 | 开始日期 |
| end | string | 是 | 结束日期 |

**请求示例:**
```
GET /api/vocabulary/date-range?start=2025-11-01&end=2025-11-30
```

**响应示例:**
```json
{
  "success": true,
  "data": [...],
  "total": 50,
  "dateRange": {
    "start": "2025-11-01",
    "end": "2025-11-30"
  }
}
```

---

### 14. 获取今日待复习的单词

**GET** `/api/vocabulary/review/today`

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "chinese": "谢谢",
      "kana": "ありがとう",
      "mastery_level": 1,
      "next_review_date": "2025-11-22",
      "review_count": 2
    }
  ],
  "total": 3
}
```

---

### 15. 获取未来N天的复习计划

**GET** `/api/vocabulary/review/plan`

**查询参数:**
- `days`: 天数（默认 7）

**请求示例:**
```
GET /api/vocabulary/review/plan?days=7
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-22",
      "word_count": 5,
      "words": [
        {
          "id": 1,
          "chinese": "你好",
          "kana": "こんにちは",
          "mastery_level": 2
        }
      ]
    },
    {
      "date": "2025-11-23",
      "word_count": 3,
      "words": [...]
    }
  ],
  "total": 7,
  "days": 7
}
```

---

### 16. 记录练习结果

**POST** `/api/practice`

自动触发复习计划更新：
- 答对：掌握程度 +1，复习间隔延长
- 答错：掌握程度 -1，复习间隔缩短

**请求体:**
```json
{
  "user_id": 1,
  "vocabulary_id": 1,
  "user_answer": "こんにちは",
  "is_correct": true,
  "attempt_count": 1
}
```

**必填字段:**
- `vocabulary_id`: 单词ID
- `user_answer`: 用户答案
- `is_correct`: 是否正确

**可选字段:**
- `user_id`: 用户ID（默认 1）
- `attempt_count`: 尝试次数（默认 1）

**响应示例:**
```json
{
  "success": true,
  "data": {
    "practice": {
      "id": 10,
      "vocabulary_id": 1,
      "user_answer": "こんにちは",
      "is_correct": true,
      "practice_date": "2025-11-22"
    },
    "vocabulary": {
      "id": 1,
      "chinese": "你好",
      "kana": "こんにちは",
      "mastery_level": 2,
      "next_review_date": "2025-11-26",
      "review_count": 3
    }
  },
  "message": "回答正确！"
}
```

---

## 统计相关 API

### 17. 获取每日录入统计

**GET** `/api/stats/daily-input`

**查询参数:**
- `days`: 统计天数（默认 30）

**请求示例:**
```
GET /api/stats/daily-input?days=30
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "input_date": "2025-11-22",
      "word_count": 10,
      "mastered_count": 3
    },
    {
      "input_date": "2025-11-21",
      "word_count": 8,
      "mastered_count": 2
    }
  ],
  "total": 30,
  "days": 30
}
```

---

### 18. 获取每日练习统计

**GET** `/api/stats/daily-practice`

**查询参数:**
- `user_id`: 用户ID（默认 1）
- `days`: 统计天数（默认 30）

**请求示例:**
```
GET /api/stats/daily-practice?user_id=1&days=30
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "practice_date": "2025-11-22",
      "practice_count": 20,
      "correct_count": 18,
      "accuracy_rate": 90.00
    },
    {
      "practice_date": "2025-11-21",
      "practice_count": 15,
      "correct_count": 12,
      "accuracy_rate": 80.00
    }
  ],
  "total": 30,
  "days": 30
}
```

---

### 19. 获取掌握程度分布

**GET** `/api/stats/mastery-distribution`

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "mastery_level": 0,
      "word_count": 20,
      "percentage": 20.00
    },
    {
      "mastery_level": 1,
      "word_count": 25,
      "percentage": 25.00
    },
    {
      "mastery_level": 2,
      "word_count": 20,
      "percentage": 20.00
    },
    {
      "mastery_level": 3,
      "word_count": 15,
      "percentage": 15.00
    },
    {
      "mastery_level": 4,
      "word_count": 10,
      "percentage": 10.00
    },
    {
      "mastery_level": 5,
      "word_count": 10,
      "percentage": 10.00
    }
  ]
}
```

---

### 20. 获取学习概览

**GET** `/api/stats/overview`

**查询参数:**
- `user_id`: 用户ID（默认 1）

**请求示例:**
```
GET /api/stats/overview?user_id=1
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "totalWords": 100,
    "todayInput": 10,
    "todayReview": 5,
    "totalPractice": 500,
    "recentAccuracy": 85.50
  }
}
```

---

## 前端集成示例

### 使用 fetch API

```javascript
// 获取所有单词
async function getVocabulary() {
  const response = await fetch('http://localhost:3001/api/vocabulary');
  const data = await response.json();
  return data;
}

// 创建单词
async function createVocabulary(word) {
  const response = await fetch('http://localhost:3001/api/vocabulary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(word),
  });
  const data = await response.json();
  return data;
}

// 随机获取10个单词
async function getRandomWords(count = 10) {
  const response = await fetch(`http://localhost:3001/api/vocabulary/random/${count}`);
  const data = await response.json();
  return data;
}
```

### 使用 axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// 获取所有单词
export const getVocabulary = async (params) => {
  const response = await axios.get(`${API_BASE_URL}/vocabulary`, { params });
  return response.data;
};

// 创建单词
export const createVocabulary = async (word) => {
  const response = await axios.post(`${API_BASE_URL}/vocabulary`, word);
  return response.data;
};

// 随机获取单词
export const getRandomWords = async (count, params) => {
  const response = await axios.get(`${API_BASE_URL}/vocabulary/random/${count}`, { params });
  return response.data;
};

// 获取今日录入的单词
export const getTodayWords = async () => {
  const response = await axios.get(`${API_BASE_URL}/vocabulary/today`);
  return response.data;
};

// 获取今日待复习的单词
export const getTodayReview = async () => {
  const response = await axios.get(`${API_BASE_URL}/vocabulary/review/today`);
  return response.data;
};

// 记录练习结果
export const recordPractice = async (practice) => {
  const response = await axios.post(`${API_BASE_URL}/practice`, practice);
  return response.data;
};

// 获取每日统计
export const getDailyStats = async (days = 30) => {
  const [inputStats, practiceStats] = await Promise.all([
    axios.get(`${API_BASE_URL}/stats/daily-input`, { params: { days } }),
    axios.get(`${API_BASE_URL}/stats/daily-practice`, { params: { days } })
  ]);
  
  return {
    input: inputStats.data,
    practice: practiceStats.data
  };
};
```

---

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 部署建议

### Vercel 部署（推荐）

1. 安装 Vercel CLI
2. 在 `api` 目录运行 `vercel`
3. 配置环境变量 `DATABASE_URL`

### Railway 部署

1. 连接 GitHub 仓库
2. 选择 `api` 目录
3. 配置环境变量
4. 自动部署

---

## 项目架构说明

### 代码重构（2025-11-22）

为了提高代码可维护性和可扩展性，API 已重构为模块化架构：

```
api/
├── controllers/          # 业务逻辑层
│   ├── vocabulary.controller.js   # 单词相关：CRUD、搜索、日期查询（16个功能）
│   ├── practice.controller.js      # 练习记录（1个功能）
│   └── stats.controller.js         # 统计功能（4个功能）
├── routes/              # 路由层
│   ├── vocabulary.routes.js        # 单词路由定义
│   ├── practice.routes.js          # 练习路由定义
│   └── stats.routes.js             # 统计路由定义
├── middleware/          # 中间件
│   └── errorHandler.js             # 统一错误处理、异步包装器
├── utils/               # 工具函数
│   └── pagination.js               # 分页逻辑复用
├── db.js                # 数据库连接池
├── server.js            # 主应用文件（3.2KB）
└── server.js.backup     # 重构前备份（19.5KB）
```

**重构优势：**

- ✅ **可维护性**：代码按职责分层，修改功能只需改对应 controller
- ✅ **可扩展性**：新增功能只需添加新 controller 和 route
- ✅ **代码复用**：分页、错误处理统一封装
- ✅ **体积减少**：主文件从 19.5KB 减少到 3.2KB（减少 84%）
- ✅ **测试友好**：每个 controller 可独立测试

**测试覆盖：**

所有 21 个端点均已测试通过：
- ✅ 基础端点：健康检查、分类、分页
- ✅ 单词 CRUD：创建、读取、更新、删除
- ✅ 查询功能：搜索、随机获取、筛选
- ✅ 日期功能：今日录入、按日期查询、复习计划
- ✅ 练习功能：记录练习、自动更新掌握度
- ✅ 统计功能：学习概览、录入统计、练习统计

---

## 测试 API

### Linux/macOS (bash)

```bash
# 健康检查
curl http://localhost:3001/health

# 获取单词
curl http://localhost:3001/api/vocabulary

# 创建单词
curl -X POST http://localhost:3001/api/vocabulary \
  -H "Content-Type: application/json" \
  -d '{"chinese":"测试","kana":"てすと","category":"测试"}'
```

### Windows PowerShell

**注意：必须使用 `Invoke-RestMethod` 才能正确显示中日文！**

```powershell
# 健康检查
Invoke-RestMethod -Uri "http://localhost:3001/health"

# 获取单词
Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary"

# 创建单词
$body = @{
    chinese = "测试"
    kana = "てすと"
    category = "测试"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/vocabulary" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

