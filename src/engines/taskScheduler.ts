import { ShortTermTask, SeedPack, LongTermGoal, ImmediateContext } from '@/types/memory';
import { EngineConfig, PriorityScore } from '@/types/engine';
import { priorityEngine } from './priority/priorityEngine';

// 任务调度器 - 管理双引擎任务分配
export class TaskScheduler {
  private config: EngineConfig = {
    workRatio: 0.6,
    lifeRatio: 0.4,
    autoAdjust: true,
  };

  constructor() {}

  // 更新配置
  setConfig(config: EngineConfig) {
    this.config = config;
  }

  // 获取今日任务计划
  getDailyPlan(
    tasks: ShortTermTask[],
    context: ImmediateContext | null,
    seedPack: SeedPack | null,
    goals: LongTermGoal[],
    availableHours: number = 8
  ): DailyPlan {
    // 初始化优先级引擎
    priorityEngine.initialize(seedPack, goals, this.config);

    // 分离 Work 和 Life 任务
    const workTasks = tasks.filter(t => t.engine === 'work' && t.status !== 'completed');
    const lifeTasks = tasks.filter(t => t.engine === 'life' && t.status !== 'completed');

    // 评估优先级
    const workScores = priorityEngine.evaluateAndRankTasks(workTasks, context);
    const lifeScores = priorityEngine.evaluateAndRankTasks(lifeTasks, context);

    // 计算各引擎可用时间
    const workHours = availableHours * this.config.workRatio;
    const lifeHours = availableHours * this.config.lifeRatio;

    // 选择任务填充时间
    const selectedWork = this.selectTasksForTime(workTasks, workScores, workHours);
    const selectedLife = this.selectTasksForTime(lifeTasks, lifeScores, lifeHours);

    return {
      date: new Date(),
      totalHours: availableHours,
      workAllocation: {
        hours: workHours,
        tasks: selectedWork.tasks,
        scores: selectedWork.scores,
        estimatedCompletion: selectedWork.estimatedHours,
      },
      lifeAllocation: {
        hours: lifeHours,
        tasks: selectedLife.tasks,
        scores: selectedLife.scores,
        estimatedCompletion: selectedLife.estimatedHours,
      },
      overflow: {
        work: workScores.slice(selectedWork.tasks.length),
        life: lifeScores.slice(selectedLife.tasks.length),
      },
    };
  }

  // 根据可用时间选择任务
  private selectTasksForTime(
    tasks: ShortTermTask[],
    scores: PriorityScore[],
    availableHours: number
  ): { tasks: ShortTermTask[]; scores: PriorityScore[]; estimatedHours: number } {
    const selected: ShortTermTask[] = [];
    const selectedScores: PriorityScore[] = [];
    let totalHours = 0;

    for (const score of scores) {
      const task = tasks.find(t => t.id === score.taskId);
      if (!task) continue;

      // 检查是否还有足够时间
      if (totalHours + task.estimatedHours <= availableHours) {
        selected.push(task);
        selectedScores.push(score);
        totalHours += task.estimatedHours;
      } else if (totalHours < availableHours) {
        // 如果剩余时间不够完成整个任务，但还有一些时间
        // 仍然添加任务，但标记为部分完成
        selected.push(task);
        selectedScores.push(score);
        totalHours += task.estimatedHours;
        break;
      }
    }

    return {
      tasks: selected,
      scores: selectedScores,
      estimatedHours: totalHours,
    };
  }

  // 动态调整任务优先级（基于实时反馈）
  rebalanceTasks(
    currentPlan: DailyPlan,
    completedTaskId: string,
    actualHours: number
  ): DailyPlan {
    const now = new Date();
    const remainingHours = Math.max(0, currentPlan.totalHours - actualHours);

    // 找到完成的任务属于哪个引擎
    const wasWorkTask = currentPlan.workAllocation.tasks.some(t => t.id === completedTaskId);
    
    if (wasWorkTask) {
      // 从 Work 任务中移除
      const remainingWorkTasks = currentPlan.workAllocation.tasks.filter(t => t.id !== completedTaskId);
      const remainingWorkScores = currentPlan.workAllocation.scores.filter(s => s.taskId !== completedTaskId);
      
      // 如果还有溢出任务，尝试添加
      if (currentPlan.overflow.work.length > 0) {
        const nextScore = currentPlan.overflow.work[0];
        // 这里简化处理，实际应该重新计算
        remainingWorkScores.push(nextScore);
      }
      
      return {
        ...currentPlan,
        workAllocation: {
          ...currentPlan.workAllocation,
          tasks: remainingWorkTasks,
          scores: remainingWorkScores,
        },
        overflow: {
          ...currentPlan.overflow,
          work: currentPlan.overflow.work.slice(1),
        },
      };
    } else {
      // Life 任务同理
      const remainingLifeTasks = currentPlan.lifeAllocation.tasks.filter(t => t.id !== completedTaskId);
      const remainingLifeScores = currentPlan.lifeAllocation.scores.filter(s => s.taskId !== completedTaskId);
      
      return {
        ...currentPlan,
        lifeAllocation: {
          ...currentPlan.lifeAllocation,
          tasks: remainingLifeTasks,
          scores: remainingLifeScores,
        },
        overflow: {
          ...currentPlan.overflow,
          life: currentPlan.overflow.life.slice(1),
        },
      };
    }
  }

  // 生成任务执行建议
  getExecutionSuggestion(
    task: ShortTermTask,
    score: PriorityScore,
    context: ImmediateContext | null
  ): ExecutionSuggestion {
    const suggestions: string[] = [];
    const warnings: string[] = [];

    // 基于推荐行动生成建议
    switch (score.recommendedAction) {
      case 'do_now':
        suggestions.push('立即开始执行，这是当前最重要的任务');
        break;
      case 'schedule':
        suggestions.push('安排在合适的时间段执行');
        break;
      case 'delegate':
        suggestions.push('考虑委托他人或寻求协作');
        break;
      case 'defer':
        suggestions.push('可以延后处理，优先完成更重要的任务');
        break;
    }

    // 基于复利价值
    if (score.breakdown.compoundValue >= 70) {
      suggestions.push('高复利任务，执行时注意沉淀可复用的方法/模板');
    }

    // 基于紧急度
    if (score.breakdown.urgency >= 80) {
      warnings.push('时间紧迫，注意把控进度');
    }

    // 基于资源匹配
    if (score.breakdown.resourceMatch < 50 && context) {
      if (context.mood === 'tired' || context.mood === 'stressed') {
        warnings.push('当前状态可能不适合执行此任务，建议先休息或调整');
      }
    }

    // 估算完成时间
    const estimatedEndTime = new Date();
    estimatedEndTime.setHours(estimatedEndTime.getHours() + task.estimatedHours);

    return {
      taskId: task.id,
      suggestions,
      warnings,
      estimatedEndTime,
      focusPoints: this.generateFocusPoints(task, score),
    };
  }

  // 生成执行要点
  private generateFocusPoints(task: ShortTermTask, score: PriorityScore): string[] {
    const points: string[] = [];

    // 基于任务类型生成要点
    if (task.tags.includes('调研') || task.tags.includes('分析')) {
      points.push('明确调研目标和边界');
      points.push('记录关键发现和数据来源');
    }

    if (task.tags.includes('设计') || task.tags.includes('规划')) {
      points.push('先明确约束条件');
      points.push('产出可评审的方案文档');
    }

    if (task.tags.includes('开发') || task.tags.includes('编码')) {
      points.push('先写测试或验收标准');
      points.push('保持代码可读性和可维护性');
    }

    // 高复利任务的额外要点
    if (score.breakdown.compoundValue >= 70) {
      points.push('执行过程中注意提炼可复用的模式');
      points.push('完成后整理成 SOP 或模板');
    }

    return points.length > 0 ? points : ['按计划执行，完成后记录收获'];
  }
}

// 类型定义
export interface DailyPlan {
  date: Date;
  totalHours: number;
  workAllocation: {
    hours: number;
    tasks: ShortTermTask[];
    scores: PriorityScore[];
    estimatedCompletion: number;
  };
  lifeAllocation: {
    hours: number;
    tasks: ShortTermTask[];
    scores: PriorityScore[];
    estimatedCompletion: number;
  };
  overflow: {
    work: PriorityScore[];
    life: PriorityScore[];
  };
}

export interface ExecutionSuggestion {
  taskId: string;
  suggestions: string[];
  warnings: string[];
  estimatedEndTime: Date;
  focusPoints: string[];
}

// 导出单例
export const taskScheduler = new TaskScheduler();
export default taskScheduler;
