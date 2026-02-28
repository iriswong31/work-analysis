import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { priorityEvaluator, PriorityResult } from './priority.js';
import type { 
  ShortTermTask, 
  LongTermGoal, 
  ImmediateContext,
  ExecutableTask,
  TaskContext 
} from '../types/index.js';

/**
 * 任务选择器
 * 根据优先级和上下文智能选择今日执行的任务
 */
export class TaskSelector {
  /**
   * 选择今日执行的任务
   */
  async selectDailyTasks(
    tasks: ShortTermTask[],
    context: ImmediateContext | null,
    goals: LongTermGoal[],
    maxTasks: number
  ): Promise<ExecutableTask[]> {
    logger.info(`Selecting from ${tasks.length} tasks, max ${maxTasks}`);

    // 1. 过滤可执行的任务
    const eligibleTasks = this.filterEligibleTasks(tasks);
    logger.info(`Eligible tasks: ${eligibleTasks.length}`);

    if (eligibleTasks.length === 0) {
      return [];
    }

    // 2. 评估优先级
    const priorityResults = priorityEvaluator.evaluateAll(eligibleTasks, goals, context);

    // 3. 过滤编码任务
    const codingResults = priorityResults.filter(r => r.isCodingTask);
    logger.info(`Coding tasks: ${codingResults.length}`);

    if (codingResults.length === 0) {
      logger.warn('No coding tasks found');
      return [];
    }

    // 4. 按优先级排序
    const sortedResults = codingResults.sort((a, b) => b.totalScore - a.totalScore);

    // 5. 选择任务（考虑时间约束）
    const selectedTasks = this.selectWithTimeConstraint(
      sortedResults,
      eligibleTasks,
      context?.availableHours || 8,
      maxTasks
    );

    // 6. 转换为可执行任务
    const executableTasks = selectedTasks.map((result, index) => {
      const task = eligibleTasks.find(t => t.id === result.taskId)!;
      return this.createExecutableTask(task, result, index);
    });

    logger.info(`Selected ${executableTasks.length} tasks for execution`);
    return executableTasks;
  }

  /**
   * 过滤可执行的任务
   */
  private filterEligibleTasks(tasks: ShortTermTask[]): ShortTermTask[] {
    return tasks.filter(task => {
      // 只选择待处理或进行中的任务
      if (task.status !== 'pending' && task.status !== 'in_progress') {
        return false;
      }

      // 只选择工作引擎的任务（编码任务通常在工作引擎）
      if (task.engine !== 'work') {
        return false;
      }

      // 排除没有描述的任务
      if (!task.description || task.description.trim().length < 10) {
        return false;
      }

      return true;
    });
  }

  /**
   * 考虑时间约束选择任务
   */
  private selectWithTimeConstraint(
    sortedResults: PriorityResult[],
    tasks: ShortTermTask[],
    availableHours: number,
    maxTasks: number
  ): PriorityResult[] {
    const selected: PriorityResult[] = [];
    let totalHours = 0;

    for (const result of sortedResults) {
      if (selected.length >= maxTasks) break;

      const task = tasks.find(t => t.id === result.taskId);
      if (!task) continue;

      const estimatedHours = task.estimatedHours || 2;

      // 检查是否有足够时间
      if (totalHours + estimatedHours <= availableHours) {
        selected.push(result);
        totalHours += estimatedHours;
      } else if (selected.length === 0) {
        // 如果还没选择任何任务，至少选择一个
        selected.push(result);
        break;
      }
    }

    return selected;
  }

  /**
   * 创建可执行任务
   */
  private createExecutableTask(
    task: ShortTermTask,
    priorityResult: PriorityResult,
    order: number
  ): ExecutableTask {
    return {
      id: uuidv4(),
      sourceTask: task,
      type: priorityResult.taskType,
      context: this.buildTaskContext(task),
      priority: priorityResult.totalScore,
      estimatedDuration: (task.estimatedHours || 2) * 60 * 60 * 1000, // 转换为毫秒
      scheduledAt: new Date(Date.now() + order * 30 * 60 * 1000), // 每个任务间隔30分钟
    };
  }

  /**
   * 构建任务上下文
   */
  private buildTaskContext(task: ShortTermTask): TaskContext {
    // 从任务描述中提取信息
    const description = task.description || '';
    
    // 尝试提取项目路径
    const projectPathMatch = description.match(/项目[：:]\s*([^\s,，]+)/);
    const projectPath = projectPathMatch?.[1] || './';

    // 尝试提取相关文件
    const fileMatches = description.match(/文件[：:]\s*([^\s,，]+)/g) || [];
    const relatedFiles = fileMatches.map(m => m.replace(/文件[：:]\s*/, ''));

    // 尝试提取技术栈
    const techKeywords = ['React', 'Vue', 'Node', 'TypeScript', 'Python', 'Go', 'Java'];
    const techStack = techKeywords.filter(tech => 
      description.toLowerCase().includes(tech.toLowerCase()) ||
      task.title.toLowerCase().includes(tech.toLowerCase())
    );

    return {
      projectPath,
      requirements: `${task.title}\n\n${description}`,
      relatedFiles,
      expectedOutput: this.inferExpectedOutput(task),
      techStack: techStack.length > 0 ? techStack : undefined,
      constraints: task.tags.length > 0 ? task.tags : undefined,
    };
  }

  /**
   * 推断预期产出
   */
  private inferExpectedOutput(task: ShortTermTask): string {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();

    if (title.includes('组件') || description.includes('组件')) {
      return 'React/Vue 组件代码';
    }
    if (title.includes('接口') || title.includes('api')) {
      return 'API 接口实现代码';
    }
    if (title.includes('页面') || description.includes('页面')) {
      return '页面组件代码';
    }
    if (title.includes('服务') || description.includes('服务')) {
      return '服务层代码';
    }
    if (title.includes('修复') || title.includes('bug')) {
      return 'Bug 修复补丁';
    }
    if (title.includes('优化') || description.includes('优化')) {
      return '性能优化代码';
    }
    if (title.includes('重构') || description.includes('重构')) {
      return '重构后的代码';
    }

    return '功能实现代码';
  }

  /**
   * 获取任务选择摘要
   */
  getSelectionSummary(tasks: ExecutableTask[]): string {
    if (tasks.length === 0) {
      return '今日无可执行的编码任务';
    }

    const totalHours = tasks.reduce(
      (sum, t) => sum + (t.sourceTask.estimatedHours || 2),
      0
    );

    const typeCount = tasks.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeStr = Object.entries(typeCount)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return `选择了 ${tasks.length} 个任务，预计耗时 ${totalHours} 小时。任务类型：${typeStr}`;
  }
}

export const taskSelector = new TaskSelector();
