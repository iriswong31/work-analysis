/**
 * 任务生成器
 * 基于五层记忆系统自动分解生成每日任务
 */

import { yamlMemoryReader } from '../memory/yaml-reader.js';
import { logger } from '../utils/logger.js';
import type {
  DailyTask,
  DailyPlan,
  TaskType,
  TaskPriority,
  GoalInfo,
  MilestoneInfo,
  TaskGenerationContext,
  ProjectState,
  PendingItem,
} from './types.js';

/**
 * 任务生成器类
 */
class TaskGenerator {
  private readonly PRIORITY_WEIGHTS = {
    compoundValue: 0.4,
    goalAlignment: 0.25,
    urgency: 0.2,
    resourceMatch: 0.15,
  };

  /**
   * 生成每日计划
   */
  async generateDailyPlan(): Promise<DailyPlan> {
    logger.info('🎯 开始生成每日计划...');

    // 1. 读取记忆系统数据
    const context = await this.buildContext();
    logger.info(`读取到 ${context.goals.length} 个目标，${context.pendingItems.length} 个待办事项`);

    // 2. 生成候选任务
    const candidateTasks = await this.generateCandidateTasks(context);
    logger.info(`生成 ${candidateTasks.length} 个候选任务`);

    // 3. 评估优先级并排序
    const scoredTasks = this.scoreTasks(candidateTasks, context);

    // 4. 根据时间约束选择任务
    const selectedTasks = this.selectTasks(scoredTasks, context);
    logger.info(`选择 ${selectedTasks.length} 个任务执行`);

    // 5. 构建每日计划
    const plan = this.buildPlan(selectedTasks, context);

    return plan;
  }

  /**
   * 构建任务生成上下文
   */
  private async buildContext(): Promise<TaskGenerationContext> {
    const memory = await yamlMemoryReader.readAll();

    // 解析目标
    const goals: GoalInfo[] = [];
    if (memory.intent_goals?.long_term_goals) {
      for (const g of memory.intent_goals.long_term_goals) {
        goals.push({
          id: this.generateId(g.goal),
          name: g.goal,
          category: g.category as 'work' | 'life',
          description: g.description || '',
          targetDate: undefined, // YAML 中暂无此字段
          compoundValue: g.compound_value || 50,
          status: g.status as 'active' | 'completed' | 'paused',
          milestones: (g.milestones || []).map((m: any) => ({
            name: m.milestone,
            targetDate: undefined,
            completed: m.completed || false,
            tasks: m.tasks,
          })),
        });
      }
    }

    // 解析项目状态
    const projectStates: ProjectState[] = [];
    if (memory.L1_context?.project_states) {
      for (const p of memory.L1_context.project_states) {
        projectStates.push({
          projectId: p.project_id,
          name: p.name,
          status: p.status as 'active' | 'paused' | 'completed' | 'blocked',
          lastActivity: undefined, // YAML 中暂无此字段
          nextAction: p.next_action,
        });
      }
    }

    // 解析待办事项
    const pendingItems: PendingItem[] = [];
    if (memory.L1_context?.pending_items) {
      for (const item of memory.L1_context.pending_items) {
        pendingItems.push({
          item: item.item,
          priority: item.priority as TaskPriority,
          dueDate: item.due_date ? new Date(item.due_date) : undefined,
          context: undefined, // YAML 中暂无此字段
        });
      }
    }

    // 解析约束条件
    const constraints = memory.intent_constraints;
    const preferences = memory.intent_preferences;

    return {
      goals: goals.filter(g => g.status === 'active'),
      currentFocus: memory.intent_goals?.current_focus || [],
      projectStates,
      pendingItems,
      availableHours: constraints?.time_constraints?.available_hours_per_day || 4,
      workLifeRatio: preferences?.work_life_ratio || { work: 0.6, life: 0.4 },
      preferredWorkTimes: constraints?.time_constraints?.preferred_work_times || [],
      recentCompletionRate: 0.8, // TODO: 从历史数据计算
      averageTaskDuration: 60,   // TODO: 从历史数据计算
    };
  }

  /**
   * 生成候选任务
   */
  private async generateCandidateTasks(context: TaskGenerationContext): Promise<DailyTask[]> {
    const tasks: DailyTask[] = [];
    const now = new Date();

    // 1. 从目标里程碑生成任务
    for (const goal of context.goals) {
      const uncompletedMilestones = goal.milestones.filter(m => !m.completed);
      
      for (const milestone of uncompletedMilestones.slice(0, 2)) { // 每个目标最多取2个里程碑
        const task = this.createTaskFromMilestone(goal, milestone, now);
        if (task) {
          tasks.push(task);
        }
      }
    }

    // 2. 从项目状态生成任务
    for (const project of context.projectStates) {
      if (project.status === 'active' && project.nextAction) {
        const task = this.createTaskFromProject(project, now);
        tasks.push(task);
      }
    }

    // 3. 从待办事项生成任务
    for (const item of context.pendingItems) {
      const task = this.createTaskFromPending(item, now);
      tasks.push(task);
    }

    // 4. 根据当前聚焦领域调整
    for (const focus of context.currentFocus) {
      const focusTask = this.createFocusTask(focus, context, now);
      if (focusTask) {
        tasks.push(focusTask);
      }
    }

    return tasks;
  }

  /**
   * 从里程碑创建任务
   */
  private createTaskFromMilestone(
    goal: GoalInfo,
    milestone: MilestoneInfo,
    now: Date
  ): DailyTask | null {
    // 判断任务类型
    const type = this.inferTaskType(milestone.name, goal.category);
    
    // 计算紧急度
    const urgency = this.calculateUrgency(milestone.targetDate, now);

    return {
      id: this.generateId(`${goal.name}-${milestone.name}`),
      type,
      title: milestone.name,
      description: `来自目标「${goal.name}」的里程碑任务`,
      priority: this.urgencyToPriority(urgency),
      estimatedMinutes: this.estimateMinutes(milestone.name, type),
      status: 'pending',
      sourceGoalId: goal.id,
      sourceGoalName: goal.name,
      sourceMilestone: milestone.name,
      compoundValue: goal.compoundValue,
      goalAlignment: 100, // 直接来自目标，完全对齐
      urgency,
      order: 0,
      deliverables: milestone.tasks,
      createdAt: now,
    };
  }

  /**
   * 从项目状态创建任务
   */
  private createTaskFromProject(project: ProjectState, now: Date): DailyTask {
    const type = this.inferTaskType(project.nextAction || '', 'work');

    return {
      id: this.generateId(`project-${project.projectId}`),
      type,
      title: project.nextAction || `推进 ${project.name}`,
      description: `项目「${project.name}」的下一步行动`,
      priority: 'medium',
      estimatedMinutes: 60,
      status: 'pending',
      compoundValue: 70,
      goalAlignment: 80,
      urgency: 50,
      order: 0,
      createdAt: now,
    };
  }

  /**
   * 从待办事项创建任务
   */
  private createTaskFromPending(item: PendingItem, now: Date): DailyTask {
    const type = this.inferTaskType(item.item, 'work');
    const urgency = this.calculateUrgency(item.dueDate, now);

    return {
      id: this.generateId(`pending-${item.item}`),
      type,
      title: item.item,
      description: item.context || '待办事项',
      priority: item.priority,
      estimatedMinutes: 30,
      status: 'pending',
      compoundValue: 50,
      goalAlignment: 60,
      urgency,
      order: 0,
      createdAt: now,
    };
  }

  /**
   * 创建聚焦领域任务
   */
  private createFocusTask(
    focus: string,
    context: TaskGenerationContext,
    now: Date
  ): DailyTask | null {
    // 检查是否已有相关任务
    const hasRelatedGoal = context.goals.some(g => 
      g.name.includes(focus) || focus.includes(g.name)
    );

    if (hasRelatedGoal) {
      return null; // 已有相关目标任务，不重复创建
    }

    return {
      id: this.generateId(`focus-${focus}`),
      type: 'work',
      title: `推进「${focus}」领域`,
      description: `当前聚焦领域的推进任务`,
      priority: 'high',
      estimatedMinutes: 60,
      status: 'pending',
      compoundValue: 80,
      goalAlignment: 90,
      urgency: 60,
      order: 0,
      createdAt: now,
    };
  }

  /**
   * 评估任务优先级分数
   */
  private scoreTasks(tasks: DailyTask[], context: TaskGenerationContext): DailyTask[] {
    return tasks.map(task => {
      const score = 
        task.compoundValue * this.PRIORITY_WEIGHTS.compoundValue +
        task.goalAlignment * this.PRIORITY_WEIGHTS.goalAlignment +
        task.urgency * this.PRIORITY_WEIGHTS.urgency +
        this.calculateResourceMatch(task, context) * this.PRIORITY_WEIGHTS.resourceMatch;

      return {
        ...task,
        order: score,
      };
    }).sort((a, b) => b.order - a.order);
  }

  /**
   * 根据时间约束选择任务
   */
  private selectTasks(tasks: DailyTask[], context: TaskGenerationContext): DailyTask[] {
    const maxMinutes = context.availableHours * 60;
    const selected: DailyTask[] = [];
    let totalMinutes = 0;

    // 按工作/生活比例分配时间
    const workMinutes = maxMinutes * context.workLifeRatio.work;
    const lifeMinutes = maxMinutes * context.workLifeRatio.life;
    let usedWorkMinutes = 0;
    let usedLifeMinutes = 0;

    for (const task of tasks) {
      const isLifeTask = task.type === 'life';
      const budget = isLifeTask ? lifeMinutes : workMinutes;
      const used = isLifeTask ? usedLifeMinutes : usedWorkMinutes;

      if (used + task.estimatedMinutes <= budget && totalMinutes + task.estimatedMinutes <= maxMinutes) {
        selected.push({
          ...task,
          order: selected.length + 1,
        });
        totalMinutes += task.estimatedMinutes;

        if (isLifeTask) {
          usedLifeMinutes += task.estimatedMinutes;
        } else {
          usedWorkMinutes += task.estimatedMinutes;
        }
      }

      // 最多选择 5 个任务
      if (selected.length >= 5) {
        break;
      }
    }

    return selected;
  }

  /**
   * 构建每日计划
   */
  private buildPlan(tasks: DailyTask[], context: TaskGenerationContext): DailyPlan {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    return {
      date: dateStr,
      generatedAt: now,
      tasks,
      totalEstimatedMinutes: tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
      codingTasks: tasks.filter(t => t.type === 'coding').length,
      workTasks: tasks.filter(t => t.type === 'work').length,
      lifeTasks: tasks.filter(t => t.type === 'life').length,
      focusGoals: [...new Set(tasks.map(t => t.sourceGoalName).filter(Boolean))] as string[],
      availableHours: context.availableHours,
      workLifeRatio: context.workLifeRatio,
    };
  }

  // ==================== 辅助方法 ====================

  private generateId(seed: string): string {
    const hash = seed.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `task-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
  }

  private inferTaskType(text: string, defaultCategory: 'work' | 'life'): TaskType {
    const codingKeywords = ['开发', '实现', '编码', '代码', '功能', '模块', 'API', '组件', '页面', '修复', 'bug', '重构'];
    const lifeKeywords = ['生活', '健康', '运动', '学习', '阅读', '休息', '家庭'];

    const lowerText = text.toLowerCase();

    if (codingKeywords.some(k => lowerText.includes(k.toLowerCase()))) {
      return 'coding';
    }

    if (lifeKeywords.some(k => lowerText.includes(k.toLowerCase()))) {
      return 'life';
    }

    return defaultCategory === 'life' ? 'life' : 'work';
  }

  private calculateUrgency(targetDate: Date | undefined, now: Date): number {
    if (!targetDate) {
      return 50; // 默认中等紧急度
    }

    const daysUntil = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 0) return 100;      // 已过期
    if (daysUntil <= 1) return 95;       // 今天到期
    if (daysUntil <= 3) return 85;       // 3天内
    if (daysUntil <= 7) return 70;       // 一周内
    if (daysUntil <= 14) return 50;      // 两周内
    if (daysUntil <= 30) return 30;      // 一个月内
    return 20;                            // 更远
  }

  private urgencyToPriority(urgency: number): TaskPriority {
    if (urgency >= 80) return 'high';
    if (urgency >= 50) return 'medium';
    return 'low';
  }

  private estimateMinutes(taskName: string, type: TaskType): number {
    // 基于任务类型的默认估时
    const baseMinutes = {
      coding: 90,
      work: 60,
      life: 45,
    };

    // 根据任务名称关键词调整
    const quickKeywords = ['检查', '确认', '回复', '查看'];
    const longKeywords = ['开发', '实现', '设计', '重构', '迁移'];

    if (quickKeywords.some(k => taskName.includes(k))) {
      return 30;
    }

    if (longKeywords.some(k => taskName.includes(k))) {
      return 120;
    }

    return baseMinutes[type];
  }

  private calculateResourceMatch(task: DailyTask, context: TaskGenerationContext): number {
    // 简化的资源匹配度计算
    // TODO: 可以基于当前时间、精力状态等进行更精细的计算
    return 70;
  }
}

export const taskGenerator = new TaskGenerator();
