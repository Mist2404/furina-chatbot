import { Context } from 'koishi'
import OpenAI from 'openai'
import { Config } from '../index'

export const name = 'pet-module-chat'

// apply 是 Koishi 插件的入口函数，这就相当于 C++ 里的 main() 或者 Python 的 __init__
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

  // 【新增】内存缓存，用于存储上下文记忆。
  // Map 在 TypeScript/JavaScript 中就相当于 C++ 的 std::unordered_map 或者是 Python 里的 字典(dict)。
  // 这里表示它的 Key 是一个 string (纯文本ID), Value 是一个包含历史对话字典的数组 (Array/List)。
  const memoryCache = new Map<string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]>();

  // 依赖 petStatus 和 aiTool
  ctx.inject(['petStatus', 'aiTool'], (ctx) => {
    // ctx.middleware 注册了一个中间件。你可以理解为一种“全局拦截器”。
    // 每次机器人收到任何消息时，都会自动调用这个函数。
    // async (...) => {...} 是 JS/TS 的“异步匿名函数”(类似 C++ 的 Lambda 或者 Python 的 async def 匿名版)。
    // 使用 async 是因为大模型请求需要等待网络IO，这样它就不会像传统 C++ 一样阻塞主线程，其余群友还可以正常和机器人交互。
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

      // 【新增】获取上下文 ID，群聊用 channelId，私聊用 userId
      const contextId = session.isDirect ? session.userId : session.channelId;
      if (!contextId) return next();

      // 初始化当前上下文的记忆数组 (如果这个键不在字典中，就给它赋一个空列表 [ ])
      if (!memoryCache.has(contextId)) {
        memoryCache.set(contextId, []);
      }

      // 从字典中获取对应 ID 的历史记录。
      // 注意末尾的叹号 '!' : 这是 TypeScript 独有的语法。
      // 它的作用是强制告诉编译器“不用检查了，这里绝对不可能为空”。
      // 因为上面我们刚做过初始化，所以我们笃定它有值。这有点类似 C++ 中笃定指针不为 nullptr 然后强行提领（解引用）。
      const history = memoryCache.get(contextId)!;

      // 构建动态 system prompt
      const systemPrompt = config.systemPrompt
        .replace('{mood}', status.mood.toString())
        .replace('{hunger}', status.hunger.toString())
        .replace('{thirst}', status.thirst.toString())
        .replace('{fatigue}', status.fatigue.toString());

      try {
        let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          // 这里的 ... 叫作“展开运算符 (Spread Operator)”。
          // 它等同于 Python 列表里的解包操作 [*history]。意思就是把 history 数组（列表）里的所有大括号元素拿出来，平铺排列在这里。
          ...history,
          { role: 'user', content: content }
        ];
        ctx.logger.info("construct message");
        const tools = ctx.aiTool.getTools();

        let completion = await openai.chat.completions.create({
          model: config.openaiModel,
          messages: messages,
          tools: tools.length > 0 ? tools : undefined,
        });

        let responseMessage = completion.choices[0]?.message;

        while (responseMessage && responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          messages.push(responseMessage as OpenAI.Chat.Completions.ChatCompletionMessageParam);

          for (const toolCall of responseMessage.tool_calls) {
            const functionName = (toolCall as any).function.name;
            let functionArgs = {};
            try {
              functionArgs = JSON.parse((toolCall as any).function.arguments);
            } catch (err) {
              ctx.logger.warn(`工具参数解析失败: ${(toolCall as any).function.arguments}`);
            }

            const registeredTool = ctx.aiTool.get(functionName);
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
              content: String(functionResult),
            } as OpenAI.Chat.Completions.ChatCompletionToolMessageParam);
          }

          completion = await openai.chat.completions.create({
            model: config.openaiModel,
            messages: messages,
            tools: tools.length > 0 ? tools : undefined,
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
            ctx.logger.info(`[状态更新] 心情: ${amount}`);
          } else if (type === '饱食度') {
            await ctx.petStatus.addHunger(amount);
            ctx.logger.info(`[状态更新] 饱食: ${amount}`);
          } else if (type === '口渴度') {
            await ctx.petStatus.addThirst(amount);
            ctx.logger.info(`[状态更新] 口渴: ${amount}`);
          } else if (type === '疲劳度' || type === '疲劳') {
            await ctx.petStatus.addFatigue(amount);
            ctx.logger.info(`[状态更新] 疲劳: ${amount}`);
          }
        }

        // 去除标签，发送给用户纯净文本
        const cleanReply = reply.replace(/#(心情|饱食度|口渴度|疲劳度|疲劳)([-+]\d+)#/g, '').trim();

        // 【新增】把当前轮次对话存入记忆
        if (cleanReply) {
          history.push({ role: 'user', content: content });
          history.push({ role: 'assistant', content: cleanReply });

          // 控制记忆上限 (超出的话从最前面弹掉)
          // length 等同于 Python 的 len(list) 或 C++ 的 list.size()
          while (history.length > config.maxHistorySize) {
            // shift() 方法的作用是移除数组的第一个元素（即最旧的消息），并将其返回。
            // 这相当于 Python 里的 list.pop(0)，或者 C++ 里 std::vector 的 vec.erase(vec.begin())。
            // 使用这种方式不断把最老的一句话挤出历史缓存。
            history.shift();
          }
        }

        return cleanReply;

      } catch (error) {
        ctx.logger.error('LLM 请求失败:', error);
        return '唔...我现在有点头晕，不知道该说什么... (大模型请求失败)';
      }
    })
  })
}
