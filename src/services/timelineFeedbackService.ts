// 时间轴反馈服务 - 管理用户对产出的反馈
import type { Feedback, CreateFeedbackInput, FeedbackRating } from '@/types/goal-timeline';

// 本地存储 key
const FEEDBACK_STORAGE_KEY = 'iris-timeline-feedback';

// 初始反馈数据（示例）
const initialFeedback: Feedback[] = [
  {
    id: 'feedback_1736236800001',
    outputId: 'output_1736236800000',
    rating: 5,
    comment: '调研报告非常全面，对后续 Agent 架构设计很有帮助！',
    meetsExpectation: true,
    createdAt: '2026-01-07T12:00:00+08:00',
  },
];

// 从 localStorage 加载数据
const loadFeedback = (): Feedback[] => {
  if (typeof window === 'undefined') return initialFeedback;
  const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(initialFeedback));
    return initialFeedback;
  }
  return JSON.parse(stored);
};

// 保存数据到 localStorage
const saveFeedback = (feedback: Feedback[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
};

export const timelineFeedbackService = {
  // 获取所有反馈
  async getAllFeedback(): Promise<Feedback[]> {
    return loadFeedback();
  },

  // 根据产出 ID 获取反馈
  async getFeedbackByOutputId(outputId: string): Promise<Feedback | undefined> {
    const feedback = loadFeedback();
    return feedback.find((f) => f.outputId === outputId);
  },

  // 根据 ID 获取反馈
  async getFeedbackById(id: string): Promise<Feedback | undefined> {
    const feedback = loadFeedback();
    return feedback.find((f) => f.id === id);
  },

  // 创建反馈
  async createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
    const feedback = loadFeedback();
    
    // 检查是否已存在该产出的反馈
    const existingIndex = feedback.findIndex((f) => f.outputId === input.outputId);
    
    const newFeedback: Feedback = {
      ...input,
      id: `feedback_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      // 更新已有反馈
      feedback[existingIndex] = newFeedback;
    } else {
      // 添加新反馈
      feedback.unshift(newFeedback);
    }
    
    saveFeedback(feedback);
    return newFeedback;
  },

  // 更新反馈
  async updateFeedback(id: string, updates: Partial<Omit<CreateFeedbackInput, 'outputId'>>): Promise<Feedback | undefined> {
    const feedback = loadFeedback();
    const index = feedback.findIndex((f) => f.id === id);
    if (index === -1) return undefined;

    const updated: Feedback = {
      ...feedback[index],
      ...updates,
    };
    feedback[index] = updated;
    saveFeedback(feedback);
    return updated;
  },

  // 删除反馈
  async deleteFeedback(id: string): Promise<boolean> {
    const feedback = loadFeedback();
    const index = feedback.findIndex((f) => f.id === id);
    if (index === -1) return false;

    feedback.splice(index, 1);
    saveFeedback(feedback);
    return true;
  },

  // 获取反馈统计
  async getFeedbackStats(): Promise<{
    total: number;
    averageRating: number;
    meetsExpectationRate: number;
    ratingDistribution: Record<FeedbackRating, number>;
  }> {
    const feedback = loadFeedback();
    
    if (feedback.length === 0) {
      return {
        total: 0,
        averageRating: 0,
        meetsExpectationRate: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
    const meetsCount = feedback.filter((f) => f.meetsExpectation).length;
    const ratingDistribution: Record<FeedbackRating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    feedback.forEach((f) => {
      ratingDistribution[f.rating]++;
    });

    return {
      total: feedback.length,
      averageRating: Math.round((totalRating / feedback.length) * 10) / 10,
      meetsExpectationRate: Math.round((meetsCount / feedback.length) * 100),
      ratingDistribution,
    };
  },

  // 获取高评分产出
  async getHighRatedOutputIds(minRating: FeedbackRating = 4): Promise<string[]> {
    const feedback = loadFeedback();
    return feedback.filter((f) => f.rating >= minRating).map((f) => f.outputId);
  },
};
