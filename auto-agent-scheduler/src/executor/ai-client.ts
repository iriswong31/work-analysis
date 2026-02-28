import Anthropic from '@anthropic-ai/sdk';
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages.js';
import { logger } from '../utils/logger.js';
import { config, getAnthropicApiKey } from '../utils/config.js';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * AI API 客户端
 * 封装与 Claude API 的交互
 */
export class AIClient {
  private client: Anthropic | null = null;

  /**
   * 获取客户端实例
   */
  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: getAnthropicApiKey(),
      });
    }
    return this.client;
  }

  /**
   * 发送消息并获取响应
   */
  async chat(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    const client = this.getClient();

    logger.info(`Sending request to ${config.ai.model}...`);

    try {
      const response = await client.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: systemPrompt || this.getDefaultSystemPrompt(),
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });

      const content = response.content
        .filter((block): block is TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      logger.info(`Response received. Tokens used: ${tokensUsed}`);

      return {
        content,
        tokensUsed,
        model: response.model,
      };
    } catch (error) {
      logger.error('AI API request failed:', error);
      throw error;
    }
  }

  /**
   * 生成代码
   */
  async generateCode(
    requirements: string,
    context: {
      projectPath?: string;
      relatedFiles?: string[];
      techStack?: string[];
      constraints?: string[];
    }
  ): Promise<AIResponse> {
    const systemPrompt = this.buildCodeGenerationPrompt(context);
    
    const userMessage = this.buildCodeRequest(requirements, context);

    return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
  }

  /**
   * 代码审查
   */
  async reviewCode(code: string, context: string): Promise<AIResponse> {
    const systemPrompt = `你是一位资深代码审查专家。请仔细审查代码，指出潜在问题并提供改进建议。
关注点：
1. 代码质量和可读性
2. 潜在的 bug 和边界情况
3. 性能问题
4. 安全漏洞
5. 最佳实践`;

    const userMessage = `请审查以下代码：

上下文：${context}

代码：
\`\`\`
${code}
\`\`\`

请提供详细的审查意见和改进建议。`;

    return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
  }

  /**
   * 构建代码生成系统提示
   */
  private buildCodeGenerationPrompt(context: {
    techStack?: string[];
    constraints?: string[];
  }): string {
    let prompt = `你是 Iris 的数字分身，一位专业的全栈开发工程师。你的任务是根据需求生成高质量的代码。

## 代码生成规范

1. **代码质量**
   - 编写清晰、可维护的代码
   - 添加必要的注释和文档
   - 遵循语言/框架的最佳实践
   - 处理边界情况和错误

2. **输出格式**
   - 使用 markdown 代码块包裹代码
   - 在代码块前注明文件路径，格式：\`// filepath: path/to/file.ts\`
   - 如果需要创建多个文件，分别输出每个文件

3. **代码风格**
   - TypeScript：使用严格类型，避免 any
   - React：使用函数组件和 Hooks
   - 命名清晰有意义
   - 保持代码简洁`;

    if (context.techStack && context.techStack.length > 0) {
      prompt += `\n\n## 技术栈\n${context.techStack.join(', ')}`;
    }

    if (context.constraints && context.constraints.length > 0) {
      prompt += `\n\n## 约束条件\n${context.constraints.map(c => `- ${c}`).join('\n')}`;
    }

    return prompt;
  }

  /**
   * 构建代码请求消息
   */
  private buildCodeRequest(
    requirements: string,
    context: {
      projectPath?: string;
      relatedFiles?: string[];
    }
  ): string {
    let message = `## 需求\n\n${requirements}`;

    if (context.projectPath) {
      message += `\n\n## 项目路径\n${context.projectPath}`;
    }

    if (context.relatedFiles && context.relatedFiles.length > 0) {
      message += `\n\n## 相关文件\n${context.relatedFiles.map(f => `- ${f}`).join('\n')}`;
    }

    message += `\n\n请根据以上需求生成代码。确保代码完整、可运行，并包含必要的导入语句和类型定义。`;

    return message;
  }

  /**
   * 默认系统提示
   */
  private getDefaultSystemPrompt(): string {
    return `你是 Iris 的数字分身，一位专业的软件工程师。
你的特点是：
- 代码质量高，注重可维护性
- 善于理解需求，提供最优解决方案
- 熟悉现代前端和后端技术栈
- 注重用户体验和性能优化`;
  }
}

export const aiClient = new AIClient();
