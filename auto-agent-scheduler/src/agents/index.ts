/**
 * 三 Agent 协作系统 - 主入口
 * Planner-Executor-Reviewer 架构
 */

// 类型导出
export * from './types';

// Agent 导出
export { PlannerAgent } from './planner';
export { ExecutorAgent } from './executor';
export { ReviewerAgent } from './reviewer';

// 协调器导出
export { AgentCoordinator, StateManager } from './coordinator';

// 便捷工厂函数
import { AgentCoordinator } from './coordinator';
import { PlannerAgent } from './planner';
import { ExecutorAgent } from './executor';
import { ReviewerAgent } from './reviewer';
import type { AgentSystemConfig, PlanRequest } from './types';

/**
 * 创建完整的三 Agent 系统
 */
export function createAgentSystem(
  projectRoot?: string,
  config?: Partial<AgentSystemConfig>
): AgentCoordinator {
  const coordinator = new AgentCoordinator(config);
  
  // 注册三个 Agent
  coordinator.registerAgent(new PlannerAgent());
  coordinator.registerAgent(new ExecutorAgent(projectRoot));
  coordinator.registerAgent(new ReviewerAgent(projectRoot, config?.minPassScore));
  
  return coordinator;
}

/**
 * 快速执行任务流程
 */
export async function runAgentWorkflow(
  request: PlanRequest,
  projectRoot?: string,
  config?: Partial<AgentSystemConfig>
) {
  const coordinator = createAgentSystem(projectRoot, config);
  return coordinator.run(request);
}

/**
 * 检查产出一致性（独立使用）
 */
export async function checkOutputConsistency(projectRoot?: string) {
  const reviewer = new ReviewerAgent(projectRoot);
  
  // 创建一个空计划用于一致性检查
  const emptyPlan = {
    id: 'consistency-check',
    title: 'Output Consistency Check',
    description: 'Check if all recorded outputs have actual content',
    createdAt: new Date(),
    tasks: [],
    acceptanceCriteria: [{
      id: 'consistency',
      description: '验证所有记录的产出都有对应的实际内容',
      type: 'consistency' as const,
      validationRule: {
        type: 'custom' as const,
        params: { checkType: 'output_record_consistency' },
        errorMessage: '存在记录但没有实际内容的产出',
      },
      required: true,
    }],
    expectedOutputs: [],
    estimatedMinutes: 0,
    state: 'planned' as const,
  };

  const result = await reviewer.process({
    type: 'review_request',
    payload: { plan: emptyPlan, executionResults: [] },
  });

  return result;
}
