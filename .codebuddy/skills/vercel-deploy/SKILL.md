---
name: vercel-deploy
description: 部署前端项目到 Vercel 平台。当用户需要将 React/Vue/Next.js 等前端项目部署到 Vercel 并获取公开访问链接时使用此 Skill。支持一键部署、环境变量配置、自定义域名绑定等功能。
---

# Vercel 部署 Skill

将前端项目一键部署到 Vercel 平台，获取全球 CDN 加速的公开访问链接。

## 适用场景

- 部署 React、Vue、Next.js、Vite 等前端项目
- 需要获取可公开分享的预览链接
- 需要 CI/CD 自动部署（Git 推送自动更新）
- 需要自定义域名绑定

## 前置准备

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

按提示选择登录方式（GitHub/GitLab/Bitbucket/Email）。

## 部署流程

### 方式一：交互式部署（推荐新手）

在项目根目录执行：

```bash
vercel
```

首次部署会询问：
- **Set up and deploy?** → Yes
- **Which scope?** → 选择你的账户或团队
- **Link to existing project?** → No（创建新项目）
- **What's your project's name?** → 输入项目名称
- **In which directory is your code located?** → `.` 或指定目录
- **Want to modify these settings?** → No（使用默认配置）

部署完成后会输出预览 URL。

### 方式二：一键部署（适合重复部署）

```bash
# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

### 方式三：无交互部署（适合 CI/CD）

```bash
vercel --yes --prod
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `vercel` | 部署到预览环境 |
| `vercel --prod` | 部署到生产环境 |
| `vercel ls` | 列出所有部署 |
| `vercel rm <url>` | 删除某个部署 |
| `vercel env add` | 添加环境变量 |
| `vercel domains add <domain>` | 绑定自定义域名 |
| `vercel logs <url>` | 查看部署日志 |

## 项目配置文件

在项目根目录创建 `vercel.json` 进行高级配置：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 常见框架配置

**Vite 项目：**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**Create React App：**
```json
{
  "framework": "create-react-app",
  "buildCommand": "npm run build",
  "outputDirectory": "build"
}
```

**Next.js：**
无需配置，Vercel 自动识别。

**Vue CLI：**
```json
{
  "framework": "vue-cli",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## 环境变量配置

### 通过 CLI 添加
```bash
# 添加环境变量（交互式）
vercel env add

# 添加到生产环境
vercel env add VARIABLE_NAME production
```

### 通过 Web 控制台
1. 登录 https://vercel.com/dashboard
2. 进入项目 Settings → Environment Variables
3. 添加变量并选择适用环境

## 自定义域名

```bash
# 添加域名
vercel domains add example.com

# 验证域名
vercel domains verify example.com
```

然后按提示在域名 DNS 中添加相应记录。

## 常见问题处理

### 构建失败
```bash
# 查看详细日志
vercel logs <deployment-url>
```

### SPA 路由 404
在 `vercel.json` 添加 rewrites 规则：
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 环境变量未生效
- 确保变量名以 `VITE_` 开头（Vite 项目）
- 确保变量名以 `REACT_APP_` 开头（CRA 项目）
- 重新部署项目

## 完整部署示例

```bash
# 1. 确保在项目根目录
cd /path/to/your-project

# 2. 构建检查（可选）
npm run build

# 3. 登录 Vercel（首次使用）
vercel login

# 4. 部署到生产环境
vercel --prod

# 5. 获取部署链接
# 输出示例：
# 🔗 Preview: https://your-project-xxx.vercel.app
# 🔗 Production: https://your-project.vercel.app
```

## 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Vercel Dashboard](https://vercel.com/dashboard)
