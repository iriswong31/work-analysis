import Dexie, { Table } from 'dexie';
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
import {
  EngineConfig,
  StrategyAdjustment,
  WorkProject,
  LifeProject,
} from '@/types/engine';

// 定义数据库 Schema
export class IrisDatabase extends Dexie {
  // 五层记忆表
  coreIdentity!: Table<CoreIdentityLayer, number>;
  longTermGoals!: Table<LongTermGoal, string>;
  midTermPlans!: Table<MidTermPlan, string>;
  shortTermTasks!: Table<ShortTermTask, string>;
  immediateContext!: Table<ImmediateContext, number>;
  
  // Seed Pack
  seedPack!: Table<SeedPack, number>;
  
  // 交付物与反馈
  deliverables!: Table<Deliverable, string>;
  feedbacks!: Table<Feedback, string>;
  
  // 每日产出
  dailyOutputs!: Table<DailyOutput, string>;
  
  // 引擎配置
  engineConfig!: Table<EngineConfig, number>;
  strategyAdjustments!: Table<StrategyAdjustment, string>;
  
  // 项目
  workProjects!: Table<WorkProject, string>;
  lifeProjects!: Table<LifeProject, string>;

  constructor() {
    super('IrisDigitalTwin');
    
    this.version(1).stores({
      // 五层记忆
      coreIdentity: '++id, name',
      longTermGoals: 'id, category, status, targetDate',
      midTermPlans: 'id, goalId, period, status, startDate, endDate',
      shortTermTasks: 'id, planId, engine, status, priority, dueDate, createdAt',
      immediateContext: '++id, date',
      
      // Seed Pack
      seedPack: '++id, importedAt',
      
      // 交付物与反馈
      deliverables: 'id, taskId, type, createdAt',
      feedbacks: 'id, deliverableId, rating, createdAt',
      
      // 每日产出
      dailyOutputs: 'id, date',
      
      // 引擎配置
      engineConfig: '++id',
      strategyAdjustments: 'id, date, trigger',
      
      // 项目
      workProjects: 'id, status, tapdWorkspaceId',
      lifeProjects: 'id, category, status',
    });
  }
}

// 创建数据库实例
export const db = new IrisDatabase();

// 初始化默认数据
export async function initializeDatabase(): Promise<void> {
  const existingConfig = await db.engineConfig.toArray();
  
  if (existingConfig.length === 0) {
    // 初始化引擎配置
    await db.engineConfig.add({
      workRatio: 0.6,
      lifeRatio: 0.4,
      autoAdjust: true,
    });
  }
  
  const existingContext = await db.immediateContext.toArray();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (existingContext.length === 0 || 
      new Date(existingContext[0].date).toDateString() !== today.toDateString()) {
    // 创建今日上下文
    await db.immediateContext.add({
      date: today,
      availableHours: 8,
      priorities: [],
      blockers: [],
      notes: '',
      todayTasks: [],
      completedTasks: [],
      updatedAt: new Date(),
    });
  }
}

// 导出数据库操作工具
export const dbUtils = {
  // 清空所有数据（用于重置）
  async clearAll(): Promise<void> {
    await db.delete();
    await db.open();
    await initializeDatabase();
  },
  
  // 导出所有数据为 JSON
  async exportAll(): Promise<string> {
    const data = {
      coreIdentity: await db.coreIdentity.toArray(),
      longTermGoals: await db.longTermGoals.toArray(),
      midTermPlans: await db.midTermPlans.toArray(),
      shortTermTasks: await db.shortTermTasks.toArray(),
      immediateContext: await db.immediateContext.toArray(),
      seedPack: await db.seedPack.toArray(),
      deliverables: await db.deliverables.toArray(),
      feedbacks: await db.feedbacks.toArray(),
      dailyOutputs: await db.dailyOutputs.toArray(),
      engineConfig: await db.engineConfig.toArray(),
      strategyAdjustments: await db.strategyAdjustments.toArray(),
      workProjects: await db.workProjects.toArray(),
      lifeProjects: await db.lifeProjects.toArray(),
    };
    return JSON.stringify(data, null, 2);
  },
};
