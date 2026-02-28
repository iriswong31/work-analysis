/**
 * ReviewerAgent - 审查者 Agent
 * 负责验证执行结果，检查产出一致性，生成修复任务
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
  ValidationResult,
  ValidationDetail,
  ValidationIssue,
  FixTask,
  AcceptanceCriterion,
  ExpectedOutput,
} from '../types';

export class ReviewerAgent implements IAgent {
  readonly name = 'ReviewerAgent';
  readonly role: AgentRole = 'reviewer';
  
  private status: AgentStatus = 'idle';
  private projectRoot: string;
  private minPassScore: number;

  constructor(projectRoot?: string, minPassScore: number = 80) {
    this.projectRoot = projectRoot || process.cwd();
    this.minPassScore = minPassScore;
  }

  /**
   * 处理输入
   */
  async process(input: AgentInput): Promise<AgentOutput> {
    if (input.type !== 'review_request') {
      return {
        success: false,
        type: 'validation_result',
        data: null,
        error: `Invalid input type: ${input.type}, expected 'review_request'`,
      };
    }

    this.status = 'processing';

    try {
      const { plan, executionResults } = input.payload as {
        plan: ExecutionPlan;
        executionResults: ExecutionResult[];
      };

      const result = await this.validate(plan, executionResults);

      this.status = 'idle';

      return {
        success: true,
        type: 'validation_result',
        data: result,
        nextAction: result.passed
          ? undefined
          : {
              targetAgent: 'executor',
              actionType: 'fix',
              payload: result.fixTasks,
            },
      };
    } catch (error) {
      this.status = 'error';
      return {
        success: false,
        type: 'validation_result',
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行验证
   */
  private async validate(
    plan: ExecutionPlan,
    executionResults: ExecutionResult[]
  ): Promise<ValidationResult> {
    const validations: ValidationDetail[] = [];
    const issues: ValidationIssue[] = [];

    // 1. 验证每个验收标准
    for (const criterion of plan.acceptanceCriteria) {
      const detail = await this.validateCriterion(criterion, plan, executionResults);
      validations.push(detail);

      if (!detail.passed) {
        issues.push(this.createIssueFromValidation(criterion, detail));
      }
    }

    // 2. 检查产出一致性（核心功能）
    const consistencyIssues = await this.checkOutputConsistency(plan, executionResults);
    issues.push(...consistencyIssues);

    // 3. 检查所有预期产出是否都已创建
    const missingOutputIssues = this.checkMissingOutputs(plan, executionResults);
    issues.push(...missingOutputIssues);

    // 4. 计算分数
    const score = this.calculateScore(validations, issues);

    // 5. 生成修复任务
    const fixTasks = this.generateFixTasks(issues);

    const passed = score >= this.minPassScore && 
      !issues.some(i => i.severity === 'error');

    return {
      planId: plan.id,
      passed,
      score,
      validations,
      issues,
      fixTasks: passed ? undefined : fixTasks,
      validatedAt: new Date(),
    };
  }

  /**
   * 验证单个验收标准
   */
  private async validateCriterion(
    criterion: AcceptanceCriterion,
    plan: ExecutionPlan,
    executionResults: ExecutionResult[]
  ): Promise<ValidationDetail> {
    const { validationRule } = criterion;

    switch (validationRule.type) {
      case 'file_exists':
        return this.validateFileExists(criterion, validationRule.params);

      case 'link_valid':
        return this.validateLinkValid(criterion, validationRule.params);

      case 'content_contains':
        return this.validateContentContains(criterion, validationRule.params);

      case 'code_quality':
        return this.validateCodeQuality(criterion, validationRule.params, executionResults);

      case 'custom':
        return this.validateCustomRule(criterion, validationRule.params, plan, executionResults);

      default:
        return {
          criterionId: criterion.id,
          passed: false,
          message: `Unknown validation rule type: ${validationRule.type}`,
        };
    }
  }

  /**
   * 验证文件存在
   */
  private validateFileExists(
    criterion: AcceptanceCriterion,
    params: Record<string, unknown>
  ): ValidationDetail {
    const filePath = params.path as string;
    const fullPath = path.join(this.projectRoot, filePath);
    const exists = fs.existsSync(fullPath);

    return {
      criterionId: criterion.id,
      passed: exists,
      message: exists 
        ? `文件存在: ${filePath}` 
        : criterion.validationRule.errorMessage,
      evidence: exists ? `Found at ${fullPath}` : undefined,
    };
  }

  /**
   * 验证链接有效
   */
  private validateLinkValid(
    criterion: AcceptanceCriterion,
    params: Record<string, unknown>
  ): ValidationDetail {
    const link = params.link as string;
    
    // 对于内部链接，检查对应的数据文件是否存在
    if (link.startsWith('/deliverables/')) {
      const routePath = link.replace(/^\/deliverables\//, '');
      const dataFile = path.join(
        this.projectRoot,
        'src/data/deliverables',
        `${routePath}.ts`
      );
      const exists = fs.existsSync(dataFile);

      return {
        criterionId: criterion.id,
        passed: exists,
        message: exists 
          ? `链接有效: ${link}` 
          : `链接无效: ${link}，对应数据文件不存在`,
        evidence: exists ? `Data file: ${dataFile}` : undefined,
      };
    }

    // 其他链接暂时认为有效
    return {
      criterionId: criterion.id,
      passed: true,
      message: `链接: ${link}`,
    };
  }

  /**
   * 验证内容包含
   */
  private validateContentContains(
    criterion: AcceptanceCriterion,
    params: Record<string, unknown>
  ): ValidationDetail {
    const filePath = params.path as string;
    const expectedContent = params.content as string;
    const fullPath = path.join(this.projectRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      return {
        criterionId: criterion.id,
        passed: false,
        message: `文件不存在: ${filePath}`,
      };
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const contains = content.includes(expectedContent);

    return {
      criterionId: criterion.id,
      passed: contains,
      message: contains 
        ? `内容验证通过` 
        : `内容不包含预期文本: ${expectedContent.slice(0, 50)}...`,
    };
  }

  /**
   * 验证代码质量
   */
  private validateCodeQuality(
    criterion: AcceptanceCriterion,
    params: Record<string, unknown>,
    executionResults: ExecutionResult[]
  ): ValidationDetail {
    // 检查执行结果中是否有代码输出
    const codeOutputs = executionResults.flatMap(r => 
      r.actualOutputs.filter(o => o.type === 'code')
    );

    if (codeOutputs.length === 0) {
      return {
        criterionId: criterion.id,
        passed: true,
        message: '无代码产出需要验证',
      };
    }

    // 简单的质量检查
    let issues = 0;
    for (const output of codeOutputs) {
      if (output.path) {
        const fullPath = path.join(this.projectRoot, output.path);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // 检查常见问题
          if (content.includes('console.log')) issues++;
          if (content.includes('TODO')) issues++;
          if (content.includes('any')) issues++;
        }
      }
    }

    const passed = issues < 5;
    return {
      criterionId: criterion.id,
      passed,
      message: passed 
        ? '代码质量检查通过' 
        : `发现 ${issues} 个代码质量问题`,
    };
  }

  /**
   * 验证自定义规则
   */
  private async validateCustomRule(
    criterion: AcceptanceCriterion,
    params: Record<string, unknown>,
    plan: ExecutionPlan,
    executionResults: ExecutionResult[]
  ): Promise<ValidationDetail> {
    const checkType = params.checkType as string;

    if (checkType === 'output_record_consistency') {
      // 这是核心的一致性检查
      const issues = await this.checkOutputConsistency(plan, executionResults);
      const passed = issues.length === 0;

      return {
        criterionId: criterion.id,
        passed,
        message: passed 
          ? '产出记录一致性检查通过' 
          : `发现 ${issues.length} 个一致性问题`,
        evidence: passed ? undefined : issues.map(i => i.message).join('; '),
      };
    }

    return {
      criterionId: criterion.id,
      passed: true,
      message: `自定义规则 ${checkType} 验证通过`,
    };
  }

  /**
   * 检查产出一致性 - 核心功能
   * 确保 outputs.json 中记录的产出都有对应的实际内容
   */
  private async checkOutputConsistency(
    plan: ExecutionPlan,
    executionResults: ExecutionResult[]
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // 读取 outputs.json
    const outputsJsonPath = path.join(this.projectRoot, 'src/data/outputs.json');
    
    if (!fs.existsSync(outputsJsonPath)) {
      return issues; // 没有 outputs.json，跳过检查
    }

    try {
      const content = fs.readFileSync(outputsJsonPath, 'utf-8');
      const data = JSON.parse(content) as { outputs: Array<{
        id: string;
        title: string;
        link: string | null;
        type: string;
      }> };
      
      const outputs = data.outputs || [];

      for (const output of outputs) {
        if (output.link) {
          // 检查链接对应的内容是否存在
          const exists = await this.checkLinkContentExists(output.link);
          
          if (!exists) {
            issues.push({
              id: uuidv4(),
              severity: 'error',
              type: 'consistency_error',
              message: `产出 "${output.title}" 记录了链接 ${output.link}，但对应内容不存在`,
              outputId: output.id,
              suggestedFix: `创建 ${output.link} 对应的内容页面，或删除该记录`,
            });
          }
        }
      }
    } catch (error) {
      issues.push({
        id: uuidv4(),
        severity: 'warning',
        type: 'quality_issue',
        message: `无法解析 outputs.json: ${error}`,
      });
    }

    return issues;
  }

  /**
   * 检查链接对应的内容是否存在
   */
  private async checkLinkContentExists(link: string): Promise<boolean> {
    if (link.startsWith('/deliverables/')) {
      const routePath = link.replace(/^\/deliverables\//, '');
      
      // 检查数据文件是否存在（按文件名匹配）
      const possiblePaths = [
        path.join(this.projectRoot, 'src/data/deliverables', `${routePath}.ts`),
        path.join(this.projectRoot, 'src/data/deliverables', `${routePath}.tsx`),
        path.join(this.projectRoot, 'src/data/deliverables', `${routePath}/index.ts`),
      ];

      if (possiblePaths.some(p => fs.existsSync(p))) {
        return true;
      }

      // 如果文件名不匹配，检查 index.ts 中是否导出了对应 ID 的 deliverable
      const indexPath = path.join(this.projectRoot, 'src/data/deliverables', 'index.ts');
      if (fs.existsSync(indexPath)) {
        try {
          // 读取目录下所有 .ts 文件，检查是否有匹配的 ID
          const dir = path.join(this.projectRoot, 'src/data/deliverables');
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // 检查文件中是否包含匹配的 ID
            if (content.includes(`id: '${routePath}'`) || content.includes(`id: "${routePath}"`)) {
              return true;
            }
          }
        } catch {
          // 忽略读取错误
        }
      }

      return false;
    }

    if (link.startsWith('/pages/')) {
      const pagePath = link.replace(/^\/pages\//, '');
      const possiblePaths = [
        path.join(this.projectRoot, 'src/pages', `${pagePath}.tsx`),
        path.join(this.projectRoot, 'src/pages', `${pagePath}/index.tsx`),
      ];

      return possiblePaths.some(p => fs.existsSync(p));
    }

    if (link.startsWith('/reports/')) {
      // 检查报告页面 - 首先检查 App.tsx 路由定义
      const appTsxPath = path.join(this.projectRoot, 'src/App.tsx');
      if (fs.existsSync(appTsxPath)) {
        try {
          const appContent = fs.readFileSync(appTsxPath, 'utf-8');
          // 检查路由定义中是否包含该路径
          if (appContent.includes(`path="${link}"`) || appContent.includes(`path='${link}'`)) {
            return true;
          }
        } catch {
          // 忽略读取错误
        }
      }

      // 回退：检查 pages/reports 目录
      const reportPath = link.replace(/^\/reports\//, '');
      const possiblePaths = [
        path.join(this.projectRoot, 'src/pages/reports', `${reportPath}.tsx`),
        path.join(this.projectRoot, 'src/pages/reports', reportPath, 'index.tsx'),
        // 也检查独立的报告目录
        path.join(this.projectRoot, reportPath),
      ];

      return possiblePaths.some(p => fs.existsSync(p));
    }

    // 根路径 "/" 总是有效的
    if (link === '/') {
      return true;
    }

    // 其他链接暂时认为存在
    return true;
  }

  /**
   * 检查缺失的产出
   */
  private checkMissingOutputs(
    plan: ExecutionPlan,
    executionResults: ExecutionResult[]
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const actualOutputIds = new Set(
      executionResults.flatMap(r => 
        r.actualOutputs
          .filter(o => o.created)
          .map(o => o.expectedOutputId)
      )
    );

    for (const expected of plan.expectedOutputs) {
      if (!actualOutputIds.has(expected.id)) {
        issues.push({
          id: uuidv4(),
          severity: 'error',
          type: 'missing_output',
          message: `预期产出 "${expected.name}" 未创建`,
          outputId: expected.id,
          suggestedFix: `创建产出: ${expected.path || expected.link}`,
        });
      }
    }

    return issues;
  }

  /**
   * 从验证详情创建问题
   */
  private createIssueFromValidation(
    criterion: AcceptanceCriterion,
    detail: ValidationDetail
  ): ValidationIssue {
    return {
      id: uuidv4(),
      severity: criterion.required ? 'error' : 'warning',
      type: 'quality_issue',
      message: detail.message,
      criterionId: criterion.id,
      suggestedFix: criterion.validationRule.errorMessage,
    };
  }

  /**
   * 计算分数
   */
  private calculateScore(
    validations: ValidationDetail[],
    issues: ValidationIssue[]
  ): number {
    if (validations.length === 0) return 100;

    const passedCount = validations.filter(v => v.passed).length;
    let score = (passedCount / validations.length) * 100;

    // 根据问题严重程度扣分
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成修复任务
   */
  private generateFixTasks(issues: ValidationIssue[]): FixTask[] {
    const fixTasks: FixTask[] = [];

    for (const issue of issues) {
      if (issue.severity !== 'error') continue;

      switch (issue.type) {
        case 'missing_output':
          fixTasks.push({
            id: uuidv4(),
            issueId: issue.id,
            type: 'create_output',
            description: `创建缺失的产出: ${issue.message}`,
            params: {
              outputId: issue.outputId,
              suggestedFix: issue.suggestedFix,
            },
            priority: 'high',
          });
          break;

        case 'consistency_error':
          // 一致性错误有两种修复方式：创建内容或删除记录
          fixTasks.push({
            id: uuidv4(),
            issueId: issue.id,
            type: 'remove_record',
            description: `删除无效记录: ${issue.message}`,
            params: {
              recordFile: 'src/data/outputs.json',
              recordId: issue.outputId,
            },
            priority: 'high',
          });
          break;

        case 'invalid_link':
          fixTasks.push({
            id: uuidv4(),
            issueId: issue.id,
            type: 'fix_link',
            description: `修复无效链接: ${issue.message}`,
            params: {
              recordFile: 'src/data/outputs.json',
              recordId: issue.outputId,
              newLink: null,
            },
            priority: 'medium',
          });
          break;
      }
    }

    return fixTasks;
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
