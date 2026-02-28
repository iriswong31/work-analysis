/**
 * CodeBuddy 对话执行格式转换器
 * 将任务计划转换为可在 CodeBuddy 对话中执行的格式
 */

import type { DailyPlan, DailyTask, TaskType } from './types.js';

/**
 * CodeBuddy 可执行任务
 */
export interface CodeBuddyTask {
  id: string;
  order: number;
  title: string;
  type: TaskType;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  prompt: string;           // 给 AI 的执行指令
  context: {
    goal?: string;
    milestone?: string;
    deliverables?: string[];
  };
}

/**
 * CodeBuddy 执行计划
 */
export interface CodeBuddyPlan {
  date: string;
  generatedAt: string;
  executionMode: 'conversation';
  requiresApiKey: false;
  summary: {
    totalTasks: number;
    totalMinutes: number;
    codingTasks: number;
    workTasks: number;
    lifeTasks: number;
  };
  tasks: CodeBuddyTask[];
  focusGoals: string[];
}

/**
 * 格式转换器类
 */
class CodeBuddyFormatter {
  /**
   * 将 DailyPlan 转换为 CodeBuddy 执行计划
   */
  formatPlan(plan: DailyPlan): CodeBuddyPlan {
    return {
      date: plan.date,
      generatedAt: new Date().toISOString(),
      executionMode: 'conversation',
      requiresApiKey: false,
      summary: {
        totalTasks: plan.tasks.length,
        totalMinutes: plan.totalEstimatedMinutes,
        codingTasks: plan.codingTasks,
        workTasks: plan.workTasks,
        lifeTasks: plan.lifeTasks,
      },
      tasks: plan.tasks.map((task, index) => this.formatTask(task, index + 1)),
      focusGoals: plan.focusGoals,
    };
  }

  /**
   * 将单个任务转换为 CodeBuddy 格式
   */
  private formatTask(task: DailyTask, order: number): CodeBuddyTask {
    return {
      id: task.id,
      order,
      title: task.title,
      type: task.type,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      prompt: this.buildPrompt(task),
      context: {
        goal: task.sourceGoalName,
        milestone: task.sourceMilestone,
        deliverables: task.deliverables,
      },
    };
  }

  /**
   * 构建任务执行 prompt
   */
  private buildPrompt(task: DailyTask): string {
    const typeEmoji = this.getTypeEmoji(task.type);
    const priorityLabel = this.getPriorityLabel(task.priority);
    
    let prompt = `## ${typeEmoji} ${task.title}\n\n`;
    
    // 任务元信息
    prompt += `**类型**: ${this.getTypeName(task.type)} | **优先级**: ${priorityLabel} | **预估时间**: ${task.estimatedMinutes} 分钟\n\n`;
    
    // 任务描述
    if (task.description) {
      prompt += `### 任务描述\n${task.description}\n\n`;
    }
    
    // 来源目标
    if (task.sourceGoalName) {
      prompt += `### 关联目标\n- 目标: ${task.sourceGoalName}\n`;
      if (task.sourceMilestone) {
        prompt += `- 里程碑: ${task.sourceMilestone}\n`;
      }
      prompt += '\n';
    }
    
    // 预期产出
    if (task.deliverables && task.deliverables.length > 0) {
      prompt += `### 预期产出\n`;
      task.deliverables.forEach(d => {
        prompt += `- ${d}\n`;
      });
      prompt += '\n';
    }
    
    // 执行指令
    prompt += this.getExecutionInstructions(task);
    
    return prompt;
  }

  /**
   * 根据任务类型生成执行指令
   */
  private getExecutionInstructions(task: DailyTask): string {
    switch (task.type) {
      case 'coding':
        return `### 执行指令
请帮我完成这个编码任务：
1. 分析任务需求
2. 设计实现方案
3. 编写代码
4. 测试验证
5. 总结产出

完成后请告诉我执行结果和遇到的问题。
`;
      case 'work':
        return `### 执行指令
请帮我完成这个工作任务：
1. 理解任务目标
2. 制定执行计划
3. 逐步完成各项工作
4. 输出工作成果

完成后请总结执行情况。
`;
      case 'life':
        return `### 执行指令
请帮我规划这个生活任务：
1. 分析任务要点
2. 制定行动计划
3. 列出具体步骤
4. 提供执行建议

请给出详细的执行方案。
`;
      default:
        return `### 执行指令
请帮我完成这个任务，并告诉我执行结果。
`;
    }
  }

  /**
   * 输出为 Markdown 格式（用于对话展示）
   */
  toMarkdown(plan: CodeBuddyPlan): string {
    let md = '';
    
    // 标题
    md += `# 📋 每日任务计划\n\n`;
    md += `**日期**: ${plan.date} | **生成时间**: ${new Date(plan.generatedAt).toLocaleTimeString('zh-CN')}\n\n`;
    
    // 统计信息
    md += `## 📊 任务统计\n\n`;
    md += `| 指标 | 数值 |\n`;
    md += `|------|------|\n`;
    md += `| 总任务数 | ${plan.summary.totalTasks} |\n`;
    md += `| 预估时间 | ${plan.summary.totalMinutes} 分钟 (${(plan.summary.totalMinutes / 60).toFixed(1)} 小时) |\n`;
    md += `| 编码任务 | ${plan.summary.codingTasks} |\n`;
    md += `| 工作任务 | ${plan.summary.workTasks} |\n`;
    md += `| 生活任务 | ${plan.summary.lifeTasks} |\n\n`;
    
    // 关联目标
    if (plan.focusGoals.length > 0) {
      md += `## 🎯 关联目标\n\n`;
      plan.focusGoals.forEach(goal => {
        md += `- ${goal}\n`;
      });
      md += '\n';
    }
    
    // 任务列表
    md += `## 📝 任务列表\n\n`;
    md += `以下任务将按顺序执行，请逐个确认：\n\n`;
    
    plan.tasks.forEach((task, index) => {
      const emoji = this.getTypeEmoji(task.type);
      const priority = this.getPriorityLabel(task.priority);
      md += `### ${index + 1}. ${emoji} ${task.title}\n\n`;
      md += `- **优先级**: ${priority}\n`;
      md += `- **预估时间**: ${task.estimatedMinutes} 分钟\n`;
      if (task.context.goal) {
        md += `- **关联目标**: ${task.context.goal}\n`;
      }
      md += '\n';
    });
    
    // 执行说明
    md += `---\n\n`;
    md += `## 🚀 开始执行\n\n`;
    md += `请回复 **"执行任务 1"** 开始第一个任务，或 **"执行全部"** 按顺序执行所有任务。\n`;
    
    return md;
  }

  /**
   * 输出单个任务的执行 prompt
   */
  getTaskPrompt(plan: CodeBuddyPlan, taskIndex: number): string | null {
    if (taskIndex < 0 || taskIndex >= plan.tasks.length) {
      return null;
    }
    return plan.tasks[taskIndex].prompt;
  }

  /**
   * 输出为 JSON 格式（用于程序读取）
   */
  toJSON(plan: CodeBuddyPlan): string {
    return JSON.stringify(plan, null, 2);
  }

  private getTypeEmoji(type: TaskType): string {
    switch (type) {
      case 'coding': return '💻';
      case 'work': return '📋';
      case 'life': return '🌱';
      default: return '📌';
    }
  }

  private getTypeName(type: TaskType): string {
    switch (type) {
      case 'coding': return '编码任务';
      case 'work': return '工作任务';
      case 'life': return '生活任务';
      default: return '其他任务';
    }
  }

  private getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return '🔴 高';
      case 'medium': return '🟡 中';
      case 'low': return '🟢 低';
      default: return priority;
    }
  }
}

export const codeBuddyFormatter = new CodeBuddyFormatter();
export { CodeBuddyFormatter };
