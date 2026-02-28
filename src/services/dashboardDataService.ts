/**
 * Dashboard 数据服务
 * 负责读取产出数据、社区慈善报告、日报等
 */
import type {
  EngineStats,
  OutputRecord,
  DailyOutputGroup,
  CharityReport,
  CharityReportDetail,
  DailyReport,
  TaskItem,
} from '@/types/dashboard';
import outputsData from '@/data/outputs.json';
import tasksData from '@/data/tasks.json';

// 社区慈善报告的 Markdown 文件内容（静态导入）
const charityReportContents: Record<string, string> = {};

// 格式化日期为友好显示
const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }
};

// 获取日期字符串 YYYY-MM-DD
const getDateString = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

// 判断是否是今天
const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const dashboardDataService = {
  /**
   * 获取双引擎统计数据
   */
  async getEngineStats(): Promise<EngineStats[]> {
    const outputs = outputsData.outputs as OutputRecord[];
    const today = new Date().toDateString();

    const workOutputs = outputs.filter((o) => o.type === 'work');
    const lifeOutputs = outputs.filter((o) => o.type === 'life');

    const workTodayCount = workOutputs.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    ).length;
    const lifeTodayCount = lifeOutputs.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    ).length;

    return [
      {
        type: 'work',
        label: 'Work 引擎',
        totalTasks: workOutputs.length + 5, // 包含进行中和待处理的任务
        totalCompleted: workOutputs.length,
        todayCompleted: workTodayCount,
        inProgress: 2,
        pending: 3,
      },
      {
        type: 'life',
        label: 'Life 引擎',
        totalTasks: lifeOutputs.length + 3,
        totalCompleted: lifeOutputs.length,
        todayCompleted: lifeTodayCount,
        inProgress: 1,
        pending: 2,
      },
    ];
  },

  /**
   * 获取所有产出记录
   */
  async getAllOutputs(): Promise<OutputRecord[]> {
    return outputsData.outputs as OutputRecord[];
  },

  /**
   * 按类型获取产出记录
   */
  async getOutputsByType(type: 'work' | 'life'): Promise<OutputRecord[]> {
    const outputs = outputsData.outputs as OutputRecord[];
    return outputs.filter((o) => o.type === type);
  },

  /**
   * 获取按日期分组的产出（用于时间轴）
   */
  async getDailyOutputGroups(): Promise<DailyOutputGroup[]> {
    const outputs = outputsData.outputs as OutputRecord[];

    // 按日期分组
    const groupMap = new Map<string, OutputRecord[]>();
    outputs.forEach((output) => {
      const dateKey = getDateString(output.createdAt);
      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, []);
      }
      groupMap.get(dateKey)!.push(output);
    });

    // 转换为数组并按日期倒序排列
    const groups: DailyOutputGroup[] = Array.from(groupMap.entries())
      .map(([date, records]) => ({
        date,
        displayDate: formatDisplayDate(date),
        isToday: isToday(date),
        records: records.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return groups;
  },

  /**
   * 获取社区慈善报告列表
   */
  async getCharityReports(): Promise<CharityReport[]> {
    return outputsData.charityReports as CharityReport[];
  },

  /**
   * 获取社区慈善报告详情（包含 Markdown 内容）
   */
  async getCharityReportDetail(id: string): Promise<CharityReportDetail | null> {
    const reports = outputsData.charityReports as CharityReport[];
    const report = reports.find((r) => r.id === id);
    if (!report) return null;

    // 动态加载 Markdown 内容
    let content = charityReportContents[report.filename];
    if (!content) {
      try {
        // 使用 fetch 加载 Markdown 文件
        const response = await fetch(`/community-charity-research/sections/${report.filename}`);
        if (response.ok) {
          content = await response.text();
          charityReportContents[report.filename] = content;
        } else {
          content = '# 加载失败\n\n无法加载报告内容';
        }
      } catch {
        content = '# 加载失败\n\n无法加载报告内容';
      }
    }

    return {
      ...report,
      content,
    };
  },

  /**
   * 获取日报列表
   */
  async getDailyReports(): Promise<DailyReport[]> {
    const reports = outputsData.dailyReports;
    const result: DailyReport[] = [];

    for (const report of reports) {
      try {
        const response = await fetch(`/auto-agent-scheduler/data/daily-reports/${report.filename}`);
        if (response.ok) {
          const content = await response.text();
          result.push({
            date: report.date,
            filename: report.filename,
            content,
          });
        }
      } catch {
        // 忽略加载失败的日报
      }
    }

    return result;
  },

  /**
   * 获取今日产出统计
   */
  async getTodayStats(): Promise<{ total: number; work: number; life: number }> {
    const outputs = outputsData.outputs as OutputRecord[];
    const today = new Date().toDateString();

    const todayOutputs = outputs.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    );

    return {
      total: todayOutputs.length,
      work: todayOutputs.filter((o) => o.type === 'work').length,
      life: todayOutputs.filter((o) => o.type === 'life').length,
    };
  },

  /**
   * 获取双引擎今日进度数据
   * 用于 EngineStatusPanel 显示
   */
  async getTodayProgress(): Promise<{
    work: { inProgress: number; completed: number; pending: number; progress: number };
    life: { inProgress: number; completed: number; pending: number; progress: number };
  }> {
    const outputs = outputsData.outputs as OutputRecord[];
    const today = new Date().toDateString();

    // 今日完成的产出
    const todayWorkCompleted = outputs.filter(
      (o) => o.type === 'work' && new Date(o.createdAt).toDateString() === today
    ).length;
    const todayLifeCompleted = outputs.filter(
      (o) => o.type === 'life' && new Date(o.createdAt).toDateString() === today
    ).length;

    // 模拟进行中和待处理的任务数（实际应从任务系统获取）
    // 这里基于产出数据估算
    const workInProgress = 2;
    const workPending = 3;
    const lifeInProgress = 1;
    const lifePending = 2;

    const workTotal = workInProgress + workPending + todayWorkCompleted;
    const lifeTotal = lifeInProgress + lifePending + todayLifeCompleted;

    return {
      work: {
        inProgress: workInProgress,
        completed: todayWorkCompleted,
        pending: workPending,
        progress: workTotal > 0 ? Math.round((todayWorkCompleted / workTotal) * 100) : 0,
      },
      life: {
        inProgress: lifeInProgress,
        completed: todayLifeCompleted,
        pending: lifePending,
        progress: lifeTotal > 0 ? Math.round((todayLifeCompleted / lifeTotal) * 100) : 0,
      },
    };
  },

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<TaskItem[]> {
    return tasksData.tasks as TaskItem[];
  },

  /**
   * 按类型获取任务
   */
  async getTasksByType(type: 'work' | 'life'): Promise<TaskItem[]> {
    const tasks = tasksData.tasks as TaskItem[];
    return tasks.filter((t) => t.type === type);
  },

  /**
   * 获取双引擎任务详情（用于首页展示）
   */
  async getEngineTaskDetails(): Promise<{
    work: { inProgress: TaskItem[]; pending: TaskItem[]; completed: number };
    life: { inProgress: TaskItem[]; pending: TaskItem[]; completed: number };
  }> {
    const tasks = tasksData.tasks as TaskItem[];
    const outputs = outputsData.outputs as OutputRecord[];
    const today = new Date().toDateString();

    const workTasks = tasks.filter((t) => t.type === 'work');
    const lifeTasks = tasks.filter((t) => t.type === 'life');

    const todayWorkCompleted = outputs.filter(
      (o) => o.type === 'work' && new Date(o.createdAt).toDateString() === today
    ).length;
    const todayLifeCompleted = outputs.filter(
      (o) => o.type === 'life' && new Date(o.createdAt).toDateString() === today
    ).length;

    return {
      work: {
        inProgress: workTasks.filter((t) => t.status === 'in_progress'),
        pending: workTasks.filter((t) => t.status === 'pending'),
        completed: todayWorkCompleted,
      },
      life: {
        inProgress: lifeTasks.filter((t) => t.status === 'in_progress'),
        pending: lifeTasks.filter((t) => t.status === 'pending'),
        completed: todayLifeCompleted,
      },
    };
  },
};
