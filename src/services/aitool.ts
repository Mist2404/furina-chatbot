import { Service, Context } from "koishi";
import OpenAI from "openai";

export interface AITool {
  definition: OpenAI.Chat.Completions.ChatCompletionTool;
  execute: (args: any) => Promise<string>;
}

declare module "koishi" {
  interface Context {
    aiTool: AIToolService;
  }
}

export class AIToolService extends Service {
  public registry = new Map<string, AITool>();

  constructor(ctx: Context) {
    super(ctx, "aiTool");
  }

  register(name: string, tool: AITool) {
    if (this.registry.has(name)) {
      this.ctx.logger.warn(`[AIToolService] 工具 ${name} 被覆盖注册！`);
    }
    this.registry.set(name, tool);
    this.ctx.logger.info(`[AIToolService] 成功注册 AI 工具: ${name}`);
  }

  getTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return Array.from(this.registry.values()).map(t => t.definition);
  }

  get(name: string): AITool | undefined {
    return this.registry.get(name);
  }
}
