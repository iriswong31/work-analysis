/**
 * ExecutorAgent - 执行者 Agent
 * 负责执行规划的任务，生成实际产出
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import type {
  IAgent,
  AgentRole,
  AgentStatus,
  AgentInput,
  AgentOutput,
  ExecutionPlan,
  ExecutionResult,
  ActualOutput,
  ExecutionLog,
  PlannedTask,
  FixTask,
} from '../types';

export class ExecutorAgent implements IAgent {
  readonly name = 'ExecutorAgent';
  readonly role: AgentRole = 'executor';
  
  private status: AgentStatus = 'idle';
  private logs: ExecutionLog[] = [];
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * 处理输入
   */
  async process(input: AgentInput): Promise<AgentOutput> {
    this.status = 'processing';
    this.logs = [];

    try {
      switch (input.type) {
        case 'execute_request':
          return await this.handleExecuteRequest(input);
        
        case 'fix_request':
          return await this.handleFixRequest(input);
        
        default:
          return {
            success: false,
            type: 'execution_result',
            data: null,
            error: `Invalid input type: ${input.type}`,
          };
      }
    } catch (error) {
      this.status = 'error';
      this.log('error', `Execution failed: ${error}`);
      
      return {
        success: false,
        type: 'execution_result',
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 处理执行请求
   */
  private async handleExecuteRequest(input: AgentInput): Promise<AgentOutput> {
    const { plan, taskId } = input.payload as { plan: ExecutionPlan; taskId?: string };
    
    const startedAt = new Date();
    this.log('info', `Starting execution for plan: ${plan.title}`);

    const actualOutputs: ActualOutput[] = [];
    const tasksToExecute = taskId 
      ? plan.tasks.filter(t => t.id === taskId)
      : plan.tasks;

    for (const task of tasksToExecute) {
      this.log('info', `Executing task: ${task.title}`);
      
      const taskOutputs = await this.executeTask(task, plan);
      actualOutputs.push(...taskOutputs);
      
      this.log('info', `Task completed: ${task.title}`);
    }

    const completedAt = new Date();
    const actualMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);

    const result: ExecutionResult = {
      planId: plan.id,
      taskId: taskId || 'all',
      success: actualOutputs.every(o => o.created),
      actualOutputs,
      logs: [...this.logs],
      startedAt,
      completedAt,
      actualMinutes,
    };

    this.status = 'idle';

    return {
      success: result.success,
      type: 'execution_result',
      data: result,
      nextAction: {
        targetAgent: 'reviewer',
        actionType: 'review',
        payload: result,
      },
    };
  }

  /**
   * 处理修复请求
   */
  private async handleFixRequest(input: AgentInput): Promise<AgentOutput> {
    const fixTask = input.payload as FixTask;
    
    this.log('info', `Executing fix task: ${fixTask.description}`);

    try {
      switch (fixTask.type) {
        case 'create_output':
          await this.createMissingOutput(fixTask);
          break;
        
        case 'update_output':
          await this.updateOutput(fixTask);
          break;
        
        case 'remove_record':
          await this.removeRecord(fixTask);
          break;
        
        case 'fix_link':
          await this.fixLink(fixTask);
          break;
      }

      this.log('info', `Fix task completed: ${fixTask.description}`);
      this.status = 'idle';

      return {
        success: true,
        type: 'execution_result',
        data: { fixTaskId: fixTask.id, completed: true },
      };
    } catch (error) {
      this.log('error', `Fix task failed: ${error}`);
      this.status = 'error';

      return {
        success: false,
        type: 'execution_result',
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: PlannedTask, plan: ExecutionPlan): Promise<ActualOutput[]> {
    const outputs: ActualOutput[] = [];

    for (const expectedOutputPath of task.expectedOutputs) {
      const expectedOutput = plan.expectedOutputs.find(o => 
        o.path === expectedOutputPath || o.link === expectedOutputPath
      );

      if (!expectedOutput) {
        outputs.push({
          expectedOutputId: 'unknown',
          type: 'document',
          name: expectedOutputPath,
          path: expectedOutputPath,
          created: false,
        });
        continue;
      }

      // 检查产出是否已存在
      const exists = await this.checkOutputExists(expectedOutput);
      
      if (exists) {
        this.log('info', `Output already exists: ${expectedOutput.name}`);
        outputs.push({
          expectedOutputId: expectedOutput.id,
          type: expectedOutput.type,
          name: expectedOutput.name,
          path: expectedOutput.path,
          link: expectedOutput.link,
          created: true,
          contentSummary: 'Already exists',
        });
      } else {
        // 创建产出
        const created = await this.createOutput(expectedOutput, task);
        outputs.push({
          expectedOutputId: expectedOutput.id,
          type: expectedOutput.type,
          name: expectedOutput.name,
          path: expectedOutput.path,
          link: expectedOutput.link,
          created,
          contentSummary: created ? 'Created successfully' : 'Failed to create',
        });
      }
    }

    return outputs;
  }

  /**
   * 检查产出是否存在
   */
  private async checkOutputExists(output: { path?: string; link?: string; type: string }): Promise<boolean> {
    if (output.path) {
      const fullPath = path.join(this.projectRoot, output.path);
      return fs.existsSync(fullPath);
    }

    if (output.link && output.type === 'page') {
      // 对于页面类型，检查对应的数据文件或路由是否存在
      // 这里简化处理，实际需要根据项目结构判断
      const routePath = output.link.replace(/^\/deliverables\//, '');
      const dataFile = path.join(
        this.projectRoot, 
        'src/data/deliverables', 
        `${routePath}.ts`
      );
      return fs.existsSync(dataFile);
    }

    return false;
  }

  /**
   * 创建产出
   */
  private async createOutput(
    output: { id: string; type: string; name: string; path?: string; link?: string },
    task: PlannedTask
  ): Promise<boolean> {
    try {
      if (output.type === 'code' && output.path) {
        return await this.createCodeFile(output.path, task);
      }

      if (output.type === 'page' && output.link) {
        return await this.createPageData(output.link, task);
      }

      if (output.type === 'document' && output.path) {
        return await this.createDocument(output.path, task);
      }

      this.log('warn', `Unknown output type: ${output.type}`);
      return false;
    } catch (error) {
      this.log('error', `Failed to create output: ${error}`);
      return false;
    }
  }

  /**
   * 创建代码文件
   */
  private async createCodeFile(filePath: string, task: PlannedTask): Promise<boolean> {
    const fullPath = path.join(this.projectRoot, filePath);
    const dir = path.dirname(fullPath);

    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 生成基础代码模板
    const content = this.generateCodeTemplate(filePath, task);
    fs.writeFileSync(fullPath, content, 'utf-8');

    this.log('info', `Created code file: ${filePath}`);
    return true;
  }

  /**
   * 创建页面数据
   */
  private async createPageData(link: string, task: PlannedTask): Promise<boolean> {
    const routePath = link.replace(/^\/deliverables\//, '');
    const dataFile = path.join(
      this.projectRoot,
      'src/data/deliverables',
      `${routePath}.ts`
    );
    const dir = path.dirname(dataFile);

    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 生成页面数据
    const content = this.generatePageDataTemplate(routePath, task);
    fs.writeFileSync(dataFile, content, 'utf-8');

    this.log('info', `Created page data: ${dataFile}`);
    return true;
  }

  /**
   * 创建文档
   */
  private async createDocument(filePath: string, task: PlannedTask): Promise<boolean> {
    const fullPath = path.join(this.projectRoot, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = `# ${task.title}\n\n${task.description}\n\n## 内容\n\n待补充...\n`;
    fs.writeFileSync(fullPath, content, 'utf-8');

    this.log('info', `Created document: ${filePath}`);
    return true;
  }

  /**
   * 生成代码模板
   */
  private generateCodeTemplate(filePath: string, task: PlannedTask): string {
    const componentName = path.basename(filePath, path.extname(filePath));
    
    return `/**
 * ${componentName}
 * ${task.description}
 * 
 * Generated by ExecutorAgent
 * Created at: ${new Date().toISOString()}
 */

import React from 'react';

interface ${componentName}Props {
  // TODO: Define props
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h1>${task.title}</h1>
      <p>${task.description}</p>
    </div>
  );
};

export default ${componentName};
`;
  }

  /**
   * 生成页面数据模板
   */
  private generatePageDataTemplate(routePath: string, task: PlannedTask): string {
    const id = routePath.replace(/-/g, '_');
    
    return `/**
 * ${task.title}
 * Generated by ExecutorAgent
 */

import type { Deliverable } from '../types';

export const ${id}: Deliverable = {
  id: '${routePath}',
  title: '${task.title}',
  description: '${task.description}',
  createdAt: '${new Date().toISOString()}',
  updatedAt: '${new Date().toISOString()}',
  content: \`
# ${task.title}

## 概述

${task.description}

## 内容

待补充...
  \`,
};

export default ${id};
`;
  }

  /**
   * 创建缺失的产出
   */
  private async createMissingOutput(fixTask: FixTask): Promise<void> {
    const { outputPath, outputType, title, description } = fixTask.params as {
      outputPath: string;
      outputType: string;
      title: string;
      description: string;
    };

    const task: PlannedTask = {
      id: fixTask.id,
      order: 1,
      title: title || 'Fix Task',
      description: description || 'Auto-generated fix',
      estimatedMinutes: 30,
      expectedOutputs: [outputPath],
      acceptanceCriteriaIds: [],
      state: 'executing',
    };

    await this.createOutput(
      { id: fixTask.id, type: outputType, name: title, path: outputPath },
      task
    );
  }

  /**
   * 更新产出
   */
  private async updateOutput(fixTask: FixTask): Promise<void> {
    const { outputPath, updates } = fixTask.params as {
      outputPath: string;
      updates: Record<string, unknown>;
    };

    const fullPath = path.join(this.projectRoot, outputPath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${outputPath}`);
    }

    // 读取现有内容并更新
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    // 简单的替换逻辑，实际可能需要更复杂的处理
    for (const [key, value] of Object.entries(updates)) {
      content = content.replace(new RegExp(key, 'g'), String(value));
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    this.log('info', `Updated output: ${outputPath}`);
  }

  /**
   * 删除记录
   */
  private async removeRecord(fixTask: FixTask): Promise<void> {
    const { recordFile, recordId } = fixTask.params as {
      recordFile: string;
      recordId: string;
    };

    const fullPath = path.join(this.projectRoot, recordFile);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Record file not found: ${recordFile}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);

    // 假设是数组格式
    if (Array.isArray(data)) {
      const filtered = data.filter((item: { id?: string }) => item.id !== recordId);
      fs.writeFileSync(fullPath, JSON.stringify(filtered, null, 2), 'utf-8');
    }

    this.log('info', `Removed record ${recordId} from ${recordFile}`);
  }

  /**
   * 修复链接
   */
  private async fixLink(fixTask: FixTask): Promise<void> {
    const { recordFile, recordId, newLink } = fixTask.params as {
      recordFile: string;
      recordId: string;
      newLink: string | null;
    };

    const fullPath = path.join(this.projectRoot, recordFile);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Record file not found: ${recordFile}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      const item = data.find((i: { id?: string }) => i.id === recordId);
      if (item) {
        item.link = newLink;
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
      }
    }

    this.log('info', `Fixed link for ${recordId} in ${recordFile}`);
  }

  /**
   * 记录日志
   */
  private log(level: ExecutionLog['level'], message: string, details?: unknown): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      details,
    });
  }

  /**
   * 获取状态
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * 重置
   */
  reset(): void {
    this.status = 'idle';
    this.logs = [];
  }
}
