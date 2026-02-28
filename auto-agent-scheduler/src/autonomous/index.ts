/**
 * 自主任务系统入口
 * 基于五层记忆系统，自动规划和执行每日任务
 */

export { taskGenerator } from './task-generator.js';
export { taskExecutor } from './task-executor.js';
export { feedbackCollector } from './feedback-collector.js';
export { autonomousScheduler } from './scheduler.js';
export { visualizer } from './visualizer.js';
export { codeBuddyFormatter } from './codebuddy-formatter.js';

export * from './types.js';
export * from './codebuddy-formatter.js';

// 快捷方法
import { autonomousScheduler } from './scheduler.js';
import { taskGenerator } from './task-generator.js';
import { codeBuddyFormatter } from './codebuddy-formatter.js';

/**
 * 立即执行每日任务
 */
export async function runNow() {
  return autonomousScheduler.runNow();
}

/**
 * 预览每日计划
 */
export async function previewPlan() {
  return autonomousScheduler.previewPlan();
}

/**
 * 启动后台定时模式
 */
export function startBackground() {
  return autonomousScheduler.startBackgroundMode();
}

/**
 * 停止后台定时模式
 */
export function stopBackground() {
  return autonomousScheduler.stopBackgroundMode();
}

/**
 * 获取当前状态
 */
export function getStatus() {
  return autonomousScheduler.getStatus();
}

/**
 * 停止当前执行
 */
export function abort() {
  return autonomousScheduler.abort();
}

/**
 * 导出为 CodeBuddy 对话格式
 * @param format 输出格式：'markdown' | 'json'
 */
export async function exportForCodeBuddy(format: 'markdown' | 'json' = 'markdown'): Promise<string> {
  const plan = await taskGenerator.generateDailyPlan();
  const codeBuddyPlan = codeBuddyFormatter.formatPlan(plan);
  
  if (format === 'json') {
    return codeBuddyFormatter.toJSON(codeBuddyPlan);
  }
  return codeBuddyFormatter.toMarkdown(codeBuddyPlan);
}

/**
 * 获取单个任务的执行 prompt
 * @param taskIndex 任务索引（从 0 开始）
 */
export async function getTaskPrompt(taskIndex: number): Promise<string | null> {
  const plan = await taskGenerator.generateDailyPlan();
  const codeBuddyPlan = codeBuddyFormatter.formatPlan(plan);
  return codeBuddyFormatter.getTaskPrompt(codeBuddyPlan, taskIndex);
}
