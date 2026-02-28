// 五层记忆架构类型定义

// 核心身份层 - 不变的身份认同与价值观
export interface CoreIdentityLayer {
  name: string;
  roles: string[];
  coreValues: string[];
  missionStatement: string;
  personalBrand: string;
  createdAt: Date;
  updatedAt: Date;
}

// 长期目标层 - 年度战略规划
export interface LongTermGoal {
  id: string;
  title: string;
  description: string;
  category: 'work' | 'life';
  targetDate: Date;
  milestones: Milestone[];
  compoundValue: number; // 复利价值评分 0-100
  status: 'active' | 'completed' | 'paused';
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

// 中期计划层 - 季度/月度里程碑
export interface MidTermPlan {
  id: string;
  goalId: string;
  title: string;
  description: string;
  period: 'quarterly' | 'monthly';
  startDate: Date;
  endDate: Date;
  deliverables: string[];
  progress: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

// 短期任务层 - 周/日任务
export interface ShortTermTask {
  id: string;
  planId?: string;
  title: string;
  description: string;
  engine: 'work' | 'life';
  priority: number; // 优先级评分
  compoundValue: number; // 复利价值评分
  urgency: number; // 紧急度
  goalAlignment: number; // 目标对齐度
  estimatedHours: number;
  actualHours?: number;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
  deliverables: Deliverable[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// 交付物
export interface Deliverable {
  id: string;
  taskId: string;
  title: string;
  type: 'document' | 'code' | 'design' | 'article' | 'analysis' | 'other';
  content: string;
  url?: string;
  feedback?: Feedback;
  createdAt: Date;
}

// 反馈
export interface Feedback {
  id: string;
  deliverableId: string;
  rating: number; // 1-5
  comment: string;
  adjustments: string[];
  insights: string[];
  archivedTo?: 'knowledge' | 'event';
  createdAt: Date;
}

// 即时上下文层 - 当日状态与临时信息
export interface ImmediateContext {
  date: Date;
  mood?: 'energetic' | 'focused' | 'tired' | 'stressed' | 'relaxed';
  availableHours: number;
  priorities: string[];
  blockers: string[];
  notes: string;
  todayTasks: string[]; // task ids
  completedTasks: string[]; // task ids
  updatedAt: Date;
}

// 完整的五层记忆架构
export interface MemoryArchitecture {
  coreIdentity: CoreIdentityLayer;
  longTermGoals: LongTermGoal[];
  midTermPlans: MidTermPlan[];
  shortTermTasks: ShortTermTask[];
  immediateContext: ImmediateContext;
}

// Seed Pack 数据结构
export interface SeedPack {
  identity: {
    name: string;
    roles: string[];
    coreValues: string[];
    missionStatement: string;
  };
  businessLines: {
    work: BusinessLine[];
    life: BusinessLine[];
  };
  preferences: {
    workLifeRatio: { work: number; life: number };
    decisionStyle: string;
    outputFormats: string[];
  };
  collaborators: Collaborator[];
  constraints: string[];
  importedAt: Date;
}

export interface BusinessLine {
  id: string;
  name: string;
  description: string;
  priority: number;
  currentStatus: string;
  nextMilestone: string;
  compoundPotential: number; // 复利潜力评分
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  relationship: string;
  projects: string[];
  notes: string;
}

// 每日产出类型
export interface DailyOutput {
  id: string;
  date: Date;
  diary: DailyDiary;
  article?: PublicArticle;
  createdAt: Date;
}

export interface DailyDiary {
  whatDone: string[];
  feedback: string[];
  insights: string[];
  nextSteps: string[];
  priorityDecisions: PriorityDecision[];
}

export interface PriorityDecision {
  taskId: string;
  taskTitle: string;
  score: number;
  reasoning: string;
}

export interface PublicArticle {
  title: string;
  content: string;
  theme: string;
  wordCount: number;
  tags: string[];
  publishReady: boolean;
}
