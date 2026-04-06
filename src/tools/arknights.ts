import { Context } from 'koishi';

// 声明此插件依赖 aiTool 服务
export const inject = ['aiTool'];

export function apply(ctx: Context) {
  ctx.aiTool.register('get_arknights_operator_info', {
    definition: {
      type: "function",
      function: {
        name: "get_arknights_operator_info",
        description: "获取明日方舟干员的详细信息、背景设定、技能或属性信息（来源于PRTS Wiki）。当用户询问明日方舟相关内容时，请调用此工具。或者用户的画中出现了你不认识的名字或者代号时，请调用这个工具。",
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
      ctx.logger.info(`[工具被调用] 查询明日方舟干员: ${name}`);

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
        ctx.logger.error(`[工具报错] 获取干员信息失败:`, error);
        return `[获取干员信息失败]: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
}
