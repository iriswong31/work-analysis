import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { cronScheduler } from './scheduler/cron.js';
import { taskTrigger } from './scheduler/trigger.js';
import { memoryReader } from './memory/reader.js';
import { deliveryReporter } from './delivery/reporter.js';
import { deliveryPackager } from './delivery/packager.js';

/**
 * Iris 数字分身自动任务执行调度服务
 * 
 * 功能：
 * 1. 每天固定时间自动启动
 * 2. 从记忆层读取待办任务
 * 3. 智能选择今日执行的编码任务
 * 4. 调用 AI 生成代码
 * 5. 生成执行报告和交付物
 */

class IrisAgentScheduler {
  private isRunning = false;

  /**
   * 启动调度服务
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    logger.info('='.repeat(60));
    logger.info('🤖 Iris Agent Scheduler Starting...');
    logger.info('='.repeat(60));

    try {
      // 初始化任务触发器
      await taskTrigger.initialize();

      // 启动定时调度
      cronScheduler.start();

      this.isRunning = true;

      // 显示配置信息
      this.logConfiguration();

      // 显示下次执行时间
      const state = cronScheduler.getState();
      if (state.nextExecutionTime) {
        logger.info(`📅 Next execution: ${state.nextExecutionTime.toLocaleString('zh-CN')}`);
      }

      logger.info('');
      logger.info('✅ Scheduler started successfully');
      logger.info('Press Ctrl+C to stop');
      logger.info('');

      // 注册退出处理
      this.registerShutdownHandlers();

    } catch (error) {
      logger.error('Failed to start scheduler:', error);
      process.exit(1);
    }
  }

  /**
   * 停止调度服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    logger.info('');
    logger.info('Shutting down scheduler...');

    cronScheduler.stop();
    memoryReader.close();
    deliveryReporter.close();

    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * 手动触发执行
   */
  async triggerNow(): Promise<void> {
    logger.info('Manual execution triggered');
    await cronScheduler.triggerNow();
  }

  /**
   * 获取状态
   */
  getStatus(): {
    isRunning: boolean;
    schedulerState: ReturnType<typeof cronScheduler.getState>;
    config: typeof config;
  } {
    return {
      isRunning: this.isRunning,
      schedulerState: cronScheduler.getState(),
      config,
    };
  }

  /**
   * 显示配置信息
   */
  private logConfiguration(): void {
    logger.info('');
    logger.info('📋 Configuration:');
    logger.info(`   Daily execution time: ${config.scheduler.dailyExecutionTime}`);
    logger.info(`   Timezone: ${config.scheduler.timezone}`);
    logger.info(`   Max tasks per day: ${config.scheduler.maxTasksPerDay}`);
    logger.info(`   AI model: ${config.ai.model}`);
    logger.info(`   Retry attempts: ${config.scheduler.retryAttempts}`);
    logger.info('');
  }

  /**
   * 注册退出处理
   */
  private registerShutdownHandlers(): void {
    const shutdown = async () => {
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });
  }
}

// CLI 命令处理
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const scheduler = new IrisAgentScheduler();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Iris Agent Scheduler - 数字分身自动任务执行服务

用法:
  npm run dev              开发模式运行
  npm start                生产模式运行
  npm run dev -- --now     立即执行一次
  npm run dev -- --status  查看状态
  npm run dev -- --stats   查看统计数据

选项:
  --now       立即执行任务（不等待定时）
  --status    显示调度器状态
  --stats     显示执行统计
  --help, -h  显示帮助信息
`);
    return;
  }

  if (args.includes('--status')) {
    const state = cronScheduler.getState();
    console.log('Scheduler Status:', JSON.stringify(state, null, 2));
    return;
  }

  if (args.includes('--stats')) {
    const stats = await deliveryReporter.getStatistics(7);
    console.log('Last 7 Days Statistics:');
    console.log(`  Total tasks: ${stats.totalTasks}`);
    console.log(`  Completed: ${stats.completedTasks}`);
    console.log(`  Failed: ${stats.failedTasks}`);
    console.log(`  Total lines of code: ${stats.totalLinesOfCode}`);
    console.log(`  Avg success rate: ${stats.avgSuccessRate.toFixed(1)}%`);
    
    const { totalSize, fileCount } = await deliveryPackager.getDeliverySize();
    console.log(`  Delivery files: ${fileCount}`);
    console.log(`  Delivery size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    return;
  }

  // 启动调度器
  await scheduler.start();

  // 如果指定了 --now，立即执行
  if (args.includes('--now')) {
    logger.info('');
    logger.info('🚀 Immediate execution requested');
    await scheduler.triggerNow();
  }
}

// 运行主函数
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

export { IrisAgentScheduler };
