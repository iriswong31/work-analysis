/**
 * YAML 记忆写入器
 * 更新本地 YAML 文件中的记忆数据
 */

import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

const MEMORY_ROOT = path.resolve(process.cwd(), '..', 'memory-system');

interface DialogueSummary {
  date: string;
  summary: string;
  key_decisions: string[];
  action_items: string[];
}

interface BehaviorObservation {
  habit: string;
  context: string;
  example: string;
}

interface InsightEntry {
  insight: string;
  source_layer: string;
  target_layer: string;
  observed_at: string;
  observation_count: number;
  status: 'pending' | 'confirmed' | 'rejected';
}

export class YamlMemoryWriter {
  private memoryRoot: string;
  private autoCommit: boolean;

  constructor(memoryRoot?: string, autoCommit = true) {
    this.memoryRoot = memoryRoot || MEMORY_ROOT;
    this.autoCommit = autoCommit;
  }

  private readYamlFile(relativePath: string): Record<string, unknown> {
    const fullPath = path.join(this.memoryRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return {};
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return YAML.parse(content) || {};
  }

  private writeYamlFile(relativePath: string, data: Record<string, unknown>): void {
    const fullPath = path.join(this.memoryRoot, relativePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 更新时间戳
    data.last_updated = new Date().toISOString();

    const content = YAML.stringify(data, { indent: 2 });
    fs.writeFileSync(fullPath, content, 'utf-8');
    
    logger.info(`已更新: ${relativePath}`);
  }

  private gitCommit(message: string): void {
    if (!this.autoCommit) return;

    try {
      const projectRoot = path.resolve(this.memoryRoot, '..');
      execSync('git add memory-system/', { cwd: projectRoot, encoding: 'utf-8' });
      execSync(`git commit -m "${message}"`, { cwd: projectRoot, encoding: 'utf-8' });
      logger.info(`Git 提交: ${message}`);
    } catch (error) {
      // 可能没有变更需要提交
      logger.debug('Git 提交跳过（无变更或未配置）');
    }
  }

  /**
   * 添加对话摘要到 L1 情境层
   */
  async addDialogueSummary(summary: DialogueSummary): Promise<void> {
    const filePath = 'Memory/L1_情境层.yaml';
    const data = this.readYamlFile(filePath);

    if (!data.recent_dialogues) {
      data.recent_dialogues = [];
    }

    (data.recent_dialogues as DialogueSummary[]).unshift(summary);

    // 保留最近 30 天的对话
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    data.recent_dialogues = (data.recent_dialogues as DialogueSummary[]).filter(d => {
      const date = new Date(d.date);
      return date >= thirtyDaysAgo;
    });

    this.writeYamlFile(filePath, data);
    this.gitCommit(`[memory] 更新: L1_情境层 - 添加对话摘要 ${summary.date}`);
  }

  /**
   * 更新项目状态
   */
  async updateProjectStatus(
    projectId: string,
    status: string,
    nextAction: string
  ): Promise<void> {
    const filePath = 'Memory/L1_情境层.yaml';
    const data = this.readYamlFile(filePath);

    const projects = (data.project_states as Array<Record<string, unknown>>) || [];
    const project = projects.find(p => p.project_id === projectId);

    if (project) {
      project.status = status;
      project.next_action = nextAction;
      project.last_activity = new Date().toISOString().split('T')[0];
      
      this.writeYamlFile(filePath, data);
      this.gitCommit(`[memory] 更新: L1_情境层 - 项目 ${projectId} 状态更新`);
    } else {
      logger.warn(`项目不存在: ${projectId}`);
    }
  }

  /**
   * 添加行为观察到 L2 行为层
   */
  async addBehaviorObservation(observation: BehaviorObservation): Promise<void> {
    const filePath = 'Memory/L2_行为层.yaml';
    const data = this.readYamlFile(filePath);

    if (!data.work_habits) {
      data.work_habits = [];
    }

    const habits = data.work_habits as Array<Record<string, unknown>>;
    const existing = habits.find(h => h.habit === observation.habit);

    if (existing) {
      // 增加观察次数
      existing.observed_count = ((existing.observed_count as number) || 0) + 1;
      if (!existing.examples) existing.examples = [];
      (existing.examples as string[]).push(observation.example);
      
      logger.info(`更新习惯观察: ${observation.habit} (${existing.observed_count} 次)`);
      
      // 检查是否达到沉淀条件（3次以上）
      if ((existing.observed_count as number) >= 3 && existing.frequency !== 'always') {
        existing.frequency = 'often';
        await this.addInsight({
          insight: `行为模式 "${observation.habit}" 已观察到 ${existing.observed_count} 次，可能是稳定习惯`,
          source_layer: 'L2',
          target_layer: 'L3',
        });
      }
    } else {
      // 添加新习惯
      habits.push({
        habit: observation.habit,
        frequency: 'sometimes',
        context: observation.context,
        observed_count: 1,
        first_observed: new Date().toISOString().split('T')[0],
        examples: [observation.example],
      });
      logger.info(`添加新习惯观察: ${observation.habit}`);
    }

    this.writeYamlFile(filePath, data);
    this.gitCommit(`[memory] 更新: L2_行为层 - 行为观察`);
  }

  /**
   * 添加洞察到队列
   */
  async addInsight(insight: Omit<InsightEntry, 'observed_at' | 'observation_count' | 'status'>): Promise<void> {
    const filePath = 'Meta/洞察队列.yaml';
    const data = this.readYamlFile(filePath);

    if (!data.pending_insights) {
      data.pending_insights = [];
    }

    const insights = data.pending_insights as InsightEntry[];
    const existing = insights.find(i => i.insight === insight.insight);

    if (existing) {
      existing.observation_count++;
      existing.observed_at = new Date().toISOString();
    } else {
      insights.push({
        ...insight,
        observed_at: new Date().toISOString(),
        observation_count: 1,
        status: 'pending',
      });
    }

    this.writeYamlFile(filePath, data);
    logger.info(`添加洞察: ${insight.insight}`);
  }

  /**
   * 更新 L0 状态层（当前工作状态）
   */
  async updateCurrentState(state: {
    focus_task?: string;
    active_files?: string[];
    energy_level?: 'high' | 'medium' | 'low';
    mood?: string;
    temp_notes?: string[];
  }): Promise<void> {
    const filePath = 'Memory/L0_状态层.yaml';
    const data = this.readYamlFile(filePath);

    if (state.focus_task !== undefined) {
      if (!data.current_session) data.current_session = {};
      (data.current_session as Record<string, unknown>).focus_task = state.focus_task;
    }

    if (state.active_files !== undefined) {
      if (!data.current_session) data.current_session = {};
      (data.current_session as Record<string, unknown>).active_files = state.active_files;
    }

    if (state.energy_level !== undefined || state.mood !== undefined) {
      if (!data.energy_state) data.energy_state = {};
      if (state.energy_level) (data.energy_state as Record<string, unknown>).level = state.energy_level;
      if (state.mood) (data.energy_state as Record<string, unknown>).mood = state.mood;
    }

    if (state.temp_notes !== undefined) {
      if (!data.current_session) data.current_session = {};
      (data.current_session as Record<string, unknown>).temp_notes = state.temp_notes;
    }

    this.writeYamlFile(filePath, data);
    // L0 不需要 git commit，因为是临时状态
  }

  /**
   * 记录每日执行结果
   */
  async recordDailyExecution(result: {
    date: string;
    tasks_completed: number;
    tasks_total: number;
    key_outputs: string[];
    learnings: string[];
  }): Promise<void> {
    // 添加到对话摘要
    await this.addDialogueSummary({
      date: result.date,
      summary: `完成 ${result.tasks_completed}/${result.tasks_total} 个任务`,
      key_decisions: result.key_outputs,
      action_items: [],
    });

    // 如果有学习收获，添加到洞察队列
    for (const learning of result.learnings) {
      await this.addInsight({
        insight: learning,
        source_layer: 'L1',
        target_layer: 'L2',
      });
    }
  }

  /**
   * 更新目标里程碑状态
   */
  async updateMilestoneStatus(
    goalName: string,
    milestoneName: string,
    completed: boolean
  ): Promise<void> {
    const filePath = 'Intent/目标与规划.yaml';
    const data = this.readYamlFile(filePath);

    const goals = (data.long_term_goals as Array<Record<string, unknown>>) || [];
    const goal = goals.find(g => g.goal === goalName);

    if (goal && goal.milestones) {
      const milestones = goal.milestones as Array<Record<string, unknown>>;
      const milestone = milestones.find(m => m.milestone === milestoneName);
      
      if (milestone) {
        milestone.completed = completed;
        this.writeYamlFile(filePath, data);
        this.gitCommit(`[memory] 更新: Intent - 里程碑 "${milestoneName}" ${completed ? '完成' : '重置'}`);
      }
    }
  }
}

// 导出单例
export const yamlMemoryWriter = new YamlMemoryWriter();
