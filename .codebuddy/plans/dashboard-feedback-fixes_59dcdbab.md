---
name: dashboard-feedback-fixes
overview: 修复 Dashboard 页面的 6 个反馈问题：移除不需要的组件、删除老页面、实现反馈智能分类写入记忆层、修复产出列表点击问题。
todos:
  - id: explore-components
    content: 使用 [subagent:code-explorer] 搜索三个待移除组件的所有引用位置
    status: completed
  - id: remove-components
    content: 从 Dashboard 页面移除社区慈善调研报告、TAPD 集成、五层记忆架构三个组件
    status: completed
    dependencies:
      - explore-components
  - id: delete-deliverables
    content: 删除 /deliverables 老页面及相关路由配置
    status: completed
  - id: implement-feedback-classify
    content: 实现反馈智能分类功能并写入对应记忆层
    status: completed
  - id: fix-card-click
    content: 修复产出列表卡片点击无响应问题
    status: completed
  - id: verify-fixes
    content: 验证所有修复项功能正常
    status: completed
    dependencies:
      - remove-components
      - delete-deliverables
      - implement-feedback-classify
      - fix-card-click
---

## Product Overview

修复 Dashboard 页面的 6 个用户反馈问题，包括移除不需要的组件、删除废弃页面、实现反馈智能分类功能以及修复交互问题。

## Core Features

1. **组件移除**：从 Dashboard 页面移除"社区慈善调研报告"、"TAPD 集成"、"五层记忆架构"三个不需要的组件
2. **老页面删除**：删除"每日交付时间轴"老页面（/deliverables 路由及相关文件）
3. **反馈智能分类**：用户提交反馈后，系统自动进行智能分类并写入对应的记忆层
4. **产出列表点击修复**：修复产出列表卡片点击无响应的交互问题，确保点击后能正常跳转或展开详情

## Tech Stack

- 前端框架：基于现有项目技术栈（React/Next.js + TypeScript）
- 样式方案：沿用项目现有 Tailwind CSS 配置
- 状态管理：复用现有状态管理方案

## Tech Architecture

### System Architecture

本次修改为存量项目的 Bug 修复和功能优化，遵循现有项目架构，不引入新的架构模式。

### Module Division

- **Dashboard 组件模块**：移除指定的三个组件
- **路由模块**：删除 /deliverables 相关路由配置
- **反馈模块**：新增智能分类逻辑，对接记忆层写入
- **产出列表模块**：修复卡片点击事件绑定

### Data Flow

用户提交反馈 -> 智能分类处理 -> 写入对应记忆层 -> 返回处理结果

## Implementation Details

### Core Directory Structure

仅展示需要修改的文件：

```
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # 移除三个组件的引用
│   └── deliverables/             # 删除整个目录
│       └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── CharityReportCard.tsx # 待移除
│   │   ├── TapdIntegration.tsx   # 待移除
│   │   └── MemoryArchitecture.tsx # 待移除
│   └── deliverables/
│       └── DeliverableCard.tsx   # 修复点击事件
└── services/
    └── feedbackService.ts        # 新增智能分类逻辑
```

### Key Code Structures

**反馈智能分类接口**：定义反馈分类和记忆层写入的数据结构

```typescript
interface FeedbackClassification {
  feedbackId: string;
  content: string;
  category: 'bug' | 'feature' | 'improvement' | 'question';
  memoryLayer: 'core' | 'project' | 'session' | 'interaction';
  confidence: number;
}

async function classifyAndStoreFeedback(feedback: string): Promise<FeedbackClassification> {
  // 智能分类逻辑
  // 写入对应记忆层
}
```

**产出卡片点击处理**：修复事件绑定问题

```typescript
interface DeliverableCardProps {
  id: string;
  title: string;
  onClick: (id: string) => void;
}
```

### Technical Implementation Plan

1. **组件移除**

- 定位并删除三个组件文件
- 清理 Dashboard 页面中的组件引用和导入语句
- 验证页面渲染正常

2. **老页面删除**

- 删除 /deliverables 路由目录
- 清理相关导航链接
- 更新路由配置

3. **反馈智能分类实现**

- 在 feedbackService 中实现分类算法
- 对接记忆层 API 进行数据写入
- 添加分类结果反馈

4. **点击事件修复**

- 检查 DeliverableCard 组件的事件绑定
- 确认 onClick 回调正确传递
- 测试点击交互

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose：搜索项目中三个待移除组件的所有引用位置，以及 /deliverables 路由的相关配置
- Expected outcome：获取完整的组件引用列表和路由配置文件位置，确保删除时不遗漏��，确保删除时不遗漏