import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getIrisMePath } from '../utils/config.js';
import { memoryReader } from './reader.js';
import type { 
  ShortTermTask, 
  ImmediateContext,
  Deliverable 
} from '../types/index.js';

/**
 * 记忆层写入器
 * 将执行结果写回 iris-me 项目
 */
export class MemoryWriter {
  private cachePath: string;

  constructor() {
    this.cachePath = path.join(getIrisMePath(), 'auto-agent-scheduler/data/memory');
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    taskId: string, 
    status: ShortTermTask['status'],
    updates?: {
      actualHours?: number;
      completedAt?: Date;
      deliverables?: Deliverable[];
    }
  ): Promise<void> {
    try {
      const memory = await memoryReader.readAll();
      if (!memory) {
        throw new Error('Failed to read memory');
      }

      const taskIndex = memory.shortTermTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        logger.warn(`Task not found: ${taskId}`);
        return;
      }

      // 更新任务
      memory.shortTermTasks[taskIndex] = {
        ...memory.shortTermTasks[taskIndex],
        status,
        updatedAt: new Date(),
        ...(updates?.actualHours !== undefined && { actualHours: updates.actualHours }),
        ...(updates?.completedAt && { completedAt: updates.completedAt }),
        ...(updates?.deliverables && { 
          deliverables: [
            ...memory.shortTermTasks[taskIndex].deliverables,
            ...updates.deliverables
          ]
        }),
      };

      // 保存更新
      await this.saveMemory(memory);
      logger.info(`Task ${taskId} status updated to ${status}`);

    } catch (error) {
      logger.error(`Failed to update task status: ${error}`);
      throw error;
    }
  }

  /**
   * 更新即时上下文
   */
  async updateImmediateContext(updates: Partial<ImmediateContext>): Promise<void> {
    try {
      const memory = await memoryReader.readAll();
      if (!memory) {
        throw new Error('Failed to read memory');
      }

      memory.immediateContext = {
        ...memory.immediateContext,
        ...updates,
        updatedAt: new Date(),
      };

      // 合并已完成任务列表
      if (updates.completedTasks) {
        const existingCompleted = new Set(memory.immediateContext.completedTasks);
        updates.completedTasks.forEach(id => existingCompleted.add(id));
        memory.immediateContext.completedTasks = Array.from(existingCompleted);
      }

      await this.saveMemory(memory);
      logger.info('Immediate context updated');

    } catch (error) {
      logger.error(`Failed to update immediate context: ${error}`);
      throw error;
    }
  }

  /**
   * 添加新任务
   */
  async addTask(task: Omit<ShortTermTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const memory = await memoryReader.readAll();
      if (!memory) {
        throw new Error('Failed to read memory');
      }

      const newTask: ShortTermTask = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memory.shortTermTasks.push(newTask);
      await this.saveMemory(memory);
      
      logger.info(`New task added: ${newTask.id}`);
      return newTask.id;

    } catch (error) {
      logger.error(`Failed to add task: ${error}`);
      throw error;
    }
  }

  /**
   * 批量更新任务
   */
  async batchUpdateTasks(
    updates: Array<{
      taskId: string;
      status: ShortTermTask['status'];
      actualHours?: number;
      completedAt?: Date;
    }>
  ): Promise<void> {
    try {
      const memory = await memoryReader.readAll();
      if (!memory) {
        throw new Error('Failed to read memory');
      }

      for (const update of updates) {
        const taskIndex = memory.shortTermTasks.findIndex(t => t.id === update.taskId);
        if (taskIndex !== -1) {
          memory.shortTermTasks[taskIndex] = {
            ...memory.shortTermTasks[taskIndex],
            status: update.status,
            updatedAt: new Date(),
            ...(update.actualHours !== undefined && { actualHours: update.actualHours }),
            ...(update.completedAt && { completedAt: update.completedAt }),
          };
        }
      }

      await this.saveMemory(memory);
      logger.info(`Batch updated ${updates.length} tasks`);

    } catch (error) {
      logger.error(`Failed to batch update tasks: ${error}`);
      throw error;
    }
  }

  /**
   * 保存记忆数据到文件
   */
  private async saveMemory(memory: object): Promise<void> {
    const exportPath = path.join(this.cachePath, 'memory_export.json');
    
    // 确保目录存在
    await fs.mkdir(path.dirname(exportPath), { recursive: true });
    
    // 写入文件
    await fs.writeFile(exportPath, JSON.stringify(memory, null, 2), 'utf-8');
    
    // 刷新缓存
    await memoryReader.refreshCache();
  }

  /**
   * 记录执行历史
   */
  async recordExecution(record: {
    taskId: string;
    taskTitle: string;
    success: boolean;
    duration: number;
    linesOfCode: number;
    error?: string;
  }): Promise<void> {
    try {
      const historyPath = path.join(this.cachePath, 'execution_history.json');
      
      let history: object[] = [];
      try {
        const content = await fs.readFile(historyPath, 'utf-8');
        history = JSON.parse(content);
      } catch {
        // 文件不存在，使用空数组
      }

      history.push({
        ...record,
        executedAt: new Date().toISOString(),
      });

      // 只保留最近 1000 条记录
      if (history.length > 1000) {
        history = history.slice(-1000);
      }

      await fs.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');

    } catch (error) {
      logger.warn(`Failed to record execution: ${error}`);
    }
  }
}

export const memoryWriter = new MemoryWriter();
