// ==================== 记忆层类型（从 iris-me 同步） ====================

export interface CoreIdentityLayer {
  name: string;
  roles: string[];
  coreValues: string[];
  missionStatement: string;
  personalBrand: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface LongTermGoal {
  id: string;
  title: string;
  description: string;
  category: 'work' | 'life';
  targetDate: Date;
  milestones: Milestone[];
  compoundValue: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface MidTermPlan {
  id: string;
  goalId: string;
  title: string;
  description: string;
  period: 'quarterly' | 'monthly';
  startDate: Date;
  endDate: Date;
  deliverables: string[];
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface Deliverable {
  id: string;
  type: 'code' | 'document' | 'design' | 'other';
  title: string;
  description: string;
  url?: string;
  filePath?: string;
  createdAt: Date;
}

export interface ShortTermTask {
  id: string;
  planId?: string;
  title: string;
  description: string;
  engine: 'work' | 'life';
  priority: number;
  compoundValue: number;
  urgency: number;
  goalAlignment: number;
  estimatedHours: number;
  actualHours?: number;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
  deliverables: Deliverable[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  externalId?: string;
  externalSource?: string;
}

export interface ImmediateContext {
  date: Date;
  mood?: 'energetic' | 'focused' | 'tired' | 'stressed' | 'relaxed';
  availableHours: number;
  priorities: string[];
  blockers: string[];
  notes: string;
  todayTasks: string[];
  completedTasks: string[];
  updatedAt: Date;
}

export interface MemoryArchitecture {
  coreIdentity: CoreIdentityLayer;
  longTermGoals: LongTermGoal[];
  midTermPlans: MidTermPlan[];
  shortTermTasks: ShortTermTask[];
  immediateContext: ImmediateContext;
}

// ==================== 调度器类型 ====================

export interface SchedulerConfig {
  enabled: boolean;
  timezone: string;
  dailyExecutionTime: string;
  maxTasksPerDay: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export interface AIConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AppConfig {
  scheduler: SchedulerConfig;
  ai: AIConfig;
  memory: {
    syncIntervalMs: number;
    maxHistoryDays: number;
  };
  delivery: {
    outputDir: string;
    reportFormat: 'markdown' | 'json';
  };
  logging: {
    level: string;
    maxFiles: number;
    maxSize: string;
  };
}

// ==================== 任务执行类型 ====================

export type TaskType = 'coding' | 'review' | 'refactor' | 'documentation' | 'testing';

export interface TaskContext {
  projectPath: string;
  requirements: string;
  relatedFiles: string[];
  expectedOutput: string;
  techStack?: string[];
  constraints?: string[];
}

export interface ExecutableTask {
  id: string;
  sourceTask: ShortTermTask;
  type: TaskType;
  context: TaskContext;
  priority: number;
  estimatedDuration: number;
  scheduledAt: Date;
}

export interface CodeOutput {
  filePath: string;
  content: string;
  language: string;
  linesOfCode: number;
  action: 'create' | 'modify' | 'delete';
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  outputs: CodeOutput[];
  logs: string[];
  duration: number;
  startedAt: Date;
  completedAt: Date;
  error?: string;
  aiTokensUsed?: number;
}

export interface DailyExecutionReport {
  id: string;
  date: Date;
  tasksPlanned: number;
  tasksCompleted: number;
  tasksFailed: number;
  totalDuration: number;
  totalLinesOfCode: number;
  results: ExecutionResult[];
  summary: string;
  nextDayRecommendations: string[];
}

// ==================== 调度器状态 ====================

export type SchedulerStatus = 'idle' | 'running' | 'paused' | 'error';

export interface SchedulerState {
  status: SchedulerStatus;
  lastExecutionTime?: Date;
  nextExecutionTime?: Date;
  currentTask?: ExecutableTask;
  todayProgress: {
    planned: number;
    completed: number;
    failed: number;
  };
  error?: string;
}

// ==================== 数据库模型 ====================

export interface ExecutionRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  taskType: TaskType;
  success: boolean;
  duration: number;
  linesOfCode: number;
  tokensUsed: number;
  error?: string;
  startedAt: string;
  completedAt: string;
}

export interface DailyReport {
  id: string;
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  tasksFailed: number;
  totalDuration: number;
  totalLinesOfCode: number;
  summary: string;
  recommendations: string;
  createdAt: string;
}
