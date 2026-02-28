// 产出数据服务 - 管理数字分身的产出记录
import type { Output, CreateOutputInput, OutputType } from '@/types/goal-timeline';

// 本地存储 key
const OUTPUTS_STORAGE_KEY = 'iris-outputs';

// 初始产出数据（示例）
const initialOutputs: Output[] = [
  {
    id: 'output_1736236800000',
    goalId: '动画-ai-制片系统-demo',
    milestoneIndex: 0,
    title: 'AI 动画制作技术调研报告',
    type: 'report',
    description: '完成了 AI 动画制作领域的全面调研，涵盖技术现状、工具对比、工作流程和未来趋势分析。',
    link: '/deliverables/ai-animation-research-report',
    createdAt: '2026-01-07T10:00:00+08:00',
    updatedAt: '2026-01-07T10:00:00+08:00',
  },
  {
    id: 'output_1736150400000',
    goalId: '数字分身系统稳定运行',
    milestoneIndex: 1,
    title: '记忆系统架构设计与实现',
    type: 'code',
    description: '完成五层记忆架构的设计和代码实现，包括核心身份层、长期目标层、中期计划层、短期任务层和即时上下文层。',
    link: '/memory',
    createdAt: '2026-01-06T14:00:00+08:00',
    updatedAt: '2026-01-06T14:00:00+08:00',
  },
  {
    id: 'output_1736064000000',
    goalId: '数字分身系统稳定运行',
    milestoneIndex: 0,
    title: '数字分身工作台 MVP',
    type: 'code',
    description: '完成个人数字分身工作台的 MVP 版本，包括仪表盘、交付物管理、记忆可视化等核心功能。',
    createdAt: '2026-01-05T10:00:00+08:00',
    updatedAt: '2026-01-05T10:00:00+08:00',
  },
];

// 从 localStorage 加载数据
const loadOutputs = (): Output[] => {
  if (typeof window === 'undefined') return initialOutputs;
  const stored = localStorage.getItem(OUTPUTS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(OUTPUTS_STORAGE_KEY, JSON.stringify(initialOutputs));
    return initialOutputs;
  }
  return JSON.parse(stored);
};

// 保存数据到 localStorage
const saveOutputs = (outputs: Output[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OUTPUTS_STORAGE_KEY, JSON.stringify(outputs));
};

export const outputService = {
  // 获取所有产出
  async getAllOutputs(): Promise<Output[]> {
    return loadOutputs();
  },

  // 根据 ID 获取产出
  async getOutputById(id: string): Promise<Output | undefined> {
    const outputs = loadOutputs();
    return outputs.find((o) => o.id === id);
  },

  // 根据目标 ID 获取产出
  async getOutputsByGoal(goalId: string): Promise<Output[]> {
    const outputs = loadOutputs();
    return outputs.filter((o) => o.goalId === goalId);
  },

  // 根据类型获取产出
  async getOutputsByType(type: OutputType): Promise<Output[]> {
    const outputs = loadOutputs();
    return outputs.filter((o) => o.type === type);
  },

  // 获取时间范围内的产出
  async getOutputsByDateRange(start: string, end: string): Promise<Output[]> {
    const outputs = loadOutputs();
    const startDate = new Date(start);
    const endDate = new Date(end);
    return outputs.filter((o) => {
      const createdAt = new Date(o.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  },

  // 创建产出
  async createOutput(input: CreateOutputInput): Promise<Output> {
    const outputs = loadOutputs();
    const now = new Date().toISOString();
    const newOutput: Output = {
      ...input,
      id: `output_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    outputs.unshift(newOutput);
    saveOutputs(outputs);
    return newOutput;
  },

  // 更新产出
  async updateOutput(id: string, updates: Partial<CreateOutputInput>): Promise<Output | undefined> {
    const outputs = loadOutputs();
    const index = outputs.findIndex((o) => o.id === id);
    if (index === -1) return undefined;

    const updated: Output = {
      ...outputs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    outputs[index] = updated;
    saveOutputs(outputs);
    return updated;
  },

  // 删除产出
  async deleteOutput(id: string): Promise<boolean> {
    const outputs = loadOutputs();
    const index = outputs.findIndex((o) => o.id === id);
    if (index === -1) return false;

    outputs.splice(index, 1);
    saveOutputs(outputs);
    return true;
  },

  // 获取产出统计
  async getOutputStats(): Promise<{ total: number; byType: Record<OutputType, number>; byGoal: Record<string, number> }> {
    const outputs = loadOutputs();
    const byType: Record<string, number> = {};
    const byGoal: Record<string, number> = {};

    outputs.forEach((o) => {
      byType[o.type] = (byType[o.type] || 0) + 1;
      byGoal[o.goalId] = (byGoal[o.goalId] || 0) + 1;
    });

    return {
      total: outputs.length,
      byType: byType as Record<OutputType, number>,
      byGoal,
    };
  },

  // 按时间倒序获取产出
  async getOutputsSortedByDate(): Promise<Output[]> {
    const outputs = loadOutputs();
    return outputs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
