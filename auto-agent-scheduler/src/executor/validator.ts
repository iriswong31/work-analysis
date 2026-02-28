import { logger } from '../utils/logger.js';
import type { ExecutionResult, CodeOutput } from '../types/index.js';

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
}

/**
 * 代码验证器
 * 验证生成的代码质量
 */
export class CodeValidator {
  /**
   * 验证执行结果
   */
  validate(result: ExecutionResult): ValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 验证每个输出文件
    for (const output of result.outputs) {
      const fileValidation = this.validateCodeOutput(output);
      issues.push(...fileValidation.issues);
      suggestions.push(...fileValidation.suggestions);
      score = Math.min(score, fileValidation.score);
    }

    // 验证整体结果
    if (result.outputs.length === 0) {
      issues.push({
        severity: 'error',
        message: 'No code outputs generated',
      });
      score = 0;
    }

    if (result.duration > 300000) { // 超过5分钟
      issues.push({
        severity: 'warning',
        message: `Execution took too long: ${(result.duration / 1000).toFixed(1)}s`,
      });
      score -= 10;
    }

    return {
      valid: score >= 60 && !issues.some(i => i.severity === 'error'),
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * 验证单个代码输出
   */
  private validateCodeOutput(output: CodeOutput): {
    score: number;
    issues: ValidationIssue[];
    suggestions: string[];
  } {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. 检查代码长度
    if (output.linesOfCode < 5) {
      issues.push({
        severity: 'warning',
        message: 'Code is very short',
        file: output.filePath,
      });
      score -= 20;
    }

    // 2. 检查空内容
    if (!output.content || output.content.trim().length === 0) {
      issues.push({
        severity: 'error',
        message: 'Code content is empty',
        file: output.filePath,
      });
      score = 0;
      return { score, issues, suggestions };
    }

    // 3. 语言特定检查
    const langChecks = this.getLanguageChecks(output.language);
    for (const check of langChecks) {
      const result = check(output.content);
      if (result.issue) {
        issues.push({
          ...result.issue,
          file: output.filePath,
        });
        score -= result.penalty;
      }
      if (result.suggestion) {
        suggestions.push(result.suggestion);
      }
    }

    // 4. 通用代码质量检查
    const qualityChecks = this.getQualityChecks();
    for (const check of qualityChecks) {
      const result = check(output.content);
      if (result.issue) {
        issues.push({
          ...result.issue,
          file: output.filePath,
        });
        score -= result.penalty;
      }
      if (result.suggestion) {
        suggestions.push(result.suggestion);
      }
    }

    return { score: Math.max(0, score), issues, suggestions };
  }

  /**
   * 获取语言特定检查
   */
  private getLanguageChecks(language: string): Array<(code: string) => {
    issue?: Omit<ValidationIssue, 'file'>;
    suggestion?: string;
    penalty: number;
  }> {
    const checks: Array<(code: string) => {
      issue?: Omit<ValidationIssue, 'file'>;
      suggestion?: string;
      penalty: number;
    }> = [];

    if (['ts', 'tsx', 'typescript'].includes(language.toLowerCase())) {
      // TypeScript 检查
      checks.push(
        // 检查 any 类型
        (code) => {
          const anyCount = (code.match(/:\s*any\b/g) || []).length;
          if (anyCount > 3) {
            return {
              issue: {
                severity: 'warning',
                message: `Too many 'any' types (${anyCount})`,
              },
              suggestion: 'Consider using more specific types instead of any',
              penalty: 10,
            };
          }
          return { penalty: 0 };
        },
        // 检查类型导入
        (code) => {
          if (code.includes('import') && !code.includes('import type') && code.includes(': ')) {
            return {
              suggestion: 'Consider using "import type" for type-only imports',
              penalty: 0,
            };
          }
          return { penalty: 0 };
        }
      );
    }

    if (['js', 'jsx', 'javascript'].includes(language.toLowerCase())) {
      // JavaScript 检查
      checks.push(
        // 检查 var 使用
        (code) => {
          if (code.includes('var ')) {
            return {
              issue: {
                severity: 'warning',
                message: 'Using "var" instead of "let" or "const"',
              },
              suggestion: 'Use "let" or "const" instead of "var"',
              penalty: 5,
            };
          }
          return { penalty: 0 };
        }
      );
    }

    return checks;
  }

  /**
   * 获取通用代码质量检查
   */
  private getQualityChecks(): Array<(code: string) => {
    issue?: Omit<ValidationIssue, 'file'>;
    suggestion?: string;
    penalty: number;
  }> {
    return [
      // 检查 console.log
      (code) => {
        const consoleCount = (code.match(/console\.(log|debug|info)/g) || []).length;
        if (consoleCount > 5) {
          return {
            issue: {
              severity: 'info',
              message: `Many console statements (${consoleCount})`,
            },
            suggestion: 'Consider removing debug console statements',
            penalty: 5,
          };
        }
        return { penalty: 0 };
      },

      // 检查 TODO 注释
      (code) => {
        const todoCount = (code.match(/\/\/\s*TODO/gi) || []).length;
        if (todoCount > 3) {
          return {
            issue: {
              severity: 'warning',
              message: `Many TODO comments (${todoCount})`,
            },
            suggestion: 'Consider completing TODO items before delivery',
            penalty: 10,
          };
        }
        return { penalty: 0 };
      },

      // 检查长行
      (code) => {
        const lines = code.split('\n');
        const longLines = lines.filter(l => l.length > 120).length;
        if (longLines > 5) {
          return {
            issue: {
              severity: 'info',
              message: `Many long lines (${longLines} lines > 120 chars)`,
            },
            suggestion: 'Consider breaking long lines for better readability',
            penalty: 5,
          };
        }
        return { penalty: 0 };
      },

      // 检查注释比例
      (code) => {
        const lines = code.split('\n');
        const commentLines = lines.filter(l => 
          l.trim().startsWith('//') || 
          l.trim().startsWith('/*') ||
          l.trim().startsWith('*')
        ).length;
        const ratio = commentLines / lines.length;
        
        if (lines.length > 50 && ratio < 0.05) {
          return {
            suggestion: 'Consider adding more comments for complex logic',
            penalty: 0,
          };
        }
        return { penalty: 0 };
      },
    ];
  }

  /**
   * 生成验证报告
   */
  generateReport(validation: ValidationResult): string {
    const lines: string[] = [];

    lines.push(`## 代码验证报告`);
    lines.push('');
    lines.push(`**状态**: ${validation.valid ? '✅ 通过' : '❌ 未通过'}`);
    lines.push(`**评分**: ${validation.score}/100`);
    lines.push('');

    if (validation.issues.length > 0) {
      lines.push('### 问题');
      for (const issue of validation.issues) {
        const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        lines.push(`- ${icon} ${issue.message}${issue.file ? ` (${issue.file})` : ''}`);
      }
      lines.push('');
    }

    if (validation.suggestions.length > 0) {
      lines.push('### 建议');
      for (const suggestion of validation.suggestions) {
        lines.push(`- 💡 ${suggestion}`);
      }
    }

    return lines.join('\n');
  }
}

export const codeValidator = new CodeValidator();
