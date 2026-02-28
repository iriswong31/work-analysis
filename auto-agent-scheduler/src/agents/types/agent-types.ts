/**
 * 三 Agent 协作系统 - 核心类型定义
 * Planner-Executor-Reviewer 架构
 */

// ==================== 基础类型 ====================

/** Agent 角色类型 */
export type AgentRole = 'planner' | 'executor' | 'reviewer';

/** Agent 状态 */
export type AgentStatus = 'idle' | 'processing' | 'waiting' | 'error';

/** 任务状态 */
export type TaskState = 
  | 'planned'      // 已规划
  | 'executing'    // 执行中
  | 'reviewing'    // 审查中
  | 'completed'    // 已完成
  | 'failed'       // 失败
  | 'fix_required'; // 需要修复

/** 验证严重级别 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** 产出类型 */
export type OutputType = 'code' | 'document' | 'data' | 'report' | 'page';

// ==================== Agent 接口 ====================

/** Agent 输入 */
export interface AgentInput {
  type: 'plan_request' | 'execute_request' | 'review_request' | 'fix_request';
  payload: unknown;
  context?: AgentContext;
  metadata?: Record<string, unknown>;
}

/** Agent 输出 */
export interface AgentOutput {
  success: boolean;
  type: 'plan' | 'execution_result' | 'validation_result' | 'fix_task';
  data: unknown;
  nextAction?: NextAction;
  error?: string;
}

/** Agent 上下文 */
export interface AgentContext {
  sessionId: string;
  timestamp: Date;
  previousResults?: AgentOutput[];
  sharedState?: Record<string, unknown>;
}

/** 下一步动作 */
export interface NextAction {
  targetAgent: AgentRole;
  actionType: string;
  payload: unknown;
}

/** Agent 基础接口 */
export interface IAgent {
  name: string;
  role: AgentRole;
  
  /** 处理输入并返回输出 */
  process(input: AgentInput): Promise<AgentOutput>;
  
  /** 获取当前状态 */
  getStatus(): AgentStatus;
  
  /** 重置 Agent 状态 */
  reset(): void;
}

// ==================== Planner 相关类型 ====================

/** 计划请求 */
export interface PlanRequest {
  title: string;
  description: string;
  requirements: string[];
  constraints?: string[];
  deadline?: Date;
}

/** 执行计划 */
export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  
  /** 任务列表 */
  tasks: PlannedTask[];
  
  /** 验收标准 */
  acceptanceCriteria: AcceptanceCriterion[];
  
  /** 预期产出 */
  expectedOutputs: ExpectedOutput[];
  
  /** 估算总时间（分钟） */
  estimatedMinutes: number;
  
  /** 计划状态 */
  state: TaskState;
}

/** 已规划的任务 */
export interface PlannedTask {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  dependencies?: string[];
  
  /** 预期产出 */
  expectedOutputs: string[];
  
  /** 验收标准引用 */
  acceptanceCriteriaIds: string[];
  
  /** 任务状态 */
  state: TaskState;
}

/** 验收标准 */
export interface AcceptanceCriterion {
  id: string;
  description: string;
  type: 'existence' | 'content' | 'quality' | 'consistency';
  
  /** 验证规则 */
  validationRule: ValidationRule;
  
  /** 是否必须 */
  required: boolean;
}

/** 验证规则 */
export interface ValidationRule {
  /** 规则类型 */
  type: 'file_exists' | 'content_contains' | 'link_valid' | 'code_quality' | 'custom';
  
  /** 规则参数 */
  params: Record<string, unknown>;
  
  /** 错误消息 */
  errorMessage: string;
}

/** 预期产出 */
export interface ExpectedOutput {
  id: string;
  type: OutputType;
  name: string;
  description: string;
  
  /** 产出路径（如果是文件） */
  path?: string;
  
  /** 产出链接（如果是页面） */
  link?: string;
  
  /** 关联的验收标准 */
  acceptanceCriteriaIds: string[];
}

// ==================== Executor 相关类型 ====================

/** 执行请求 */
export interface ExecuteRequest {
  plan: ExecutionPlan;
  taskId?: string; // 如果指定，只执行特定任务
}

/** 执行结果 */
export interface ExecutionResult {
  planId: string;
  taskId: string;
  success: boolean;
  
  /** 实际产出 */
  actualOutputs: ActualOutput[];
  
  /** 执行日志 */
  logs: ExecutionLog[];
  
  /** 执行时间 */
  startedAt: Date;
  completedAt: Date;
  actualMinutes: number;
  
  /** 错误信息 */
  error?: string;
}

/** 实际产出 */
export interface ActualOutput {
  expectedOutputId: string;
  type: OutputType;
  name: string;
  
  /** 实际路径 */
  path?: string;
  
  /** 实际链接 */
  link?: string;
  
  /** 内容摘要 */
  contentSummary?: string;
  
  /** 是否已创建 */
  created: boolean;
}

/** 执行日志 */
export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: unknown;
}

// ==================== Reviewer 相关类型 ====================

/** 审查请求 */
export interface ReviewRequest {
  plan: ExecutionPlan;
  executionResults: ExecutionResult[];
}

/** 验证结果 */
export interface ValidationResult {
  planId: string;
  passed: boolean;
  score: number; // 0-100
  
  /** 验证详情 */
  validations: ValidationDetail[];
  
  /** 问题列表 */
  issues: ValidationIssue[];
  
  /** 修复任务（如果验证失败） */
  fixTasks?: FixTask[];
  
  /** 验证时间 */
  validatedAt: Date;
}

/** 验证详情 */
export interface ValidationDetail {
  criterionId: string;
  passed: boolean;
  message: string;
  evidence?: string;
}

/** 验证问题 */
export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  type: 'missing_output' | 'invalid_link' | 'content_mismatch' | 'quality_issue' | 'consistency_error';
  message: string;
  
  /** 关联的产出 */
  outputId?: string;
  
  /** 关联的验收标准 */
  criterionId?: string;
  
  /** 建议的修复方式 */
  suggestedFix?: string;
}

/** 修复任务 */
export interface FixTask {
  id: string;
  issueId: string;
  type: 'create_output' | 'update_output' | 'remove_record' | 'fix_link';
  description: string;
  
  /** 修复参数 */
  params: Record<string, unknown>;
  
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
}

// ==================== Coordinator 相关类型 ====================

/** 协调器状态 */
export interface CoordinatorState {
  sessionId: string;
  currentPhase: 'planning' | 'executing' | 'reviewing' | 'fixing' | 'completed';
  currentPlan?: ExecutionPlan;
  executionResults: ExecutionResult[];
  validationResults: ValidationResult[];
  retryCount: number;
  maxRetries: number;
}

/** 状态转换事件 */
export interface StateTransitionEvent {
  from: TaskState;
  to: TaskState;
  reason: string;
  timestamp: Date;
  agentRole: AgentRole;
}

/** 消息 */
export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole;
  type: 'request' | 'response' | 'notification';
  payload: unknown;
  timestamp: Date;
}

// ==================== 配置类型 ====================

/** Agent 系统配置 */
export interface AgentSystemConfig {
  /** 最大重试次数 */
  maxRetries: number;
  
  /** 验证通过的最低分数 */
  minPassScore: number;
  
  /** 是否启用自动修复 */
  autoFix: boolean;
  
  /** 超时设置（毫秒） */
  timeouts: {
    planning: number;
    execution: number;
    review: number;
  };
}

/** 默认配置 */
export const DEFAULT_AGENT_CONFIG: AgentSystemConfig = {
  maxRetries: 3,
  minPassScore: 80,
  autoFix: true,
  timeouts: {
    planning: 60000,    // 1 分钟
    execution: 300000,  // 5 分钟
    review: 60000,      // 1 分钟
  },
};
