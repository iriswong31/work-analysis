---
name: fix-ai-animation-link
overview: 恢复 AI 动画报告卡片的链接，使其可以正常跳转到详情页。
todos:
  - id: locate-outputs-json
    content: 定位 outputs.json 文件并找到 AI 动画报告配置项
    status: completed
  - id: find-report-id
    content: 确认 AI 动画报告对应的 deliverable ID
    status: completed
    dependencies:
      - locate-outputs-json
  - id: restore-link
    content: 将 link 字段从 null 恢复为正确的路由路径
    status: completed
    dependencies:
      - find-report-id
  - id: verify-route
    content: 验证 /deliverables/:id 路由可正常访问
    status: completed
    dependencies:
      - restore-link
  - id: test-card-click
    content: 测试卡片点击跳转功能是否正常
    status: completed
    dependencies:
      - verify-route
---

## 产品概述

修复 AI 动画报告卡片的链接功能，使用户点击卡片后能够正常跳转到详情页面。

## 核心功能

- 恢复 outputs.json 中 AI 动画报告的 link 字段值
- 确保链接指向正确的 /deliverables/:id 路由
- 验证卡片点击后能正常跳转到详情页

## 技术方案

### 问题分析

根据用户反馈，AI 动画报告卡片无法点击跳转。经排查：

- outputs.json 中该报告的 link 字段被错误设置为 null
- /deliverables/:id 路由仍然存在且可用
- 报告数据完整，仅需恢复链接配置

### 修复方案

#### 数据修复

定位 outputs.json 文件中 AI 动画报告的配置项，将 link 字段从 null 恢复为正确的路由路径。

#### 预期修改

```
{
  "title": "AI 动画制作技术调研报告",
  "link": "/deliverables/{对应的报告ID}"
}
```

### 验证要点

1. 确认报告对应的 deliverable ID
2. 验证 /deliverables/:id 路由可正常访问
3. 测试卡片点击跳转功能