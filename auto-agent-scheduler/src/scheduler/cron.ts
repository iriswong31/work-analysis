import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import type { SchedulerState, SchedulerStatus } from '../types/index.js';

export type ExecutionCallback = () => Promise<void>;

export class CronScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private state: SchedulerState;
  private executionCallback: ExecutionCallback | null = null;

  constructor() {
    this.state = {
      status: 'idle',
      todayProgress: {
        planned: 0,
        completed: 0,
        failed: 0,
      },
    };
  }

  /**
   * 将时间字符串转换为 cron 表达式
   * @param time 时间字符串，格式 "HH:mm"
   * @returns cron 表达式
   */
  private timeToCron(time: string): string {
    const [hour, minute] = time.split(':').map(Number);
    // cron 格式: 分 时 日 月 周
    return `${minute} ${hour} * * *`;
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextExecution(): Date {
    const [hour, minute] = config.scheduler.dailyExecutionTime.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);

    // 如果今天的执行时间已过，则设置为明天
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * 注册执行回调
   */
  onExecute(callback: ExecutionCallback): void {
    this.executionCallback = callback;
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (!config.scheduler.enabled) {
      logger.warn('Scheduler is disabled in configuration');
      return;
    }

    if (this.cronJob) {
      logger.warn('Scheduler is already running');
      return;
    }

    const cronExpression = this.timeToCron(config.scheduler.dailyExecutionTime);
    logger.info(`Starting scheduler with cron expression: ${cronExpression}`);
    logger.info(`Daily execution time: ${config.scheduler.dailyExecutionTime} (${config.scheduler.timezone})`);

    this.cronJob = cron.schedule(
      cronExpression,
      async () => {
        await this.executeDaily();
      },
      {
        timezone: config.scheduler.timezone,
        scheduled: true,
      }
    );

    this.state.status = 'idle';
    this.state.nextExecutionTime = this.calculateNextExecution();
    
    logger.info(`Scheduler started. Next execution: ${this.state.nextExecutionTime.toLocaleString()}`);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.state.status = 'idle';
      logger.info('Scheduler stopped');
    }
  }

  /**
   * 暂停调度器
   */
  pause(): void {
    if (this.cronJob && this.state.status !== 'running') {
      this.cronJob.stop();
      this.state.status = 'paused';
      logger.info('Scheduler paused');
    }
  }

  /**
   * 恢复调度器
   */
  resume(): void {
    if (this.cronJob && this.state.status === 'paused') {
      this.cronJob.start();
      this.state.status = 'idle';
      this.state.nextExecutionTime = this.calculateNextExecution();
      logger.info('Scheduler resumed');
    }
  }

  /**
   * 执行每日任务
   */
  async executeDaily(): Promise<void> {
    if (this.state.status === 'running') {
      logger.warn('Execution already in progress, skipping');
      return;
    }

    logger.info('='.repeat(60));
    logger.info('Starting daily execution');
    logger.info('='.repeat(60));

    this.state.status = 'running';
    this.state.lastExecutionTime = new Date();
    this.state.todayProgress = { planned: 0, completed: 0, failed: 0 };

    try {
      if (this.executionCallback) {
        await this.executionCallback();
      } else {
        logger.warn('No execution callback registered');
      }

      this.state.status = 'idle';
      logger.info('Daily execution completed successfully');
    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : String(error);
      logger.error('Daily execution failed:', error);
    }

    this.state.nextExecutionTime = this.calculateNextExecution();
    logger.info(`Next execution scheduled: ${this.state.nextExecutionTime.toLocaleString()}`);
  }

  /**
   * 手动触发执行（用于测试或手动启动）
   */
  async triggerNow(): Promise<void> {
    logger.info('Manual execution triggered');
    await this.executeDaily();
  }

  /**
   * 获取调度器状态
   */
  getState(): SchedulerState {
    return { ...this.state };
  }

  /**
   * 更新进度
   */
  updateProgress(completed: number, failed: number, planned: number): void {
    this.state.todayProgress = { planned, completed, failed };
  }

  /**
   * 设置当前任务
   */
  setCurrentTask(task: SchedulerState['currentTask']): void {
    this.state.currentTask = task;
  }
}

export const cronScheduler = new CronScheduler();
