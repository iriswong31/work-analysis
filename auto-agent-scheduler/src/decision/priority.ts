import { logger } from '../utils/logger.js';
import type { 
  ShortTermTask, 
  LongTermGoal, 
  ImmediateContext,
  TaskType 
} from '../types/index.js';

/**
 * 优先级权重配置
 */
const WEIGHTS = {
  compoundValue: 0.40,   // 复利价值权重 40%
  urgency: 0.20,         // 紧急度权重 20%
  goalAlignment: 0.25,   // 目标对齐度权重 25%
  resourceMatch: 0.15,   // 资源匹配度权重 15%
};

/**
 * 编码任务关键词
 */
const CODING_KEYWORDS = [
  '开发', '实现', '编码', '代码', '功能', '模块', '接口', 'API',
  '组件', '页面', '服务', '修复', 'bug', '优化', '重构', '测试',
  'develop', 'implement', 'code', 'feature', 'module', 'component',
  'fix', 'refactor', 'optimize', 'test'
];

/**
 * 高复利价值关键词
 */
const HIGH_VALUE_KEYWORDS = [
  '模板', '系统', '框架', 'SOP', '自动化', '工具', '平台',
  'template', 'system', 'framework', 'automation', 'tool', 'platform'
];

export interface PriorityBreakdown {
  compoundValue: number;
  urgency: number;
  goalAlignment: number;
  resourceMatch: number;
}

export interface PriorityResult {
  taskId: string;
  totalScore: number;
  breakdown: PriorityBreakdown;
  isCodingTask: boolean;
  taskType: TaskType;
  reasoning: string;
}

/**
 * 优先级评估器
 */
export class PriorityEvaluator {
  /**
   * 评估单个任务的优先级
   */
  evaluate(
    task: ShortTermTask,
    goals: LongTermGoal[],
    context: ImmediateContext | null
  ): PriorityResult {
    // 计算各维度分数
    const compoundValue = this.calculateCompoundValue(task, goals);
    const urgency = this.calculateUrgency(task);
    const goalAlignment = this.calculateGoalAlignment(task, goals);
    const resourceMatch = this.calculateResourceMatch(task, context);

    // 计算总分
    const totalScore = 
      compoundValue * WEIGHTS.compoundValue +
      urgency * WEIGHTS.urgency +
      goalAlignment * WEIGHTS.goalAlignment +
      resourceMatch * WEIGHTS.resourceMatch;

    // 判断是否为编码任务
    const isCodingTask = this.isCodingTask(task);
    const taskType = this.inferTaskType(task);

    // 生成推理说明
    const reasoning = this.generateReasoning(task, {
      compoundValue,
      urgency,
      goalAlignment,
      resourceMatch,
    }, totalScore, isCodingTask);

    return {
      taskId: task.id,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        compoundValue: Math.round(compoundValue * 100) / 100,
        urgency: Math.round(urgency * 100) / 100,
        goalAlignment: Math.round(goalAlignment * 100) / 100,
        resourceMatch: Math.round(resourceMatch * 100) / 100,
      },
      isCodingTask,
      taskType,
      reasoning,
    };
  }

  /**
   * 批量评估任务
   */
  evaluateAll(
    tasks: ShortTermTask[],
    goals: LongTermGoal[],
    context: ImmediateContext | null
  ): PriorityResult[] {
    return tasks.map(task => this.evaluate(task, goals, context));
  }

  /**
   * 计算复利价值
   */
  private calculateCompoundValue(task: ShortTermTask, goals: LongTermGoal[]): number {
    let score = task.compoundValue || 50;

    // 检查是否与高价值目标相关
    const relatedGoal = goals.find(g => 
      g.status === 'active' && 
      (task.title.includes(g.title) || task.description.includes(g.title))
    );

    if (relatedGoal) {
      score = score * (1 + relatedGoal.compoundValue / 200);
    }

    // 检查高复利关键词
    const hasHighValueKeyword = HIGH_VALUE_KEYWORDS.some(kw => 
      task.title.toLowerCase().includes(kw.toLowerCase()) ||
      task.description.toLowerCase().includes(kw.toLowerCase())
    );

    if (hasHighValueKeyword) {
      score = score * 1.2;
    }

    return Math.min(100, score);
  }

  /**
   * 计算紧急度
   */
  private calculateUrgency(task: ShortTermTask): number {
    let score = task.urgency || 50;

    if (task.dueDate) {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilDue < 0) {
        // 已过期
        score = 100;
      } else if (daysUntilDue < 1) {
        // 今天到期
        score = Math.max(score, 95);
      } else if (daysUntilDue < 3) {
        // 3天内到期
        score = Math.max(score, 80);
      } else if (daysUntilDue < 7) {
        // 一周内到期
        score = Math.max(score, 60);
      }
    }

    // 进行中的任务优先级提升
    if (task.status === 'in_progress') {
      score = Math.max(score, 70);
    }

    return Math.min(100, score);
  }

  /**
   * 计算目标对齐度
   */
  private calculateGoalAlignment(task: ShortTermTask, goals: LongTermGoal[]): number {
    let score = task.goalAlignment || 50;

    // 检查与活跃目标的关联
    const activeGoals = goals.filter(g => g.status === 'active');
    
    for (const goal of activeGoals) {
      const titleMatch = task.title.toLowerCase().includes(goal.title.toLowerCase());
      const descMatch = task.description.toLowerCase().includes(goal.title.toLowerCase());
      const categoryMatch = task.engine === goal.category;

      if (titleMatch || descMatch) {
        score = Math.max(score, 70 + goal.compoundValue * 0.3);
      } else if (categoryMatch) {
        score = Math.max(score, 60);
      }
    }

    return Math.min(100, score);
  }

  /**
   * 计算资源匹配度
   */
  private calculateResourceMatch(task: ShortTermTask, context: ImmediateContext | null): number {
    let score = 50;

    if (!context) return score;

    // 检查可用时间
    if (context.availableHours >= task.estimatedHours) {
      score += 20;
    } else if (context.availableHours >= task.estimatedHours * 0.5) {
      score += 10;
    }

    // 检查心情状态
    if (context.mood) {
      const goodMoods = ['energetic', 'focused'];
      if (goodMoods.includes(context.mood)) {
        score += 15;
      } else if (context.mood === 'tired' || context.mood === 'stressed') {
        score -= 10;
      }
    }

    // 检查阻塞因素
    if (context.blockers.length > 0) {
      const hasBlocker = context.blockers.some(b => 
        task.title.includes(b) || task.description.includes(b)
      );
      if (hasBlocker) {
        score -= 30;
      }
    }

    // 检查是否在今日优先级列表中
    if (context.priorities.some(p => 
      task.title.includes(p) || task.description.includes(p)
    )) {
      score += 25;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 判断是否为编码任务
   */
  private isCodingTask(task: ShortTermTask): boolean {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return CODING_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  }

  /**
   * 推断任务类型
   */
  private inferTaskType(task: ShortTermTask): TaskType {
    const text = `${task.title} ${task.description}`.toLowerCase();

    if (text.includes('重构') || text.includes('refactor')) {
      return 'refactor';
    }
    if (text.includes('测试') || text.includes('test')) {
      return 'testing';
    }
    if (text.includes('文档') || text.includes('doc')) {
      return 'documentation';
    }
    if (text.includes('review') || text.includes('审查')) {
      return 'review';
    }

    return 'coding';
  }

  /**
   * 生成推理说明
   */
  private generateReasoning(
    task: ShortTermTask,
    breakdown: PriorityBreakdown,
    totalScore: number,
    isCodingTask: boolean
  ): string {
    const reasons: string[] = [];

    if (breakdown.compoundValue >= 70) {
      reasons.push('高复利价值');
    }
    if (breakdown.urgency >= 80) {
      reasons.push('紧急');
    }
    if (breakdown.goalAlignment >= 70) {
      reasons.push('与目标高度对齐');
    }
    if (breakdown.resourceMatch >= 70) {
      reasons.push('资源匹配良好');
    }

    const taskTypeLabel = isCodingTask ? '编码任务' : '非编码任务';
    const priorityLabel = totalScore >= 75 ? '高优先级' : totalScore >= 50 ? '中优先级' : '低优先级';

    return `[${taskTypeLabel}] ${priorityLabel}` + 
           (reasons.length > 0 ? `：${reasons.join('、')}` : '');
  }
}

export const priorityEvaluator = new PriorityEvaluator();
