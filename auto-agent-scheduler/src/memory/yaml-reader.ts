/**
 * YAML 记忆读取器
 * 从本地 YAML 文件读取五层记忆数据
 */

import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { logger } from '../utils/logger.js';

const MEMORY_ROOT = path.resolve(process.cwd(), '..', 'memory-system');

interface L4CoreLayer {
  identity: {
    name: string;
    roles: string[];
    mission_statement: string;
  };
  core_values: Array<{
    value: string;
    description: string;
    priority: number;
  }>;
  decision_principles: Array<{
    principle: string;
    priority: number;
  }>;
  constraints: {
    hard_constraints: string[];
    soft_constraints: string[];
  };
}

interface L3CognitionLayer {
  thinking_patterns: Array<{
    pattern_name: string;
    description: string;
    application_scenarios: string[];
  }>;
  decision_frameworks: Array<{
    framework_name: string;
    description: string;
    steps: string[];
  }>;
  mental_models: Array<{
    model_name: string;
    core_principle: string;
  }>;
}

interface L2BehaviorLayer {
  work_habits: Array<{
    habit: string;
    frequency: string;
    context: string;
  }>;
  communication_style: {
    preferred_format: string;
    response_length: string;
    tone: string;
  };
  tool_preferences: Array<{
    category: string;
    preferred_tool: string;
  }>;
  time_patterns: {
    peak_hours: string[];
    task_duration_preference: string;
  };
}

interface L1ContextLayer {
  recent_dialogues: Array<{
    date: string;
    summary: string;
    key_decisions: string[];
    action_items: string[];
  }>;
  project_states: Array<{
    project_id: string;
    name: string;
    status: string;
    next_action: string;
  }>;
  pending_items: Array<{
    item: string;
    priority: string;
    due_date: string;
  }>;
}

interface IntentGoals {
  long_term_goals: Array<{
    goal: string;
    category: string;
    description: string;
    compound_value: number;
    status: string;
    milestones: Array<{
      milestone: string;
      completed: boolean;
    }>;
  }>;
  current_focus: string[];
}

interface IntentPreferences {
  work_life_ratio: {
    work: number;
    life: number;
  };
  decision_style: {
    summary: string;
  };
  output_formats: {
    preferred: string[];
  };
}

interface IntentConstraints {
  hard_constraints: Array<{ constraint: string }>;
  soft_constraints: Array<{ constraint: string }>;
  time_constraints: {
    available_hours_per_day: number;
    preferred_work_times: string[];
  };
}

export interface YamlMemoryArchitecture {
  L4_core: L4CoreLayer | null;
  L3_cognition: L3CognitionLayer | null;
  L2_behavior: L2BehaviorLayer | null;
  L1_context: L1ContextLayer | null;
  intent_goals: IntentGoals | null;
  intent_preferences: IntentPreferences | null;
  intent_constraints: IntentConstraints | null;
}

export class YamlMemoryReader {
  private memoryRoot: string;

  constructor(memoryRoot?: string) {
    this.memoryRoot = memoryRoot || MEMORY_ROOT;
  }

  private readYamlFile<T>(relativePath: string): T | null {
    const fullPath = path.join(this.memoryRoot, relativePath);
    
    if (!fs.existsSync(fullPath)) {
      logger.warn(`YAML 文件不存在: ${relativePath}`);
      return null;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return YAML.parse(content) as T;
    } catch (error) {
      logger.error(`读取 YAML 文件失败: ${relativePath}`, error);
      return null;
    }
  }

  /**
   * 读取完整的记忆架构
   */
  async readAll(): Promise<YamlMemoryArchitecture> {
    logger.info('从 YAML 文件读取记忆数据...');

    return {
      L4_core: this.readYamlFile<L4CoreLayer>('Memory/L4_核心层.yaml'),
      L3_cognition: this.readYamlFile<L3CognitionLayer>('Memory/L3_认知层.yaml'),
      L2_behavior: this.readYamlFile<L2BehaviorLayer>('Memory/L2_行为层.yaml'),
      L1_context: this.readYamlFile<L1ContextLayer>('Memory/L1_情境层.yaml'),
      intent_goals: this.readYamlFile<IntentGoals>('Intent/目标与规划.yaml'),
      intent_preferences: this.readYamlFile<IntentPreferences>('Intent/偏好与要求.yaml'),
      intent_constraints: this.readYamlFile<IntentConstraints>('Intent/约束与边界.yaml'),
    };
  }

  /**
   * 读取核心身份信息
   */
  async readCoreIdentity(): Promise<L4CoreLayer | null> {
    return this.readYamlFile<L4CoreLayer>('Memory/L4_核心层.yaml');
  }

  /**
   * 读取长期目标
   */
  async readLongTermGoals(): Promise<IntentGoals | null> {
    return this.readYamlFile<IntentGoals>('Intent/目标与规划.yaml');
  }

  /**
   * 读取当前项目状态
   */
  async readProjectStates(): Promise<L1ContextLayer['project_states'] | null> {
    const context = this.readYamlFile<L1ContextLayer>('Memory/L1_情境层.yaml');
    return context?.project_states || null;
  }

  /**
   * 读取工作习惯
   */
  async readWorkHabits(): Promise<L2BehaviorLayer['work_habits'] | null> {
    const behavior = this.readYamlFile<L2BehaviorLayer>('Memory/L2_行为层.yaml');
    return behavior?.work_habits || null;
  }

  /**
   * 读取决策框架
   */
  async readDecisionFrameworks(): Promise<L3CognitionLayer['decision_frameworks'] | null> {
    const cognition = this.readYamlFile<L3CognitionLayer>('Memory/L3_认知层.yaml');
    return cognition?.decision_frameworks || null;
  }

  /**
   * 读取约束条件
   */
  async readConstraints(): Promise<IntentConstraints | null> {
    return this.readYamlFile<IntentConstraints>('Intent/约束与边界.yaml');
  }

  /**
   * 生成 AI 上下文提示词
   * 将记忆数据转换为可供 AI 使用的上下文
   */
  async generateContextPrompt(): Promise<string> {
    const memory = await this.readAll();
    
    const sections: string[] = [];

    // 核心身份
    if (memory.L4_core) {
      sections.push(`## 核心身份
- 名称: ${memory.L4_core.identity.name}
- 角色: ${memory.L4_core.identity.roles.join(', ')}
- 使命: ${memory.L4_core.identity.mission_statement}

### 核心价值观
${memory.L4_core.core_values.map(v => `- ${v.value}`).join('\n')}

### 决策原则
${memory.L4_core.decision_principles.map(p => `${p.priority}. ${p.principle}`).join('\n')}`);
    }

    // 长期目标
    if (memory.intent_goals) {
      const activeGoals = memory.intent_goals.long_term_goals.filter(g => g.status === 'active');
      sections.push(`## 当前目标
### 聚焦领域
${memory.intent_goals.current_focus.map(f => `- ${f}`).join('\n')}

### 活跃目标
${activeGoals.map(g => `- [${g.category}] ${g.goal} (复利价值: ${g.compound_value})`).join('\n')}`);
    }

    // 工作偏好
    if (memory.intent_preferences) {
      sections.push(`## 工作偏好
- 工作/生活比例: ${memory.intent_preferences.work_life_ratio.work * 100}% / ${memory.intent_preferences.work_life_ratio.life * 100}%
- 决策风格: ${memory.intent_preferences.decision_style.summary}
- 产出格式: ${memory.intent_preferences.output_formats.preferred.join(', ')}`);
    }

    // 约束条件
    if (memory.intent_constraints) {
      sections.push(`## 约束条件
### 硬约束
${memory.intent_constraints.hard_constraints.map(c => `- ${c.constraint}`).join('\n')}

### 时间约束
- 每日可用时间: ${memory.intent_constraints.time_constraints.available_hours_per_day} 小时
- 高效时段: ${memory.intent_constraints.time_constraints.preferred_work_times.join(', ')}`);
    }

    // 工作习惯
    if (memory.L2_behavior) {
      sections.push(`## 工作习惯
${memory.L2_behavior.work_habits.slice(0, 5).map(h => `- ${h.habit}`).join('\n')}`);
    }

    // 项目状态
    if (memory.L1_context?.project_states) {
      const activeProjects = memory.L1_context.project_states.filter(p => p.status === 'active');
      sections.push(`## 当前项目
${activeProjects.map(p => `- ${p.name}: ${p.next_action}`).join('\n')}`);
    }

    return sections.join('\n\n');
  }
}

// 导出单例
export const yamlMemoryReader = new YamlMemoryReader();
