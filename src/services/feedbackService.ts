import { Feedback, ShortTermTask, SeedPack, LongTermGoal } from '@/types/memory';
import { PriorityScore, StrategyAdjustment } from '@/types/engine';
import { memoryService } from './memoryService';
import { feedbackClassifyService, ClassificationResult } from './feedbackClassifyService';

// 反馈处理与决策校准服务
export class FeedbackService {
  // 分析反馈并生成策略调整建议
  analyzeFeedback(
    feedback: Feedback,
    recentFeedbacks: Feedback[],
    currentTasks: ShortTermTask[],
    seedPack: SeedPack | null
  ): StrategyAdjustment {
    const adjustments: StrategyAdjustment = {
      priorityWeightChanges: {},
      engineRatioChange: null,
      newRules: [],
      deprecatedRules: [],
      reasoning: '',
    };

    // 1. 分析评分趋势
    const ratingTrend = this.analyzeRatingTrend(feedback, recentFeedbacks);
    
    // 2. 解析调整建议关键词
    const keywordAnalysis = this.analyzeAdjustmentKeywords(feedback.adjustments);
    
    // 3. 根据评分生成权重调整
    if (feedback.rating <= 2) {
      // 低评分：需要较大调整
      adjustments.priorityWeightChanges = {
        urgency: keywordAnalysis.urgencyMentioned ? 0.1 : 0,
        compoundValue: keywordAnalysis.valueMentioned ? 0.1 : 0,
        goalAlignment: keywordAnalysis.goalMentioned ? 0.1 : 0,
      };
      
      if (keywordAnalysis.workLifeMentioned) {
        adjustments.engineRatioChange = keywordAnalysis.preferWork 
          ? { work: 0.1, life: -0.1 }
          : { work: -0.1, life: 0.1 };
      }
    } else if (feedback.rating === 3) {
      // 中等评分：微调
      adjustments.priorityWeightChanges = {
        urgency: keywordAnalysis.urgencyMentioned ? 0.05 : 0,
        compoundValue: keywordAnalysis.valueMentioned ? 0.05 : 0,
      };
    }
    // 高评分（4-5）：保持当前策略

    // 4. 生成新规则
    if (feedback.comment && feedback.comment.length > 20) {
      const newRule = this.extractRuleFromComment(feedback.comment);
      if (newRule) {
        adjustments.newRules.push(newRule);
      }
    }

    // 5. 生成调整理由
    adjustments.reasoning = this.generateAdjustmentReasoning(
      feedback,
      ratingTrend,
      keywordAnalysis,
      adjustments
    );

    return adjustments;
  }

  // 分析评分趋势
  private analyzeRatingTrend(
    currentFeedback: Feedback,
    recentFeedbacks: Feedback[]
  ): 'improving' | 'declining' | 'stable' {
    if (recentFeedbacks.length < 3) return 'stable';

    const recentAvg = recentFeedbacks
      .slice(0, 5)
      .reduce((sum, f) => sum + f.rating, 0) / Math.min(5, recentFeedbacks.length);

    if (currentFeedback.rating > recentAvg + 0.5) return 'improving';
    if (currentFeedback.rating < recentAvg - 0.5) return 'declining';
    return 'stable';
  }

  // 分析调整建议中的关键词
  private analyzeAdjustmentKeywords(adjustments: string[]): {
    urgencyMentioned: boolean;
    valueMentioned: boolean;
    goalMentioned: boolean;
    workLifeMentioned: boolean;
    preferWork: boolean;
  } {
    const text = adjustments.join(' ').toLowerCase();
    
    return {
      urgencyMentioned: /紧急|urgent|deadline|截止/.test(text),
      valueMentioned: /复利|价值|长期|沉淀|资产/.test(text),
      goalMentioned: /目标|对齐|方向|战略/.test(text),
      workLifeMentioned: /work|life|工作|生活|平衡/.test(text),
      preferWork: /更多工作|work优先|工作优先/.test(text),
    };
  }

  // 从评论中提取规则
  private extractRuleFromComment(comment: string): string | null {
    // 简单的规则提取逻辑
    const rulePatterns = [
      /以后(.+)应该(.+)/,
      /希望(.+)能(.+)/,
      /建议(.+)/,
      /需要(.+)/,
    ];

    for (const pattern of rulePatterns) {
      const match = comment.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  // 生成调整理由
  private generateAdjustmentReasoning(
    feedback: Feedback,
    trend: string,
    keywords: ReturnType<typeof this.analyzeAdjustmentKeywords>,
    adjustments: StrategyAdjustment
  ): string {
    const parts: string[] = [];

    parts.push(`基于评分 ${feedback.rating}/5`);

    if (trend === 'improving') {
      parts.push('评分呈上升趋势，继续保持当前策略');
    } else if (trend === 'declining') {
      parts.push('评分呈下降趋势，需要调整策略');
    }

    if (Object.values(adjustments.priorityWeightChanges).some(v => v !== 0)) {
      parts.push('已调整优先级权重');
    }

    if (adjustments.engineRatioChange) {
      parts.push('已调整 Work/Life 引擎比例');
    }

    if (adjustments.newRules.length > 0) {
      parts.push(`新增 ${adjustments.newRules.length} 条决策规则`);
    }

    return parts.join('；');
  }

  // 将反馈沉淀到记忆层
  async sedimentFeedbackToMemory(
    feedback: Feedback,
    adjustment: StrategyAdjustment
  ): Promise<{ classification: ClassificationResult }> {
    // 1. 智能分类反馈
    const classification = feedbackClassifyService.classify(
      feedback.comment || '',
      feedback.adjustments
    );
    
    console.log('[FeedbackService] 反馈分类结果:', {
      category: classification.category,
      memoryLayer: classification.memoryLayer,
      confidence: classification.confidence,
      keywords: classification.keywords
    });

    // 2. 更新即时上下文
    const context = await memoryService.getTodayContext();
    if (context) {
      const feedbackNote = `[反馈-${classification.category}] 评分 ${feedback.rating}/5: ${feedback.comment || '无详细说明'} (置信度: ${(classification.confidence * 100).toFixed(0)}%)`;
      const updatedNotes = [
        ...(context.notes || []),
        feedbackNote,
      ];
      
      await memoryService.updateTodayContext({
        notes: updatedNotes.slice(-10), // 保留最近10条
      });
    }

    // 3. 根据分类决定是否需要进一步处理
    if (classification.category === 'system_bug' || classification.category === 'ui_improvement') {
      console.log('[FeedbackService] 检测到系统/UI问题，建议创建修复任务');
      // TODO: 自动创建短期任务
    }
    
    if (classification.category === 'feature_request' && classification.confidence > 0.7) {
      console.log('[FeedbackService] 检测到高置信度功能需求，建议添加到计划');
      // TODO: 添加到中期计划评估队列
    }

    // 4. 如果有新规则，考虑是否升级到更高层记忆
    if (adjustment.newRules.length > 0 && feedback.rating >= 4) {
      // 高评分时的规则更可能是有价值的
      console.log('[FeedbackService] 新规则待沉淀:', adjustment.newRules);
      // TODO: 实现规则沉淀到长期记忆的逻辑
    }

    // 5. 记录调整历史
    console.log('[FeedbackService] 策略调整已记录:', adjustment.reasoning);
    
    return { classification };
  }

  // 计算反馈对优先级评分的影响
  calculateFeedbackImpact(
    feedbacks: Feedback[],
    taskId: string
  ): number {
    const taskFeedbacks = feedbacks.filter(f => f.deliverableId === taskId);
    if (taskFeedbacks.length === 0) return 0;

    const avgRating = taskFeedbacks.reduce((sum, f) => sum + f.rating, 0) / taskFeedbacks.length;
    // 将 1-5 评分映射到 -0.2 到 0.2 的调整系数
    return (avgRating - 3) * 0.1;
  }

  // 生成反馈摘要
  generateFeedbackSummary(feedbacks: Feedback[]): {
    avgRating: number;
    totalCount: number;
    positiveCount: number;
    negativeCount: number;
    topAdjustments: string[];
    insights: string[];
  } {
    if (feedbacks.length === 0) {
      return {
        avgRating: 0,
        totalCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        topAdjustments: [],
        insights: ['暂无反馈数据'],
      };
    }

    const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
    const negativeCount = feedbacks.filter(f => f.rating <= 2).length;

    // 统计最常见的调整建议
    const adjustmentCounts: Record<string, number> = {};
    feedbacks.forEach(f => {
      f.adjustments.forEach(adj => {
        adjustmentCounts[adj] = (adjustmentCounts[adj] || 0) + 1;
      });
    });
    const topAdjustments = Object.entries(adjustmentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([adj]) => adj);

    // 生成洞察
    const insights: string[] = [];
    if (avgRating >= 4) {
      insights.push('系统运行良好，用户满意度高');
    } else if (avgRating <= 2) {
      insights.push('需要关注：用户满意度偏低，建议检查优先级策略');
    }

    if (positiveCount > negativeCount * 2) {
      insights.push('正向反馈占主导，策略方向正确');
    }

    return {
      avgRating,
      totalCount: feedbacks.length,
      positiveCount,
      negativeCount,
      topAdjustments,
      insights,
    };
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
