// ==========================================
// Iris Daily Reminder - 类型定义
// ==========================================

/** 提醒重复规则 */
export type RepeatType = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'weekly_times' | 'monthly' | 'monthly_times' | 'once';

/** 复利分类 */
export type CompoundCategory = 
  | 'health'    // 健康复利
  | 'finance'   // 财务复利
  | 'relation'  // 关系复利
  | 'creation'  // 作品复利
  | 'joy'       // 悦己复利
  | 'skill'     // 技能复利
  | 'cognition' // 认知复利
  | 'custom';   // 其他

/** 场景模板类型 */
export type SceneTemplate = 'workday' | 'study' | 'rest' | 'custom';

/** 提醒状态 */
export type ReminderStatus = 'pending' | 'done' | 'skipped' | 'missed';

/** 提醒紧急度 */
export type ReminderUrgency = 'gentle' | 'firm' | 'urgent';

/** 单个提醒 */
export interface Reminder {
  id: string;
  title: string;
  description?: string;
  /** HH:mm 格式 */
  time: string;
  /** 结束时间（可选，用于时间块） */
  endTime?: string;
  repeat: RepeatType;
  /** 周几（用于 weekly 重复）0=周日, 1=周一... */
  weekDays?: number[];
  /** 月几号（用于 monthly 重复，支持多个日期） */
  monthDays?: number[];
  /** 每周目标次数（用于 weekly_times 重复） */
  weeklyTimesTarget?: number;
  /** 每月目标次数（用于 monthly_times 重复） */
  monthlyTimesTarget?: number;
  category: CompoundCategory;
  urgency: ReminderUrgency;
  /** 自定义提醒文案（为空则从文案库随机选） */
  customMessage?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 是否启用声音 */
  soundEnabled: boolean;
  /** 是否推送企业微信 */
  webhookEnabled: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 排序权重 */
  sortOrder: number;
  /** 来源灵感ID（灵感子任务转化的提醒才有） */
  sourceIdeaId?: string;
}

/** 提醒完成记录 */
export interface ReminderLog {
  id: string;
  reminderId: string;
  date: string; // YYYY-MM-DD
  status: ReminderStatus;
  completedAt?: Date;
  /** 专注模式时长（分钟） */
  focusDuration?: number;
  /** 实际专注时长 */
  actualFocusDuration?: number;
}

/** 专注会话 */
export interface FocusSession {
  id: string;
  reminderId?: string;
  title: string;
  /** 计划时长（分钟） */
  duration: number;
  /** 开始时间 */
  startedAt: Date;
  /** 结束时间 */
  endedAt?: Date;
  /** 是否提前退出 */
  interrupted: boolean;
}

/** 企业微信 Webhook 配置 */
export interface WebhookConfig {
  id?: number;
  /** webhook URL */
  url: string;
  /** 是否启用 */
  enabled: boolean;
  /** 最后测试时间 */
  lastTestedAt?: Date;
  /** 最后测试结果 */
  lastTestSuccess?: boolean;
}

/** 场景模板定义 */
export interface SceneTemplateData {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: SceneTemplate;
  reminders: Omit<Reminder, 'id' | 'createdAt' | 'sortOrder'>[];
}

/** 每日统计 */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  total: number;
  completed: number;
  skipped: number;
  missed: number;
  focusMinutes: number;
  completionRate: number;
}

/** 提醒调度项（运行时） */
export interface ScheduledReminder {
  reminder: Reminder;
  nextFireTime: Date;
  timeoutId?: ReturnType<typeof setTimeout>;
}

/** 月度分类总结 */
export interface MonthlySummary {
  /** 格式：YYYY-MM-category，如 2026-02-health */
  id: string;
  year: number;
  month: number; // 0-based
  category: CompoundCategory;
  content: string;
  updatedAt: Date;
}

// ==========================================
// 灵感池相关类型
// ==========================================

/** 灵感状态 */
export type IdeaStatus = 'open' | 'in_progress' | 'done' | 'archived';

/** 子任务 */
export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  /** 已转化为提醒的 reminderId（为空表示未转化） */
  reminderId?: string;
}

/** 灵感 */
export interface Idea {
  id: string;
  title: string;
  /** 原始输入内容 */
  content: string;
  /** AI 拆解出的子任务 */
  subTasks: SubTask[];
  status: IdeaStatus;
  /** 归属分类（支持多选，服务多个复利） */
  categories: CompoundCategory[];
  /** @deprecated 旧字段，兼容已有数据 */
  category?: CompoundCategory;
  createdAt: Date;
  updatedAt: Date;
}
