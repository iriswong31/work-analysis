/**
 * AgentCoordinator - Agent 协调器
 * 负责调度 Planner、Executor、Reviewer 三个 Agent 的协作
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { StateManager } from './StateManager';
import type {
  IAgent,
  AgentRole,
  AgentInput,
  AgentOutput,
  AgentMessage,
  AgentSystemConfig,
  PlanRequest,
  ExecutionPlan,
  ExecutionResult,
  ValidationResult,
  FixTask,
  DEFAULT_AGENT_CONFIG,
} from '../types';

export class AgentCoordinator extends EventEmitter {
  private agents: Map<AgentRole, IAgent> = new Map();
  private stateManager: StateManager;
  private config: AgentSystemConfig;
  private messageQueue: AgentMessage[] = [];

  constructor(config: Partial<AgentSystemConfig> = {}) {
    super();
    this.config = { ...require('../types').DEFAULT_AGENT_CONFIG, ...config };
    this.stateManager = new StateManager(uuidv4(), this.config.maxRetries);
    this.setupStateListeners();
  }

  /**
   * 注册 Agent
   */
  registerAgent(agent: IAgent): void {
    this.agents.set(agent.role, agent);
    this.emit('agent_registered', { role: agent.role, name: agent.name });
  }

  /**
   * 获取 Agent
   */
  getAgent(role: AgentRole): IAgent | undefined {
    return this.agents.get(role);
  }

  /**
   * 设置状态监听器
   */
  private setupStateListeners(): void {
    this.stateManager.on('phase_changed', (data) => {
      this.emit('phase_changed', data);
    });

    this.stateManager.on('execution_failed', (data) => {
      this.emit('execution_failed', data);
    });

    this.stateManager.on('max_retries_exceeded', (data) => {
      this.emit('max_retries_exceeded', data);
    });
  }

  /**
   * 执行完整的规划-执行-审查流程
   */
  async run(request: PlanRequest): Promise<{
    success: boolean;
    plan?: ExecutionPlan;
    executionResults: ExecutionResult[];
    validationResult?: ValidationResult;
    error?: string;
  }> {
    try {
      // 1. 规划阶段
      this.emit('workflow_started', { request });
      const planResult = await this.executePlanning(request);
      
      if (!planResult.success || !planResult.plan) {
        return {
          success: false,
          executionResults: [],
          error: planResult.error || 'Planning failed',
        };
      }

      const plan = planResult.plan;
      this.stateManager.setPlan(plan);

      // 2. 执行-审查循环
      let executionResults: ExecutionResult[] = [];
      let validationResult: ValidationResult | undefined;

      while (!this.stateManager.isCompleted()) {
        const phase = this.stateManager.getCurrentPhase();

        switch (phase) {
          case 'planning':
            // 已完成规划，开始执行
            this.stateManager.startExecution();
            break;

          case 'executing':
            const execResult = await this.executeExecution(plan);
            if (execResult.success && execResult.result) {
              executionResults.push(execResult.result);
              this.stateManager.completeExecution(execResult.result);
            } else {
              this.stateManager.failExecution(execResult.error || 'Execution failed');
            }
            break;

          case 'reviewing':
            const reviewResult = await this.executeReview(plan, executionResults);
            if (reviewResult.success && reviewResult.result) {
              validationResult = reviewResult.result;
              if (validationResult.passed) {
                this.stateManager.passReview(validationResult);
              } else {
                this.stateManager.failReview(validationResult);
              }
            } else {
              // 审查失败，标记为需要修复
              this.stateManager.failReview({
                planId: plan.id,
                passed: false,
                score: 0,
                validations: [],
                issues: [{
                  id: uuidv4(),
                  severity: 'error',
                  type: 'quality_issue',
                  message: reviewResult.error || 'Review failed',
                }],
                validatedAt: new Date(),
              });
            }
            break;

          case 'fixing':
            // 需要修复，回到执行阶段
            if (validationResult?.fixTasks) {
              await this.executeFixTasks(validationResult.fixTasks);
            }
            this.stateManager.startFix();
            break;

          default:
            break;
        }
      }

      const success = this.stateManager.isSuccessful();
      this.emit('workflow_completed', { success, plan, executionResults, validationResult });

      return {
        success,
        plan,
        executionResults,
        validationResult,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('workflow_error', { error: errorMessage });
      return {
        success: false,
        executionResults: [],
        error: errorMessage,
      };
    }
  }

  /**
   * 执行规划阶段
   */
  private async executePlanning(request: PlanRequest): Promise<{
    success: boolean;
    plan?: ExecutionPlan;
    error?: string;
  }> {
    const planner = this.agents.get('planner');
    if (!planner) {
      return { success: false, error: 'Planner agent not registered' };
    }

    const input: AgentInput = {
      type: 'plan_request',
      payload: request,
      context: {
        sessionId: this.stateManager.getState().sessionId,
        timestamp: new Date(),
      },
    };

    try {
      const output = await this.withTimeout(
        planner.process(input),
        this.config.timeouts.planning,
        'Planning timeout'
      );

      if (output.success && output.type === 'plan') {
        return { success: true, plan: output.data as ExecutionPlan };
      }

      return { success: false, error: output.error || 'Planning failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行执行阶段
   */
  private async executeExecution(plan: ExecutionPlan): Promise<{
    success: boolean;
    result?: ExecutionResult;
    error?: string;
  }> {
    const executor = this.agents.get('executor');
    if (!executor) {
      return { success: false, error: 'Executor agent not registered' };
    }

    const input: AgentInput = {
      type: 'execute_request',
      payload: { plan },
      context: {
        sessionId: this.stateManager.getState().sessionId,
        timestamp: new Date(),
      },
    };

    try {
      const output = await this.withTimeout(
        executor.process(input),
        this.config.timeouts.execution,
        'Execution timeout'
      );

      if (output.success && output.type === 'execution_result') {
        return { success: true, result: output.data as ExecutionResult };
      }

      return { success: false, error: output.error || 'Execution failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行审查阶段
   */
  private async executeReview(
    plan: ExecutionPlan,
    executionResults: ExecutionResult[]
  ): Promise<{
    success: boolean;
    result?: ValidationResult;
    error?: string;
  }> {
    const reviewer = this.agents.get('reviewer');
    if (!reviewer) {
      return { success: false, error: 'Reviewer agent not registered' };
    }

    const input: AgentInput = {
      type: 'review_request',
      payload: { plan, executionResults },
      context: {
        sessionId: this.stateManager.getState().sessionId,
        timestamp: new Date(),
      },
    };

    try {
      const output = await this.withTimeout(
        reviewer.process(input),
        this.config.timeouts.review,
        'Review timeout'
      );

      if (output.success && output.type === 'validation_result') {
        return { success: true, result: output.data as ValidationResult };
      }

      return { success: false, error: output.error || 'Review failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行修复任务
   */
  private async executeFixTasks(fixTasks: FixTask[]): Promise<void> {
    const executor = this.agents.get('executor');
    if (!executor) {
      throw new Error('Executor agent not registered');
    }

    for (const task of fixTasks) {
      const input: AgentInput = {
        type: 'fix_request',
        payload: task,
        context: {
          sessionId: this.stateManager.getState().sessionId,
          timestamp: new Date(),
        },
      };

      await executor.process(input);
    }
  }

  /**
   * 带超时的 Promise 执行
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      ),
    ]);
  }

  /**
   * 发送消息给指定 Agent
   */
  sendMessage(from: AgentRole, to: AgentRole, type: AgentMessage['type'], payload: unknown): void {
    const message: AgentMessage = {
      id: uuidv4(),
      from,
      to,
      type,
      payload,
      timestamp: new Date(),
    };
    this.messageQueue.push(message);
    this.emit('message_sent', message);
  }

  /**
   * 获取状态管理器
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    phase: string;
    agents: { role: AgentRole; status: string }[];
    retryCount: number;
  } {
    const agents: { role: AgentRole; status: string }[] = [];
    for (const [role, agent] of this.agents) {
      agents.push({ role, status: agent.getStatus() });
    }

    return {
      phase: this.stateManager.getCurrentPhase(),
      agents,
      retryCount: this.stateManager.getState().retryCount,
    };
  }

  /**
   * 重置协调器
   */
  reset(): void {
    this.stateManager.reset();
    this.messageQueue = [];
    for (const agent of this.agents.values()) {
      agent.reset();
    }
    this.emit('reset');
  }
}
