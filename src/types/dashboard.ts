// Dashboard 相关类型定义

// 引擎统计数据（用于双引擎面板展示）
export interface EngineStats {
  type: 'work' | 'life';
  label: string;
  totalTasks: number;
  totalCompleted: number;
  todayCompleted: number;
  inProgress: number;
  pending: number;
}

// 产出记录（用于时间轴展示）
export interface OutputRecord {
  id: string;
  title: string;
  type: 'work' | 'life';
  category: OutputCategory;
  description: string;
  link?: string;
  createdAt: string;
  updatedAt?: string;
}

// 产出类别
export type OutputCategory = 
  | 'report'      // 调研报告
  | 'code'        // 代码实现
  | 'design'      // 设计方案
  | 'document'    // 文档
  | 'analysis'    // 分析
  | 'article'     // 文章
  | 'other';      // 其他

// 产出类别配置
export const OUTPUT_CATEGORY_CONFIG: Record<OutputCategory, { label: string; icon: string; color: string }> = {
  report: { label: '调研报告', icon: 'FileText', color: '#6366F1' },
  code: { label: '代码实现', icon: 'Code', color: '#22C55E' },
  design: { label: '设计方案', icon: 'Palette', color: '#A855F7' },
  document: { label: '文档', icon: 'FileEdit', color: '#3B82F6' },
  analysis: { label: '分析', icon: 'BarChart', color: '#EAB308' },
  article: { label: '文章', icon: 'BookOpen', color: '#EC4899' },
  other: { label: '其他', icon: 'Package', color: '#64748B' },
};

// 按日期分组的产出
export interface DailyOutputGroup {
  date: string;           // YYYY-MM-DD
  displayDate: string;    // 友好显示格式
  isToday: boolean;
  records: OutputRecord[];
}

// 社区慈善报告
export interface CharityReport {
  id: string;
  title: string;
  filename: string;
  order: number;
  status: 'completed' | 'in_progress' | 'pending';
  updatedAt: string;
}

// 社区慈善报告详情
export interface CharityReportDetail extends CharityReport {
  content: string;
}

// 日报数据（从 auto-agent-scheduler 读取）
export interface DailyReport {
  date: string;           // YYYY-MM-DD
  filename: string;
  content: string;
}

// 产出详情页筛选
export interface OutputFilter {
  type?: 'work' | 'life';
  category?: OutputCategory;
  dateRange?: {
    start: string;
    end: string;
  };
}

// 任务项（用于首页任务列表展示）
export interface TaskItem {
  id: string;
  title: string;
  type: 'work' | 'life';
  status: 'in_progress' | 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}
