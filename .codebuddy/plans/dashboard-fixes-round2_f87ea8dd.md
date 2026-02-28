---
name: dashboard-fixes-round2
overview: 修复三个问题：1) 返回列表按钮跳转到首页；2) 修正产出列表中失效的链接；3) 重新设计首页任务统计区域，显示具体任务内容而非仅数字。
todos:
  - id: explore-codebase
    content: 使用 [subagent:code-explorer] 搜索返回按钮、产出链接和任务统计相关代码
    status: completed
  - id: fix-back-button
    content: 修复 DeliverableDetail 页面返回按钮跳转到首页
    status: completed
    dependencies:
      - explore-codebase
  - id: fix-deliverable-links
    content: 修复产出列表中 AI 动画报告等卡片的失效链接
    status: completed
    dependencies:
      - explore-codebase
  - id: redesign-task-panel
    content: 重设计首页任务统计区域，展示具体任务内容
    status: completed
    dependencies:
      - explore-codebase
  - id: verify-fixes
    content: 验证所有修复功能正常工作
    status: completed
    dependencies:
      - fix-back-button
      - fix-deliverable-links
      - redesign-task-panel
---

## Product Overview

修复 Dashboard 应用中的三个用户反馈问题，包括导航跳转错误、链接失效以及首页任务统计区域的信息展示优化。

## Core Features

- **返回按钮修复**：将 DeliverableDetail 页面的"返回列表"按钮跳转目标从已删除的 /deliverables 路由改为首页
- **产出链接修复**：修正产出列表中 AI 动画报告等卡片的失效链接，确保点击后能正确跳转到对应详情页
- **任务统计区域重设计**：重新设计首页双引擎面板，在保持紧凑布局的前提下，展示具体任务内容而非仅显示数字统计

## Tech Stack

- 基于现有项目技术栈进行修改
- 前端框架：React + TypeScript
- 路由：React Router

## Implementation Details

### 修改文件分析

```
project-root/
├── src/
│   ├── pages/
│   │   ├── DeliverableDetail/
│   │   │   └── index.tsx          # 修改：返回按钮跳转路径
│   │   └── Home/
│   │       └── index.tsx          # 修改：任务统计区域重设计
│   ├── components/
│   │   └── DeliverableCard/
│   │       └── index.tsx          # 修改：修复链接生成逻辑
│   └── routes/
│       └── index.tsx              # 检查：确认路由配置
```

### 关键修改点

**1. 返回按钮修复**

- 定位 DeliverableDetail 页面中的返回按钮组件
- 将 `navigate('/deliverables')` 改为 `navigate('/')` 或首页对应路由

**2. 产出链接修复**

- 检查 DeliverableCard 组件的链接生成逻辑
- 确认链接路径与当前路由配置匹配
- 修复 AI 动画报告等特定类型卡片的跳转路径

**3. 任务统计区域重设计**

- 在现有数字统计基础上增加任务列表展示
- 采用可折叠或紧凑列表形式显示具体任务
- 保持原有的双引擎面板布局结构

### 数据流

用户点击返回/链接 -> 路由解析 -> 页面跳转 -> 正确目标页面渲染

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 搜索项目中返回按钮、产出链接和任务统计相关的代码位置
- Expected outcome: 定位所有需要修改的文件和具体代码行