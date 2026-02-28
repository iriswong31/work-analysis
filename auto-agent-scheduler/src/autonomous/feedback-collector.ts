/**
 * 反馈收集器
 * 收集执行结果，更新记忆系统，实现复利迭代
 */

import { yamlMemoryWriter } from '../memory/yaml-writer.js';
import { logger } from '../utils/logger.js';
import type {
  DailyReport,
  ExecutionResult,
  LearningRecord,
  TaskType,
} from './types.js';

/**
 * 反馈收集器类
 */
class FeedbackCollector {
  /**
   * 收集反馈并更新记忆系统
   */
  async collectAndUpdate(report: DailyReport): Promise<void> {
    logger.info('📝 收集反馈并更新记忆系统...');

    try {
      // 1. 更新 L0 当前状态
      await this.updateCurrentState(report);

      // 2. 添加对话摘要到 L1
      await this.addDialogueSummary(report);

      // 3. 记录每日执行结果
      await this.recordDailyExecution(report);

      // 4. 分析行为模式
      await this.analyzeBehaviorPatterns(report);

      // 5. 添加洞察到队列
      await this.addInsights(report);

      logger.info('✅ 记忆系统更新完成');
    } catch (error) {
      logger.error('记忆系统更新失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 更新 L0 当前状态
   */
  private async updateCurrentState(report: DailyReport): Promise<void> {
    const completionRate = report.tasksCompleted / report.tasksPlanned;
    
    let energyLevel: 'high' | 'medium' | 'low';
    let mood: string;

    if (completionRate >= 0.8) {
      energyLevel = 'high';
      mood = '高效满足';
    } else if (completionRate >= 0.5) {
      energyLevel = 'medium';
      mood = '稳步推进';
    } else {
      energyLevel = 'low';
      mood = '需要调整';
    }

    await yamlMemoryWriter.updateCurrentState({
      focus_task: undefined, // 今日任务已完成
      energy_level: energyLevel,
      mood,
      temp_notes: [
        `今日完成 ${report.tasksCompleted}/${report.tasksPlanned} 任务`,
        `效率: ${report.efficiency.toFixed(0)}%`,
        ...report.achievements.slice(0, 2),
      ],
    });
  }

  /**
   * 添加对话摘要到 L1
   */
  private async addDialogueSummary(report: DailyReport): Promise<void> {
    // 生成今日摘要
    const summary = this.generateDailySummary(report);

    // 提取关键决策
    const keyDecisions = report.results
      .filter(r => r.success)
      .flatMap(r => r.outputs)
      .filter(o => o.type === 'decision')
      .map(o => o.description)
      .slice(0, 5);

    // 提取行动项
    const actionItems = [
      ...report.nextDayRecommendations,
      ...report.blockers.map(b => `解决: ${b}`),
    ].slice(0, 5);

    await yamlMemoryWriter.addDialogueSummary({
      date: report.date,
      summary,
      key_decisions: keyDecisions.length > 0 ? keyDecisions : ['无重大决策'],
      action_items: actionItems.length > 0 ? actionItems : ['继续按计划执行'],
    });
  }

  /**
   * 记录每日执行结果
   */
  private async recordDailyExecution(report: DailyReport): Promise<void> {
    // 提取关键产出
    const keyOutputs = report.results
      .filter(r => r.success)
      .flatMap(r => r.outputs)
      .map(o => {
        if (o.path) {
          return `${o.path}${o.linesOfCode ? ` (${o.linesOfCode} 行)` : ''}`;
        }
        return o.description;
      })
      .slice(0, 10);

    await yamlMemoryWriter.recordDailyExecution({
      date: report.date,
      tasks_completed: report.tasksCompleted,
      tasks_total: report.tasksPlanned,
      key_outputs: keyOutputs,
      learnings: report.learnings,
    });
  }

  /**
   * 分析行为模式
   */
  private async analyzeBehaviorPatterns(report: DailyReport): Promise<void> {
    // 分析任务类型偏好
    const typeStats = this.calculateTypeStats(report.results);

    // 如果发现明显模式，添加行为观察
    if (typeStats.dominant) {
      await yamlMemoryWriter.addBehaviorObservation({
        habit: `偏好 ${this.getTaskTypeLabel(typeStats.dominant)} 类型任务`,
        context: '每日任务执行',
        example: `${report.date}: ${typeStats.dominant} 任务完成率最高`,
      });
    }

    // 如果效率波动大，记录
    if (report.efficiency < 70 || report.efficiency > 130) {
      await yamlMemoryWriter.addBehaviorObservation({
        habit: report.efficiency > 100 ? '任务预估偏保守' : '任务预估偏乐观',
        context: '时间估算',
        example: `${report.date}: 实际效率 ${report.efficiency.toFixed(0)}%`,
      });
    }
  }

  /**
   * 添加洞察到队列
   */
  private async addInsights(report: DailyReport): Promise<void> {
    // 从成就中提取洞察
    if (report.tasksCompleted === report.tasksPlanned && report.tasksPlanned > 0) {
      await yamlMemoryWriter.addInsight({
        insight: '全部完成计划任务，当前任务量设置合理',
        source_layer: 'L1_情境层',
        target_layer: 'L2_行为层',
      });
    }

    // 从失败中提取洞察
    if (report.tasksFailed > 0) {
      await yamlMemoryWriter.addInsight({
        insight: `${report.tasksFailed} 个任务失败，需要分析原因并调整策略`,
        source_layer: 'L1_情境层',
        target_layer: 'L3_认知层',
      });
    }

    // 从效率中提取洞察
    if (report.efficiency > 120) {
      await yamlMemoryWriter.addInsight({
        insight: '任务预估时间偏长，可以适当增加任务量',
        source_layer: 'L1_情境层',
        target_layer: 'L2_行为层',
      });
    } else if (report.efficiency < 80) {
      await yamlMemoryWriter.addInsight({
        insight: '任务预估时间偏短，需要更保守的估算',
        source_layer: 'L1_情境层',
        target_layer: 'L2_行为层',
      });
    }
  }

  /**
   * 生成学习记录
   */
  async generateLearningRecord(report: DailyReport): Promise<LearningRecord> {
    const typeStats = this.calculateTypeStats(report.results);

    return {
      date: report.date,
      patterns: {
        averageTaskDuration: this.calculateAverageTaskDuration(report.results),
        completionRateByType: typeStats.completionRates,
      },
      optimizations: this.generateOptimizations(report),
      applied: false,
    };
  }

  // ==================== 辅助方法 ====================

  private generateDailySummary(report: DailyReport): string {
    const parts: string[] = [];

    // 完成情况
    parts.push(`完成 ${report.tasksCompleted}/${report.tasksPlanned} 个任务`);

    // 效率
    if (report.efficiency >= 100) {
      parts.push(`效率 ${report.efficiency.toFixed(0)}%（提前完成）`);
    } else {
      parts.push(`效率 ${report.efficiency.toFixed(0)}%`);
    }

    // 主要成就
    if (report.achievements.length > 0) {
      parts.push(report.achievements[0]);
    }

    // 主要阻塞
    if (report.blockers.length > 0) {
      parts.push(`遇到阻塞: ${report.blockers[0]}`);
    }

    return parts.join('。');
  }

  private calculateTypeStats(results: ExecutionResult[]): {
    dominant: TaskType | null;
    completionRates: Record<TaskType, number>;
  } {
    // 简化处理，返回默认值
    return {
      dominant: null,
      completionRates: {
        coding: 1,
        work: 1,
        life: 1,
      },
    };
  }

  private calculateAverageTaskDuration(results: ExecutionResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.actualMinutes, 0) / results.length;
  }

  private generateOptimizations(report: DailyReport): string[] {
    const optimizations: string[] = [];

    if (report.efficiency < 80) {
      optimizations.push('增加任务预估时间缓冲');
    }

    if (report.tasksFailed > report.tasksCompleted) {
      optimizations.push('降低任务复杂度或增加准备时间');
    }

    if (report.tasksCompleted === report.tasksPlanned && report.efficiency > 120) {
      optimizations.push('可以适当增加每日任务数量');
    }

    return optimizations;
  }

  private getTaskTypeLabel(type: TaskType): string {
    const labels: Record<TaskType, string> = {
      coding: '编码',
      work: '工作',
      life: '生活',
    };
    return labels[type] || type;
  }
}

export const feedbackCollector = new FeedbackCollector();
