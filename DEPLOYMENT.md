# GitHub Pages 自动部署配置

## 已配置的功能

✅ 自动构建和部署到 GitHub Pages
✅ 当推送到 main 分支时自动触发
✅ 使用 GitHub Actions 工作流
✅ 构建产物自动上传到 Pages

## 部署流程

### 工作流文件
位置：`.github/workflows/deploy.yml`

### 触发条件
- 推送代码到 `main` 分支时自动触发

### 部署步骤
1. **Checkout** - 检出代码
2. **Setup Node** - 安装 Node.js 20
3. **Install dependencies** - 安装 npm 依赖
4. **Build** - 运行 `npm run build` 构建项目
5. **Upload artifact** - 上传构建产物
6. **Deploy** - 部署到 GitHub Pages

## 首次启用步骤

### 1. 启用 GitHub Pages
在 GitHub 仓库中：
1. 进入 **Settings** > **Pages**
2. 在 **Source** 下选择 **GitHub Actions**
3. 保存设置

### 2. 推送代码
```bash
git add .
git commit -m "ci: 添加 GitHub Actions 自动部署配置"
git push
```

### 3. 查看部署状态
1. 进入仓库的 **Actions** 标签
2. 查看 "Deploy to GitHub Pages" 工作流运行状态
3. 等待部署完成（通常需要 1-2 分钟）

### 4. 访问网站
部署成功后，访问：
```
https://kawaii2025.github.io/japanese-vocab/
```

## 配置说明

### Vite 配置 (vite.config.js)
```javascript
base: process.env.NODE_ENV === 'production' ? '/japanese-vocab/' : '/'
```
- 生产环境使用 `/japanese-vocab/` 作为 base URL
- 开发环境使用 `/` 作为 base URL

### 工作流权限
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```
这些权限允许 GitHub Actions 读取代码、写入 Pages 和使用身份令牌。

## 更新部署

每次推送到 `main` 分支时，都会自动触发新的部署：

```bash
git add .
git commit -m "更新内容"
git push
```

## 本地测试生产构建

在推送前，可以本地测试生产构建：

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

## 故障排除

### 部署失败
1. 检查 Actions 标签中的错误日志
2. 确保 GitHub Pages 已在仓库设置中启用
3. 确保工作流有正确的权限

### 页面 404
1. 检查 `vite.config.js` 中的 `base` 配置是否正确
2. 确保路径匹配仓库名称：`/japanese-vocab/`

### 样式或资源加载失败
1. 确保所有资源路径都是相对路径
2. 检查浏览器控制台的错误信息
3. 验证 base URL 配置

## 环境变量

### NODE_ENV
- `development`: 开发环境
- `production`: 生产环境（GitHub Actions 自动设置）

## 缓存

工作流使用 npm 缓存来加速构建：
```yaml
with:
  cache: 'npm'
```

## 并发控制

只允许一个部署同时进行：
```yaml
concurrency:
  group: "pages"
  cancel-in-progress: true
```

## 监控

可以在以下位置查看部署状态：
- **Actions 标签**: 查看工作流运行历史
- **Deployments**: 查看部署历史和当前状态
- **Environments**: 查看 github-pages 环境

## 自定义域名（可选）

如果想使用自定义域名：
1. 在 `public/` 目录创建 `CNAME` 文件
2. 文件内容为你的域名，如：`vocab.example.com`
3. 在 DNS 提供商配置 CNAME 记录指向 `kawaii2025.github.io`

## 成本

GitHub Pages 和 GitHub Actions 对公开仓库完全免费！
