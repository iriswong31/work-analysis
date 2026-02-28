---
name: github-deploy
description: 将项目版本部署（推送）到 GitHub 仓库。当用户需要提交代码、推送到 GitHub、打版本标签、管理分支时使用此 Skill。支持常规推送、版本发布、分支管理等功能。
---

# GitHub 部署 Skill

将项目代码提交并推送到 GitHub 仓库，支持版本标签管理和分支操作。

## 适用场景

- "推到 GitHub"、"提交代码"、"部署到 GitHub"
- "发一个新版本"、"打个 tag"
- "创建/切换分支"
- "看看当前状态"、"有哪些改动"

## 项目信息

- **GitHub 账号**: iriswong31
- **远程仓库**: https://github.com/iriswong31/work-analysis.git
- **邮箱**: iriswong31@gmail.com

## 标准工作流

### 1. 查看当前状态

每次操作前必须先确认状态：

```bash
# 查看改动概览
git status

# 查看具体改了什么
git diff --stat
```

### 2. 常规提交推送

```bash
# 添加所有改动
git add -A

# 提交（commit message 规范见下方）
git commit -m "类型: 简短描述"

# 推送到远程
git push origin main
```

### 3. 版本发布（打标签）

当用户说"发布版本"、"打个 tag"时：

```bash
# 创建版本标签（语义化版本号）
git tag -a v1.0.0 -m "版本描述"

# 推送标签到远程
git push origin v1.0.0

# 或推送所有标签
git push origin --tags
```

### 4. 分支管理

```bash
# 查看所有分支
git branch -a

# 创建新分支
git checkout -b feature/分支名

# 切换分支
git checkout 分支名

# 推送新分支到远程
git push -u origin 分支名
```

## Commit Message 规范

格式：`类型: 简短描述`

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat: 添加数据大屏页面` |
| fix | 修复 bug | `fix: 修复移动端适配问题` |
| docs | 文档更新 | `docs: 更新部署说明` |
| style | 样式调整 | `style: 优化卡片间距` |
| refactor | 重构 | `refactor: 重构组件结构` |
| chore | 杂务/配置 | `chore: 更新依赖版本` |
| content | 内容更新 | `content: 更新调研报告` |

**提交描述使用中文**，类型前缀用英文。

## 版本号规范

采用语义化版本 `vX.Y.Z`：

- **X（主版本）**: 重大变更、不兼容更新
- **Y（次版本）**: 新功能、向后兼容
- **Z（补丁）**: Bug 修复、小调整

示例：
- `v1.0.0` — 首次正式发布
- `v1.1.0` — 添加新页面/功能
- `v1.1.1` — 修复小问题

## 执行规则

### 必须遵守

1. **推送前必须确认**：向用户展示 `git status` 和 `git diff --stat`，确认要提交的内容
2. **不自动推送**：必须得到用户明确同意后才执行 `git push`
3. **不强制推送**：永远不使用 `git push --force`，除非用户明确要求
4. **不修改历史**：不使用 `git commit --amend`，除非用户明确要求
5. **不动 git config**：不修改全局或本地 git 配置

### 推送前检查清单

- [ ] `git status` 确认改动范围
- [ ] 确认不会推送敏感信息（API Key、密码等）
- [ ] commit message 清晰描述本次变更
- [ ] 用户已确认可以推送

### .gitignore 检查

推送前确认以下内容被忽略：

```
node_modules/
dist/
.env
*.log
.DS_Store
```

如果 `.gitignore` 不存在或缺少关键项，先提醒用户补充。

## 常见操作速查

| 用户说 | 执行操作 |
|--------|---------|
| "推到 GitHub" | 查看状态 → 确认 → add → commit → push |
| "发个版本" | 查看状态 → 确认 → add → commit → tag → push → push tags |
| "看看改了什么" | git status + git diff --stat |
| "回退上次提交" | git log --oneline -5 展示 → 确认 → git revert |
| "创建分支" | git checkout -b → 确认 → push -u |

## 故障排除

### 推送被拒绝（远程有新提交）
```bash
# 先拉取远程更新
git pull --rebase origin main
# 再推送
git push origin main
```

### 误提交了不该提交的文件
```bash
# 从暂存区移除（不删本地文件）
git rm --cached 文件名
# 重新提交
git commit -m "chore: 移除误提交的文件"
```

### 查看提交历史
```bash
git log --oneline -10
```
