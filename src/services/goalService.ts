// 目标数据服务 - 从 YAML 文件解析目标数据
import type { GoalData, LongTermGoal, GoalProgress, GoalCategory } from '@/types/goal-timeline';
import { outputService } from './outputService';

// 硬编码的目标数据（从 memory-system/Intent/目标与规划.yaml 解析）
// 在浏览器环境中无法直接读取 YAML 文件，因此将数据内联
const goalData: GoalData = {
  last_updated: "2026-01-07T09:00:00+08:00",
  long_term_goals: [
    {
      goal: "善治美公益组件 MVP 上线",
      category: "work",
      description: "完成乡村公益认证与交付系统的最小可用版本，在一个试点村完成验证",
      target_date: "2026-03-31",
      compound_value: 85,
      status: "active",
      milestones: [
        { milestone: "完成爱心小卖部方案设计", target_date: "2026-01-15", completed: false },
        { milestone: "完成技术方案评审", target_date: "2026-01-31", completed: false },
        { milestone: "试点村上线运行", target_date: "2026-03-15", completed: false },
      ],
    },
    {
      goal: "农事预警系统 Demo 完成",
      category: "work",
      description: "成都郫都区小麦农事预警 Demo，把气象数据转化为可执行的农事提醒",
      target_date: "2026-02-28",
      compound_value: 70,
      status: "active",
      milestones: [
        { milestone: "完成最小可用字段集定义", target_date: "2026-01-20", completed: false },
        { milestone: "阈值表规则化", target_date: "2026-02-10", completed: false },
      ],
    },
    {
      goal: "动画 AI 制片系统 Demo",
      category: "life",
      description: "搭建前期创作 Agent 协作网络，产出第一个可演示的定调 Demo",
      target_date: "2026-06-30",
      compound_value: 95,
      status: "active",
      milestones: [
        { milestone: "完成前期创作流程调研", target_date: "2026-01-31", completed: false },
        { milestone: "设计 Agent 协作架构", target_date: "2026-02-28", completed: false },
        { milestone: "与刘导完成导演定调访谈", target_date: "2026-03-15", completed: false },
        { milestone: "产出第一个 Mood Trailer", target_date: "2026-05-31", completed: false },
      ],
    },
    {
      goal: "数字分身系统稳定运行",
      category: "life",
      description: "完成五层记忆架构和双引擎任务系统的搭建，实现每日自动产出",
      target_date: "2026-02-28",
      compound_value: 90,
      status: "active",
      milestones: [
        { milestone: "MVP 上线运行", target_date: "2026-01-10", completed: false },
        { milestone: "完成 Seed Pack 导入和记忆系统初始化", target_date: "2026-01-07", completed: true },
        { milestone: "连续运行 30 天", target_date: "2026-02-15", completed: false },
      ],
    },
  ],
  current_focus: [
    "完成数字分身记忆系统搭建",
    "善治美公益组件方案设计",
    "动画 AI 制片系统调研",
  ],
  weekly_goals: {
    week_of: "2026-01-06",
    goals: [
      { goal: "完成记忆系统初始化", status: "in_progress" },
      { goal: "配置 auto-agent-scheduler 定时任务", status: "pending" },
      { goal: "善治美爱心小卖部方案初稿", status: "pending" },
    ],
  },
};

// 生成目标 ID
const generateGoalId = (goal: LongTermGoal): string => {
  return goal.goal.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '');
};

export const goalService = {
  // 获取所有目标数据
  getGoalData(): GoalData {
    return goalData;
  },

  // 获取所有长期目标
  getLongTermGoals(): LongTermGoal[] {
    return goalData.long_term_goals;
  },

  // 按分类获取目标
  getGoalsByCategory(category: GoalCategory): LongTermGoal[] {
    return goalData.long_term_goals.filter((g) => g.category === category);
  },

  // 根据目标名称获取目标
  getGoalByName(goalName: string): LongTermGoal | undefined {
    return goalData.long_term_goals.find((g) => g.goal === goalName);
  },

  // 获取目标 ID
  getGoalId(goal: LongTermGoal): string {
    return generateGoalId(goal);
  },

  // 根据 ID 获取目标
  getGoalById(goalId: string): LongTermGoal | undefined {
    return goalData.long_term_goals.find((g) => generateGoalId(g) === goalId);
  },

  // 获取当前聚焦
  getCurrentFocus(): string[] {
    return goalData.current_focus;
  },

  // 获取本周目标
  getWeeklyGoals() {
    return goalData.weekly_goals;
  },

  // 计算目标进度
  async getGoalProgress(goal: LongTermGoal): Promise<GoalProgress> {
    const goalId = generateGoalId(goal);
    const outputs = await outputService.getOutputsByGoal(goalId);
    const completedMilestones = goal.milestones.filter((m) => m.completed).length;
    const totalMilestones = goal.milestones.length;
    const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return {
      goal,
      totalMilestones,
      completedMilestones,
      outputCount: outputs.length,
      progressPercent,
    };
  },

  // 获取所有目标的进度
  async getAllGoalProgress(): Promise<GoalProgress[]> {
    const goals = goalData.long_term_goals;
    const progressList = await Promise.all(goals.map((g) => this.getGoalProgress(g)));
    return progressList;
  },

  // 获取最后更新时间
  getLastUpdated(): string {
    return goalData.last_updated;
  },
};
