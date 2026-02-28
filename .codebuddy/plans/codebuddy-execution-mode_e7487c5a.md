---
name: codebuddy-execution-mode
overview: 修改自主调度器，使其生成任务计划后输出为可在 CodeBuddy 对话中执行的格式，无需外部 API Key。
todos:
  - id: analyze-scheduler
    content: 使用 [subagent:code-explorer] 分析现有自主调度器的代码结构和输出格式
    status: completed
  - id: define-execution-format
    content: 定义 CodeBuddy 对话可执行的任务计划格式规范
    status: completed
    dependencies:
      - analyze-scheduler
  - id: create-formatter
    content: 实现格式转换器，将任务计划转换为对话执行格式
    status: completed
    dependencies:
      - define-execution-format
  - id: remove-api-dependency
    content: 移除外部 API Key 相关的执行逻辑
    status: completed
    dependencies:
      - analyze-scheduler
  - id: integrate-output
    content: 集成格式转换器到调度器输出流程
    status: completed
    dependencies:
      - create-formatter
      - remove-api-dependency
  - id: test-execution
    content: 在 CodeBuddy 对话中测试任务计划的执行流程
    status: completed
    dependencies:
      - integrate-output
---

## 产品概述

修改自主调度器（Autonomous Scheduler），使其生成的任务计划能够直接在 CodeBuddy 对话中执行，无需依赖外部 API Key。任务将由当前对话中的 AI 直接执行，简化工作流程。

## 核心功能

- 任务计划输出格式转换：将调度器生成的任务计划转换为 CodeBuddy 对话可执行的格式
- 移除外部 API Key 依赖：任务执行完全由当前对话中的 AI 完成
- 任务执行状态追踪：在对话中实时显示任务执行进度和结果
- 任务计划可视化展示：以清晰的格式展示待执行的任务列表

## 技术栈

- 语言：TypeScript
- 运行环境：CodeBuddy 对话环境
- 输出格式：Markdown / 结构化文本

## 技术架构

### 系统架构

采用管道式架构，调度器生成任务计划后，通过格式转换器输出为对话可执行格式。

```mermaid
flowchart LR
    A[自主调度器] --> B[任务计划生成]
    B --> C[格式转换器]
    C --> D[CodeBuddy 对话输出]
    D --> E[AI 逐步执行]
    E --> F[执行结果反馈]
```

### 模块划分

- **任务计划生成模块**：现有调度器核心逻辑，生成结构化任务列表
- **格式转换模块**：将内部任务格式转换为对话可执行格式
- **输出模块**：以 Markdown 格式输出任务计划，便于 AI 理解和执行

### 数据流

用户请求 -> 调度器分析 -> 生成任务计划 -> 格式转换 -> 对话输出 -> AI 逐步执行

## 实现细节

### 核心目录结构

```
project-root/
├── src/
│   ├── scheduler/
│   │   └── outputFormatter.ts    # 新增：对话执行格式转换器
│   └── types/
│       └── executionPlan.ts      # 新增：执行计划类型定义
```

### 关键代码结构

**ExecutionPlan 接口**：定义对话可执行的任务计划结构，包含任务列表、依赖关系和执行指令。

```typescript
interface ExecutionPlan {
  tasks: ExecutableTask[];
  executionMode: 'conversation';
  requiresApiKey: false;
}

interface ExecutableTask {
  id: string;
  description: string;
  dependencies: string[];
  instructions: string;
}
```

**OutputFormatter 类**：负责将调度器内部任务格式转换为对话可执行格式，生成清晰的 Markdown 输出。

```typescript
class OutputFormatter {
  formatForConversation(plan: InternalPlan): ExecutionPlan { }
  toMarkdown(plan: ExecutionPlan): string { }
}
```

### 技术实现方案

1. **问题**：现有调度器输出格式需要外部 API 执行
2. **方案**：新增格式转换层，将任务转换为对话指令格式
3. **关键技术**：Markdown 格式化、任务依赖解析
4. **实现步骤**：

- 分析现有调度器输出结构
- 设计对话可执行格式规范
- 实现格式转换器
- 集成到调度器输出流程

5. **验证方式**：在 CodeBuddy 对话中测试任务执行流程

## Agent Extensions

### SubAgent

- **code-explorer**
- 用途：分析现有自主调度器代码结构，理解当前任务计划生成逻辑
- 预期结果：获取调度器核心模块的代码结构和输出格式定义