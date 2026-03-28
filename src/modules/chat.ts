import { Context } from 'koishi'
import OpenAI from 'openai'
import { Config } from '../index'

export const name = 'pet-module-chat'

export interface AITool {
  definition: OpenAI.Chat.Completions.ChatCompletionTool;
  execute: (args: any) => Promise<string>;
}

export function apply(ctx: Context, config: Config) {
  // 只有在配置了 apiKey 时才启动大模型
  if (!config.openaiApiKey) {
    ctx.logger.warn('未配置 OpenAI API Key，全局聊天模块将不会生效。')
    return;
  }

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.openaiBaseUrl,
  })

  // 1. 初始化工具中枢 (Tools Registry)
  const toolRegistry = new Map<string, AITool>();

  // 2. 注册一个测试工具
  toolRegistry.set('get_dummy_character_info', {
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
      ctx.logger.info(`[工具被调用] 查询角色资料: ${character_name}`);

      if (character_name === '胡桃') {
        return JSON.stringify({ name: '胡桃', hp: 15552, atk: 106, description: '往生堂第七十七代堂主' });
      } else if (character_name === '钟离') {
        return JSON.stringify({ name: '钟离', hp: 14695, atk: 251, description: '往生堂客卿，其实是岩王帝君' });
      } else {
        return `未找到关于 ${character_name} 的资料。`;
      }
    }
  });

  // 依赖 petStatus
  ctx.inject(['petStatus'], (ctx) => {
    ctx.middleware(async (session, next) => {
      // 只有 at 机器人，或者是在私聊，才触发大模型
      const selfId = session.bot.selfId || session.bot.userId;
      // ctx.logger.info("selfID", selfId);
      const atStr = `<at id="${selfId}"/>`;
      const isAt = session.content.includes(atStr);
      // ctx.logger.info("isDirect", session.isDirect);
      // ctx.logger.info("isAt", isAt)
      if (!session.isDirect && !isAt) {
        return next()
      }

      // 获取机器人的最新状态
      const status = await ctx.petStatus.checkUpdate();

      if (!status) {
        return next();
      }

      // 提取核心文本
      const content = session.content.replace(new RegExp(atStr + '\\s*'), '').trim();
      if (!content) return next();

      // 【指令过滤】如果消息以 "/" 开头，说明它是一个指令，直接放行给系统的指令中间件处理，大模型不介入
      if (content.startsWith('/')) {
        return next();
      }

      // 构建动态 system prompt
      const systemPrompt = config.systemPrompt
        .replace('{mood}', status.mood.toString())
        .replace('{hunger}', status.hunger.toString())
        .replace('{thirst}', status.thirst.toString())
        .replace('{fatigue}', status.fatigue.toString());

      try {
        let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ];
        ctx.logger.info("construct message");
        const tools = Array.from(toolRegistry.values()).map(t => t.definition);

        let completion = await openai.chat.completions.create({
          model: config.openaiModel,
          messages: messages,
          tools: tools.length > 0 ? tools : undefined,
        });

        let responseMessage = completion.choices[0]?.message;

        if (responseMessage && responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          messages.push(responseMessage as OpenAI.Chat.Completions.ChatCompletionMessageParam);

          for (const toolCall of responseMessage.tool_calls) {
            const functionName = (toolCall as any).function.name;
            const functionArgs = JSON.parse((toolCall as any).function.arguments);

            const registeredTool = toolRegistry.get(functionName);
            let functionResult = "";

            if (registeredTool) {
              try {
                functionResult = await registeredTool.execute(functionArgs);
              } catch (e) {
                functionResult = `[执行报错]: ${e}`;
              }
            } else {
              functionResult = `[错误]: 未找到名为 ${functionName} 的工具。`;
            }

            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: functionResult,
            } as OpenAI.Chat.Completions.ChatCompletionToolMessageParam);
          }

          completion = await openai.chat.completions.create({
            model: config.openaiModel,
            messages: messages,
          });

          responseMessage = completion.choices[0]?.message;
        }

        let reply = responseMessage?.content || '';

        // 解析并扣除状态
        // 匹配 #心情+1# 等
        const regex = /#(心情|饱食度|口渴度|疲劳度|疲劳)([-+]\d+)#/g;
        let match;

        while ((match = regex.exec(reply)) !== null) {
          const type = match[1];
          const amount = parseInt(match[2], 10);

          if (type === '心情') {
            await ctx.petStatus.addMood(amount);
          } else if (type === '饱食度') {
            await ctx.petStatus.addHunger(amount);
          } else if (type === '口渴度') {
            await ctx.petStatus.addThirst(amount);
          } else if (type === '疲劳度' || type === '疲劳') {
            await ctx.petStatus.addFatigue(amount);
          }
        }

        // 去除标签，发送给用户纯净文本
        const cleanReply = reply.replace(/#(心情|饱食度|口渴度|疲劳度|疲劳)([-+]\d+)#/g, '').trim();

        return cleanReply;

      } catch (error) {
        ctx.logger.error('LLM 请求失败:', error);
        return '唔...我现在有点头晕，不知道该说什么... (大模型请求失败)';
      }
    })
  })
}
