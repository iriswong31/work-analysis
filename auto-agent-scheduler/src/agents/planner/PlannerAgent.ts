/**
 * PlannerAgent - 规划者 Agent
 * 负责接收需求，生成执行计划和验收标准
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  IAgent,
  AgentRole,
  AgentStatus,
  AgentInput,
  AgentOutput,
  PlanRequest,
  ExecutionPlan,
  PlannedTask,
  AcceptanceCriterion,
  ExpectedOutput,
  OutputType,
} from '../types';

export class PlannerAgent implements IAgent {
  readonly name = 'PlannerAgent';
  readonly role: AgentRole = 'planner';
  
  private status: AgentStatus = 'idle';

  /**
   * 处理输入
   */
  async process(input: AgentInput): Promise<AgentOutput> {
    if (input.type !== 'plan_request') {
      return {
        success: false,
        type: 'plan',
        data: null,
        error: `Invalid input type: ${input.type}, expected 'plan_request'`,
      };
    }

    this.status = 'processing';

    try {
      const request = input.payload as PlanRequest;
      const plan = await this.generatePlan(request);

      this.status = 'idle';

      return {
        success: true,
        type: 'plan',
        data: plan,
        nextAction: {
          targetAgent: 'executor',
          actionType: 'execute',
          payload: plan,
        },
      };
    } catch (error) {
      this.status = 'error';
      return {
        success: false,
        type: 'plan',
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 生成执行计划
   */
  private async generatePlan(request: PlanRequest): Promise<ExecutionPlan> {
    const planId = uuidv4();
    
    // 分析需求，生成任务列表
    const tasks = this.generateTasks(request, planId);
    
    // 生成验收标准
    const acceptanceCriteria = this.generateAcceptanceCriteria(request, tasks);
    
    // 生成预期产出
    const expectedOutputs = this.generateExpectedOutputs(request, tasks, acceptanceCriteria);

    // 计算总估时
    const estimatedMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    return {
      id: planId,
      title: request.title,
      description: request.description,
      createdAt: new Date(),
      tasks,
      acceptanceCriteria,
      expectedOutputs,
      estimatedMinutes,
      state: 'planned',
    };
  }

  /**
   * 根据需求生成任务列表
   */
  private generateTasks(request: PlanRequest, planId: string): PlannedTask[] {
    const tasks: PlannedTask[] = [];
    
    // 分析需求，拆分为具体任务
    request.requirements.forEach((req, index) => {
      const taskId = `${planId}_task_${index + 1}`;
      const taskType = this.inferTaskType(req);
      
      tasks.push({
        id: taskId,
        order: index + 1,
        title: this.extractTaskTitle(req),
        description: req,
        estimatedMinutes: this.estimateMinutes(req),
        expectedOutputs: this.inferExpectedOutputs(req),
        acceptanceCriteriaIds: [], // 稍后填充
        state: 'planned',
      });
    });

    return tasks;
  }

  /**
   * 生成验收标准
   */
  private generateAcceptanceCriteria(
    request: PlanRequest,
    tasks: PlannedTask[]
  ): AcceptanceCriterion[] {
    const criteria: AcceptanceCriterion[] = [];

    // 为每个任务的预期产出生成验收标准
    tasks.forEach((task) => {
      task.expectedOutputs.forEach((output, index) => {
        const criterionId = `${task.id}_criterion_${index + 1}`;
        
        // 添加存在性检查
        criteria.push({
          id: criterionId,
          description: `验证 "${output}" 已创建且可访问`,
          type: 'existence',
          validationRule: {
            type: 'file_exists',
            params: { path: output },
            errorMessage: `产出 "${output}" 不存在或无法访问`,
          },
          required: true,
        });

        // 关联到任务
        task.acceptanceCriteriaIds.push(criterionId);
      });
    });

    // 添加一致性检查（确保记录与实际产出一致）
    criteria.push({
      id: `consistency_check`,
      description: '验证所有记录的产出都有对应的实际内容',
      type: 'consistency',
      validationRule: {
        type: 'custom',
        params: { checkType: 'output_record_consistency' },
        errorMessage: '存在记录但没有实际内容的产出',
      },
      required: true,
    });

    return criteria;
  }

  /**
   * 生成预期产出
   */
  private generateExpectedOutputs(
    request: PlanRequest,
    tasks: PlannedTask[],
    criteria: AcceptanceCriterion[]
  ): ExpectedOutput[] {
    const outputs: ExpectedOutput[] = [];

    tasks.forEach((task) => {
      task.expectedOutputs.forEach((outputPath, index) => {
        const outputId = `${task.id}_output_${index + 1}`;
        const outputType = this.inferOutputType(outputPath);
        
        outputs.push({
          id: outputId,
          type: outputType,
          name: this.extractOutputName(outputPath),
          description: `任务 "${task.title}" 的产出`,
          path: outputType !== 'page' ? outputPath : undefined,
          link: outputType === 'page' ? outputPath : undefined,
          acceptanceCriteriaIds: task.acceptanceCriteriaIds.filter(id => 
            id.includes(`_${index + 1}`)
          ),
        });
      });
    });

    return outputs;
  }

  /**
   * 推断任务类型
   */
  private inferTaskType(requirement: string): 'coding' | 'document' | 'design' {
    const lowerReq = requirement.toLowerCase();
    
    if (lowerReq.includes('代码') || lowerReq.includes('开发') || 
        lowerReq.includes('实现') || lowerReq.includes('code')) {
      return 'coding';
    }
    
    if (lowerReq.includes('设计') || lowerReq.includes('ui') || 
        lowerReq.includes('界面')) {
      return 'design';
    }
    
    return 'document';
  }

  /**
   * 提取任务标题
   */
  private extractTaskTitle(requirement: string): string {
    // 取前 50 个字符作为标题
    const title = requirement.slice(0, 50);
    return requirement.length > 50 ? `${title}...` : title;
  }

  /**
   * 估算任务时间
   */
  private estimateMinutes(requirement: string): number {
    const length = requirement.length;
    
    // 简单的估算逻辑
    if (requirement.includes('复杂') || requirement.includes('完整')) {
      return 120; // 2 小时
    }
    
    if (requirement.includes('简单') || requirement.includes('快速')) {
      return 30; // 30 分钟
    }
    
    return 60; // 默认 1 小时
  }

  /**
   * 推断预期产出
   */
  private inferExpectedOutputs(requirement: string): string[] {
    const outputs: string[] = [];
    
    // 分析需求中提到的产出
    if (requirement.includes('报告') || requirement.includes('文档')) {
      outputs.push(`/deliverables/${this.generateSlug(requirement)}`);
    }
    
    if (requirement.includes('页面') || requirement.includes('界面')) {
      outputs.push(`/pages/${this.generateSlug(requirement)}`);
    }
    
    if (requirement.includes('代码') || requirement.includes('组件')) {
      outputs.push(`src/components/${this.generateSlug(requirement)}.tsx`);
    }

    // 如果没有识别出具体产出，默认生成一个
    if (outputs.length === 0) {
      outputs.push(`/deliverables/${this.generateSlug(requirement)}`);
    }

    return outputs;
  }

  /**
   * 生成 URL slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  }

  /**
   * 推断产出类型
   */
  private inferOutputType(path: string): OutputType {
    if (path.startsWith('/deliverables/') || path.startsWith('/pages/')) {
      return 'page';
    }
    
    if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.js')) {
      return 'code';
    }
    
    if (path.endsWith('.md') || path.endsWith('.doc')) {
      return 'document';
    }
    
    if (path.endsWith('.json') || path.endsWith('.yaml')) {
      return 'data';
    }
    
    return 'document';
  }

  /**
   * 提取产出名称
   */
  private extractOutputName(path: string): string {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[^.]+$/, '');
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
  }
}
