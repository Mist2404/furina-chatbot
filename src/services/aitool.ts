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

  protected start() {
    // 注册测试假数据工具
    this.register('get_dummy_character_info', {
      definition: {
        type: "function",
        function: {
          name: "get_dummy_character_info",
          description: "获取指定游戏角色的详细数据、背景设定或属性信息。",
          parameters: {
            type: "object",
            properties: {
              character_name: {
                type: "string",
                description: "需要查询的角色名字，如：胡桃、钟离",
              },
            },
            required: ["character_name"],
          },
        }
      },
      execute: async (args: any) => {
        const { character_name } = args;
        this.ctx.logger.info(`[工具被调用] 查询角色资料: ${character_name}`);
        
        if (character_name === '胡桃') {
          return JSON.stringify({ name: '胡桃', hp: 15552, atk: 106, description: '往生堂第七十七代堂主' });
        } else if (character_name === '钟离') {
          return JSON.stringify({ name: '钟离', hp: 14695, atk: 251, description: '往生堂客卿，其实是岩王帝君' });
        } else {
          return `未找到关于 ${character_name} 的资料。`;
        }
      }
    });

    // 注册明日方舟干员查询工具，调用本地爬虫接口
    this.register('get_arknights_operator_info', {
      definition: {
        type: "function",
        function: {
          name: "get_arknights_operator_info",
          description: "获取明日方舟干员的详细信息、背景设定、技能或属性信息（来源于PRTS Wiki）。",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "需要查询的干员名字，如：阿米娅、能天使、玛恩纳",
              },
            },
            required: ["name"],
          },
        }
      },
      execute: async (args: any) => {
        const { name } = args;
        this.ctx.logger.info(`[工具被调用] 查询明日方舟干员: ${name}`);
        
        try {
          // 调用 FastAPI 接口
          const response = await fetch(`http://127.0.0.1:8000/operator/${encodeURIComponent(name)}`);
          if (!response.ok) {
            if (response.status === 404) {
               return `未找到干员 '${name}' 的信息，请检查名称是否正确（如：阿米娅）。`;
            }
            return `[API请求失败]: HTTP状态码 ${response.status}`;
          }
          const textData = await response.text();
          return textData;
        } catch (error) {
          this.ctx.logger.error(`[工具报错] 获取干员信息失败:`, error);
          return `[获取干员信息失败]: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    });
  }
}
