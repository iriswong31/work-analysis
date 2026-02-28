/**
 * StateManager - 状态管理器
 * 管理三 Agent 协作系统的状态流转
 */

import { EventEmitter } from 'events';
import type {
  CoordinatorState,
  StateTransitionEvent,
  TaskState,
  AgentRole,
  ExecutionPlan,
  ExecutionResult,
  ValidationResult,
} from '../types';

/** 状态转换规则 */
const STATE_TRANSITIONS: Record<TaskState, TaskState[]> = {
  planned: ['executing'],
  executing: ['reviewing', 'failed'],
  reviewing: ['completed', 'fix_required', 'failed'],
  completed: [],
  failed: ['planned'], // 可以重新规划
  fix_required: ['executing'], // 回到执行阶段
};

/** 阶段到状态的映射 */
const PHASE_TO_STATE: Record<CoordinatorState['currentPhase'], TaskState> = {
  planning: 'planned',
  executing: 'executing',
  reviewing: 'reviewing',
  fixing: 'fix_required',
  completed: 'completed',
};

export class StateManager extends EventEmitter {
  private state: CoordinatorState;
  private transitionHistory: StateTransitionEvent[] = [];

  constructor(sessionId: string, maxRetries: number = 3) {
    super();
    this.state = {
      sessionId,
      currentPhase: 'planning',
      executionResults: [],
      validationResults: [],
      retryCount: 0,
      maxRetries,
    };
  }

  /**
   * 获取当前状态
   */
  getState(): CoordinatorState {
    return { ...this.state };
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase(): CoordinatorState['currentPhase'] {
    return this.state.currentPhase;
  }

  /**
   * 获取当前计划
   */
  getCurrentPlan(): ExecutionPlan | undefined {
    return this.state.currentPlan;
  }

  /**
   * 设置执行计划
   */
  setPlan(plan: ExecutionPlan): void {
    this.state.currentPlan = plan;
    this.transitionPhase('planning', 'plan_created', 'planner');
    this.emit('plan_set', plan);
  }

  /**
   * 阶段转换
   */
  transitionPhase(
    targetPhase: CoordinatorState['currentPhase'],
    reason: string,
    agentRole: AgentRole
  ): boolean {
    const currentState = PHASE_TO_STATE[this.state.currentPhase];
    const targetState = PHASE_TO_STATE[targetPhase];

    // 检查转换是否有效
    if (!this.isValidTransition(currentState, targetState)) {
      this.emit('invalid_transition', {
        from: this.state.currentPhase,
        to: targetPhase,
        reason: `Invalid transition from ${currentState} to ${targetState}`,
      });
      return false;
    }

    const previousPhase = this.state.currentPhase;
    this.state.currentPhase = targetPhase;

    // 记录转换事件
    const event: StateTransitionEvent = {
      from: currentState,
      to: targetState,
      reason,
      timestamp: new Date(),
      agentRole,
    };
    this.transitionHistory.push(event);

    // 发出事件
    this.emit('phase_changed', {
      from: previousPhase,
      to: targetPhase,
      event,
    });

    return true;
  }

  /**
   * 检查状态转换是否有效
   */
  private isValidTransition(from: TaskState, to: TaskState): boolean {
    // 相同状态不需要转换
    if (from === to) return true;
    
    const allowedTransitions = STATE_TRANSITIONS[from];
    return allowedTransitions.includes(to);
  }

  /**
   * 开始执行
   */
  startExecution(): boolean {
    if (this.state.currentPhase !== 'planning') {
      return false;
    }
    return this.transitionPhase('executing', 'execution_started', 'executor');
  }

  /**
   * 完成执行，进入审查
   */
  completeExecution(result: ExecutionResult): boolean {
    if (this.state.currentPhase !== 'executing') {
      return false;
    }
    this.state.executionResults.push(result);
    return this.transitionPhase('reviewing', 'execution_completed', 'executor');
  }

  /**
   * 执行失败
   */
  failExecution(error: string): boolean {
    if (this.state.currentPhase !== 'executing') {
      return false;
    }
    this.emit('execution_failed', { error });
    
    // 检查是否可以重试
    if (this.state.retryCount < this.state.maxRetries) {
      this.state.retryCount++;
      return this.transitionPhase('planning', 'retry_after_failure', 'executor');
    }
    
    // 超过重试次数，标记为失败
    this.state.currentPhase = 'completed';
    this.emit('max_retries_exceeded', { retryCount: this.state.retryCount });
    return false;
  }

  /**
   * 审查通过
   */
  passReview(result: ValidationResult): boolean {
    if (this.state.currentPhase !== 'reviewing') {
      return false;
    }
    this.state.validationResults.push(result);
    return this.transitionPhase('completed', 'review_passed', 'reviewer');
  }

  /**
   * 审查失败，需要修复
   */
  failReview(result: ValidationResult): boolean {
    if (this.state.currentPhase !== 'reviewing') {
      return false;
    }
    this.state.validationResults.push(result);
    
    // 检查是否可以重试
    if (this.state.retryCount < this.state.maxRetries) {
      this.state.retryCount++;
      return this.transitionPhase('fixing', 'review_failed_needs_fix', 'reviewer');
    }
    
    // 超过重试次数
    this.state.currentPhase = 'completed';
    this.emit('max_retries_exceeded', { retryCount: this.state.retryCount });
    return false;
  }

  /**
   * 开始修复
   */
  startFix(): boolean {
    if (this.state.currentPhase !== 'fixing') {
      return false;
    }
    return this.transitionPhase('executing', 'fix_started', 'executor');
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      sessionId: this.state.sessionId,
      currentPhase: 'planning',
      executionResults: [],
      validationResults: [],
      retryCount: 0,
      maxRetries: this.state.maxRetries,
    };
    this.transitionHistory = [];
    this.emit('reset');
  }

  /**
   * 获取转换历史
   */
  getTransitionHistory(): StateTransitionEvent[] {
    return [...this.transitionHistory];
  }

  /**
   * 获取执行结果
   */
  getExecutionResults(): ExecutionResult[] {
    return [...this.state.executionResults];
  }

  /**
   * 获取验证结果
   */
  getValidationResults(): ValidationResult[] {
    return [...this.state.validationResults];
  }

  /**
   * 是否已完成
   */
  isCompleted(): boolean {
    return this.state.currentPhase === 'completed';
  }

  /**
   * 是否成功完成
   */
  isSuccessful(): boolean {
    if (!this.isCompleted()) return false;
    const lastValidation = this.state.validationResults[this.state.validationResults.length - 1];
    return lastValidation?.passed ?? false;
  }
}
