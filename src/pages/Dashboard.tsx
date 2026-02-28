import { useEffect, useState } from 'react';
import { useMemoryStore } from '@/stores/memoryStore';
import { useEngineStore } from '@/stores/engineStore';
import { initializeDatabase } from '@/services/database';
import { feedbackService } from '@/services/feedbackService';

import { dashboardDataService } from '@/services/dashboardDataService';
import { EngineStatusPanel } from '@/components/dashboard/EngineStatusPanel';
import { FeedbackPanel } from '@/components/dashboard/FeedbackPanel';
import { FeedbackHistory } from '@/components/dashboard/FeedbackHistory';
import { DailyTimeline } from '@/components/dashboard/DailyTimeline';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Settings, 
  Clock
} from 'lucide-react';

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workTotalCompleted, setWorkTotalCompleted] = useState(0);
  const [lifeTotalCompleted, setLifeTotalCompleted] = useState(0);

  // Memory Store
  const {
    coreIdentity,
    longTermGoals,
    midTermPlans,
    shortTermTasks,
    immediateContext,
    seedPack,
    feedbacks,
    initialize: initMemory,
    addShortTermTask,
    addFeedback,
  } = useMemoryStore();

  // Engine Store
  const {
    config,
    workEngine,
    lifeEngine,
    initialize: initEngine,
    updateConfig,
    evaluateTasks,
    adjustStrategy,
    refreshEngineStatus,
  } = useEngineStore();

  // 初始化
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await initMemory();
      await initEngine();
      
      // 加载产出统计
      const stats = await dashboardDataService.getEngineStats();
      const workStats = stats.find(s => s.type === 'work');
      const lifeStats = stats.find(s => s.type === 'life');
      if (workStats) setWorkTotalCompleted(workStats.totalCompleted);
      if (lifeStats) setLifeTotalCompleted(lifeStats.totalCompleted);
      
      // 加载今日进度数据
      const todayProgress = await dashboardDataService.getTodayProgress();
      refreshEngineStatusFromOutputs(todayProgress);
      
      setIsLoading(false);
    };
    init();
  }, []);

  // 从产出数据刷新引擎状态
  const refreshEngineStatusFromOutputs = (progress: {
    work: { inProgress: number; completed: number; pending: number; progress: number };
    life: { inProgress: number; completed: number; pending: number; progress: number };
  }) => {
    // 更新 engineStore 中的状态
    useEngineStore.setState({
      workEngine: {
        engine: 'work',
        activeTasks: progress.work.inProgress,
        completedToday: progress.work.completed,
        pendingTasks: progress.work.pending,
        progress: progress.work.progress,
      },
      lifeEngine: {
        engine: 'life',
        activeTasks: progress.life.inProgress,
        completedToday: progress.life.completed,
        pendingTasks: progress.life.pending,
        progress: progress.life.progress,
      },
      lastUpdated: new Date(),
    });
  };

  // 评估任务优先级
  useEffect(() => {
    if (shortTermTasks.length > 0) {
      evaluateTasks(shortTermTasks, immediateContext, seedPack, longTermGoals);
      refreshEngineStatus(shortTermTasks);
    }
  }, [shortTermTasks, immediateContext, seedPack, longTermGoals]);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 处理反馈提交
  const handleFeedbackSubmit = async (rating: number, comment: string, adjustments: string[]) => {
    // 保存反馈
    const feedbackId = await addFeedback({
      deliverableId: 'daily_feedback',
      rating,
      comment,
      adjustments,
      insights: [],
    });

    // 分析反馈并生成策略调整
    const recentFeedbacks = feedbacks.slice(0, 10);
    const adjustment = feedbackService.analyzeFeedback(
      { id: feedbackId, deliverableId: 'daily_feedback', rating, comment, adjustments, insights: [], createdAt: new Date() },
      recentFeedbacks,
      shortTermTasks,
      seedPack
    );

    // 沉淀反馈到记忆层
    await feedbackService.sedimentFeedbackToMemory(
      { id: feedbackId, deliverableId: 'daily_feedback', rating, comment, adjustments, insights: [], createdAt: new Date() },
      adjustment
    );

    // 触发策略调整
    await adjustStrategy(rating, comment, feedbackId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-iris-dark flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-iris-primary animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">正在唤醒数字分身...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iris-dark via-iris-darker to-iris-navy">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iris-primary to-iris-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Iris 数字分身</h1>
              <p className="text-zinc-500 text-xs">复利系统 v1.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-iris-dark/50">
              <div className="w-2 h-2 rounded-full bg-iris-success animate-pulse" />
              <span className="text-xs text-zinc-400">系统运行中</span>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 欢迎信息 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">
              {coreIdentity?.name ? `你好，${coreIdentity.name}` : '欢迎回来'}
            </h2>
            <p className="text-zinc-400">
              {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
              {immediateContext?.mood && ` · 当前状态: ${immediateContext.mood}`}
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* 左侧：双引擎状态 + 每日产出时间轴 */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* 双引擎状态面板 */}
              <EngineStatusPanel
                workEngine={workEngine}
                lifeEngine={lifeEngine}
                config={config}
                onConfigChange={updateConfig}
                workTotalCompleted={workTotalCompleted}
                lifeTotalCompleted={lifeTotalCompleted}
              />

              {/* 每日产出时间轴 */}
              <DailyTimeline />
            </div>

            {/* 右侧：反馈面板 + 反馈历史 */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* 反馈面板 */}
              <FeedbackPanel onSubmit={handleFeedbackSubmit} />

              {/* 反馈历史 */}
              <FeedbackHistory feedbacks={feedbacks} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
