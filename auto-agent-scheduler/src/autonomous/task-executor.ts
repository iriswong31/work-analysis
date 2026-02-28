/**
 * 任务执行器
 * 支持编码、工作、生活三类任务的处理
 */

import { logger } from '../utils/logger.js';
import { aiClient, type AIResponse } from '../executor/ai-client.js';
import type {
  DailyTask,
  ExecutionResult,
  TaskOutput,
  ExecutionConfig,
} from './types.js';

/**
 * 任务执行器类
 */
class TaskExecutor {
  private config: ExecutionConfig;
  private currentTask: DailyTask | null = null;
  private abortController: AbortController | null = null;

  constructor(config?: Partial<ExecutionConfig>) {
    this.config = {
      mode: 'interactive',
      maxTasksPerDay: 5,
      maxMinutesPerDay: 240,
      retryOnFailure: true,
      maxRetries: 2,
      pauseBetweenTasks: 2000,
      showProgress: true,
      verboseOutput: true,
      autoStart: false,
      ...config,
    };
  }

  /**
   * 执行单个任务
   */
  async executeTask(task: DailyTask): Promise<ExecutionResult> {
    this.currentTask = task;
    const startTime = Date.now();

    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🚀 开始执行任务: ${task.title}`);
    logger.info(`   类型: ${this.getTaskTypeLabel(task.type)} | 优先级: ${task.priority} | 预估: ${task.estimatedMinutes}分钟`);
    logger.info(`${'='.repeat(60)}\n`);

    let result: ExecutionResult;

    try {
      switch (task.type) {
        case 'coding':
          result = await this.executeCodingTask(task, startTime);
          break;
        case 'work':
          result = await this.executeWorkTask(task, startTime);
          break;
        case 'life':
          result = await this.executeLifeTask(task, startTime);
          break;
        default:
          result = await this.executeGenericTask(task, startTime);
      }
    } catch (error) {
      result = this.createFailedResult(task, startTime, error);
    }

    this.currentTask = null;
    this.logResult(result);

    return result;
  }

  /**
   * 执行编码任务
   */
  private async executeCodingTask(task: DailyTask, startTime: number): Promise<ExecutionResult> {
    logger.info('💻 执行编码任务...');

    const outputs: TaskOutput[] = [];
    const learnings: string[] = [];

    try {
      // 构建编码任务提示
      const prompt = this.buildCodingPrompt(task);

      // 调用 AI 分析任务
      logger.info('   📝 分析任务需求...');
      const analysisResult = await aiClient.chat([
        { role: 'user', content: `作为专业软件工程师，请分析以下任务：\n\n${prompt}` },
      ]);

      logger.info('   🔧 生成实现方案...');

      // 记录 AI 分析结果作为产出
      outputs.push({
        type: 'decision',
        description: `编码任务分析: ${task.title}`,
      });

      // 如果有具体产出物，记录
      if (task.deliverables && task.deliverables.length > 0) {
        for (const deliverable of task.deliverables) {
          outputs.push({
            type: 'code',
            description: deliverable,
          });
        }
      }

      learnings.push(`编码任务已分析，生成 ${outputs.length} 项产出`);

      return {
        taskId: task.id,
        taskTitle: task.title,
        success: true,
        status: 'completed',
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: Math.round((Date.now() - startTime) / 60000),
        outputs,
        feedback: analysisResult.content.substring(0, 500),
        learnings,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      };
    } catch (error) {
      logger.error('编码任务执行失败:', error);
      return this.createFailedResult(task, startTime, error);
    }
  }

  /**
   * 执行工作任务
   */
  private async executeWorkTask(task: DailyTask, startTime: number): Promise<ExecutionResult> {
    logger.info('📋 执行工作任务...');

    const outputs: TaskOutput[] = [];
    const learnings: string[] = [];

    try {
      // 构建工作任务提示
      const prompt = this.buildWorkPrompt(task);

      logger.info('   🤔 分析任务...');
      const result = await aiClient.chat([
        { role: 'user', content: `作为高效工作助手，请帮我完成以下任务：\n\n${prompt}` },
      ]);

      logger.info('   ✍️ 生成执行方案...');

      // 记录决策产出
      outputs.push({
        type: 'decision',
        description: `工作任务分析和执行方案`,
      });

      // 如果有具体产出物，记录
      if (task.deliverables && task.deliverables.length > 0) {
        for (const deliverable of task.deliverables) {
          outputs.push({
            type: 'document',
            description: deliverable,
          });
        }
      }

      learnings.push('工作任务已分析并生成执行方案');

      return {
        taskId: task.id,
        taskTitle: task.title,
        success: true,
        status: 'completed',
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: Math.round((Date.now() - startTime) / 60000),
        outputs,
        feedback: result.content.substring(0, 500),
        learnings,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      };
    } catch (error) {
      return this.createFailedResult(task, startTime, error);
    }
  }

  /**
   * 执行生活任务
   */
  private async executeLifeTask(task: DailyTask, startTime: number): Promise<ExecutionResult> {
    logger.info('🌱 执行生活任务...');

    const outputs: TaskOutput[] = [];
    const learnings: string[] = [];

    try {
      // 生活任务通常需要人工完成，这里生成提醒和计划
      const prompt = this.buildLifePrompt(task);

      logger.info('   📅 生成执行计划...');
      const result = await aiClient.chat([
        { role: 'user', content: `作为生活助手，请帮我规划以下任务：\n\n${prompt}` },
      ]);

      outputs.push({
        type: 'other',
        description: `生活任务提醒: ${task.title}`,
      });

      learnings.push('生活任务已生成执行计划');

      // 生活任务标记为完成（实际执行由用户完成）
      return {
        taskId: task.id,
        taskTitle: task.title,
        success: true,
        status: 'completed',
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: Math.round((Date.now() - startTime) / 60000),
        outputs,
        feedback: result.content.substring(0, 500),
        learnings,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      };
    } catch (error) {
      return this.createFailedResult(task, startTime, error);
    }
  }

  /**
   * 执行通用任务
   */
  private async executeGenericTask(task: DailyTask, startTime: number): Promise<ExecutionResult> {
    logger.info('⚡ 执行通用任务...');

    try {
      const result = await aiClient.chat([
        { role: 'user', content: `请帮我完成以下任务：\n\n标题：${task.title}\n描述：${task.description}` },
      ]);

      return {
        taskId: task.id,
        taskTitle: task.title,
        success: true,
        status: 'completed',
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: Math.round((Date.now() - startTime) / 60000),
        outputs: [{ type: 'other', description: '任务已处理' }],
        feedback: result.content.substring(0, 500),
        startedAt: new Date(startTime),
        completedAt: new Date(),
      };
    } catch (error) {
      return this.createFailedResult(task, startTime, error);
    }
  }

  /**
   * 批量执行任务
   */
  async executeTasks(tasks: DailyTask[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      logger.info(`\n📌 任务进度: ${i + 1}/${tasks.length}`);

      const result = await this.executeTask(task);
      results.push(result);

      // 任务间暂停
      if (i < tasks.length - 1 && this.config.pauseBetweenTasks > 0) {
        logger.info(`⏸️  暂停 ${this.config.pauseBetweenTasks / 1000} 秒后继续...`);
        await this.delay(this.config.pauseBetweenTasks);
      }
    }

    return results;
  }

  /**
   * 停止当前执行
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      logger.warn('⚠️ 任务执行已中止');
    }
  }

  /**
   * 获取当前任务
   */
  getCurrentTask(): DailyTask | null {
    return this.currentTask;
  }

  // ==================== 辅助方法 ====================

  private buildCodingPrompt(task: DailyTask): string {
    return `
## 编码任务

**标题**: ${task.title}
**描述**: ${task.description}
${task.sourceGoalName ? `**关联目标**: ${task.sourceGoalName}` : ''}
${task.deliverables?.length ? `**预期产出**: \n${task.deliverables.map(d => `- ${d}`).join('\n')}` : ''}

请分析这个任务，并提供：
1. 任务分解步骤
2. 技术方案建议
3. 预期产出文件
4. 潜在风险和注意事项
    `.trim();
  }

  private buildWorkPrompt(task: DailyTask): string {
    return `
## 工作任务

**标题**: ${task.title}
**描述**: ${task.description}
**优先级**: ${task.priority}
${task.sourceGoalName ? `**关联目标**: ${task.sourceGoalName}` : ''}

请帮我：
1. 分析这个任务的关键点
2. 提供具体的执行步骤
3. 列出需要注意的事项
4. 给出预期成果
    `.trim();
  }

  private buildLifePrompt(task: DailyTask): string {
    return `
## 生活任务

**标题**: ${task.title}
**描述**: ${task.description}
**预估时间**: ${task.estimatedMinutes} 分钟

请帮我：
1. 规划这个任务的最佳执行时间
2. 提供执行建议
3. 设置提醒要点
    `.trim();
  }

  private createFailedResult(task: DailyTask, startTime: number, error: unknown): ExecutionResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      taskId: task.id,
      taskTitle: task.title,
      success: false,
      status: 'failed',
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: Math.round((Date.now() - startTime) / 60000),
      outputs: [],
      feedback: `执行失败: ${errorMessage}`,
      blockers: [errorMessage],
      startedAt: new Date(startTime),
      completedAt: new Date(),
    };
  }

  private logResult(result: ExecutionResult): void {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? '成功' : '失败';

    logger.info(`\n${icon} 任务执行${status}: ${result.taskTitle}`);
    logger.info(`   预估: ${result.estimatedMinutes}分钟 | 实际: ${result.actualMinutes}分钟`);

    if (result.outputs.length > 0) {
      logger.info(`   产出: ${result.outputs.length} 项`);
      for (const output of result.outputs) {
        logger.info(`      - ${output.description}${output.path ? ` (${output.path})` : ''}`);
      }
    }

    if (result.learnings && result.learnings.length > 0) {
      logger.info(`   学习: ${result.learnings.join(', ')}`);
    }

    if (result.blockers && result.blockers.length > 0) {
      logger.warn(`   阻塞: ${result.blockers.join(', ')}`);
    }
  }

  private getTaskTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      coding: '💻 编码',
      work: '📋 工作',
      life: '🌱 生活',
    };
    return labels[type] || type;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const taskExecutor = new TaskExecutor();
