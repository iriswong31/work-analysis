// 双引擎任务系统类型定义

export interface EngineConfig {
  workRatio: number; // 0-1, 默认 0.6
  lifeRatio: number; // 0-1, 默认 0.4
  autoAdjust: boolean;
}

export interface EngineStatus {
  engine: 'work' | 'life';
  activeTasks: number;
  completedToday: number;
  pendingTasks: number;
  progress: number; // 0-100
  topPriority?: string; // task id
}

export interface DualEngineState {
  config: EngineConfig;
  workEngine: EngineStatus;
  lifeEngine: EngineStatus;
  lastUpdated: Date;
}

// 优先级评估结果
export interface PriorityScore {
  taskId: string;
  totalScore: number;
  breakdown: {
    compoundValue: number; // 复利价值 (权重 40%)
    urgency: number; // 紧急度 (权重 20%)
    goalAlignment: number; // 目标对齐度 (权重 25%)
    resourceMatch: number; // 资源匹配度 (权重 15%)
  };
  reasoning: string;
  recommendedAction: 'do_now' | 'schedule' | 'delegate' | 'defer';
}

// 策略校准记录
export interface StrategyAdjustmentRecord {
  id: string;
  date: Date;
  trigger: 'feedback' | 'completion' | 'manual';
  previousConfig: EngineConfig;
  newConfig: EngineConfig;
  reason: string;
  feedbackId?: string;
}

// 策略调整建议（由反馈分析生成）
export interface StrategyAdjustment {
  priorityWeightChanges: {
    urgency?: number;
    compoundValue?: number;
    goalAlignment?: number;
    resourceMatch?: number;
  };
  engineRatioChange: { work: number; life: number } | null;
  newRules: string[];
  deprecatedRules: string[];
  reasoning: string;
}

// Work 引擎专属 - 善治美项目
export interface WorkProject {
  id: string;
  name: string;
  description: string;
  tapdWorkspaceId?: string;
  status: 'active' | 'paused' | 'completed';
  tasks: string[]; // task ids
  createdAt: Date;
  updatedAt: Date;
}

// Life 引擎专属 - 动画 AI 制片
export interface LifeProject {
  id: string;
  name: string;
  description: string;
  category: 'animation' | 'finance' | 'personal' | 'other';
  collaborators: string[]; // collaborator ids
  agentPipeline?: AnimationAgentPipeline;
  status: 'research' | 'planning' | 'building' | 'active' | 'paused';
  tasks: string[]; // task ids
  createdAt: Date;
  updatedAt: Date;
}

// 动画 AI 制片 Agent 管道
export interface AnimationAgentPipeline {
  id: string;
  name: string;
  description: string;
  agents: AnimationAgent[];
  workflows: AgentWorkflow[];
  status: 'design' | 'building' | 'testing' | 'production';
  createdAt: Date;
  updatedAt: Date;
}

export interface AnimationAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
  automationLevel: 'manual' | 'semi_auto' | 'full_auto';
  status: 'planned' | 'building' | 'active';
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggerCondition: string;
}

export interface WorkflowStep {
  order: number;
  agentId: string;
  action: string;
  inputFrom?: string; // previous step or external
  outputTo?: string; // next step or storage
}
