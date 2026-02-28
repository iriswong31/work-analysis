/**
 * 产出反馈服务
 * 负责保存用户对产出的反馈到记忆系统
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface OutputFeedback {
  id: string;
  outputId: string;
  outputTitle: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// 内存中的反馈存储（用于前端）
let feedbackCache: OutputFeedback[] = [];

// 从 localStorage 加载反馈
const loadFeedbackFromStorage = (): OutputFeedback[] => {
  try {
    const stored = localStorage.getItem('output_feedbacks');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('加载反馈失败:', error);
  }
  return [];
};

// 保存反馈到 localStorage
const saveFeedbackToStorage = (feedbacks: OutputFeedback[]) => {
  try {
    localStorage.setItem('output_feedbacks', JSON.stringify(feedbacks));
  } catch (error) {
    console.error('保存反馈失败:', error);
  }
};

export const outputFeedbackService = {
  /**
   * 初始化服务
   */
  initialize() {
    feedbackCache = loadFeedbackFromStorage();
  },

  /**
   * 添加产出反馈
   */
  async addFeedback(
    outputId: string,
    outputTitle: string,
    rating: number,
    comment: string
  ): Promise<OutputFeedback> {
    const feedback: OutputFeedback = {
      id: `feedback_${Date.now()}`,
      outputId,
      outputTitle,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    feedbackCache.unshift(feedback);
    saveFeedbackToStorage(feedbackCache);

    // 同时保存到记忆系统的 L2 行为层
    await this.saveToMemorySystem(feedback);

    return feedback;
  },

  /**
   * 获取所有反馈
   */
  getAllFeedbacks(): OutputFeedback[] {
    if (feedbackCache.length === 0) {
      feedbackCache = loadFeedbackFromStorage();
    }
    return feedbackCache;
  },

  /**
   * 获取某个产出的反馈
   */
  getFeedbackByOutputId(outputId: string): OutputFeedback | undefined {
    return feedbackCache.find(f => f.outputId === outputId);
  },

  /**
   * 获取反馈统计
   */
  getFeedbackStats(): {
    total: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  } {
    const feedbacks = this.getAllFeedbacks();
    const total = feedbacks.length;
    
    if (total === 0) {
      return {
        total: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => {
      distribution[f.rating] = (distribution[f.rating] || 0) + 1;
    });

    return {
      total,
      averageRating: Math.round((sum / total) * 10) / 10,
      ratingDistribution: distribution,
    };
  },

  /**
   * 保存反馈到记忆系统 L2 行为层
   * 这个方法会尝试更新 memory-system/Memory/L2_行为层.yaml
   */
  async saveToMemorySystem(feedback: OutputFeedback): Promise<void> {
    try {
      // 构建反馈洞察
      const insight = this.generateInsight(feedback);
      
      // 保存到 localStorage 的洞察队列
      const insightsKey = 'memory_insights_queue';
      const existingInsights = JSON.parse(localStorage.getItem(insightsKey) || '[]');
      existingInsights.push({
        type: 'output_feedback',
        source: feedback.outputId,
        content: insight,
        rating: feedback.rating,
        timestamp: feedback.createdAt,
      });
      localStorage.setItem(insightsKey, JSON.stringify(existingInsights));

      console.log('反馈已保存到记忆系统洞察队列:', insight);
    } catch (error) {
      console.error('保存到记忆系统失败:', error);
    }
  },

  /**
   * 根据反馈生成洞察
   */
  generateInsight(feedback: OutputFeedback): string {
    const ratingLabels = ['', '需大幅改进', '需要改进', '基本满意', '满意', '非常满意'];
    const ratingLabel = ratingLabels[feedback.rating];
    
    let insight = `产出「${feedback.outputTitle}」评价：${ratingLabel}（${feedback.rating}/5）`;
    
    if (feedback.comment) {
      insight += `。用户反馈：${feedback.comment}`;
    }

    // 根据评分添加行动建议
    if (feedback.rating <= 2) {
      insight += '。【需关注】此类产出需要改进，下次执行类似任务时应特别注意质量把控。';
    } else if (feedback.rating >= 4) {
      insight += '。【可复用】此类产出效果良好，可作为后续类似任务的参考模板。';
    }

    return insight;
  },

  /**
   * 获取记忆系统中的洞察队列
   */
  getMemoryInsights(): Array<{
    type: string;
    source: string;
    content: string;
    rating: number;
    timestamp: string;
  }> {
    try {
      const insightsKey = 'memory_insights_queue';
      return JSON.parse(localStorage.getItem(insightsKey) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * 导出反馈数据为 YAML 格式（用于同步到记忆系统文件）
   */
  exportFeedbacksAsYaml(): string {
    const feedbacks = this.getAllFeedbacks();
    const insights = feedbacks.map(f => ({
      id: f.id,
      output: f.outputTitle,
      rating: f.rating,
      comment: f.comment || '无',
      insight: this.generateInsight(f),
      date: f.createdAt.split('T')[0],
    }));

    return `# 产出反馈洞察
# 自动生成于 ${new Date().toISOString()}
# 用于数字分身学习和优化

feedbacks:
${insights.map(i => `  - id: "${i.id}"
    output: "${i.output}"
    rating: ${i.rating}
    comment: "${i.comment}"
    insight: "${i.insight}"
    date: "${i.date}"`).join('\n')}
`;
  },
};

// 初始化
if (typeof window !== 'undefined') {
  outputFeedbackService.initialize();
}

export default outputFeedbackService;
