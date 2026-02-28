import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getIrisMePath } from '../utils/config.js';
import { aiClient } from './ai-client.js';
import type { 
  ExecutableTask, 
  ExecutionResult, 
  CodeOutput 
} from '../types/index.js';

/**
 * 代码执行器
 * 调用 AI 生成代码并保存到文件
 */
export class CodeExecutor {
  /**
   * 执行任务
   */
  async execute(task: ExecutableTask): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const outputs: CodeOutput[] = [];

    try {
      logs.push(`Starting task: ${task.sourceTask.title}`);
      logs.push(`Task type: ${task.type}`);
      logs.push(`Priority: ${task.priority}`);

      // 1. 调用 AI 生成代码
      logs.push('Calling AI to generate code...');
      const aiResponse = await aiClient.generateCode(
        task.context.requirements,
        {
          projectPath: task.context.projectPath,
          relatedFiles: task.context.relatedFiles,
          techStack: task.context.techStack,
          constraints: task.context.constraints,
        }
      );

      logs.push(`AI response received. Tokens used: ${aiResponse.tokensUsed}`);

      // 2. 解析代码块
      const codeBlocks = this.parseCodeBlocks(aiResponse.content);
      logs.push(`Parsed ${codeBlocks.length} code blocks`);

      if (codeBlocks.length === 0) {
        throw new Error('No code blocks found in AI response');
      }

      // 3. 保存代码文件
      for (const block of codeBlocks) {
        const output = await this.saveCodeBlock(block, task);
        if (output) {
          outputs.push(output);
          logs.push(`Saved: ${output.filePath} (${output.linesOfCode} lines)`);
        }
      }

      const duration = Date.now() - startTime;
      logs.push(`Task completed in ${duration}ms`);

      return {
        taskId: task.id,
        success: true,
        outputs,
        logs,
        duration,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        aiTokensUsed: aiResponse.tokensUsed,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logs.push(`Error: ${errorMessage}`);

      logger.error(`Task execution failed: ${errorMessage}`);

      return {
        taskId: task.id,
        success: false,
        outputs,
        logs,
        duration,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        error: errorMessage,
      };
    }
  }

  /**
   * 解析代码块
   */
  private parseCodeBlocks(content: string): Array<{
    filePath: string;
    language: string;
    code: string;
  }> {
    const blocks: Array<{
      filePath: string;
      language: string;
      code: string;
    }> = [];

    // 匹配 markdown 代码块
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();

      // 尝试从代码或上下文中提取文件路径
      const filePath = this.extractFilePath(content, match.index, code, language);

      blocks.push({
        filePath,
        language,
        code,
      });
    }

    return blocks;
  }

  /**
   * 提取文件路径
   */
  private extractFilePath(
    content: string,
    blockIndex: number,
    code: string,
    language: string
  ): string {
    // 1. 检查代码块前的文件路径注释
    const beforeBlock = content.substring(Math.max(0, blockIndex - 200), blockIndex);
    
    // 匹配 "// filepath: xxx" 或 "文件: xxx" 或 "File: xxx"
    const pathPatterns = [
      /\/\/\s*filepath:\s*([^\n]+)/i,
      /\/\/\s*file:\s*([^\n]+)/i,
      /文件[：:]\s*([^\n]+)/,
      /路径[：:]\s*([^\n]+)/,
      /`([^`]+\.\w+)`/,
    ];

    for (const pattern of pathPatterns) {
      const match = beforeBlock.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // 2. 检查代码内的文件路径注释（第一行）
    const firstLine = code.split('\n')[0];
    for (const pattern of pathPatterns) {
      const match = firstLine.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // 3. 根据语言生成默认文件名
    const ext = this.getExtension(language);
    const timestamp = Date.now();
    return `generated_${timestamp}.${ext}`;
  }

  /**
   * 获取文件扩展名
   */
  private getExtension(language: string): string {
    const extMap: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      tsx: 'tsx',
      jsx: 'jsx',
      python: 'py',
      go: 'go',
      java: 'java',
      rust: 'rs',
      css: 'css',
      scss: 'scss',
      html: 'html',
      json: 'json',
      yaml: 'yaml',
      yml: 'yml',
      sql: 'sql',
      shell: 'sh',
      bash: 'sh',
      markdown: 'md',
    };

    return extMap[language.toLowerCase()] || 'txt';
  }

  /**
   * 保存代码块到文件
   */
  private async saveCodeBlock(
    block: { filePath: string; language: string; code: string },
    task: ExecutableTask
  ): Promise<CodeOutput | null> {
    try {
      // 确定保存路径
      let savePath: string;
      
      if (path.isAbsolute(block.filePath)) {
        savePath = block.filePath;
      } else {
        // 保存到交付物目录
        const deliveryDir = path.join(
          getIrisMePath(),
          'auto-agent-scheduler/data/deliveries',
          new Date().toISOString().split('T')[0],
          task.id
        );
        savePath = path.join(deliveryDir, block.filePath);
      }

      // 确保目录存在
      await fs.mkdir(path.dirname(savePath), { recursive: true });

      // 写入文件
      await fs.writeFile(savePath, block.code, 'utf-8');

      const linesOfCode = block.code.split('\n').length;

      logger.info(`Code saved to: ${savePath}`);

      return {
        filePath: savePath,
        content: block.code,
        language: block.language,
        linesOfCode,
        action: 'create',
      };

    } catch (error) {
      logger.error(`Failed to save code block: ${error}`);
      return null;
    }
  }

  /**
   * 验证生成的代码
   */
  async validateCode(output: CodeOutput): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 基础验证
    if (!output.content || output.content.trim().length === 0) {
      errors.push('Code content is empty');
    }

    if (output.linesOfCode < 3) {
      errors.push('Code is too short (less than 3 lines)');
    }

    // TypeScript/JavaScript 语法检查（简单版本）
    if (['ts', 'tsx', 'js', 'jsx'].includes(output.language)) {
      // 检查是否有明显的语法错误标记
      if (output.content.includes('// TODO:') && output.content.split('// TODO:').length > 5) {
        errors.push('Too many TODO comments, code may be incomplete');
      }

      // 检查是否有未闭合的括号
      const openBraces = (output.content.match(/{/g) || []).length;
      const closeBraces = (output.content.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push('Mismatched braces detected');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const codeExecutor = new CodeExecutor();
