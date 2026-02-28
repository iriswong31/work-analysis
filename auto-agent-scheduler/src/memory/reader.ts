import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getIrisMePath } from '../utils/config.js';
import type { 
  MemoryArchitecture, 
  ShortTermTask, 
  LongTermGoal,
  MidTermPlan,
  ImmediateContext,
  CoreIdentityLayer 
} from '../types/index.js';
import Database from 'better-sqlite3';

/**
 * 记忆层读取器
 * 从 iris-me 项目的 IndexedDB 导出数据或本地缓存读取
 */
export class MemoryReader {
  private cachePath: string;
  private db: Database.Database | null = null;

  constructor() {
    this.cachePath = path.join(getIrisMePath(), 'auto-agent-scheduler/data/memory');
  }

  /**
   * 初始化数据库连接
   */
  private initDatabase(): void {
    if (this.db) return;

    const dbPath = path.join(getIrisMePath(), 'auto-agent-scheduler/data/scheduler.db');
    this.db = new Database(dbPath);
    
    // 创建缓存表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  /**
   * 读取所有记忆层数据
   */
  async readAll(): Promise<MemoryArchitecture | null> {
    try {
      // 优先从缓存读取
      const cached = await this.readFromCache();
      if (cached) {
        logger.info('Memory loaded from cache');
        return cached;
      }

      // 从 JSON 文件读取（需要 iris-me 导出）
      const fromFile = await this.readFromExportFile();
      if (fromFile) {
        // 缓存数据
        await this.saveToCache(fromFile);
        logger.info('Memory loaded from export file');
        return fromFile;
      }

      // 返回默认数据
      logger.warn('No memory data found, using defaults');
      return this.getDefaultMemory();

    } catch (error) {
      logger.error('Failed to read memory:', error);
      return null;
    }
  }

  /**
   * 读取短期任务列表
   */
  async readShortTermTasks(): Promise<ShortTermTask[]> {
    const memory = await this.readAll();
    return memory?.shortTermTasks || [];
  }

  /**
   * 读取待处理任务（pending 或 in_progress）
   */
  async readPendingTasks(): Promise<ShortTermTask[]> {
    const tasks = await this.readShortTermTasks();
    return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  }

  /**
   * 读取工作引擎任务
   */
  async readWorkTasks(): Promise<ShortTermTask[]> {
    const tasks = await this.readPendingTasks();
    return tasks.filter(t => t.engine === 'work');
  }

  /**
   * 读取长期目标
   */
  async readLongTermGoals(): Promise<LongTermGoal[]> {
    const memory = await this.readAll();
    return memory?.longTermGoals || [];
  }

  /**
   * 读取活跃的长期目标
   */
  async readActiveGoals(): Promise<LongTermGoal[]> {
    const goals = await this.readLongTermGoals();
    return goals.filter(g => g.status === 'active');
  }

  /**
   * 读取即时上下文
   */
  async readImmediateContext(): Promise<ImmediateContext | null> {
    const memory = await this.readAll();
    return memory?.immediateContext || null;
  }

  /**
   * 读取核心身份
   */
  async readCoreIdentity(): Promise<CoreIdentityLayer | null> {
    const memory = await this.readAll();
    return memory?.coreIdentity || null;
  }

  /**
   * 从缓存读取
   */
  private async readFromCache(): Promise<MemoryArchitecture | null> {
    try {
      this.initDatabase();
      const row = this.db!.prepare('SELECT value, updated_at FROM memory_cache WHERE key = ?').get('memory_architecture') as { value: string; updated_at: string } | undefined;
      
      if (!row) return null;

      // 检查缓存是否过期（1小时）
      const updatedAt = new Date(row.updated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 1) {
        logger.info('Cache expired, will refresh');
        return null;
      }

      return JSON.parse(row.value);
    } catch (error) {
      logger.warn('Failed to read from cache:', error);
      return null;
    }
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(memory: MemoryArchitecture): Promise<void> {
    try {
      this.initDatabase();
      this.db!.prepare(`
        INSERT OR REPLACE INTO memory_cache (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('memory_architecture', JSON.stringify(memory), new Date().toISOString());
    } catch (error) {
      logger.warn('Failed to save to cache:', error);
    }
  }

  /**
   * 从导出文件读取
   */
  private async readFromExportFile(): Promise<MemoryArchitecture | null> {
    try {
      const exportPath = path.join(this.cachePath, 'memory_export.json');
      const content = await fs.readFile(exportPath, 'utf-8');
      const data = JSON.parse(content);

      // 转换日期字符串
      return this.parseDates(data);
    } catch (error) {
      // 文件不存在是正常的
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('Failed to read export file:', error);
      }
      return null;
    }
  }

  /**
   * 解析日期字符串
   */
  private parseDates(data: MemoryArchitecture): MemoryArchitecture {
    // 解析任务日期
    if (data.shortTermTasks) {
      data.shortTermTasks = data.shortTermTasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
    }

    // 解析目标日期
    if (data.longTermGoals) {
      data.longTermGoals = data.longTermGoals.map(goal => ({
        ...goal,
        targetDate: new Date(goal.targetDate),
        createdAt: new Date(goal.createdAt),
        updatedAt: new Date(goal.updatedAt),
        milestones: goal.milestones.map(m => ({
          ...m,
          targetDate: new Date(m.targetDate),
          completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
        })),
      }));
    }

    // 解析即时上下文日期
    if (data.immediateContext) {
      data.immediateContext = {
        ...data.immediateContext,
        date: new Date(data.immediateContext.date),
        updatedAt: new Date(data.immediateContext.updatedAt),
      };
    }

    return data;
  }

  /**
   * 获取默认记忆数据
   */
  private getDefaultMemory(): MemoryArchitecture {
    const now = new Date();
    return {
      coreIdentity: {
        name: 'Iris',
        roles: ['开发者', '产品经理'],
        coreValues: ['效率', '创新', '成长'],
        missionStatement: '通过技术创造价值',
        personalBrand: '数字分身',
        createdAt: now,
        updatedAt: now,
      },
      longTermGoals: [],
      midTermPlans: [],
      shortTermTasks: [],
      immediateContext: {
        date: now,
        availableHours: 8,
        priorities: [],
        blockers: [],
        notes: '',
        todayTasks: [],
        completedTasks: [],
        updatedAt: now,
      },
    };
  }

  /**
   * 刷新缓存
   */
  async refreshCache(): Promise<void> {
    const fromFile = await this.readFromExportFile();
    if (fromFile) {
      await this.saveToCache(fromFile);
      logger.info('Cache refreshed from export file');
    }
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    try {
      this.initDatabase();
      this.db!.prepare('DELETE FROM memory_cache WHERE key = ?').run('memory_architecture');
      logger.info('Cache cleared');
    } catch (error) {
      logger.warn('Failed to clear cache:', error);
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const memoryReader = new MemoryReader();
