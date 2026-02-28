/**
 * 反馈智能分类服务
 * 根据反馈内容自动分类并写入对应的记忆层
 */

// 反馈分类类型
export type FeedbackCategory = 
  | 'work_task'      // 工作任务相关
  | 'life_task'      // 第二人生相关
  | 'system_bug'     // 系统问题/Bug
  | 'ui_improvement' // UI/交互改进
  | 'feature_request'// 功能需求
  | 'strategy'       // 策略/决策相关
  | 'general';       // 一般反馈

// 记忆层类型
export type MemoryLayer = 
  | 'L1_情境层'       // 即时上下文、近期对话
  | 'L2_短期任务层'   // 短期任务调整
  | 'L3_中期计划层'   // 中期计划调整
  | 'L4_长期目标层'   // 长期目标调整
  | 'L5_核心身份层';  // 核心价值观调整

// 分类结果
export interface ClassificationResult {
  category: FeedbackCategory;
  memoryLayer: MemoryLayer;
  confidence: number;
  keywords: string[];
  suggestedAction: string;
}

// 分类规则
const classificationRules: {
  keywords: string[];
  category: FeedbackCategory;
  memoryLayer: MemoryLayer;
  weight: number;
}[] = [
  // 工作任务相关
  { 
    keywords: ['工作', 'work', '公益平台', '关爱平台', '善治美', '调研', '报告', '文档'],
    category: 'work_task',
    memoryLayer: 'L1_情境层',
    weight: 1.0
  },
  // 第二人生相关
  { 
    keywords: ['第二人生', 'life', '副业', 'AI变现', '内容工厂', '培训', '小程序'],
    category: 'life_task',
    memoryLayer: 'L1_情境层',
    weight: 1.0
  },
  // 系统Bug
  { 
    keywords: ['bug', '错误', '报错', '崩溃', '不工作', '失败', '问题', '无法'],
    category: 'system_bug',
    memoryLayer: 'L2_短期任务层',
    weight: 1.2
  },
  // UI改进
  { 
    keywords: ['界面', 'UI', '交互', '布局', '样式', '显示', '移除', '删除', '添加', '组件'],
    category: 'ui_improvement',
    memoryLayer: 'L2_短期任务层',
    weight: 1.1
  },
  // 功能需求
  { 
    keywords: ['希望', '需要', '功能', '支持', '能不能', '可以', '建议', '增加'],
    category: 'feature_request',
    memoryLayer: 'L3_中期计划层',
    weight: 0.9
  },
  // 策略相关
  { 
    keywords: ['策略', '方向', '目标', '规划', '计划', '优先级', '调整', '定位'],
    category: 'strategy',
    memoryLayer: 'L4_长期目标层',
    weight: 0.8
  },
];

class FeedbackClassifyService {
  /**
   * 对反馈进行智能分类
   */
  classify(feedbackContent: string, tags: string[] = []): ClassificationResult {
    const content = (feedbackContent + ' ' + tags.join(' ')).toLowerCase();
    
    // 计算每个规则的匹配分数
    const scores: { rule: typeof classificationRules[0]; score: number; matchedKeywords: string[] }[] = [];
    
    for (const rule of classificationRules) {
      const matchedKeywords: string[] = [];
      let score = 0;
      
      for (const keyword of rule.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          score += rule.weight;
        }
      }
      
      if (matchedKeywords.length > 0) {
        scores.push({ rule, score, matchedKeywords });
      }
    }
    
    // 按分数排序，取最高分
    scores.sort((a, b) => b.score - a.score);
    
    if (scores.length === 0) {
      // 无法分类，默认为一般反馈
      return {
        category: 'general',
        memoryLayer: 'L1_情境层',
        confidence: 0.3,
        keywords: [],
        suggestedAction: '记录到情境层作为近期对话参考'
      };
    }
    
    const best = scores[0];
    const confidence = Math.min(0.95, 0.5 + best.matchedKeywords.length * 0.15);
    
    return {
      category: best.rule.category,
      memoryLayer: best.rule.memoryLayer,
      confidence,
      keywords: best.matchedKeywords,
      suggestedAction: this.getSuggestedAction(best.rule.category, best.rule.memoryLayer)
    };
  }
  
  /**
   * 获取建议的处理动作
   */
  private getSuggestedAction(category: FeedbackCategory, layer: MemoryLayer): string {
    const actions: Record<FeedbackCategory, string> = {
      work_task: '更新情境层的工作任务状态和进展',
      life_task: '更新情境层的第二人生探索记录',
      system_bug: '创建短期任务修复Bug',
      ui_improvement: '创建短期任务优化UI',
      feature_request: '评估后添加到中期计划',
      strategy: '评估是否需要调整长期目标',
      general: '记录到情境层供参考'
    };
    return actions[category];
  }
  
  /**
   * 格式化反馈为YAML格式的记录
   */
  formatForMemory(
    feedbackContent: string, 
    classification: ClassificationResult,
    rating: number
  ): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    return `
  - date: ${dateStr}
    type: user_feedback
    rating: ${rating}
    category: ${classification.category}
    content: "${feedbackContent.replace(/"/g, '\\"')}"
    keywords: [${classification.keywords.map(k => `"${k}"`).join(', ')}]
    action: ${classification.suggestedAction}
    confidence: ${classification.confidence.toFixed(2)}
`;
  }
  
  /**
   * 获取记忆文件路径
   */
  getMemoryFilePath(layer: MemoryLayer): string {
    const basePath = '/Users/iriswong/CodeBuddy/iris-me/memory-system/Memory';
    return `${basePath}/${layer}.yaml`;
  }
}

export const feedbackClassifyService = new FeedbackClassifyService();
export default feedbackClassifyService;
