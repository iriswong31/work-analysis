import { 
  ShortTermTask, 
  Feedback, 
  DailyDiary, 
  PublicArticle, 
  DailyOutput,
  SeedPack,
  PriorityDecision
} from '@/types/memory';
import { PriorityScore } from '@/types/engine';

// 内容生成服务
export class ContentGenerator {
  private seedPack: SeedPack | null = null;

  constructor() {}

  setSeedPack(seedPack: SeedPack | null) {
    this.seedPack = seedPack;
  }

  // 生成每日复盘日记
  generateDailyDiary(
    completedTasks: ShortTermTask[],
    feedbacks: Feedback[],
    priorityScores: PriorityScore[],
    tasks: ShortTermTask[]
  ): DailyDiary {
    // 今日完成的事项
    const whatDone = completedTasks.map(task => {
      const engineLabel = task.engine === 'work' ? '[Work]' : '[Life]';
      return `${engineLabel} ${task.title}`;
    });

    // 收到的反馈
    const feedbackSummary = feedbacks
      .filter(f => f.rating > 0)
      .map(f => {
        const ratingText = f.rating >= 4 ? '满意' : f.rating >= 3 ? '一般' : '需改进';
        return `评分 ${f.rating}/5 (${ratingText}): ${f.comment || '无详细说明'}`;
      });

    // 提炼收获
    const insights = this.extractInsights(completedTasks, feedbacks);

    // 下一步计划
    const nextSteps = this.generateNextSteps(tasks, priorityScores);

    // 优先级决策回顾
    const priorityDecisions: PriorityDecision[] = priorityScores
      .slice(0, 5)
      .map(score => {
        const task = tasks.find(t => t.id === score.taskId);
        return {
          taskId: score.taskId,
          taskTitle: task?.title || '未知任务',
          score: score.totalScore,
          reasoning: score.reasoning,
        };
      });

    return {
      whatDone,
      feedback: feedbackSummary,
      insights,
      nextSteps,
      priorityDecisions,
    };
  }

  // 生成公众号文章
  generatePublicArticle(
    diary: DailyDiary,
    dayNumber: number = 1
  ): PublicArticle {
    const themes = [
      '数字分身如何帮我做决策',
      '用复利思维管理时间',
      'AI 时代的个人效能系统',
      '从任务清单到复利资产',
      '让 AI 成为你的第二大脑',
    ];

    const theme = themes[dayNumber % themes.length];
    
    // 生成文章内容
    const content = this.composeArticle(diary, theme, dayNumber);
    
    // 提取标签
    const tags = this.extractTags(diary);

    return {
      title: this.generateTitle(theme, dayNumber),
      content,
      theme: 'AI数字分身实验',
      wordCount: content.length,
      tags,
      publishReady: content.length >= 300 && content.length <= 1000,
    };
  }

  // 生成完整的每日产出
  generateDailyOutput(
    completedTasks: ShortTermTask[],
    feedbacks: Feedback[],
    priorityScores: PriorityScore[],
    tasks: ShortTermTask[],
    dayNumber: number = 1
  ): Omit<DailyOutput, 'id' | 'createdAt'> {
    const diary = this.generateDailyDiary(completedTasks, feedbacks, priorityScores, tasks);
    const article = this.generatePublicArticle(diary, dayNumber);

    return {
      date: new Date(),
      diary,
      article,
    };
  }

  // 提炼收获
  private extractInsights(tasks: ShortTermTask[], feedbacks: Feedback[]): string[] {
    const insights: string[] = [];

    // 从完成的任务中提炼
    const highValueTasks = tasks.filter(t => t.compoundValue >= 70);
    if (highValueTasks.length > 0) {
      insights.push(`完成了 ${highValueTasks.length} 个高复利价值任务，为长期目标积累了资产`);
    }

    // 从任务分布中提炼
    const workTasks = tasks.filter(t => t.engine === 'work');
    const lifeTasks = tasks.filter(t => t.engine === 'life');
    if (workTasks.length > 0 && lifeTasks.length > 0) {
      insights.push(`Work/Life 双引擎均有产出，保持了平衡`);
    }

    // 从反馈中提炼
    const positiveFeedbacks = feedbacks.filter(f => f.rating >= 4);
    if (positiveFeedbacks.length > 0) {
      insights.push(`收到 ${positiveFeedbacks.length} 条正向反馈，系统运行良好`);
    }

    const negativeFeedbacks = feedbacks.filter(f => f.rating <= 2);
    if (negativeFeedbacks.length > 0) {
      insights.push(`发现 ${negativeFeedbacks.length} 个需要改进的点，已触发策略调整`);
    }

    // 如果没有提炼出任何收获，添加默认内容
    if (insights.length === 0) {
      insights.push('今日稳步推进，持续积累复利');
    }

    return insights;
  }

  // 生成下一步计划
  private generateNextSteps(tasks: ShortTermTask[], scores: PriorityScore[]): string[] {
    const steps: string[] = [];

    // 找出明天应该优先处理的任务
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const topPending = scores
      .filter(s => pendingTasks.some(t => t.id === s.taskId))
      .slice(0, 3);

    topPending.forEach((score, index) => {
      const task = tasks.find(t => t.id === score.taskId);
      if (task) {
        const prefix = index === 0 ? '首先' : index === 1 ? '然后' : '接着';
        steps.push(`${prefix}处理「${task.title}」(优先级: ${score.totalScore.toFixed(1)})`);
      }
    });

    // 添加通用建议
    if (steps.length === 0) {
      steps.push('回顾长期目标，确保任务与目标对齐');
      steps.push('检查是否有可以沉淀为模板的工作');
    }

    return steps;
  }

  // 生成文章标题
  private generateTitle(theme: string, dayNumber: number): string {
    const titleTemplates = [
      `Day ${dayNumber}: ${theme}`,
      `数字分身实验日记 #${dayNumber}`,
      `AI 协作第 ${dayNumber} 天：${theme}`,
      `复利系统实验记录 Day${dayNumber}`,
    ];
    return titleTemplates[dayNumber % titleTemplates.length];
  }

  // 组合文章内容
  private composeArticle(diary: DailyDiary, theme: string, dayNumber: number): string {
    const sections: string[] = [];

    // 开头
    sections.push(`这是我与数字分身协作的第 ${dayNumber} 天。`);
    sections.push('');

    // 今日亮点
    if (diary.whatDone.length > 0) {
      sections.push('【今日亮点】');
      const highlights = diary.whatDone.slice(0, 3).map(item => `• ${item}`);
      sections.push(highlights.join('\n'));
      sections.push('');
    }

    // 核心洞察
    if (diary.insights.length > 0) {
      sections.push('【一点思考】');
      sections.push(diary.insights[0]);
      sections.push('');
    }

    // 关于主题的思考
    sections.push(`【关于"${theme}"】`);
    sections.push(this.generateThemeContent(theme, diary));
    sections.push('');

    // 结尾
    sections.push('---');
    sections.push('这个实验的核心不是追求效率最大化，而是探索人与 AI 协作的可能性。');
    sections.push('让 AI 帮我们更好地认识自己、发挥天赋、过上自由幸福的生活。');

    return sections.join('\n');
  }

  // 根据主题生成内容
  private generateThemeContent(theme: string, diary: DailyDiary): string {
    const themeContents: Record<string, string> = {
      '数字分身如何帮我做决策': 
        '数字分身不是替我做决策，而是帮我看清决策的依据。它会告诉我每个任务的复利价值、紧急程度、与长期目标的对齐度。最终选择权在我，但信息更透明了。',
      
      '用复利思维管理时间': 
        '不是所有任务都值得做。复利思维的核心是：优先做那些能沉淀为可复用资产的事。今天写的模板，明天可以直接用；今天整理的方法论，以后可以教给别人。',
      
      'AI 时代的个人效能系统': 
        'AI 不会让我们更忙，而是让我们更清醒。当 AI 帮我处理信息整理、优先级排序、内容生成这些事时，我有更多精力思考真正重要的问题。',
      
      '从任务清单到复利资产': 
        '普通的任务清单只记录"做什么"，复利系统还要问"做完之后留下什么"。每完成一个任务，都要想：这能不能变成模板？能不能写成文章？能不能教给别人？',
      
      '让 AI 成为你的第二大脑': 
        'AI 记得我说过的每一句话、做过的每一个决定。它不会忘记，不会疲惫，不会情绪化。但它也不会替代我思考——它是放大器，不是替代品。',
    };

    return themeContents[theme] || 
      '每天与数字分身协作，都在探索人机协作的边界。重要的不是 AI 有多强，而是我们如何借助 AI 成为更好的自己。';
  }

  // 提取标签
  private extractTags(diary: DailyDiary): string[] {
    const tags = ['AI数字分身', '复利系统'];

    // 根据任务类型添加标签
    const hasWork = diary.whatDone.some(item => item.includes('[Work]'));
    const hasLife = diary.whatDone.some(item => item.includes('[Life]'));

    if (hasWork) tags.push('效率提升');
    if (hasLife) tags.push('个人成长');

    // 根据收获添加标签
    if (diary.insights.some(i => i.includes('复利'))) {
      tags.push('复利思维');
    }

    return tags.slice(0, 5);
  }
}

// 导出单例
export const contentGenerator = new ContentGenerator();
export default contentGenerator;
