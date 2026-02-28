// 目标时间轴相关类型定义

// 目标分类
export type GoalCategory = 'work' | 'life';

// 目标状态
export type GoalStatus = 'active' | 'completed' | 'paused';

// 里程碑
export interface Milestone {
  milestone: string;
  target_date: string;
  completed: boolean;
}

// 长期目标（从 YAML 解析）
export interface LongTermGoal {
  goal: string;
  category: GoalCategory;
  description: string;
  target_date: string;
  compound_value: number;
  status: GoalStatus;
  milestones: Milestone[];
}

// 周目标
export interface WeeklyGoal {
  goal: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// 周目标集合
export interface WeeklyGoals {
  week_of: string;
  goals: WeeklyGoal[];
}

// 目标数据（从 YAML 解析的完整结构）
export interface GoalData {
  last_updated: string;
  long_term_goals: LongTermGoal[];
  current_focus: string[];
  weekly_goals: WeeklyGoals;
}

// 产出类型
export type OutputType = 'report' | 'code' | 'design' | 'document' | 'analysis' | 'other';

// 产出记录
export interface Output {
  id: string;
  goalId: string;
  milestoneIndex?: number;
  title: string;
  type: OutputType;
  description: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建产出的输入类型
export type CreateOutputInput = Omit<Output, 'id' | 'createdAt' | 'updatedAt'>;

// 反馈评分
export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

// 反馈记录
export interface Feedback {
  id: string;
  outputId: string;
  rating: FeedbackRating;
  comment: string;
  meetsExpectation: boolean;
  createdAt: string;
}

// 创建反馈的输入类型
export type CreateFeedbackInput = Omit<Feedback, 'id' | 'createdAt'>;

// 时间轴节点（组合产出和反馈）
export interface TimelineNode {
  output: Output;
  goal: LongTermGoal;
  feedback?: Feedback;
}

// 目标进度统计
export interface GoalProgress {
  goal: LongTermGoal;
  totalMilestones: number;
  completedMilestones: number;
  outputCount: number;
  progressPercent: number;
}

// 筛选选项
export interface TimelineFilter {
  goalId?: string;
  category?: GoalCategory;
  dateRange?: {
    start: string;
    end: string;
  };
}

// 产出类型配置
export const OUTPUT_TYPE_CONFIG: Record<OutputType, { label: string; icon: string; color: string }> = {
  report: { label: '调研报告', icon: 'FileText', color: '#6366F1' },
  code: { label: '代码实现', icon: 'Code', color: '#22C55E' },
  design: { label: '设计方案', icon: 'Palette', color: '#A855F7' },
  document: { label: '文档', icon: 'FileEdit', color: '#3B82F6' },
  analysis: { label: '分析', icon: 'BarChart', color: '#EAB308' },
  other: { label: '其他', icon: 'Package', color: '#64748B' },
};

// 目标分类配置
export const GOAL_CATEGORY_CONFIG: Record<GoalCategory, { label: string; color: string; gradient: string }> = {
  work: { label: '工作线', color: '#6366F1', gradient: 'from-indigo-500 to-purple-500' },
  life: { label: '第二人生', color: '#A855F7', gradient: 'from-purple-500 to-pink-500' },
};
