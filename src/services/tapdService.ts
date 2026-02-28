// TAPD 集成服务
// 用于从 TAPD 拉取需求并转换为系统任务

import { ShortTermTask } from '@/types/memory';

// TAPD 需求数据结构
export interface TapdStory {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  owner?: string;
  developer?: string;
  iteration_id?: string;
  created?: string;
  modified?: string;
  workspace_id: string;
}

// TAPD Bug 数据结构
export interface TapdBug {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  current_owner?: string;
  created?: string;
  modified?: string;
  workspace_id: string;
}

// TAPD 任务数据结构
export interface TapdTask {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  owner?: string;
  story_id?: string;
  created?: string;
  modified?: string;
  workspace_id: string;
}

// 项目配置
export interface TapdProjectConfig {
  workspaceId: string;
  projectName: string;
  engine: 'work' | 'life';
  syncEnabled: boolean;
  lastSyncAt?: Date;
}

// TAPD 服务类
export class TapdService {
  private projectConfigs: TapdProjectConfig[] = [
    {
      workspaceId: '70142391',
      projectName: '善治美',
      engine: 'work',
      syncEnabled: true,
    },
  ];

  // 获取项目配置
  getProjectConfigs(): TapdProjectConfig[] {
    return this.projectConfigs;
  }

  // 添加项目配置
  addProjectConfig(config: TapdProjectConfig): void {
    const existing = this.projectConfigs.find(c => c.workspaceId === config.workspaceId);
    if (!existing) {
      this.projectConfigs.push(config);
    }
  }

  // 将 TAPD 需求转换为系统任务
  convertStoryToTask(story: TapdStory, config: TapdProjectConfig): Omit<ShortTermTask, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      title: story.name,
      description: story.description || '',
      status: this.mapTapdStatus(story.status),
      engine: config.engine,
      priority: this.mapTapdPriority(story.priority),
      urgency: this.calculateUrgency(story),
      compoundValue: this.calculateCompoundValue(story, config),
      goalId: undefined,
      planId: undefined,
      dueDate: undefined,
      tags: ['tapd', config.projectName],
      externalId: story.id,
      externalSource: 'tapd',
    };
  }

  // 将 TAPD Bug 转换为系统任务
  convertBugToTask(bug: TapdBug, config: TapdProjectConfig): Omit<ShortTermTask, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      title: `[Bug] ${bug.title}`,
      description: bug.description || '',
      status: this.mapTapdStatus(bug.status),
      engine: config.engine,
      priority: this.mapTapdPriority(bug.priority),
      urgency: this.calculateBugUrgency(bug),
      compoundValue: 30, // Bug 修复通常复利价值较低
      goalId: undefined,
      planId: undefined,
      dueDate: undefined,
      tags: ['tapd', 'bug', config.projectName],
      externalId: bug.id,
      externalSource: 'tapd',
    };
  }

  // 将 TAPD 任务转换为系统任务
  convertTaskToTask(task: TapdTask, config: TapdProjectConfig): Omit<ShortTermTask, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      title: task.name,
      description: task.description || '',
      status: this.mapTapdStatus(task.status),
      engine: config.engine,
      priority: this.mapTapdPriority(task.priority),
      urgency: 50,
      compoundValue: 40,
      goalId: undefined,
      planId: undefined,
      dueDate: undefined,
      tags: ['tapd', 'task', config.projectName],
      externalId: task.id,
      externalSource: 'tapd',
    };
  }

  // 映射 TAPD 状态到系统状态
  private mapTapdStatus(tapdStatus: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'in_progress' | 'completed' | 'cancelled'> = {
      'planning': 'pending',
      'developing': 'in_progress',
      'testing': 'in_progress',
      'done': 'completed',
      'closed': 'completed',
      'rejected': 'cancelled',
      'new': 'pending',
      'open': 'pending',
      'in_progress': 'in_progress',
      'resolved': 'completed',
      'verified': 'completed',
    };
    return statusMap[tapdStatus.toLowerCase()] || 'pending';
  }

  // 映射 TAPD 优先级
  private mapTapdPriority(tapdPriority?: string): 'high' | 'medium' | 'low' {
    if (!tapdPriority) return 'medium';
    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
      'high': 'high',
      'urgent': 'high',
      'critical': 'high',
      'medium': 'medium',
      'normal': 'medium',
      'low': 'low',
      'minor': 'low',
    };
    return priorityMap[tapdPriority.toLowerCase()] || 'medium';
  }

  // 计算需求紧急度
  private calculateUrgency(story: TapdStory): number {
    let urgency = 50;
    
    // 根据优先级调整
    if (story.priority === 'high' || story.priority === 'urgent') {
      urgency += 30;
    } else if (story.priority === 'low') {
      urgency -= 20;
    }

    return Math.min(100, Math.max(0, urgency));
  }

  // 计算 Bug 紧急度
  private calculateBugUrgency(bug: TapdBug): number {
    let urgency = 60; // Bug 默认较高紧急度
    
    if (bug.priority === 'high' || bug.priority === 'urgent' || bug.priority === 'critical') {
      urgency += 30;
    } else if (bug.priority === 'low' || bug.priority === 'minor') {
      urgency -= 20;
    }

    return Math.min(100, Math.max(0, urgency));
  }

  // 计算复利价值
  private calculateCompoundValue(story: TapdStory, config: TapdProjectConfig): number {
    let value = 50;

    // 善治美项目的需求通常有较高复利价值（公益数字化）
    if (config.projectName === '善治美') {
      value += 20;
    }

    // 根据描述长度估算复杂度和价值
    if (story.description && story.description.length > 500) {
      value += 10;
    }

    return Math.min(100, Math.max(0, value));
  }

  // 生成同步摘要
  generateSyncSummary(
    stories: TapdStory[],
    bugs: TapdBug[],
    tasks: TapdTask[],
    config: TapdProjectConfig
  ): string {
    const parts: string[] = [];
    parts.push(`[${config.projectName}] TAPD 同步完成`);
    
    if (stories.length > 0) {
      parts.push(`需求: ${stories.length} 条`);
    }
    if (bugs.length > 0) {
      parts.push(`缺陷: ${bugs.length} 条`);
    }
    if (tasks.length > 0) {
      parts.push(`任务: ${tasks.length} 条`);
    }

    return parts.join(' | ');
  }
}

export const tapdService = new TapdService();
export default tapdService;
