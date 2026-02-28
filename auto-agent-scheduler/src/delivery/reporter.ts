import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getIrisMePath, config } from '../utils/config.js';
import { codeValidator } from '../executor/validator.js';
import type { DailyExecutionReport, ExecutionResult } from '../types/index.js';
import Database from 'better-sqlite3';

/**
 * 交付报告生成器
 */
export class DeliveryReporter {
  private db: Database.Database | null = null;

  /**
   * 初始化数据库
   */
  private initDatabase(): void {
    if (this.db) return;

    const dbPath = path.join(getIrisMePath(), 'auto-agent-scheduler/data/scheduler.db');
    this.db = new Database(dbPath);

    // 创建报告表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        tasks_planned INTEGER NOT NULL,
        tasks_completed INTEGER NOT NULL,
        tasks_failed INTEGER NOT NULL,
        total_duration INTEGER NOT NULL,
        total_lines_of_code INTEGER NOT NULL,
        summary TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // 创建执行记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS execution_records (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        task_title TEXT NOT NULL,
        success INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        lines_of_code INTEGER NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        error TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES daily_reports(id)
      )
    `);
  }

  /**
   * 保存执行报告
   */
  async saveReport(report: DailyExecutionReport): Promise<void> {
    try {
      this.initDatabase();

      // 保存到数据库
      this.db!.prepare(`
        INSERT INTO daily_reports (
          id, date, tasks_planned, tasks_completed, tasks_failed,
          total_duration, total_lines_of_code, summary, recommendations, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        report.id,
        report.date.toISOString().split('T')[0],
        report.tasksPlanned,
        report.tasksCompleted,
        report.tasksFailed,
        report.totalDuration,
        report.totalLinesOfCode,
        report.summary,
        JSON.stringify(report.nextDayRecommendations),
        new Date().toISOString()
      );

      // 保存执行记录
      const insertRecord = this.db!.prepare(`
        INSERT INTO execution_records (
          id, report_id, task_id, task_title, success, duration,
          lines_of_code, tokens_used, error, started_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const result of report.results) {
        const linesOfCode = result.outputs.reduce((sum, o) => sum + o.linesOfCode, 0);
        insertRecord.run(
          `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          report.id,
          result.taskId,
          result.logs[0]?.replace('Starting task: ', '') || 'Unknown',
          result.success ? 1 : 0,
          result.duration,
          linesOfCode,
          result.aiTokensUsed || 0,
          result.error || null,
          result.startedAt.toISOString(),
          result.completedAt.toISOString()
        );
      }

      // 生成 Markdown 报告文件
      await this.generateMarkdownReport(report);

      logger.info(`Report saved: ${report.id}`);

    } catch (error) {
      logger.error('Failed to save report:', error);
      throw error;
    }
  }

  /**
   * 生成 Markdown 报告
   */
  private async generateMarkdownReport(report: DailyExecutionReport): Promise<void> {
    const dateStr = report.date.toISOString().split('T')[0];
    const reportDir = path.join(
      getIrisMePath(),
      config.delivery.outputDir,
      dateStr
    );

    await fs.mkdir(reportDir, { recursive: true });

    const content = this.formatMarkdownReport(report);
    const reportPath = path.join(reportDir, `daily_report_${dateStr}.md`);

    await fs.writeFile(reportPath, content, 'utf-8');
    logger.info(`Markdown report saved: ${reportPath}`);
  }

  /**
   * 格式化 Markdown 报告
   */
  private formatMarkdownReport(report: DailyExecutionReport): string {
    const dateStr = report.date.toISOString().split('T')[0];
    const successRate = report.tasksPlanned > 0 
      ? (report.tasksCompleted / report.tasksPlanned * 100).toFixed(1) 
      : '0';

    const lines: string[] = [
      `# 🤖 Iris 数字分身执行报告`,
      ``,
      `**日期**: ${dateStr}`,
      `**生成时间**: ${new Date().toLocaleString('zh-CN')}`,
      ``,
      `---`,
      ``,
      `## 📊 执行摘要`,
      ``,
      `| 指标 | 数值 |`,
      `|------|------|`,
      `| 计划任务 | ${report.tasksPlanned} |`,
      `| 完成任务 | ${report.tasksCompleted} |`,
      `| 失败任务 | ${report.tasksFailed} |`,
      `| 成功率 | ${successRate}% |`,
      `| 总耗时 | ${this.formatDuration(report.totalDuration)} |`,
      `| 代码行数 | ${report.totalLinesOfCode} |`,
      ``,
      `**总结**: ${report.summary}`,
      ``,
    ];

    // 任务详情
    if (report.results.length > 0) {
      lines.push(`## 📝 任务详情`);
      lines.push(``);

      for (const result of report.results) {
        const status = result.success ? '✅' : '❌';
        const taskTitle = result.logs[0]?.replace('Starting task: ', '') || 'Unknown';
        const linesOfCode = result.outputs.reduce((sum, o) => sum + o.linesOfCode, 0);

        lines.push(`### ${status} ${taskTitle}`);
        lines.push(``);
        lines.push(`- **状态**: ${result.success ? '成功' : '失败'}`);
        lines.push(`- **耗时**: ${this.formatDuration(result.duration)}`);
        lines.push(`- **代码行数**: ${linesOfCode}`);
        
        if (result.aiTokensUsed) {
          lines.push(`- **Token 消耗**: ${result.aiTokensUsed}`);
        }

        if (result.error) {
          lines.push(`- **错误**: ${result.error}`);
        }

        // 输出文件列表
        if (result.outputs.length > 0) {
          lines.push(``);
          lines.push(`**生成文件**:`);
          for (const output of result.outputs) {
            lines.push(`- \`${output.filePath}\` (${output.linesOfCode} 行 ${output.language})`);
          }
        }

        // 验证结果
        const validation = codeValidator.validate(result);
        if (validation.issues.length > 0 || validation.suggestions.length > 0) {
          lines.push(``);
          lines.push(`**代码质量**: ${validation.score}/100`);
          
          if (validation.issues.length > 0) {
            for (const issue of validation.issues.slice(0, 3)) {
              const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
              lines.push(`  - ${icon} ${issue.message}`);
            }
          }
        }

        lines.push(``);
      }
    }

    // 明日建议
    if (report.nextDayRecommendations.length > 0) {
      lines.push(`## 💡 明日建议`);
      lines.push(``);
      for (const rec of report.nextDayRecommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push(``);
    }

    // 页脚
    lines.push(`---`);
    lines.push(``);
    lines.push(`*此报告由 Iris 数字分身自动生成*`);

    return lines.join('\n');
  }

  /**
   * 格式化时长
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  /**
   * 获取历史报告
   */
  async getReports(limit: number = 30): Promise<DailyExecutionReport[]> {
    try {
      this.initDatabase();

      const rows = this.db!.prepare(`
        SELECT * FROM daily_reports 
        ORDER BY date DESC 
        LIMIT ?
      `).all(limit) as Array<{
        id: string;
        date: string;
        tasks_planned: number;
        tasks_completed: number;
        tasks_failed: number;
        total_duration: number;
        total_lines_of_code: number;
        summary: string;
        recommendations: string;
      }>;

      return rows.map(row => ({
        id: row.id,
        date: new Date(row.date),
        tasksPlanned: row.tasks_planned,
        tasksCompleted: row.tasks_completed,
        tasksFailed: row.tasks_failed,
        totalDuration: row.total_duration,
        totalLinesOfCode: row.total_lines_of_code,
        results: [],
        summary: row.summary,
        nextDayRecommendations: JSON.parse(row.recommendations),
      }));

    } catch (error) {
      logger.error('Failed to get reports:', error);
      return [];
    }
  }

  /**
   * 获取统计数据
   */
  async getStatistics(days: number = 7): Promise<{
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalLinesOfCode: number;
    avgSuccessRate: number;
    avgDuration: number;
  }> {
    try {
      this.initDatabase();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const row = this.db!.prepare(`
        SELECT 
          SUM(tasks_planned) as total_tasks,
          SUM(tasks_completed) as completed_tasks,
          SUM(tasks_failed) as failed_tasks,
          SUM(total_lines_of_code) as total_lines,
          AVG(CAST(tasks_completed AS FLOAT) / NULLIF(tasks_planned, 0) * 100) as avg_success_rate,
          AVG(total_duration) as avg_duration
        FROM daily_reports
        WHERE date >= ?
      `).get(startDate.toISOString().split('T')[0]) as {
        total_tasks: number | null;
        completed_tasks: number | null;
        failed_tasks: number | null;
        total_lines: number | null;
        avg_success_rate: number | null;
        avg_duration: number | null;
      };

      return {
        totalTasks: row.total_tasks || 0,
        completedTasks: row.completed_tasks || 0,
        failedTasks: row.failed_tasks || 0,
        totalLinesOfCode: row.total_lines || 0,
        avgSuccessRate: row.avg_success_rate || 0,
        avgDuration: row.avg_duration || 0,
      };

    } catch (error) {
      logger.error('Failed to get statistics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        totalLinesOfCode: 0,
        avgSuccessRate: 0,
        avgDuration: 0,
      };
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const deliveryReporter = new DeliveryReporter();
