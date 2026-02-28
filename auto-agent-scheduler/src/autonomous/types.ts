/**
 * 自主任务系统类型定义
 * 基于五层记忆系统，支持编码、工作、生活三类任务
 */

// ==================== 任务类型 ====================

export type TaskType = 'coding' | 'work' | 'life';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type ExecutionMode = 'interactive' | 'background';

/**
 * 每日任务
 */
export interface DailyTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  status: TaskStatus;
  
  // 来源追溯
  sourceGoalId?: string;
  sourceGoalName?: string;
  sourceMilestone?: string;
  
  // 复利价值评估
  compoundValue: number;      // 0-100
  goalAlignment: number;      // 0-100
  urgency: number;            // 0-100
  
  // 执行信息
  order: number;              // 执行顺序
  dependencies?: string[];    // 依赖任务 ID
  deliverables?: string[];    // 预期产出
  
  // 时间戳
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * 任务执行结果
 */
export interface ExecutionResult {
  taskId: string;
  taskTitle: string;
  success: boolean;
  status: TaskStatus;
  
  // 时间统计
  estimatedMinutes: number;
  actualMinutes: number;
  
  // 产出
  outputs: TaskOutput[];
  
  // 反馈
  feedback?: string;
  learnings?: string[];
  blockers?: string[];
  
  // 时间戳
  startedAt: Date;
  completedAt: Date;
}

/**
 * 任务产出
 */
export interface TaskOutput {
  type: 'file' | 'code' | 'document' | 'decision' | 'other';
  path?: string;
  description: string;
  linesOfCode?: number;
}

// ==================== 每日计划 ====================

/**
 * 每日计划
 */
export interface DailyPlan {
  date: string;               // YYYY-MM-DD
  generatedAt: Date;
  
  // 任务分配
  tasks: DailyTask[];
  totalEstimatedMinutes: number;
  
  // 分类统计
  codingTasks: number;
  workTasks: number;
  lifeTasks: number;
  
  // 目标关联
  focusGoals: string[];
  
  // 约束条件
  availableHours: number;
  workLifeRatio: { work: number; life: number };
}

/**
 * 每日执行报告
 */
export interface DailyReport {
  date: string;
  planId: string;
  
  // 统计
  tasksPlanned: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksSkipped: number;
  
  // 时间
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  efficiency: number;         // 实际/预估
  
  // 结果
  results: ExecutionResult[];
  
  // 洞察
  achievements: string[];
  learnings: string[];
  blockers: string[];
  
  // 建议
  nextDayRecommendations: string[];
  
  // 时间戳
  startedAt: Date;
  completedAt: Date;
}

// ==================== 执行配置 ====================

/**
 * 执行配置
 */
export interface ExecutionConfig {
  mode: ExecutionMode;
  
  // 任务限制
  maxTasksPerDay: number;
  maxMinutesPerDay: number;
  
  // 执行控制
  retryOnFailure: boolean;
  maxRetries: number;
  pauseBetweenTasks: number;  // 毫秒
  
  // 可视化
  showProgress: boolean;
  verboseOutput: boolean;
  
  // 自动化
  autoStart: boolean;
  scheduledTime?: string;     // HH:mm
}

/**
 * 默认执行配置
 */
export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  mode: 'interactive',
  maxTasksPerDay: 5,
  maxMinutesPerDay: 240,      // 4 小时
  retryOnFailure: true,
  maxRetries: 2,
  pauseBetweenTasks: 2000,
  showProgress: true,
  verboseOutput: true,
  autoStart: false,
};

// ==================== 任务生成 ====================

/**
 * 目标信息（从记忆系统读取）
 */
export interface GoalInfo {
  id: string;
  name: string;
  category: 'work' | 'life';
  description: string;
  targetDate?: Date;
  compoundValue: number;
  status: 'active' | 'completed' | 'paused';
  milestones: MilestoneInfo[];
}

/**
 * 里程碑信息
 */
export interface MilestoneInfo {
  name: string;
  targetDate?: Date;
  completed: boolean;
  tasks?: string[];
}

/**
 * 任务生成上下文
 */
export interface TaskGenerationContext {
  // 从记忆系统读取
  goals: GoalInfo[];
  currentFocus: string[];
  projectStates: ProjectState[];
  pendingItems: PendingItem[];
  
  // 约束条件
  availableHours: number;
  workLifeRatio: { work: number; life: number };
  preferredWorkTimes: string[];
  
  // 历史数据
  recentCompletionRate: number;
  averageTaskDuration: number;
}

/**
 * 项目状态
 */
export interface ProjectState {
  projectId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'blocked';
  lastActivity?: Date;
  nextAction?: string;
}

/**
 * 待办事项
 */
export interface PendingItem {
  item: string;
  priority: TaskPriority;
  dueDate?: Date;
  context?: string;
}

// ==================== 反馈系统 ====================

/**
 * 用户反馈
 */
export interface UserFeedback {
  date: string;
  taskId?: string;
  
  // 评分
  overallSatisfaction: 1 | 2 | 3 | 4 | 5;
  taskLoadRating: 'too_light' | 'just_right' | 'too_heavy';
  priorityAccuracy: 'accurate' | 'needs_adjustment';
  
  // 文字反馈
  comments?: string;
  suggestions?: string[];
  
  // 调整建议
  adjustments?: {
    preferMoreCoding?: boolean;
    preferMoreWork?: boolean;
    preferMoreLife?: boolean;
    reduceTaskCount?: boolean;
    increaseTaskCount?: boolean;
  };
}

/**
 * 系统学习记录
 */
export interface LearningRecord {
  date: string;
  
  // 模式识别
  patterns: {
    bestPerformanceTime?: string;
    averageTaskDuration: number;
    completionRateByType: Record<TaskType, number>;
    preferredTaskOrder?: TaskType[];
  };
  
  // 优化建议
  optimizations: string[];
  
  // 应用状态
  applied: boolean;
  appliedAt?: Date;
}

// ==================== 可视化 ====================

/**
 * 进度状态
 */
export interface ProgressState {
  currentTask: DailyTask | null;
  completedTasks: number;
  totalTasks: number;
  elapsedMinutes: number;
  estimatedRemainingMinutes: number;
  
  // 当前任务进度
  taskProgress?: {
    step: string;
    percentage: number;
  };
}

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  taskId?: string;
  details?: Record<string, unknown>;
}
