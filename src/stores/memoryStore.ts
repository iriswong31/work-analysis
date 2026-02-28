import { create } from 'zustand';
import { memoryService } from '@/services/memoryService';
import {
  CoreIdentityLayer,
  LongTermGoal,
  MidTermPlan,
  ShortTermTask,
  ImmediateContext,
  SeedPack,
  Deliverable,
  Feedback,
  DailyOutput,
} from '@/types/memory';

interface MemoryState {
  // 数据状态
  coreIdentity: CoreIdentityLayer | null;
  longTermGoals: LongTermGoal[];
  midTermPlans: MidTermPlan[];
  shortTermTasks: ShortTermTask[];
  immediateContext: ImmediateContext | null;
  seedPack: SeedPack | null;
  deliverables: Deliverable[];
  feedbacks: Feedback[];
  dailyOutputs: DailyOutput[];
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  
  // 操作方法
  initialize: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // 核心身份
  updateCoreIdentity: (identity: Partial<CoreIdentityLayer>) => Promise<void>;
  
  // Seed Pack
  importSeedPack: (pack: Omit<SeedPack, 'importedAt'>) => Promise<void>;
  
  // 长期目标
  addLongTermGoal: (goal: Omit<LongTermGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateLongTermGoal: (id: string, updates: Partial<LongTermGoal>) => Promise<void>;
  
  // 中期计划
  addMidTermPlan: (plan: Omit<MidTermPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMidTermPlan: (id: string, updates: Partial<MidTermPlan>) => Promise<void>;
  
  // 短期任务
  addShortTermTask: (task: Omit<ShortTermTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateShortTermTask: (id: string, updates: Partial<ShortTermTask>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  
  // 即时上下文
  updateTodayContext: (updates: Partial<ImmediateContext>) => Promise<void>;
  
  // 交付物与反馈
  addDeliverable: (deliverable: Omit<Deliverable, 'id' | 'createdAt'>) => Promise<string>;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => Promise<string>;
  
  // 每日产出
  saveDailyOutput: (output: Omit<DailyOutput, 'id' | 'createdAt'>) => Promise<string>;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  // 初始状态
  coreIdentity: null,
  longTermGoals: [],
  midTermPlans: [],
  shortTermTasks: [],
  immediateContext: null,
  seedPack: null,
  deliverables: [],
  feedbacks: [],
  dailyOutputs: [],
  isLoading: false,
  isInitialized: false,

  // 初始化
  initialize: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    
    const [
      coreIdentity,
      longTermGoals,
      midTermPlans,
      shortTermTasks,
      immediateContext,
      seedPack,
      deliverables,
      feedbacks,
      dailyOutputs,
    ] = await Promise.all([
      memoryService.getCoreIdentity(),
      memoryService.getLongTermGoals(),
      memoryService.getMidTermPlans(),
      memoryService.getShortTermTasks(),
      memoryService.getTodayContext(),
      memoryService.getSeedPack(),
      memoryService.getDeliverables(),
      memoryService.getFeedbacks(),
      memoryService.getRecentOutputs(30),
    ]);

    set({
      coreIdentity: coreIdentity || null,
      longTermGoals,
      midTermPlans,
      shortTermTasks,
      immediateContext: immediateContext || null,
      seedPack: seedPack || null,
      deliverables,
      feedbacks,
      dailyOutputs,
      isLoading: false,
      isInitialized: true,
    });
  },

  // 刷新所有数据
  refreshAll: async () => {
    set({ isLoading: true });
    
    const [
      coreIdentity,
      longTermGoals,
      midTermPlans,
      shortTermTasks,
      immediateContext,
      seedPack,
      deliverables,
      feedbacks,
      dailyOutputs,
    ] = await Promise.all([
      memoryService.getCoreIdentity(),
      memoryService.getLongTermGoals(),
      memoryService.getMidTermPlans(),
      memoryService.getShortTermTasks(),
      memoryService.getTodayContext(),
      memoryService.getSeedPack(),
      memoryService.getDeliverables(),
      memoryService.getFeedbacks(),
      memoryService.getRecentOutputs(30),
    ]);

    set({
      coreIdentity: coreIdentity || null,
      longTermGoals,
      midTermPlans,
      shortTermTasks,
      immediateContext: immediateContext || null,
      seedPack: seedPack || null,
      deliverables,
      feedbacks,
      dailyOutputs,
      isLoading: false,
    });
  },

  // 更新核心身份
  updateCoreIdentity: async (identity) => {
    await memoryService.updateCoreIdentity(identity);
    const updated = await memoryService.getCoreIdentity();
    set({ coreIdentity: updated || null });
  },

  // 导入 Seed Pack
  importSeedPack: async (pack) => {
    await memoryService.importSeedPack(pack);
    const seedPack = await memoryService.getSeedPack();
    const coreIdentity = await memoryService.getCoreIdentity();
    set({ seedPack: seedPack || null, coreIdentity: coreIdentity || null });
  },

  // 长期目标操作
  addLongTermGoal: async (goal) => {
    const id = await memoryService.addLongTermGoal(goal);
    const longTermGoals = await memoryService.getLongTermGoals();
    set({ longTermGoals });
    return id;
  },

  updateLongTermGoal: async (id, updates) => {
    await memoryService.updateLongTermGoal(id, updates);
    const longTermGoals = await memoryService.getLongTermGoals();
    set({ longTermGoals });
  },

  // 中期计划操作
  addMidTermPlan: async (plan) => {
    const id = await memoryService.addMidTermPlan(plan);
    const midTermPlans = await memoryService.getMidTermPlans();
    set({ midTermPlans });
    return id;
  },

  updateMidTermPlan: async (id, updates) => {
    await memoryService.updateMidTermPlan(id, updates);
    const midTermPlans = await memoryService.getMidTermPlans();
    set({ midTermPlans });
  },

  // 短期任务操作
  addShortTermTask: async (task) => {
    const id = await memoryService.addShortTermTask(task);
    const shortTermTasks = await memoryService.getShortTermTasks();
    set({ shortTermTasks });
    return id;
  },

  updateShortTermTask: async (id, updates) => {
    await memoryService.updateShortTermTask(id, updates);
    const shortTermTasks = await memoryService.getShortTermTasks();
    set({ shortTermTasks });
  },

  completeTask: async (id) => {
    await memoryService.completeTask(id);
    const shortTermTasks = await memoryService.getShortTermTasks();
    set({ shortTermTasks });
  },

  // 即时上下文操作
  updateTodayContext: async (updates) => {
    await memoryService.updateTodayContext(updates);
    const immediateContext = await memoryService.getTodayContext();
    set({ immediateContext: immediateContext || null });
  },

  // 交付物与反馈操作
  addDeliverable: async (deliverable) => {
    const id = await memoryService.addDeliverable(deliverable);
    const deliverables = await memoryService.getDeliverables();
    set({ deliverables });
    return id;
  },

  addFeedback: async (feedback) => {
    const id = await memoryService.addFeedback(feedback);
    const feedbacks = await memoryService.getFeedbacks();
    set({ feedbacks });
    return id;
  },

  // 每日产出操作
  saveDailyOutput: async (output) => {
    const id = await memoryService.saveDailyOutput(output);
    const dailyOutputs = await memoryService.getRecentOutputs(30);
    set({ dailyOutputs });
    return id;
  },
}));

export default useMemoryStore;
