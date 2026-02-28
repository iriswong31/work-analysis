/**
 * 双模式调度器
 * 支持 IDE 交互模式和后台定时模式
 */

import cron from 'node-cron';
import { taskGenerator } from './task-generator.js';
import { taskExecutor } from './task-executor.js';
import { feedbackCollector } from './feedback-collector.js';
import { visualizer } from './visualizer.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import type {
  DailyPlan,
  DailyReport,
  ExecutionResult,
  ExecutionConfig,
  ExecutionMode,
} from './types.js';

/**
 * 自主调度器类
 */
class AutonomousScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private currentPlan: DailyPlan | null = null;
  private executionConfig: ExecutionConfig;

  constructor() {
    this.executionConfig = {
      mode: 'interactive',
      maxTasksPerDay: config.scheduler.maxTasksPerDay || 5,
      maxMinutesPerDay: 240,
      retryOnFailure: true,
      maxRetries: 2,
      pauseBetweenTasks: 2000,
      showProgress: true,
      verboseOutput: true,
      autoStart: false,
      scheduledTime: config.scheduler.dailyExecutionTime || '09:00',
    };
  }

  /**
   * 立即执行（交互模式）
   * 用于 IDE 中手动触发
   */
  async runNow(): Promise<DailyReport> {
    if (this.isRunning) {
      throw new Error('已有任务正在执行中');
    }

    this.isRunning = true;
    this.executionConfig.mode = 'interactive';

    try {
      // 显示欢迎信息
      visualizer.showWelcome();

      // 1. 生成每日计划
      visualizer.showInfo('正在生成每日计划...');
      const plan = await taskGenerator.generateDailyPlan();
      this.currentPlan = plan;

      // 显示计划
      visualizer.showDailyPlan(plan);

      if (plan.tasks.length === 0) {
        visualizer.showWarning('今日没有可执行的任务');
        return this.createEmptyReport(plan);
      }

      // 2. 执行任务
      visualizer.showInfo('开始执行任务...');
      const results = await this.executeTasks(plan);

      // 3. 生成报告
      const report = this.generateReport(plan, results);

      // 4. 收集反馈并更新记忆
      await feedbackCollector.collectAndUpdate(report);

      // 显示报告和结束信息
      visualizer.showDailyReport(report);
      visualizer.showGoodbye(report);

      return report;
    } catch (error) {
      visualizer.showError('执行过程中发生错误', error as Error);
      throw error;
    } finally {
      this.isRunning = false;
      this.currentPlan = null;
    }
  }

  /**
   * 启动后台定时模式
   */
  startBackgroundMode(): void {
    if (this.cronJob) {
      logger.warn('后台模式已在运行');
      return;
    }

    const time = this.executionConfig.scheduledTime || '09:00';
    const [hour, minute] = time.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    logger.info(`🕐 启动后台定时模式，每天 ${time} 自动执行`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      logger.info('⏰ 定时任务触发，开始执行每日工作流...');
      this.executionConfig.mode = 'background';

      try {
        await this.runNow();
      } catch (error) {
        logger.error('后台执行失败:', error);
      }
    }, {
      timezone: config.scheduler.timezone || 'Asia/Shanghai',
    });

    this.cronJob.start();
    visualizer.showSuccess(`后台模式已启动，每天 ${time} 自动执行`);
  }

  /**
   * 停止后台定时模式
   */
  stopBackgroundMode(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('后台定时模式已停止');
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isRunning: boolean;
    mode: ExecutionMode;
    currentPlan: DailyPlan | null;
    backgroundEnabled: boolean;
    scheduledTime: string;
  } {
    return {
      isRunning: this.isRunning,
      mode: this.executionConfig.mode,
      currentPlan: this.currentPlan,
      backgroundEnabled: this.cronJob !== null,
      scheduledTime: this.executionConfig.scheduledTime || '09:00',
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ExecutionConfig>): void {
    this.executionConfig = {
      ...this.executionConfig,
      ...config,
    };

    // 如果更新了定时时间且后台模式在运行，重启
    if (config.scheduledTime && this.cronJob) {
      this.stopBackgroundMode();
      this.startBackgroundMode();
    }
  }

  /**
   * 停止当前执行
   */
  abort(): void {
    if (this.isRunning) {
      taskExecutor.abort();
      this.isRunning = false;
      visualizer.showWarning('执行已中止');
    }
  }

  /**
   * 仅生成计划（预览模式）
   */
  async previewPlan(): Promise<DailyPlan> {
    visualizer.showInfo('正在生成每日计划预览...');
    const plan = await taskGenerator.generateDailyPlan();
    visualizer.showDailyPlan(plan);
    return plan;
  }

  // ==================== 私有方法 ====================

  /**
   * 执行任务列表
   */
  private async executeTasks(plan: DailyPlan): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    const tasks = plan.tasks;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      // 显示任务开始
      visualizer.showTaskStart(task, i + 1, tasks.length);

      // 执行任务
      const result = await taskExecutor.executeTask(task);
      results.push(result);

      // 显示任务完成
      visualizer.showTaskComplete(result);

      // 更新进度
      visualizer.showProgress({
        currentTask: i < tasks.length - 1 ? tasks[i + 1] : null,
        completedTasks: i + 1,
        totalTasks: tasks.length,
        elapsedMinutes: results.reduce((sum, r) => sum + r.actualMinutes, 0),
        estimatedRemainingMinutes: tasks.slice(i + 1).reduce((sum, t) => sum + t.estimatedMinutes, 0),
      });

      // 任务间暂停
      if (i < tasks.length - 1 && this.executionConfig.pauseBetweenTasks > 0) {
        await this.delay(this.executionConfig.pauseBetweenTasks);
      }
    }

    console.log(); // 换行
    return results;
  }

  /**
   * 生成每日报告
   */
  private generateReport(plan: DailyPlan, results: ExecutionResult[]): DailyReport {
    const completed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const skipped = plan.tasks.length - results.length;

    const totalEstimated = results.reduce((sum, r) => sum + r.estimatedMinutes, 0);
    const totalActual = results.reduce((sum, r) => sum + r.actualMinutes, 0);

    // 提取成就
    const achievements: string[] = [];
    if (completed.length === plan.tasks.length) {
      achievements.push('🎯 完成所有计划任务！');
    }
    if (completed.length >= 3) {
      achievements.push(`💪 完成 ${completed.length} 个任务`);
    }
    
    const codingOutputs = completed
      .flatMap(r => r.outputs)
      .filter(o => o.type === 'code');
    if (codingOutputs.length > 0) {
      const totalLines = codingOutputs.reduce((sum, o) => sum + (o.linesOfCode || 0), 0);
      if (totalLines > 0) {
        achievements.push(`💻 生成 ${totalLines} 行代码`);
      }
    }

    // 提取学习
    const learnings = completed
      .flatMap(r => r.learnings || [])
      .filter((v, i, a) => a.indexOf(v) === i); // 去重

    // 提取阻塞
    const blockers = failed
      .flatMap(r => r.blockers || [])
      .filter((v, i, a) => a.indexOf(v) === i);

    // 生成建议
    const recommendations: string[] = [];
    if (failed.length > 0) {
      recommendations.push(`分析 ${failed.length} 个失败任务的原因`);
    }
    if (totalActual > totalEstimated * 1.5) {
      recommendations.push('考虑减少每日任务数量或优化任务粒度');
    }
    if (completed.length < plan.tasks.length * 0.5) {
      recommendations.push('降低任务难度或增加可用时间');
    }

    return {
      date: plan.date,
      planId: `plan-${plan.date}`,
      tasksPlanned: plan.tasks.length,
      tasksCompleted: completed.length,
      tasksFailed: failed.length,
      tasksSkipped: skipped,
      totalEstimatedMinutes: totalEstimated,
      totalActualMinutes: totalActual,
      efficiency: totalActual > 0 ? (totalEstimated / totalActual) * 100 : 100,
      results,
      achievements,
      learnings,
      blockers,
      nextDayRecommendations: recommendations,
      startedAt: results[0]?.startedAt || new Date(),
      completedAt: results[results.length - 1]?.completedAt || new Date(),
    };
  }

  /**
   * 创建空报告
   */
  private createEmptyReport(plan: DailyPlan): DailyReport {
    const now = new Date();
    return {
      date: plan.date,
      planId: `plan-${plan.date}`,
      tasksPlanned: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksSkipped: 0,
      totalEstimatedMinutes: 0,
      totalActualMinutes: 0,
      efficiency: 100,
      results: [],
      achievements: [],
      learnings: ['今日没有可执行的任务'],
      blockers: [],
      nextDayRecommendations: ['检查目标和里程碑设置'],
      startedAt: now,
      completedAt: now,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const autonomousScheduler = new AutonomousScheduler();
