# 日语单词记忆练习 - Vue 3 版本

## 项目说明

这是将原始单页面HTML应用拆分成Vue 3组件结构的版本。所有功能和样式保持不变，但代码结构更加模块化和可维护。

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
