/**
 * 执行可视化模块
 * 实时展示任务执行进度和状态
 */

import type {
  DailyTask,
  DailyPlan,
  ExecutionResult,
  DailyReport,
  ProgressState,
  LogEntry,
} from './types.js';

// ANSI 颜色码
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // 前景色
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // 背景色
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

/**
 * 可视化器类
 */
class Visualizer {
  private startTime: Date | null = null;
  private logs: LogEntry[] = [];

  /**
   * 显示每日计划
   */
  showDailyPlan(plan: DailyPlan): void {
    this.printHeader('📋 每日计划');
    
    console.log(`${colors.gray}日期: ${plan.date}${colors.reset}`);
    console.log(`${colors.gray}生成时间: ${plan.generatedAt.toLocaleTimeString()}${colors.reset}`);
    console.log();

    // 统计信息
    this.printSection('📊 任务统计');
    console.log(`   总任务数: ${colors.bold}${plan.tasks.length}${colors.reset}`);
    console.log(`   预估时间: ${colors.bold}${plan.totalEstimatedMinutes}${colors.reset} 分钟 (${(plan.totalEstimatedMinutes / 60).toFixed(1)} 小时)`);
    console.log(`   编码任务: ${colors.cyan}${plan.codingTasks}${colors.reset}`);
    console.log(`   工作任务: ${colors.blue}${plan.workTasks}${colors.reset}`);
    console.log(`   生活任务: ${colors.green}${plan.lifeTasks}${colors.reset}`);
    console.log();

    // 任务列表
    this.printSection('📝 任务列表');
    for (const task of plan.tasks) {
      this.printTask(task);
    }
    console.log();

    // 关联目标
    if (plan.focusGoals.length > 0) {
      this.printSection('🎯 关联目标');
      for (const goal of plan.focusGoals) {
        console.log(`   • ${goal}`);
      }
      console.log();
    }

    this.printDivider();
  }

  /**
   * 显示任务开始
   */
  showTaskStart(task: DailyTask, index: number, total: number): void {
    console.log();
    this.printDivider('=');
    console.log(`${colors.bold}${colors.cyan}🚀 任务 ${index}/${total}: ${task.title}${colors.reset}`);
    this.printDivider('=');
    
    console.log(`   ${colors.gray}类型:${colors.reset} ${this.getTaskTypeIcon(task.type)} ${this.getTaskTypeLabel(task.type)}`);
    console.log(`   ${colors.gray}优先级:${colors.reset} ${this.getPriorityBadge(task.priority)}`);
    console.log(`   ${colors.gray}预估时间:${colors.reset} ${task.estimatedMinutes} 分钟`);
    
    if (task.sourceGoalName) {
      console.log(`   ${colors.gray}关联目标:${colors.reset} ${task.sourceGoalName}`);
    }
    
    if (task.description) {
      console.log(`   ${colors.gray}描述:${colors.reset} ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`);
    }
    
    console.log();
  }

  /**
   * 显示任务进度
   */
  showProgress(state: ProgressState): void {
    const percentage = state.totalTasks > 0 
      ? Math.round((state.completedTasks / state.totalTasks) * 100) 
      : 0;
    
    const progressBar = this.createProgressBar(percentage, 30);
    
    // 清除当前行并重写
    process.stdout.write(`\r   ${progressBar} ${percentage}% | 已完成: ${state.completedTasks}/${state.totalTasks}`);
    
    if (state.taskProgress) {
      process.stdout.write(` | 当前步骤: ${state.taskProgress.step}`);
    }
  }

  /**
   * 显示任务完成
   */
  showTaskComplete(result: ExecutionResult): void {
    console.log(); // 换行
    
    const icon = result.success ? '✅' : '❌';
    const statusColor = result.success ? colors.green : colors.red;
    const status = result.success ? '完成' : '失败';
    
    console.log(`${icon} ${statusColor}${colors.bold}任务${status}${colors.reset}: ${result.taskTitle}`);
    console.log(`   ${colors.gray}预估:${colors.reset} ${result.estimatedMinutes}分钟 ${colors.gray}|${colors.reset} ${colors.gray}实际:${colors.reset} ${result.actualMinutes}分钟`);
    
    // 效率分析
    if (result.estimatedMinutes > 0) {
      const efficiency = (result.estimatedMinutes / result.actualMinutes * 100).toFixed(0);
      const effColor = result.actualMinutes <= result.estimatedMinutes ? colors.green : colors.yellow;
      console.log(`   ${colors.gray}效率:${colors.reset} ${effColor}${efficiency}%${colors.reset}`);
    }
    
    // 产出
    if (result.outputs.length > 0) {
      console.log(`   ${colors.gray}产出:${colors.reset}`);
      for (const output of result.outputs) {
        const icon = this.getOutputIcon(output.type);
        console.log(`      ${icon} ${output.description}${output.linesOfCode ? ` (${output.linesOfCode} 行)` : ''}`);
      }
    }
    
    // 学习
    if (result.learnings && result.learnings.length > 0) {
      console.log(`   ${colors.gray}学习:${colors.reset}`);
      for (const learning of result.learnings) {
        console.log(`      💡 ${learning}`);
      }
    }
    
    // 阻塞
    if (result.blockers && result.blockers.length > 0) {
      console.log(`   ${colors.yellow}阻塞:${colors.reset}`);
      for (const blocker of result.blockers) {
        console.log(`      ⚠️ ${blocker}`);
      }
    }
    
    console.log();
  }

  /**
   * 显示每日报告
   */
  showDailyReport(report: DailyReport): void {
    console.log();
    this.printHeader('📊 每日执行报告');
    
    console.log(`${colors.gray}日期: ${report.date}${colors.reset}`);
    console.log(`${colors.gray}执行时间: ${report.startedAt.toLocaleTimeString()} - ${report.completedAt.toLocaleTimeString()}${colors.reset}`);
    console.log();

    // 完成统计
    this.printSection('📈 完成统计');
    const completionRate = (report.tasksCompleted / report.tasksPlanned * 100).toFixed(0);
    console.log(`   计划任务: ${report.tasksPlanned}`);
    console.log(`   完成任务: ${colors.green}${report.tasksCompleted}${colors.reset}`);
    console.log(`   失败任务: ${report.tasksFailed > 0 ? colors.red : colors.gray}${report.tasksFailed}${colors.reset}`);
    console.log(`   跳过任务: ${colors.gray}${report.tasksSkipped}${colors.reset}`);
    console.log(`   完成率: ${this.getCompletionRateBadge(Number(completionRate))}`);
    console.log();

    // 时间统计
    this.printSection('⏱️ 时间统计');
    console.log(`   预估时间: ${report.totalEstimatedMinutes} 分钟`);
    console.log(`   实际时间: ${report.totalActualMinutes} 分钟`);
    const effColor = report.efficiency >= 100 ? colors.green : colors.yellow;
    console.log(`   执行效率: ${effColor}${report.efficiency.toFixed(0)}%${colors.reset}`);
    console.log();

    // 成就
    if (report.achievements.length > 0) {
      this.printSection('🏆 今日成就');
      for (const achievement of report.achievements) {
        console.log(`   🌟 ${achievement}`);
      }
      console.log();
    }

    // 学习
    if (report.learnings.length > 0) {
      this.printSection('💡 学习收获');
      for (const learning of report.learnings) {
        console.log(`   • ${learning}`);
      }
      console.log();
    }

    // 阻塞
    if (report.blockers.length > 0) {
      this.printSection('⚠️ 遇到阻塞');
      for (const blocker of report.blockers) {
        console.log(`   • ${blocker}`);
      }
      console.log();
    }

    // 明日建议
    if (report.nextDayRecommendations.length > 0) {
      this.printSection('📅 明日建议');
      for (const rec of report.nextDayRecommendations) {
        console.log(`   → ${rec}`);
      }
      console.log();
    }

    this.printDivider();
  }

  /**
   * 显示欢迎信息
   */
  showWelcome(): void {
    console.log();
    console.log(`${colors.bold}${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}║${colors.reset}                                                            ${colors.bold}${colors.magenta}║${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}║${colors.reset}   ${colors.bold}${colors.cyan}🤖 Iris 数字分身 - 自主任务系统${colors.reset}                       ${colors.bold}${colors.magenta}║${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}║${colors.reset}                                                            ${colors.bold}${colors.magenta}║${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log();
    console.log(`${colors.gray}   基于五层记忆系统，自动规划和执行每日任务${colors.reset}`);
    console.log();
    this.startTime = new Date();
  }

  /**
   * 显示结束信息
   */
  showGoodbye(report: DailyReport): void {
    console.log();
    this.printDivider('═');
    console.log(`${colors.bold}${colors.green}🎉 今日任务执行完毕！${colors.reset}`);
    console.log();
    console.log(`   完成 ${colors.bold}${report.tasksCompleted}${colors.reset} 个任务，用时 ${colors.bold}${report.totalActualMinutes}${colors.reset} 分钟`);
    
    if (this.startTime) {
      const totalTime = Math.round((new Date().getTime() - this.startTime.getTime()) / 60000);
      console.log(`   总运行时间: ${totalTime} 分钟`);
    }
    
    console.log();
    console.log(`${colors.gray}   记忆系统已更新，明天见！${colors.reset}`);
    this.printDivider('═');
    console.log();
  }

  /**
   * 显示错误
   */
  showError(message: string, error?: Error): void {
    console.log();
    console.log(`${colors.red}${colors.bold}❌ 错误: ${message}${colors.reset}`);
    if (error) {
      console.log(`${colors.gray}   ${error.message}${colors.reset}`);
    }
    console.log();
  }

  /**
   * 显示警告
   */
  showWarning(message: string): void {
    console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
  }

  /**
   * 显示信息
   */
  showInfo(message: string): void {
    console.log(`${colors.cyan}ℹ️ ${message}${colors.reset}`);
  }

  /**
   * 显示成功
   */
  showSuccess(message: string): void {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  }

  /**
   * 记录日志
   */
  log(entry: LogEntry): void {
    this.logs.push(entry);
    
    const timestamp = entry.timestamp.toLocaleTimeString();
    const levelColors: Record<string, string> = {
      info: colors.cyan,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
    };
    
    const color = levelColors[entry.level] || colors.white;
    console.log(`${colors.gray}[${timestamp}]${colors.reset} ${color}${entry.message}${colors.reset}`);
  }

  // ==================== 辅助方法 ====================

  private printHeader(title: string): void {
    console.log();
    console.log(`${colors.bold}${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log();
  }

  private printSection(title: string): void {
    console.log(`${colors.bold}${title}${colors.reset}`);
  }

  private printDivider(char: string = '-'): void {
    console.log(`${colors.gray}${char.repeat(60)}${colors.reset}`);
  }

  private printTask(task: DailyTask): void {
    const icon = this.getTaskTypeIcon(task.type);
    const priority = this.getPriorityBadge(task.priority);
    
    console.log(`   ${task.order}. ${icon} ${task.title}`);
    console.log(`      ${priority} | ${task.estimatedMinutes}分钟 | 复利值: ${task.compoundValue}`);
    
    if (task.sourceGoalName) {
      console.log(`      ${colors.gray}← ${task.sourceGoalName}${colors.reset}`);
    }
  }

  private getTaskTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      coding: '💻',
      work: '📋',
      life: '🌱',
    };
    return icons[type] || '📌';
  }

  private getTaskTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      coding: '编码任务',
      work: '工作任务',
      life: '生活任务',
    };
    return labels[type] || type;
  }

  private getPriorityBadge(priority: string): string {
    const badges: Record<string, string> = {
      high: `${colors.red}[高]${colors.reset}`,
      medium: `${colors.yellow}[中]${colors.reset}`,
      low: `${colors.gray}[低]${colors.reset}`,
    };
    return badges[priority] || priority;
  }

  private getCompletionRateBadge(rate: number): string {
    if (rate >= 90) return `${colors.green}${rate}% 🌟${colors.reset}`;
    if (rate >= 70) return `${colors.green}${rate}%${colors.reset}`;
    if (rate >= 50) return `${colors.yellow}${rate}%${colors.reset}`;
    return `${colors.red}${rate}%${colors.reset}`;
  }

  private getOutputIcon(type: string): string {
    const icons: Record<string, string> = {
      file: '📄',
      code: '💾',
      document: '📝',
      decision: '🎯',
      other: '📦',
    };
    return icons[type] || '📦';
  }

  private createProgressBar(percentage: number, width: number): string {
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    
    const filledBar = `${colors.green}${'█'.repeat(filled)}${colors.reset}`;
    const emptyBar = `${colors.gray}${'░'.repeat(empty)}${colors.reset}`;
    
    return `[${filledBar}${emptyBar}]`;
  }
}

export const visualizer = new Visualizer();
