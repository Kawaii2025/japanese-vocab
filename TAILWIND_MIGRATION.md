# Tailwind CSS 配置迁移说明

## 修改内容

已将 Tailwind CSS 从 CDN 版本迁移到本地安装版本，并将所有配置抽离到独立的配置文件中。

## 文件变更

### 1. `tailwind.config.js` - Tailwind 配置文件
- ✅ 添加了所有自定义颜色配置
- ✅ 配置了自定义字体
- ✅ 设置了内容扫描路径

### 2. `src/style.css` - 新增 CSS 入口文件
- ✅ 导入 Tailwind 的 base、components、utilities
- ✅ 定义了所有自定义工具类（使用 @layer utilities）
- ✅ 定义了所有动画关键帧

### 3. `src/main.js` - Vue 应用入口
- ✅ 添加了 CSS 文件导入

### 4. `index.html` - HTML 入口文件
- ✅ 移除了 Tailwind CDN 引用
- ✅ 移除了内联的 Tailwind 配置脚本
- ✅ 移除了所有内联样式
- ✅ 保留了 Font Awesome CDN（仍需使用）

### 5. `postcss.config.js` - PostCSS 配置
- ✅ 已配置 tailwindcss 和 autoprefixer 插件

## 优势

### 性能优化
- ✅ **更小的包体积**：只打包使用到的 CSS 类
- ✅ **更快的加载速度**：不需要加载整个 CDN 文件
- ✅ **生产环境优化**：自动 PurgeCSS 删除未使用的样式

### 开发体验
- ✅ **配置集中管理**：所有 Tailwind 配置在 `tailwind.config.js` 中
- ✅ **样式文件独立**：CSS 代码从 HTML 中分离
- ✅ **更好的 IDE 支持**：更好的自动完成和语法检查
- ✅ **自定义类更规范**：使用 `@layer` 指令，遵循 Tailwind 最佳实践

### 维护性
- ✅ **易于修改**：修改配置文件即可，无需改动 HTML
- ✅ **版本控制**：本地依赖版本可控
- ✅ **团队协作**：统一的配置标准

## 自定义配置

### 自定义颜色（在 tailwind.config.js 中）
```javascript
colors: {
  primary: '#3B82F6',    // 蓝色
  secondary: '#10B981',  // 绿色
  accent: '#2563EB',     // 深蓝色
  amber: '#F59E0B',      // 琥珀色
  error: '#EF4444',      // 红色
  light: '#F8FAFC',      // 浅色背景
  dark: '#1E293B',       // 深色文本
  original: '#6366F1',   // 靛蓝色
  kana: '#EC4899',       // 粉色
  edit: '#8B5CF6',       // 紫色
  'diff-insert': '#dcfce7',
  'diff-delete': '#fee2e2',
  'diff-equal': '#f3f4f6'
}
```

### 自定义工具类（在 src/style.css 中）
- `.content-auto` - 内容可见性优化
- `.text-shadow` - 文字阴影
- `.transition-custom` - 自定义过渡
- `.btn-pulse` - 按钮脉冲动画
- `.highlight-transition` - 高亮过渡效果
- `.table-cell` - 表格单元格省略号
- `.editing-breathing-bg` - 编辑时呼吸动画
- `.history-item` - 历史记录项样式
- `.diff-*` - 差异对比样式

## 使用方式

### 开发环境
```bash
npm run dev
```
访问 http://localhost:3000（或其他可用端口）

### 生产构建
```bash
npm run build
```
构建产物会自动优化和压缩 CSS

## 注意事项

1. **Font Awesome 仍使用 CDN**：保留了 Font Awesome 的 CDN 引用，因为项目中大量使用图标
2. **本地安装的好处**：Tailwind 现在是本地依赖，可以离线开发
3. **配置文件位置**：
   - Tailwind 配置：`tailwind.config.js`
   - PostCSS 配置：`postcss.config.js`
   - 样式入口：`src/style.css`

## 如何添加新的自定义样式

### 方式一：在 tailwind.config.js 中扩展
```javascript
theme: {
  extend: {
    colors: {
      'my-color': '#123456'
    }
  }
}
```

### 方式二：在 src/style.css 中添加
```css
@layer utilities {
  .my-custom-class {
    /* 你的样式 */
  }
}
```

## 迁移前后对比

| 项目 | CDN 版本 | 本地版本 |
|------|---------|---------|
| 包体积 | ~3MB | ~10KB（实际使用） |
| 加载速度 | 依赖网络 | 本地极快 |
| 配置方式 | HTML 内联 | 配置文件 |
| 自定义类 | 内联 `<style>` | 独立 CSS 文件 |
| IDE 支持 | 有限 | 完整 |
| 生产优化 | 无 | 自动 PurgeCSS |
| 离线开发 | ❌ | ✅ |

## 结论

迁移到本地 Tailwind CSS 后，项目获得了：
- 🚀 更好的性能
- 🛠️ 更好的开发体验
- 📦 更小的构建体积
- 🔧 更易维护的代码结构

所有功能和样式保持完全一致！
