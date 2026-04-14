# 日语单词记忆练习 - Vue 3 + API 版本

[![Deploy to GitHub Pages](https://github.com/Kawaii2025/japanese-vocab/actions/workflows/deploy.yml/badge.svg)](https://github.com/Kawaii2025/japanese-vocab/actions/workflows/deploy.yml)

## 🗄️ 数据库架构（最新更新）

**架构**: 本地 SQLite (主数据库) + 可选 Neon PostgreSQL (备份)

### SQLite 本地数据库 (新)
- ⚡ **10-25倍性能提升** vs Neon 云数据库
- 💾 **本地存储**: `/data/vocabulary.db` 
- 🚀 **零网络延迟**: 所有查询 <10ms
- 📦 **便携式**: 数据库文件可随项目携带
- **导入/导出**: JSON 格式支持跨平台数据迁移

### 可选：Neon PostgreSQL 备份
- 🔄 **双向同步**: SQLite ↔ Neon
- ☁️ **云备份**: 重要数据在线备份
- 🔐 **加密存储**: Neon 服务器托管
- **用途**: 生产环境备份 + 多设备同步

### 性能对比
| 操作 | SQLite (本地) | Neon (云) |
|------|-------------|----------|
| 查询单词 | 1-5ms | 50-100ms+ |
| 批量导入 | <1s | 5-10s |
| 实时更新 | 即时 | 网络延迟 |
| 离线使用 | ✅ 支持 | ❌ 不支持 |

---

## 🌍 多环境配置 (Local vs GitHub Pages)

本项目使用 **智能环境切换** 支持不同场景：

### 本地开发 (SQLite) ⚡
```bash
npm run dev
# ✅ 连接到: http://localhost:3001/api
# 📊 使用: 本地 SQLite 数据库
# 🚀 速度: <10ms 查询
# ⚙️ 配置: .env.development
```

### GitHub Pages (Neon) 🚀
```bash
npm run build
# ✅ 连接到: https://japanese-vocab-three.vercel.app/api
# 📊 使用: Neon PostgreSQL 数据库
# 🌍 地域: 云部署（全球可访问）
# ⚙️ 配置: .env.production
```

### 环境文件对比

| 文件 | 用途 | 后端 | 数据库 |
|------|------|------|--------|
| `.env.development` | 本地开发 | `http://localhost:3001/api` | SQLite |
| `.env.production` | GitHub Pages | `https://japanese-vocab-three.vercel.app/api` | Neon PostgreSQL |

**📖 详细说明**: 参考 [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md)

### 自动切换如何工作

```
运行 npm run dev
    ↓
读取 .env.development
    ↓
前端连接本地 SQLite
    ↓
完整功能 + 最快速度 ✅

---

运行 npm run build (Node_ENV=production)
    ↓
读取 .env.production
    ↓
前端连接 Neon PostgreSQL
    ↓
GitHub Pages 部署 ✅
```

---

## � 数据同步审计 (Audit & Monitoring)

所有 SQLite ↔ Neon 同步操作都被自动跟踪和记录：

### 功能特点
- ✅ **实时进度** - 同步时显示逐条记录成功/失败状态
- ❌ **错误追踪** - 每个失败的记录都记录错误代码和消息
- 📊 **同步统计** - 成功率、处理时间、表级别指标
- 📁 **双重存储** - JSON 文件 + Neon 数据库审计表
- 🔍 **验证检查** - 同步后自动验证数据完整性

### 查看审计数据

**本地 JSON 审计:**
```bash
cat api/data/audits/vocabulary_full-*.json | jq '.summary'
```

**Neon 数据库审计:**
```sql
SELECT * FROM sync_stats;           -- 同步性能统计
SELECT * FROM sync_errors;          -- 错误记录
SELECT * FROM recent_sync_history;  -- 最近同步历史
```

**📖 详细文档**: 参考 [AUDIT_SYSTEM.md](./AUDIT_SYSTEM.md) 

---

## �🔐 二进制文件安全政策 (Company Security Compliance)

本项目遵循严格的数据安全政策，确保公司隐私和 GitHub 合规性。

### 📋 政策概述

**规则**: 严禁提交二进制文件到 GitHub  
**目的**: 确保数据安全和代码透明度  
**状态**: ✅ **已激活并自动执行**

### ❌ 禁止类型 (永远不会上传)

| 文件类型 | 模式 | 原因 |
|---------|------|------|
| **数据库** | `*.db`, `*.db-shm`, `*.db-wal` | 包含用户数据 |
| **可执行文件** | `*.exe`, `*.dll`, `*.so` | 安全风险 |
| **编译文件** | `*.jar`, `*.class`, `*.o` | 平台相关性 |
| **压缩包** | `*.zip`, `*.tar.gz`, `*.iso` | 大小和安全 |
| **文档** | `*.pdf`, `*.doc`, `*.docx` | 元数据风险 |
| **配置** | `.env` | 包含数据库凭证 |

### ✅ 允许类型 (仅文本格式)

| 文件类型 | 格式 | 用途 |
|---------|------|------|
| **数据备份** | `vocabulary-*.json` | GitHub 安全备份 |
| **源代码** | `.js`, `.vue`, `.ts` | 开发文件 |
| **配置样本** | `.env.production`, `.env.development` | 无密钥 |
| **文档** | `.md` | 可读性 |

### 🛡️ 安全执行机制

#### 1. **自动预推送检查** (Pre-Push Hook)
```bash
git push
# ➜ 自动运行安全检查 (~100-500ms)
# ✅ 所有检查通过 → 推送成功
# ❌ 检测到二进制文件 → 推送被阻止
```

**检查项目**:
- `.env` 文件（数据库凭证）
- 二进制数据库文件
- 硬编码的秘密
- 大于 10MB 的文件

#### 2. **Git Ignore 配置**
```gitignore
# 数据库永远不上传
*.db
*.db-shm
*.db-wal
api/data/

# 但允许 JSON 导出
!data/exports/
!data/exports/*.json
```

#### 3. **手动验证工具**
```bash
# 任何时候验证安全性
bash verify-no-binaries.sh

# 输出:
# ✅ SAFE: No binary files committed to git!
# ✅ All binary files are properly ignored
# ✅ Safe for company security policy
```

### 📊 数据流 (Binary-Safe)

```
┌─────────────────────────────────────────────┐
│       生产数据流 (二进制安全)               │
└─────────────────────────────────────────────┘

您的 SQLite DB              JSON 导出
(vocabulary.db)         (vocabulary.json)
     ↓                         ↓
  [本地仅]              [GitHub 安全]
  未在 git              ✅ 已跟踪
  
  导入 ← ← ← ← ┼ ← ← ← ← 导出
           ↕ 双向同步 ↕

✅ 文本格式 + 人类可读 = 安全合规
✅ 可审计 + 可恢复 = 企业就绪
```

---

## 📥 JSON 数据管理 (文本格式备份)

本项目使用 JSON 格式存储数据备份，完全符合公司安全政策。

### 为什么用 JSON？

| 优势 | 说明 |
|-----|------|
| **文本格式** | 人类可读，便于审查 |
| **无执行风险** | 纯数据，无恶意代码 |
| **可版本控制** | 完整的修改历史 |
| **可审计** | 每次变更都可追踪 |
| **可恢复** | 完整的数据备份 |
| **跨平台** | 所有系统兼容 |

### 🔄 导出/导入流程

#### 导出到 JSON (SQLite → JSON)
```bash
cd api
npm run export-json
```

**生成文件**:
```
data/exports/
├── vocabulary-export-2026-04-09.json  # 时间戳备份
├── vocabulary-export-2026-04-10.json  # 每日更新
└── vocabulary-latest.json             # 最新版本
```

**文件内容** (JSON 格式):
```json
{
  "exportDate": "2026-04-09T06:50:57.575Z",
  "exportSource": "SQLite",
  "tables": {
    "vocabulary": [
      {
        "id": 4,
        "kana": "こううん",
        "chinese": "好运",
        "category": "基础",
        "mastery_level": 1,
        "review_count": 18,
        "created_at": 1763715080217
      }
      // ... 更多记录
    ],
    "users": [ /* 用户数据 */ ],
    "practice_records": [ /* 练习历史 */ ]
  }
}
```

#### 导入到 SQLite (JSON → SQLite)
```bash
cd api
npm run import-json

# 或指定特定文件
node import-from-json.js data/exports/vocabulary-export-2026-04-09.json
```

**导入流程**:
```
JSON 文件 → 解析 → SQLite 数据库
  ↓
404 个单词  ✅
4 个用户    ✅
0 条练习    ✅
```

### 📦 团队数据共享 (Zero Binary)

#### 开发者 1 (您)
```bash
# 使用本地 SQLite 进行开发
npm run dev                    # 完整功能

# 准备分享
npm run export-json            # 导出为 JSON

# 提交到 GitHub
git add data/exports/*.json
git commit -m "Update vocabulary data"
git push origin main
```

#### 开发者 2 (团队成员)
```bash
# 获取最新代码
git pull origin main          # 获取 JSON 文件

# 恢复本地数据库
npm run import-json           # JSON → SQLite

# 开始工作
npm run dev                   # 完整功能 + 最新数据
```

**结果**: 
- ✅ 团队成员立即获得所有数据
- ✅ 无二进制文件在 GitHub 上
- ✅ 100% 符合公司安全政策
- ✅ 数据始终可读可审核

### 📋 数据文件结构

```
japanese-vocab/
├── data/
│   ├── vocabulary.db           # ❌ 本地二进制 (不在 git)
│   ├── vocabulary.db-shm       # ❌ 临时文件 (自动忽略)
│   ├── vocabulary.db-wal       # ❌ 日志文件 (自动忽略)
│   └── exports/
│       ├── vocabulary-latest.json              # ✅ 最新备份
│       ├── vocabulary-export-2026-04-09.json   # ✅ 时间戳版本
│       └── vocabulary-export-2026-04-10.json   # ✅ 更新版本
└── .gitignore                 # 配置忽略规则
```

### 🔒 安全保证

| 层级 | 机制 | 结果 |
|-----|------|------|
| **预防** | .gitignore | 二进制文件无法暂存 |
| **检测** | Pre-push 钩子 | 推送前检查 |
| **验证** | verify-no-binaries.sh | 手动审计工具 |
| **文档** | 本章节 + 政策文件 | 团队教育 |

---

## 快速开始

### 数据库配置

本项目使用 **SQLite (本地)** 作为主数据库，提供最佳性能。可选配置 Neon PostgreSQL 作为远程备份。

#### 选项 1：仅 SQLite (推荐快速开始) ⚡

**无需任何配置** - 立即使用！

SQLite 数据库会在首次运行时自动创建：
```bash
cd api
npm run start

# 输出:
# ✅ SQLite Database: READY (Local Primary)
# 🚀 服务器启动成功！
```

数据自动保存到 `data/vocabulary.db`

#### 选项 2：SQLite + Neon 备份 (可选)

如果想要云备份功能，在 `api/` 目录创建 `.env` 文件：

```env
# 可选：Neon PostgreSQL 远程备份
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require

# 必须的
PORT=3001
```

**获取 Neon 连接字符串**:
1. 访问 [neon.tech](https://neon.tech)
2. 创建项目和数据库
3. 复制连接字符串到 `.env` 文件

**⚠️ 重要安全提示**:
- ✅ `.env` 文件已在 `.gitignore` 中（不会上传 GitHub）
- ✅ 预推送钩子会自动阻止 `.env` 文件
- ❌ 从不提交 `.env` 到版本控制
- 如果意外提交，请立即重新生成 Neon 密钥

#### 启动应用

**方式一：SQLite 本地 (推荐) ⚡**
```bash
cd api
npm install
npm run start
# 即时可用，无需任何配置
```

**方式二：完整功能（前端 + 后端）**

1. **启动 API 服务器** (可选 Neon 配置)
```bash
cd api
npm install
npm run start
```
服务器运行在 `http://localhost:3001`

2. **启动前端开发服务器**
```bash
npm install
npm run dev
```
前端运行在 `http://localhost:5173`

**方式三：仅前端（离线模式）**
```bash
npm install
npm run dev
```
前端可独立运行，无需后端

#### 数据导入 (如果有现有 Neon 数据)

如果你有现有的 Neon PostgreSQL 数据库，可以导入到本地 SQLite：

```bash
# 1. 配置 DATABASE_URL in api/.env (指向 Neon)
# 2. 启动服务器
cd api && npm run start

# 3. 在另一个终端导入数据
curl -X POST http://localhost:3001/api/sync/import-from-neon

# 结果：404 个单词导入到本地 SQLite ✅
```

#### 数据导出 (team 共享)

定期导出数据为 JSON 格式（GitHub 安全格式）:

```bash
# 导出 SQLite → JSON
npm run export-json

# 生成:
# data/exports/vocabulary-latest.json (最新)
# data/exports/vocabulary-export-2026-04-09.json (时间戳)

# 提交到 GitHub
git add data/exports/*.json
git commit -m "Update vocabulary data"
git push
```

团队成员可恢复数据：
```bash
npm run import-json   # JSON → SQLite
npm run start         # 使用包含所有数据的本地数据库
```

### 方式四：使用 VS Code Tasks（推荐）

项目包含自动化任务配置，可同时启动前端和后端。

**前提条件**：
1. SQLite 无需配置（自动创建）
2. 或 `.env` 文件已正确配置（如果使用 Neon）
3. 在 VS Code 中打开项目

**使用方法**：

**选项 1：使用命令面板（推荐）**
- 按 `Cmd + Shift + P`（Mac）或 `Ctrl + Shift + P`（Windows/Linux）
- 输入 "Tasks: Run Task"
- 选择以下任一选项：
  - **"Run Both (API + Frontend)"** - 同时启动前端（5173）和后端（3001）
  - **"Start API Server"** - 仅启动后端 API（3001）
  - **"Start Frontend Dev Server"** - 仅启动前端（5173）

**选项 2：使用快捷键**
- 按 `Cmd + Shift + B`（Mac）或 `Ctrl + Shift + B`（Windows/Linux）启动默认任务

**任务详情**：
| 任务名称 | 命令 | 端口 |
|--------|------|------|
| Run Both (API + Frontend) | 同时运行 API 和前端 | 3001 & 5173 |
| Start API Server | `npm run start` | 3001 |
| Start Frontend Dev Server | `npm run dev` | 5173 |

## 项目结构

```
japanese-vocab/
├── index.html              # Vue 3版本的HTML入口（主入口）
├── index-original.html     # 原始单页面版本（备份）
├── package.json            # 项目依赖
├── vite.config.js          # Vite构建配置
└── src/
    ├── main.js             # Vue应用入口
    ├── App.vue             # 主应用组件
    ├── components/         # Vue组件
    │   ├── HeaderComponent.vue           # 页面标题组件
    │   ├── VocabInputComponent.vue       # 单词输入组件
    │   ├── VocabTableComponent.vue       # 单词练习表组件
    │   ├── UnfamiliarWordsComponent.vue  # 不熟悉单词组件
    │   ├── MistakesTableComponent.vue    # 错题记录组件
    │   └── StatsComponent.vue            # 统计信息组件
    ├── composables/        # Vue组合式函数
    │   └── useVocabulary.js  # 单词数据管理
    └── utils/              # 工具函数
        ├── helpers.js      # 通用辅助函数
        └── parser.js       # 输入解析函数
```

## 组件说明

### 1. HeaderComponent
- 显示页面标题和说明
- 纯展示组件，无状态

### 2. VocabInputComponent
- 单词输入区域
- 支持文本和Markdown表格两种格式
- 提供输入提示和解析信息显示

### 3. VocabTableComponent
- 核心单词练习表格
- 包含所有交互功能：检查答案、朗读、显示/隐藏控制
- 支持打乱顺序、导出等操作

### 4. UnfamiliarWordsComponent
- 显示不熟悉的单词列表
- 支持集中复习和清空记录

### 5. MistakesTableComponent
- 错题历史记录表格
- 显示答案对比和差异分析
- 支持复制为Markdown格式

### 6. StatsComponent
- 学习统计信息展示
- 实时更新练习数据

## 安装和运行

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:3000 使用 Vue 3 版本

### 使用原始单页面版本（无需安装）
直接在浏览器中打开 `index-original.html` 文件

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 自动部署

项目配置了 GitHub Actions 自动部署到 GitHub Pages：

- ✅ 推送到 `main` 分支自动触发部署
- ✅ 自动构建和发布到 GitHub Pages
- ✅ 部署状态徽章显示在 README 顶部

查看详细部署配置：[DEPLOYMENT.md](./DEPLOYMENT.md)

## 功能特性（与原版完全一致）

✅ 支持文本和Markdown表格两种输入格式
✅ 智能识别中文、日语原文和假名列
✅ 假名输入练习和答案检查
✅ 差异对比显示（标记错误和缺失部分）
✅ 日语语音朗读功能
✅ 单词/假名显示隐藏控制
✅ 不熟悉单词记录和复习
✅ 错题历史记录和纠正状态
✅ 学习统计信息
✅ 打乱顺序功能
✅ 导出未完成单词
✅ 合并导出不熟悉和错题
✅ 复制错题为Markdown格式

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Composition API** - Vue 3组合式API
- **TailwindCSS** - CSS框架（通过CDN）
- **Font Awesome** - 图标库（通过CDN）

## 与原版对比

### 优势
- ✅ 组件化架构，代码更清晰
- ✅ 更好的代码复用和维护性
- ✅ 响应式数据管理更加优雅
- ✅ 支持热更新开发
- ✅ 更容易扩展新功能

### 保持一致
- ✅ 所有功能完全相同
- ✅ UI/UX完全一致
- ✅ 样式和动画效果相同
- ✅ 用户数据和交互逻辑相同

## 文件说明

- `index.html` - Vue 3版本的入口文件（默认首页），需要通过 `npm run dev` 运行
- `index-original.html` - 原始单页面版本（备份），可直接在浏览器打开使用
- 两个版本的功能完全相同，Vue 版本代码结构更清晰，便于维护和扩展

## 注意事项

1. 默认使用 Vue 3 版本，需要先安装依赖才能运行
2. 如需使用原始单页面版本，打开 `index-original.html` 即可，无需安装
3. 两个版本的功能完全相同，可根据需求选择使用

## 开发建议

如需添加新功能：
1. 考虑创建新组件或修改现有组件
2. 使用`useVocabulary` composable管理状态
3. 工具函数放在`utils`目录
4. 保持组件的单一职责原则

---

## 📚 完整文档和参考

本项目包含详细的文档用于各种场景。请根据需求选择阅读：

### 🌍 环境配置和部署文档

#### [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md) - 多环境配置指南 (新)
**用途**: 理解本地 SQLite 和 GitHub Pages Neon 的配置  
**包含内容**:
- 本地开发 (SQLite) 环境配置
- GitHub Pages 生产 (Neon) 环境配置
- `.env.development` 和 `.env.production` 说明
- 自动环境切换如何工作
- 部署到 Vercel 的步骤
- CORS 和常见问题排查

**推荐阅读场景**:
- 设置本地开发环境
- 部署到 GitHub Pages
- 配置生产后端
- 理解环境变量如何工作

### 🔐 安全和数据管理文档

#### [BINARY_SAFETY_POLICY.md](./BINARY_SAFETY_POLICY.md) - 二进制文件安全策略
**用途**: 了解二进制文件禁止政策和执行机制  
**包含内容**:
- 为什么禁止二进制文件 (公司安全合规)
- 具体允许/禁止的文件类型  
- 4 层安全执行机制
- 团队数据共享工作流
- 事故恢复程序
- 完整的命令参考

**推荐阅读场景**: 
- 第一次加入团队
- 误提交了二进制文件
- 部署到生产环境
- 安全审计

#### [JSON_EXPORT_GUIDE.md](./JSON_EXPORT_GUIDE.md) - JSON 数据导出/导入指南
**用途**: 学习如何安全地备份和共享数据  
**包含内容**:
- JSON 格式为什么是最佳选择
- 导出 SQLite 到 JSON (`npm run export-json`)
- 导入 JSON 到 SQLite (`npm run import-json`)
- 团队数据协作工作流
- 性能指标和备份策略
- 常见问题解答

**推荐阅读场景**:
- 第一次导出数据
- 与团队成员共享数据
- 设置自动备份
- 数据迁移

#### [DATA_IMPORT_GUIDE.md](./DATA_IMPORT_GUIDE.md) - Neon 到 SQLite 数据迁移指南
**用途**: 从云 PostgreSQL 迁移到本地 SQLite  
**包含内容**:
- 一步步的迁移说明
- Neon 连接配置
- 导入所有数据 (单词、用户、练习记录)
- 故障排除和常见错误
- 导入进度监控
- 验证导入成功

**推荐阅读场景**:
- 有现存的 Neon 数据库
- 首次切换到本地 SQLite
- 数据导入失败
- 需要保留所有历史数据

### 🔧 开发工具和配置文档

#### [LOCAL_DEBUG_GUIDE.md](./LOCAL_DEBUG_GUIDE.md) - 本地调试 Neon 指南 (新)
**用途**: 在本地测试 Neon PostgreSQL 代码路径，不需要每次都部署到 Vercel  
**包含内容**:
- 如何在本地启用 Neon 进行测试
- SQLite vs Neon 对比测试
- 查看 SQL 查询转换日志
- 常见错误及解决方案
- 快速调试工作流

**推荐阅读场景**:
- 开发新功能需要测试 Neon 兼容性
- 调试 Neon 相关的 SQL 错误
- 避免频繁部署到 Vercel
- 理解 SQLite↔PostgreSQL 转换原理

#### [GIT_HOOK_GUIDE.md](./GIT_HOOK_GUIDE.md) - 预推送 Git 钩子指南
**用途**: 了解自动安全检查如何工作  
**包含内容**:
- 预推送钩子工作原理
- 检查高效性指标  
- 什么会被阻止 (示例)
- 自定义和配置选项
- 绕过钩子 (`--no-verify`)
- 团队设置说明

**推荐阅读场景**:
- 推送被钩子阻止了
- 想要自定义检查
- 团队成员不知道如何设置
- 性能优化

#### [SECURITY_CHECK_REPORT.md](./SECURITY_CHECK_REPORT.md) - 安全审计报告
**用途**: 完整的安全检查和合规报告  
**包含内容**:
- 全面的安全审计结果
- 检查清单和通过状态
- 为什么通过了审查
- 公司合规性验证
- 文件清单 (允许/禁止)
- 最佳实践指南

**推荐阅读场景**:
- 提交给公司安全团队
- 内部审计和合规检查
- 部署前的最终验证
- 安全意识培训

### 📚 API 和数据库文档

#### [api/API_DOCS.md](./api/API_DOCS.md) - API 使用文档
**用途**: 了解所有 API 端点和用法  
**包含内容**:
- 完整的 API 端点列表
- 请求/响应示例
- 错误处理
- 数据库操作

#### [SQLITE_MIGRATION.md](./SQLITE_MIGRATION.md) - SQLite 迁移技术指南
**用途**: 数据库实现细节  
**包含内容**:
- 架构设计决策
- 性能优化配置
- 迁移步骤
- 故障排除

### 🧪 测试和验证工具

#### [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) - Postman API 测试指南
**用途**: 使用 Postman 测试所有 API 端点  
**包含内容**:
- Postman 设置步骤
- 所有端点的测试用例
- 响应格式说明
- 性能测试方法

### ✅ 快速检查清单

#### 部署前检查清单

```bash
# 1. 验证没有二进制文件
bash verify-no-binaries.sh
# ✅ 输出: SAFE: No binary files committed to git!

# 2. 导出最新数据
cd api
npm run export-json
# ✅ 生成: data/exports/vocabulary-latest.json

# 3. 检查 Git 状态
git status
# ✅ 应该是: nothing to commit, working tree clean

# 4. 运行完整系统测试
npm run dev          # 前端
cd api && npm run start  # 后端 (另一窗口)
# ✅ 都应该正常启动

# 5. 测试数据导入/导出
npm run export-json   # 导出成功
npm run import-json   # 导入成功

# 6. 最终提交和推送
git add .
git commit -m "Prepare for deployment"
git push origin main
# ✅ Pre-push 钩子通过检查并推送成功
```

### 📖 阅读顺序建议

**首次使用** (推荐顺序):
1. 本 README (当前文件) - 获得总体理解
2. [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md) - 理解本地 vs 生产环境
3. [BINARY_SAFETY_POLICY.md](./BINARY_SAFETY_POLICY.md) - 理解安全规则
4. [GIT_HOOK_GUIDE.md](./GIT_HOOK_GUIDE.md) - 学会使用 git 钩子
5. 开始开发!

**本地开发设置** (推荐顺序):
1. [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md) - 第 "本地开发设置" 部分
2. 运行 `npm run dev` 和 `npm run start`
3. 开始编码!

**调试 Neon 错误** (推荐顺序):
1. [LOCAL_DEBUG_GUIDE.md](./LOCAL_DEBUG_GUIDE.md) - 在本地测试 Neon
2. 启用本地 Neon 连接 (编辑 `.env`)
3. 测试问题端点并查看日志
4. 使用 SQL 转换信息进行修复
5. 验证 SQLite 仍然工作
6. 提交修复

**部署到 GitHub Pages** (推荐顺序):
1. [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md) - 第 "生产后端设置" 部分
2. 在 Vercel/Railway 部署后端
3. 更新 `.env.production` 中的 API 端点
4. [LOCAL_DEBUG_GUIDE.md](./LOCAL_DEBUG_GUIDE.md) - 用 Neon 在本地做最后测试
5. [SECURITY_CHECK_REPORT.md](./SECURITY_CHECK_REPORT.md) - 验证安全性
6. [JSON_EXPORT_GUIDE.md](./JSON_EXPORT_GUIDE.md) - 导出最新数据
7. 执行快速检查清单
8. 推送并部署!

**数据迁移** (推荐顺序):
1. [DATA_IMPORT_GUIDE.md](./DATA_IMPORT_GUIDE.md) - 步骤说明
2. [JSON_EXPORT_GUIDE.md](./JSON_EXPORT_GUIDE.md) - 之后如何管理
3. 完成迁移!

**故障排除** (按优先级):
1. [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md) - "常见问题" 部分
2. 查看相关文档的"常见问题"部分
3. 查看 [GIT_HOOK_GUIDE.md](./GIT_HOOK_GUIDE.md) 或 [DATA_IMPORT_GUIDE.md](./DATA_IMPORT_GUIDE.md)
3. 运行 `bash verify-no-binaries.sh` 进行诊断
4. 检查 API 日志 `npm run start` 输出

---

## 🎯 关键统计数据

| 指标 | 值 | 说明 |
|-----|-----|------|
| **数据库性能** | 10-25x 更快 | SQLite vs Neon |
| **查询响应时间** | <10ms | 本地 SQLite |
| **导出/导入时间** | <1s | 404 条记录 |
| **Git 钩子检查时间** | 100-500ms | 每次推送前 |
| **导出文件大小** | 154KB | JSON 格式 |
| **二进制文件提交** | 0 个 | 100% 安全 |
| **API 端点** | 11+ | 完整 CRUD + 同步 |
| **支持的操作系统** | Windows/Mac/Linux | 跨平台 |

---

## 📞 常见问题 (FAQ)

**Q: 我能否在 GitHub 上看到我的数据库文件?**  
A: 否。`.db` 和相关文件被 `.gitignore` 忽略。只有 JSON 导出在 GitHub 上。✅

**Q: 如果我不小心提交了 `.db` 文件怎么办?**  
A: 预推送钩子会防止这种情况。但如果已发生，请查看 [BINARY_SAFETY_POLICY.md](./BINARY_SAFETY_POLICY.md) 的恢复程序。

**Q: 如何与团队成员共享数据?**  
A: 运行 `npm run export-json` 导出为 JSON，提交到 GitHub。团队成员拉取后运行 `npm run import-json` 恢复数据。

**Q: SQLite 可靠吗?**  
A: 是的。SQLite 被 SQLite、iOS、Android 等大型应用使用。可选的 Neon 备份提供额外的安全性。

**Q: 我可以离线使用吗?**  
A: 是的。SQLite 是文件型数据库，完全离线工作。Neon 是可选的。

**Q: 性能如何?**  
A: 大约快 10-25 倍，从 50-100ms (Neon) 到 <10ms (SQLite)。

---

**最后更新**: 2026-04-09  
**维护者**: Kaiwen  
**许可证**: MIT
