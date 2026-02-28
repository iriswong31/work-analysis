import { ShortTermTask, SeedPack, LongTermGoal, ImmediateContext } from '@/types/memory';
import { PriorityScore, EngineConfig } from '@/types/engine';

// 权重配置
const WEIGHTS = {
  compoundValue: 0.40,  // 复利价值权重 40%
  urgency: 0.20,        // 紧急度权重 20%
  goalAlignment: 0.25,  // 目标对齐度权重 25%
  resourceMatch: 0.15,  // 资源匹配度权重 15%
};

// 智能优先级引擎
export class PriorityEngine {
  private seedPack: SeedPack | null = null;
  private goals: LongTermGoal[] = [];
  private config: EngineConfig = {
    workRatio: 0.6,
    lifeRatio: 0.4,
    autoAdjust: true,
  };

  constructor() {}

  // 初始化引擎
  initialize(seedPack: SeedPack | null, goals: LongTermGoal[], config: EngineConfig) {
    this.seedPack = seedPack;
    this.goals = goals;
    this.config = config;
  }

  // 评估单个任务的优先级
  evaluateTask(task: ShortTermTask, context: ImmediateContext | null): PriorityScore {
    const compoundValue = this.calculateCompoundValue(task);
    const urgency = this.calculateUrgency(task);
    const goalAlignment = this.calculateGoalAlignment(task);
    const resourceMatch = this.calculateResourceMatch(task, context);

    const totalScore = 
      compoundValue * WEIGHTS.compoundValue +
      urgency * WEIGHTS.urgency +
      goalAlignment * WEIGHTS.goalAlignment +
      resourceMatch * WEIGHTS.resourceMatch;

    const reasoning = this.generateReasoning(task, {
      compoundValue,
      urgency,
      goalAlignment,
      resourceMatch,
    });

    const recommendedAction = this.determineAction(totalScore, urgency, task);

    return {
      taskId: task.id,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        compoundValue: Math.round(compoundValue * 100) / 100,
        urgency: Math.round(urgency * 100) / 100,
        goalAlignment: Math.round(goalAlignment * 100) / 100,
        resourceMatch: Math.round(resourceMatch * 100) / 100,
      },
      reasoning,
      recommendedAction,
    };
  }

  // 批量评估并排序任务
  evaluateAndRankTasks(tasks: ShortTermTask[], context: ImmediateContext | null): PriorityScore[] {
    const scores = tasks.map(task => this.evaluateTask(task, context));
    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  // 获取今日推荐任务（考虑双引擎比例）
  getRecommendedTasks(
    tasks: ShortTermTask[], 
    context: ImmediateContext | null,
    maxTasks: number = 5
  ): PriorityScore[] {
    const workTasks = tasks.filter(t => t.engine === 'work');
    const lifeTasks = tasks.filter(t => t.engine === 'life');

    const workScores = this.evaluateAndRankTasks(workTasks, context);
    const lifeScores = this.evaluateAndRankTasks(lifeTasks, context);

    // 按比例分配任务数量
    const workCount = Math.round(maxTasks * this.config.workRatio);
    const lifeCount = maxTasks - workCount;

    const selectedWork = workScores.slice(0, workCount);
    const selectedLife = lifeScores.slice(0, lifeCount);

    // 合并并重新排序
    const combined = [...selectedWork, ...selectedLife];
    return combined.sort((a, b) => b.totalScore - a.totalScore);
  }

  // 计算复利价值（核心算法）
  private calculateCompoundValue(task: ShortTermTask): number {
    let score = task.compoundValue || 50;

    // 基于 Seed Pack 中的事业主线优先级调整
    if (this.seedPack) {
      const businessLines = task.engine === 'work' 
        ? this.seedPack.businessLines.work 
        : this.seedPack.businessLines.life;
      
      // 检查任务是否与高优先级事业主线相关
      const relatedLine = businessLines.find(line => 
        task.tags.some(tag => 
          line.name.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(line.name.toLowerCase())
        )
      );

      if (relatedLine) {
        // 根据事业主线的复利潜力调整分数
        score = score * (1 + relatedLine.compoundPotential / 200);
      }
    }

    // 检查任务是否能产出可复用资产
    const assetKeywords = ['模板', '系统', '框架', '规范', 'SOP', '方法论', '工具'];
    const hasAssetPotential = assetKeywords.some(keyword => 
      task.title.includes(keyword) || task.description.includes(keyword)
    );
    if (hasAssetPotential) {
      score *= 1.2;
    }

    // 检查任务是否有长期影响
    const longTermKeywords = ['战略', '架构', '基础', '核心', '平台'];
    const hasLongTermImpact = longTermKeywords.some(keyword =>
      task.title.includes(keyword) || task.description.includes(keyword)
    );
    if (hasLongTermImpact) {
      score *= 1.15;
    }

    return Math.min(100, Math.max(0, score));
  }

  // 计算紧急度
  private calculateUrgency(task: ShortTermTask): number {
    let score = task.urgency || 50;

    if (task.dueDate) {
      const now = new Date();
      const due = new Date(task.dueDate);
      const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

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

    // 进行中的任务紧急度提升
    if (task.status === 'in_progress') {
      score = Math.max(score, 70);
    }

    return Math.min(100, Math.max(0, score));
  }

  // 计算目标对齐度
  private calculateGoalAlignment(task: ShortTermTask): number {
    let score = task.goalAlignment || 50;

    // 检查任务是否关联到长期目标
    const relatedGoals = this.goals.filter(goal => 
      goal.category === task.engine && goal.status === 'active'
    );

    if (relatedGoals.length > 0) {
      // 检查任务标签与目标的匹配度
      const matchingGoals = relatedGoals.filter(goal =>
        task.tags.some(tag => 
          goal.title.toLowerCase().includes(tag.toLowerCase()) ||
          goal.description.toLowerCase().includes(tag.toLowerCase())
        )
      );

      if (matchingGoals.length > 0) {
        // 找到匹配的目标，提升对齐度
        const highestCompoundGoal = matchingGoals.reduce((a, b) => 
          (a.compoundValue || 0) > (b.compoundValue || 0) ? a : b
        );
        score = Math.max(score, 70 + (highestCompoundGoal.compoundValue || 0) * 0.3);
      }
    }

    // 检查任务是否与核心价值观对齐
    if (this.seedPack) {
      const valueKeywords = this.seedPack.identity.coreValues.flatMap(v => 
        v.toLowerCase().split(/[,，、\s]+/)
      );
      const taskText = `${task.title} ${task.description}`.toLowerCase();
      const valueMatch = valueKeywords.some(keyword => taskText.includes(keyword));
      if (valueMatch) {
        score *= 1.1;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  // 计算资源匹配度
  private calculateResourceMatch(task: ShortTermTask, context: ImmediateContext | null): number {
    let score = 50;

    if (!context) return score;

    // 检查可用时间是否足够
    if (context.availableHours >= task.estimatedHours) {
      score += 20;
    } else if (context.availableHours >= task.estimatedHours * 0.5) {
      score += 10;
    }

    // 检查当前状态是否适合该任务
    if (context.mood) {
      const moodTaskMatch: Record<string, string[]> = {
        energetic: ['创新', '设计', '规划', '头脑风暴'],
        focused: ['编码', '写作', '分析', '调研'],
        tired: ['整理', '回顾', '沟通', '简单'],
        stressed: ['放松', '简单', '熟悉'],
        relaxed: ['学习', '探索', '创意'],
      };

      const suitableTasks = moodTaskMatch[context.mood] || [];
      const taskText = `${task.title} ${task.description}`.toLowerCase();
      const isSuitable = suitableTasks.some(keyword => taskText.includes(keyword));
      if (isSuitable) {
        score += 15;
      }
    }

    // 检查是否有阻塞因素
    if (context.blockers.length > 0) {
      const taskText = `${task.title} ${task.description}`.toLowerCase();
      const isBlocked = context.blockers.some(blocker => 
        taskText.includes(blocker.toLowerCase())
      );
      if (isBlocked) {
        score -= 30;
      }
    }

    // 检查是否在今日优先级列表中
    if (context.priorities.some(p => 
      task.title.toLowerCase().includes(p.toLowerCase()) ||
      p.toLowerCase().includes(task.title.toLowerCase())
    )) {
      score += 25;
    }

    return Math.min(100, Math.max(0, score));
  }

  // 生成决策理由
  private generateReasoning(
    task: ShortTermTask, 
    scores: { compoundValue: number; urgency: number; goalAlignment: number; resourceMatch: number }
  ): string {
    const reasons: string[] = [];

    if (scores.compoundValue >= 70) {
      reasons.push('高复利价值，能沉淀为可复用资产');
    }
    if (scores.urgency >= 80) {
      reasons.push('时间紧迫，需要优先处理');
    }
    if (scores.goalAlignment >= 70) {
      reasons.push('与长期目标高度对齐');
    }
    if (scores.resourceMatch >= 70) {
      reasons.push('当前状态适合执行此任务');
    }

    if (reasons.length === 0) {
      if (scores.compoundValue < 40) {
        reasons.push('复利价值较低，建议评估是否必要');
      }
      if (scores.goalAlignment < 40) {
        reasons.push('与核心目标关联度不高');
      }
    }

    return reasons.join('；') || '常规任务，按计划执行';
  }

  // 确定推荐行动
  private determineAction(
    totalScore: number, 
    urgency: number,
    task: ShortTermTask
  ): 'do_now' | 'schedule' | 'delegate' | 'defer' {
    if (totalScore >= 75 || urgency >= 90) {
      return 'do_now';
    }
    if (totalScore >= 50) {
      return 'schedule';
    }
    if (task.estimatedHours > 4 && totalScore < 60) {
      return 'delegate';
    }
    return 'defer';
  }

  // 根据反馈调整策略
  adjustStrategy(
    feedbackRating: number, 
    feedbackComment: string,
    currentConfig: EngineConfig
  ): EngineConfig {
    if (!currentConfig.autoAdjust) {
      return currentConfig;
    }

    const newConfig = { ...currentConfig };

    // 分析反馈内容
    const workKeywords = ['工作', 'work', '善治美', '公益', '项目'];
    const lifeKeywords = ['生活', 'life', '动画', '电影', '个人'];
    
    const mentionsWork = workKeywords.some(k => feedbackComment.toLowerCase().includes(k));
    const mentionsLife = lifeKeywords.some(k => feedbackComment.toLowerCase().includes(k));

    // 根据评分和反馈内容调整比例
    if (feedbackRating <= 2) {
      // 低评分，需要调整
      if (mentionsWork && !mentionsLife) {
        // Work 相关问题，减少 Work 比例
        newConfig.workRatio = Math.max(0.4, newConfig.workRatio - 0.05);
        newConfig.lifeRatio = 1 - newConfig.workRatio;
      } else if (mentionsLife && !mentionsWork) {
        // Life 相关问题，减少 Life 比例
        newConfig.lifeRatio = Math.max(0.3, newConfig.lifeRatio - 0.05);
        newConfig.workRatio = 1 - newConfig.lifeRatio;
      }
    } else if (feedbackRating >= 4) {
      // 高评分，强化当前策略
      // 保持当前比例不变
    }

    return newConfig;
  }
}

// 导出单例
export const priorityEngine = new PriorityEngine();
export default priorityEngine;
