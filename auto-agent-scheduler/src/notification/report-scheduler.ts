/**
 * 日报调度器
 * 每日 18:00 自动发送工作日报邮件
 */

import cron from 'node-cron';
import { emailService } from './email-service.js';
import { generateReportHtml } from './report-template.js';
import { isEmailConfigured } from './email-config.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import type { DailyReport } from '../autonomous/types.js';

class ReportScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private latestReport: DailyReport | null = null;

  /**
   * 设置最新的日报数据
   */
  setReport(report: DailyReport): void {
    this.latestReport = report;
    logger.info(`日报数据已更新: ${report.date}`);
  }

  /**
   * 获取报告发送时间
   */
  private getReportTime(): string {
    return process.env.REPORT_TIME || '18:00';
  }

  /**
   * 启动日报调度器
   */
  start(): void {
    if (!isEmailConfigured()) {
      logger.warn('邮件服务未配置，日报调度器未启动');
      return;
    }

    if (this.cronJob) {
      logger.warn('日报调度器已在运行');
      return;
    }

    const reportTime = this.getReportTime();
    const [hour, minute] = reportTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    logger.info(`启动日报调度器，每天 ${reportTime} 发送日报`);

    this.cronJob = cron.schedule(
      cronExpression,
      async () => {
        await this.sendDailyReport();
      },
      {
        timezone: config.scheduler.timezone || 'Asia/Shanghai',
        scheduled: true,
      }
    );

    logger.info(`日报调度器已启动，cron: ${cronExpression}`);
  }

  /**
   * 停止日报调度器
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('日报调度器已停止');
    }
  }

  /**
   * 发送日报
   */
  async sendDailyReport(): Promise<boolean> {
    if (!this.latestReport) {
      logger.warn('没有可发送的日报数据');
      
      // 发送一个空报告通知
      const emptyReport = this.createEmptyReport();
      return this.sendReport(emptyReport);
    }

    return this.sendReport(this.latestReport);
  }

  /**
   * 发送指定报告
   */
  private async sendReport(report: DailyReport): Promise<boolean> {
    try {
      const html = generateReportHtml(report);
      const result = await emailService.sendDailyReport(html, report.date);

      if (result.success) {
        logger.info(`日报邮件发送成功: ${result.messageId}`);
        return true;
      } else {
        logger.error(`日报邮件发送失败: ${result.error}`);
        return false;
      }
    } catch (error) {
      logger.error('发送日报时发生错误:', error);
      return false;
    }
  }

  /**
   * 创建空报告
   */
  private createEmptyReport(): DailyReport {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    return {
      date: dateStr,
      planId: `plan-${dateStr}`,
      tasksPlanned: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksSkipped: 0,
      totalEstimatedMinutes: 0,
      totalActualMinutes: 0,
      efficiency: 100,
      results: [],
      achievements: [],
      learnings: ['今日没有执行任务'],
      blockers: [],
      nextDayRecommendations: ['检查任务规划和目标设置'],
      startedAt: now,
      completedAt: now,
    };
  }

  /**
   * 手动触发发送（用于测试）
   */
  async triggerNow(): Promise<boolean> {
    logger.info('手动触发日报发送');
    return this.sendDailyReport();
  }

  /**
   * 获取调度器状态
   */
  getStatus(): {
    isRunning: boolean;
    reportTime: string;
    hasReport: boolean;
    lastReportDate: string | null;
  } {
    return {
      isRunning: this.cronJob !== null,
      reportTime: this.getReportTime(),
      hasReport: this.latestReport !== null,
      lastReportDate: this.latestReport?.date || null,
    };
  }
}

export const reportScheduler = new ReportScheduler();
