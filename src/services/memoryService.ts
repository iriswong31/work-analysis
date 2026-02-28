import { db } from './database';
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
  MemoryArchitecture,
} from '@/types/memory';

// 五层记忆服务
export const memoryService = {
  // ========== 核心身份层 ==========
  async getCoreIdentity(): Promise<CoreIdentityLayer | undefined> {
    const identities = await db.coreIdentity.toArray();
    return identities[0];
  },

  async updateCoreIdentity(identity: Partial<CoreIdentityLayer>): Promise<void> {
    const existing = await this.getCoreIdentity();
    if (existing) {
      await db.coreIdentity.update(1, {
        ...identity,
        updatedAt: new Date(),
      });
    } else {
      await db.coreIdentity.add({
        name: identity.name || '',
        roles: identity.roles || [],
        coreValues: identity.coreValues || [],
        missionStatement: identity.missionStatement || '',
        personalBrand: identity.personalBrand || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },

  // ========== 长期目标层 ==========
  async getLongTermGoals(category?: 'work' | 'life'): Promise<LongTermGoal[]> {
    if (category) {
      return db.longTermGoals.where('category').equals(category).toArray();
    }
    return db.longTermGoals.toArray();
  },

  async addLongTermGoal(goal: Omit<LongTermGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `goal_${Date.now()}`;
    await db.longTermGoals.add({
      ...goal,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async updateLongTermGoal(id: string, updates: Partial<LongTermGoal>): Promise<void> {
    await db.longTermGoals.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  // ========== 中期计划层 ==========
  async getMidTermPlans(goalId?: string): Promise<MidTermPlan[]> {
    if (goalId) {
      return db.midTermPlans.where('goalId').equals(goalId).toArray();
    }
    return db.midTermPlans.toArray();
  },

  async addMidTermPlan(plan: Omit<MidTermPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `plan_${Date.now()}`;
    await db.midTermPlans.add({
      ...plan,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async updateMidTermPlan(id: string, updates: Partial<MidTermPlan>): Promise<void> {
    await db.midTermPlans.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  // ========== 短期任务层 ==========
  async getShortTermTasks(filter?: {
    engine?: 'work' | 'life';
    status?: ShortTermTask['status'];
    planId?: string;
  }): Promise<ShortTermTask[]> {
    let query = db.shortTermTasks.toCollection();
    
    if (filter?.engine) {
      query = db.shortTermTasks.where('engine').equals(filter.engine);
    }
    
    const tasks = await query.toArray();
    
    return tasks.filter(task => {
      if (filter?.status && task.status !== filter.status) return false;
      if (filter?.planId && task.planId !== filter.planId) return false;
      return true;
    });
  },

  async addShortTermTask(task: Omit<ShortTermTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `task_${Date.now()}`;
    await db.shortTermTasks.add({
      ...task,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  },

  async updateShortTermTask(id: string, updates: Partial<ShortTermTask>): Promise<void> {
    await db.shortTermTasks.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async completeTask(id: string): Promise<void> {
    await db.shortTermTasks.update(id, {
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  },

  // ========== 即时上下文层 ==========
  async getTodayContext(): Promise<ImmediateContext | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const contexts = await db.immediateContext
      .where('date')
      .equals(today)
      .toArray();
    
    return contexts[0];
  },

  async updateTodayContext(updates: Partial<ImmediateContext>): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await this.getTodayContext();
    if (existing) {
      await db.immediateContext.where('date').equals(today).modify({
        ...updates,
        updatedAt: new Date(),
      });
    } else {
      await db.immediateContext.add({
        date: today,
        availableHours: updates.availableHours || 8,
        priorities: updates.priorities || [],
        blockers: updates.blockers || [],
        notes: updates.notes || '',
        todayTasks: updates.todayTasks || [],
        completedTasks: updates.completedTasks || [],
        updatedAt: new Date(),
      });
    }
  },

  // ========== Seed Pack ==========
  async getSeedPack(): Promise<SeedPack | undefined> {
    const packs = await db.seedPack.toArray();
    return packs[0];
  },

  async importSeedPack(pack: Omit<SeedPack, 'importedAt'>): Promise<void> {
    // 清除旧的 seed pack
    await db.seedPack.clear();
    
    await db.seedPack.add({
      ...pack,
      importedAt: new Date(),
    });
    
    // 同步更新核心身份层
    await this.updateCoreIdentity({
      name: pack.identity.name,
      roles: pack.identity.roles,
      coreValues: pack.identity.coreValues,
      missionStatement: pack.identity.missionStatement,
    });
  },

  // ========== 交付物与反馈 ==========
  async addDeliverable(deliverable: Omit<Deliverable, 'id' | 'createdAt'>): Promise<string> {
    const id = `del_${Date.now()}`;
    await db.deliverables.add({
      ...deliverable,
      id,
      createdAt: new Date(),
    });
    return id;
  },

  async getDeliverables(taskId?: string): Promise<Deliverable[]> {
    if (taskId) {
      return db.deliverables.where('taskId').equals(taskId).toArray();
    }
    return db.deliverables.orderBy('createdAt').reverse().toArray();
  },

  async addFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<string> {
    const id = `fb_${Date.now()}`;
    await db.feedbacks.add({
      ...feedback,
      id,
      createdAt: new Date(),
    });
    return id;
  },

  async getFeedbacks(deliverableId?: string): Promise<Feedback[]> {
    if (deliverableId) {
      return db.feedbacks.where('deliverableId').equals(deliverableId).toArray();
    }
    return db.feedbacks.orderBy('createdAt').reverse().toArray();
  },

  // ========== 每日产出 ==========
  async saveDailyOutput(output: Omit<DailyOutput, 'id' | 'createdAt'>): Promise<string> {
    const dateStr = output.date.toISOString().split('T')[0];
    const id = `output_${dateStr}`;
    
    const existing = await db.dailyOutputs.get(id);
    if (existing) {
      await db.dailyOutputs.update(id, output);
    } else {
      await db.dailyOutputs.add({
        ...output,
        id,
        createdAt: new Date(),
      });
    }
    return id;
  },

  async getDailyOutput(date: Date): Promise<DailyOutput | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    const id = `output_${dateStr}`;
    return db.dailyOutputs.get(id);
  },

  async getRecentOutputs(days: number = 7): Promise<DailyOutput[]> {
    const outputs = await db.dailyOutputs.orderBy('date').reverse().limit(days).toArray();
    return outputs;
  },

  // ========== 聚合查询 ==========
  async getFullMemoryArchitecture(): Promise<MemoryArchitecture | null> {
    const coreIdentity = await this.getCoreIdentity();
    if (!coreIdentity) return null;
    
    const longTermGoals = await this.getLongTermGoals();
    const midTermPlans = await this.getMidTermPlans();
    const shortTermTasks = await this.getShortTermTasks();
    const immediateContext = await this.getTodayContext();
    
    if (!immediateContext) return null;
    
    return {
      coreIdentity,
      longTermGoals,
      midTermPlans,
      shortTermTasks,
      immediateContext,
    };
  },

  // 获取今日待办任务（按优先级排序）
  async getTodayTasks(): Promise<ShortTermTask[]> {
    const tasks = await this.getShortTermTasks({ status: 'pending' });
    const inProgressTasks = await this.getShortTermTasks({ status: 'in_progress' });
    
    const allTasks = [...inProgressTasks, ...tasks];
    
    // 按优先级排序
    return allTasks.sort((a, b) => b.priority - a.priority);
  },
};

export default memoryService;
