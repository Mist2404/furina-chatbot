import { Context } from 'koishi';

// 声明此插件依赖 aiTool 服务
export const inject = ['aiTool'];

export function apply(ctx: Context) {
  ctx.aiTool.register('get_dummy_character_info', {
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
}
