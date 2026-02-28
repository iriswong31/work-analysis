import { create } from 'zustand';
import { db } from '@/services/database';
import { priorityEngine } from '@/engines/priority/priorityEngine';
import { 
  EngineConfig, 
  EngineStatus, 
  DualEngineState, 
  PriorityScore,
  StrategyAdjustmentRecord,
  WorkProject,
  LifeProject,
} from '@/types/engine';
import { ShortTermTask, SeedPack, LongTermGoal, ImmediateContext } from '@/types/memory';

interface EngineState extends DualEngineState {
  // 优先级评估结果
  priorityScores: PriorityScore[];
  recommendedTasks: PriorityScore[];
  
  // 项目
  workProjects: WorkProject[];
  lifeProjects: LifeProject[];
  
  // 策略调整历史
  adjustmentHistory: StrategyAdjustmentRecord[];
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  
  // 操作方法
  initialize: () => Promise<void>;
  
  // 引擎配置
  updateConfig: (config: Partial<EngineConfig>) => Promise<void>;
  
  // 优先级评估
  evaluateTasks: (
    tasks: ShortTermTask[], 
    context: ImmediateContext | null,
    seedPack: SeedPack | null,
    goals: LongTermGoal[]
  ) => void;
  
  // 策略调整
  adjustStrategy: (
    feedbackRating: number, 
    feedbackComment: string,
    feedbackId: string
  ) => Promise<void>;
  
  // 项目管理
  addWorkProject: (project: Omit<WorkProject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  addLifeProject: (project: Omit<LifeProject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateWorkProject: (id: string, updates: Partial<WorkProject>) => Promise<void>;
  updateLifeProject: (id: string, updates: Partial<LifeProject>) => Promise<void>;
  
  // 刷新引擎状态
  refreshEngineStatus: (tasks: ShortTermTask[]) => void;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  // 初始状态
  config: {
    workRatio: 0.6,
    lifeRatio: 0.4,
    autoAdjust: true,
  },
  workEngine: {
    engine: 'work',
    activeTasks: 0,
    completedToday: 0,
    pendingTasks: 0,
    progress: 0,
  },
  lifeEngine: {
    engine: 'life',
    activeTasks: 0,
    completedToday: 0,
    pendingTasks: 0,
    progress: 0,
  },
  lastUpdated: new Date(),
  priorityScores: [],
  recommendedTasks: [],
  workProjects: [],
  lifeProjects: [],
  adjustmentHistory: [],
  isLoading: false,
  isInitialized: false,

  // 初始化
  initialize: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    
    const [configs, workProjects, lifeProjects, adjustments] = await Promise.all([
      db.engineConfig.toArray(),
      db.workProjects.toArray(),
      db.lifeProjects.toArray(),
      db.strategyAdjustments.orderBy('date').reverse().limit(10).toArray(),
    ]);

    const config = configs[0] || {
      workRatio: 0.6,
      lifeRatio: 0.4,
      autoAdjust: true,
    };

    set({
      config,
      workProjects,
      lifeProjects,
      adjustmentHistory: adjustments,
      isLoading: false,
      isInitialized: true,
    });
  },

  // 更新配置
  updateConfig: async (updates) => {
    const currentConfig = get().config;
    const newConfig = { ...currentConfig, ...updates };
    
    // 确保比例总和为 1
    if (updates.workRatio !== undefined) {
      newConfig.lifeRatio = 1 - newConfig.workRatio;
    } else if (updates.lifeRatio !== undefined) {
      newConfig.workRatio = 1 - newConfig.lifeRatio;
    }
    
    await db.engineConfig.clear();
    await db.engineConfig.add(newConfig);
    
    set({ config: newConfig, lastUpdated: new Date() });
  },

  // 评估任务优先级
  evaluateTasks: (tasks, context, seedPack, goals) => {
    const { config } = get();
    
    // 初始化优先级引擎
    priorityEngine.initialize(seedPack, goals, config);
    
    // 评估所有任务
    const priorityScores = priorityEngine.evaluateAndRankTasks(tasks, context);
    
    // 获取推荐任务
    const recommendedTasks = priorityEngine.getRecommendedTasks(tasks, context, 5);
    
    set({ priorityScores, recommendedTasks });
  },

  // 策略调整
  adjustStrategy: async (feedbackRating, feedbackComment, feedbackId) => {
    const { config } = get();
    
    // 使用优先级引擎计算新配置
    const newConfig = priorityEngine.adjustStrategy(feedbackRating, feedbackComment, config);
    
    // 如果配置有变化，记录调整历史
    if (newConfig.workRatio !== config.workRatio || newConfig.lifeRatio !== config.lifeRatio) {
      const adjustment: StrategyAdjustmentRecord = {
        id: `adj_${Date.now()}`,
        date: new Date(),
        trigger: 'feedback',
        previousConfig: config,
        newConfig,
        reason: `基于反馈评分 ${feedbackRating}/5 调整：${feedbackComment.slice(0, 100)}`,
        feedbackId,
      };
      
      await db.strategyAdjustments.add(adjustment);
      
      // 更新配置
      await get().updateConfig(newConfig);
      
      // 更新调整历史
      const adjustmentHistory = await db.strategyAdjustments
        .orderBy('date')
        .reverse()
        .limit(10)
        .toArray();
      
      set({ adjustmentHistory });
    }
  },

  // 添加 Work 项目
  addWorkProject: async (project) => {
    const id = `wp_${Date.now()}`;
    const newProject: WorkProject = {
      ...project,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.workProjects.add(newProject);
    const workProjects = await db.workProjects.toArray();
    set({ workProjects });
    return id;
  },

  // 添加 Life 项目
  addLifeProject: async (project) => {
    const id = `lp_${Date.now()}`;
    const newProject: LifeProject = {
      ...project,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.lifeProjects.add(newProject);
    const lifeProjects = await db.lifeProjects.toArray();
    set({ lifeProjects });
    return id;
  },

  // 更新 Work 项目
  updateWorkProject: async (id, updates) => {
    await db.workProjects.update(id, { ...updates, updatedAt: new Date() });
    const workProjects = await db.workProjects.toArray();
    set({ workProjects });
  },

  // 更新 Life 项目
  updateLifeProject: async (id, updates) => {
    await db.lifeProjects.update(id, { ...updates, updatedAt: new Date() });
    const lifeProjects = await db.lifeProjects.toArray();
    set({ lifeProjects });
  },

  // 刷新引擎状态
  refreshEngineStatus: (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const workTasks = tasks.filter(t => t.engine === 'work');
    const lifeTasks = tasks.filter(t => t.engine === 'life');
    
    const workActive = workTasks.filter(t => t.status === 'in_progress').length;
    const workPending = workTasks.filter(t => t.status === 'pending').length;
    const workCompleted = workTasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      new Date(t.completedAt) >= today
    ).length;
    const workTotal = workActive + workPending + workCompleted;
    
    const lifeActive = lifeTasks.filter(t => t.status === 'in_progress').length;
    const lifePending = lifeTasks.filter(t => t.status === 'pending').length;
    const lifeCompleted = lifeTasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      new Date(t.completedAt) >= today
    ).length;
    const lifeTotal = lifeActive + lifePending + lifeCompleted;
    
    set({
      workEngine: {
        engine: 'work',
        activeTasks: workActive,
        completedToday: workCompleted,
        pendingTasks: workPending,
        progress: workTotal > 0 ? Math.round((workCompleted / workTotal) * 100) : 0,
        topPriority: get().recommendedTasks.find(t => 
          tasks.find(task => task.id === t.taskId)?.engine === 'work'
        )?.taskId,
      },
      lifeEngine: {
        engine: 'life',
        activeTasks: lifeActive,
        completedToday: lifeCompleted,
        pendingTasks: lifePending,
        progress: lifeTotal > 0 ? Math.round((lifeCompleted / lifeTotal) * 100) : 0,
        topPriority: get().recommendedTasks.find(t => 
          tasks.find(task => task.id === t.taskId)?.engine === 'life'
        )?.taskId,
      },
      lastUpdated: new Date(),
    });
  },
}));

export default useEngineStore;
