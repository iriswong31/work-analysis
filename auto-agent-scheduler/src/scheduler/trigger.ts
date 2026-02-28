import { logger, executionLogger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { cronScheduler } from './cron.js';
import { memoryReader } from '../memory/reader.js';
import { memoryWriter } from '../memory/writer.js';
import { yamlMemoryReader } from '../memory/yaml-reader.js';
import { yamlMemoryWriter } from '../memory/yaml-writer.js';
import { taskSelector } from '../decision/selector.js';
import { codeExecutor } from '../executor/code-generator.js';
import { deliveryReporter } from '../delivery/reporter.js';
import type { 
  ExecutableTask, 
  ExecutionResult, 
  DailyExecutionReport,
  ShortTermTask 
} from '../types/index.js';

export class TaskTrigger {
  private isInitialized = false;

  /**
   * 初始化触发器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('Initializing task trigger...');

    // 注册执行回调
    cronScheduler.onExecute(async () => {
      await this.executeDailyWorkflow();
    });

    this.isInitialized = true;
    logger.info('Task trigger initialized');
  }

  /**
   * 执行每日工作流
   */
  async executeDailyWorkflow(): Promise<DailyExecutionReport> {
    const startTime = Date.now();
    const results: ExecutionResult[] = [];
    let tasksPlanned = 0;
    let tasksCompleted = 0;
    let tasksFailed = 0;

    try {
      // 1. 读取记忆层数据
      logger.info('Step 1: Reading memory layer...');
      const memory = await memoryReader.readAll();
      
      if (!memory) {
        throw new Error('Failed to read memory layer');
      }

      logger.info(`Loaded ${memory.shortTermTasks.length} tasks from memory`);

      // 2. 选择今日任务
      logger.info('Step 2: Selecting tasks for today...');
      const selectedTasks = await taskSelector.selectDailyTasks(
        memory.shortTermTasks,
        memory.immediateContext,
        memory.longTermGoals,
        config.scheduler.maxTasksPerDay
      );

      tasksPlanned = selectedTasks.length;
      cronScheduler.updateProgress(0, 0, tasksPlanned);

      if (selectedTasks.length === 0) {
        logger.info('No tasks selected for today');
        return this.createReport(startTime, results, tasksPlanned, tasksCompleted, tasksFailed);
      }

      logger.info(`Selected ${selectedTasks.length} tasks for execution`);
      selectedTasks.forEach((task, i) => {
        logger.info(`  ${i + 1}. [${task.type}] ${task.sourceTask.title} (priority: ${task.priority})`);
      });

      // 3. 逐个执行任务
      logger.info('Step 3: Executing tasks...');
      for (const task of selectedTasks) {
        cronScheduler.setCurrentTask(task);
        
        logger.info(`\nExecuting task: ${task.sourceTask.title}`);
        executionLogger.info({
          event: 'task_start',
          taskId: task.id,
          title: task.sourceTask.title,
          type: task.type,
        });

        const result = await this.executeTaskWithRetry(task);
        results.push(result);

        if (result.success) {
          tasksCompleted++;
          logger.info(`Task completed: ${task.sourceTask.title}`);
          
          // 更新任务状态
          await this.updateTaskStatus(task.sourceTask, 'completed', result);
        } else {
          tasksFailed++;
          logger.error(`Task failed: ${task.sourceTask.title} - ${result.error}`);
        }

        cronScheduler.updateProgress(tasksCompleted, tasksFailed, tasksPlanned);

        executionLogger.info({
          event: 'task_end',
          taskId: task.id,
          success: result.success,
          duration: result.duration,
          linesOfCode: result.outputs.reduce((sum, o) => sum + o.linesOfCode, 0),
        });
      }

      cronScheduler.setCurrentTask(undefined);

      // 4. 生成报告
      logger.info('Step 4: Generating daily report...');
      const report = this.createReport(startTime, results, tasksPlanned, tasksCompleted, tasksFailed);
      
      // 5. 保存报告
      await deliveryReporter.saveReport(report);
      logger.info(`Daily report saved: ${report.id}`);

      // 6. 更新记忆层
      logger.info('Step 5: Updating memory layer...');
      await memoryWriter.updateImmediateContext({
        completedTasks: results.filter(r => r.success).map(r => r.taskId),
      });

      // 7. 更新 YAML 记忆系统（复利迭代）
      logger.info('Step 6: Updating YAML memory system...');
      await this.updateYamlMemory(report, results);

      return report;

    } catch (error) {
      logger.error('Daily workflow failed:', error);
      throw error;
    }
  }

  /**
   * 带重试的任务执行
   */
  private async executeTaskWithRetry(task: ExecutableTask): Promise<ExecutionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.scheduler.retryAttempts; attempt++) {
      try {
        logger.info(`Attempt ${attempt}/${config.scheduler.retryAttempts}`);
        const result = await codeExecutor.execute(task);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < config.scheduler.retryAttempts) {
          logger.info(`Retrying in ${config.scheduler.retryDelayMs}ms...`);
          await this.delay(config.scheduler.retryDelayMs);
        }
      }
    }

    // 所有重试都失败
    return {
      taskId: task.id,
      success: false,
      outputs: [],
      logs: [`All ${config.scheduler.retryAttempts} attempts failed`],
      duration: 0,
      startedAt: new Date(),
      completedAt: new Date(),
      error: lastError?.message || 'Unknown error',
    };
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(
    task: ShortTermTask, 
    status: ShortTermTask['status'],
    result: ExecutionResult
  ): Promise<void> {
    try {
      await memoryWriter.updateTaskStatus(task.id, status, {
        actualHours: result.duration / 3600000, // 转换为小时
        completedAt: result.completedAt,
        deliverables: result.outputs.map(o => ({
          id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'code' as const,
          title: o.filePath,
          description: `Generated ${o.linesOfCode} lines of ${o.language} code`,
          filePath: o.filePath,
          createdAt: new Date(),
        })),
      });
    } catch (error) {
      logger.error(`Failed to update task status: ${error}`);
    }
  }

  /**
   * 创建执行报告
   */
  private createReport(
    startTime: number,
    results: ExecutionResult[],
    planned: number,
    completed: number,
    failed: number
  ): DailyExecutionReport {
    const totalDuration = Date.now() - startTime;
    const totalLinesOfCode = results.reduce(
      (sum, r) => sum + r.outputs.reduce((s, o) => s + o.linesOfCode, 0),
      0
    );

    const summary = this.generateSummary(results, completed, failed);
    const recommendations = this.generateRecommendations(results);

    return {
      id: `report_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
      date: new Date(),
      tasksPlanned: planned,
      tasksCompleted: completed,
      tasksFailed: failed,
      totalDuration,
      totalLinesOfCode,
      results,
      summary,
      nextDayRecommendations: recommendations,
    };
  }

  /**
   * 生成执行摘要
   */
  private generateSummary(results: ExecutionResult[], completed: number, failed: number): string {
    const successRate = results.length > 0 ? (completed / results.length * 100).toFixed(1) : '0';
    const totalLines = results.reduce(
      (sum, r) => sum + r.outputs.reduce((s, o) => s + o.linesOfCode, 0),
      0
    );
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = results.length > 0 ? totalDuration / results.length : 0;

    return `今日执行完成：${completed}/${results.length} 任务成功 (${successRate}%)，` +
           `共生成 ${totalLines} 行代码，平均耗时 ${(avgDuration / 1000).toFixed(1)} 秒/任务。`;
  }

  /**
   * 生成明日建议
   */
  private generateRecommendations(results: ExecutionResult[]): string[] {
    const recommendations: string[] = [];

    const failedTasks = results.filter(r => !r.success);
    if (failedTasks.length > 0) {
      recommendations.push(`复查失败任务 (${failedTasks.length}个)，分析失败原因`);
    }

    const longTasks = results.filter(r => r.duration > 300000); // > 5分钟
    if (longTasks.length > 0) {
      recommendations.push('考虑将耗时较长的任务拆分为更小的子任务');
    }

    if (results.length < config.scheduler.maxTasksPerDay) {
      recommendations.push('可以增加每日任务数量以提高产出');
    }

    if (recommendations.length === 0) {
      recommendations.push('保持当前节奏，继续推进项目');
    }

    return recommendations;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新 YAML 记忆系统（复利迭代）
   */
  private async updateYamlMemory(
    report: DailyExecutionReport,
    results: ExecutionResult[]
  ): Promise<void> {
    try {
      // 1. 添加今日对话摘要到 L1
      const successfulTasks = results.filter(r => r.success);
      const keyOutputs = successfulTasks
        .flatMap(r => r.outputs.map(o => `${o.filePath} (${o.linesOfCode} 行)`))
        .slice(0, 5);

      await yamlMemoryWriter.addDialogueSummary({
        date: new Date().toISOString().split('T')[0],
        summary: report.summary,
        key_decisions: keyOutputs,
        action_items: report.nextDayRecommendations,
      });

      // 2. 记录每日执行结果
      await yamlMemoryWriter.recordDailyExecution({
        date: new Date().toISOString().split('T')[0],
        tasks_completed: report.tasksCompleted,
        tasks_total: report.tasksPlanned,
        key_outputs: keyOutputs,
        learnings: this.extractLearnings(results),
      });

      // 3. 更新当前状态 L0
      await yamlMemoryWriter.updateCurrentState({
        focus_task: undefined,
        energy_level: report.tasksCompleted >= report.tasksPlanned * 0.8 ? 'high' : 'medium',
        mood: report.tasksFailed === 0 ? '高效' : '需要调整',
        temp_notes: [`今日完成 ${report.tasksCompleted}/${report.tasksPlanned} 任务`],
      });

      logger.info('YAML memory system updated successfully');
    } catch (error) {
      logger.error('Failed to update YAML memory system:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 从执行结果中提取学习收获
   */
  private extractLearnings(results: ExecutionResult[]): string[] {
    const learnings: string[] = [];

    // 分析失败任务
    const failedTasks = results.filter(r => !r.success);
    if (failedTasks.length > 0) {
      learnings.push(`${failedTasks.length} 个任务失败，需要分析原因并优化`);
    }

    // 分析耗时
    const avgDuration = results.length > 0
      ? results.reduce((sum, r) => sum + r.duration, 0) / results.length
      : 0;
    if (avgDuration > 180000) { // > 3 分钟
      learnings.push('任务平均耗时较长，考虑优化任务粒度');
    }

    // 分析代码产出
    const totalLines = results.reduce(
      (sum, r) => sum + r.outputs.reduce((s, o) => s + o.linesOfCode, 0),
      0
    );
    if (totalLines > 500) {
      learnings.push(`高产出日：生成 ${totalLines} 行代码`);
    }

    return learnings;
  }
}

export const taskTrigger = new TaskTrigger();
