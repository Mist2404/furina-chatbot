// src/database.ts
import { Context } from "koishi";

declare module "koishi" {
  interface BotStatus {
    id: number;
    affinity: number;
    mood: number;
    hunger: number;
    thirst: number;
    fatigue: number;
    lastUpdate: number;
  }
}

declare module "koishi" {
  interface Inventory {
    id: number;
    userId: number;
    itemId: string;
    counts: number;
  }

  interface Tables {
    pet_inventory: Inventory;
    bot_status: BotStatus;
  }
}

export function apply(ctx: Context) {
  ctx.model.extend(
    "bot_status",
    {
      id: "unsigned",
      affinity: { type: "unsigned", initial: 0 },
      mood: { type: "unsigned", initial: 50 },
      hunger: { type: "unsigned", initial: 80 },
      thirst: { type: "unsigned", initial: 80 },
      fatigue: { type: "unsigned", initial: 0 },
      lastUpdate: { type: "unsigned", initial: 0 },
    },
    {
      primary: "id",
    }
  );

  ctx.model.extend(
    "pet_inventory",
    {
      // 字段定义
      id: "unsigned", // 自增主键
      userId: "unsigned", // 存储用户的 ID
      itemId: "string", // 物品 ID
      counts: { type: "unsigned", initial: 0 },
    },
    {
      // 配置项
      primary: "id", // 指定主键
      autoInc: true, // 开启自增

      // 4. 【关键】定义外键引用
      foreign: {
        userId: ["user", "id"], // 意思是：本表的 userId 字段，引用 user 表的 id 字段
      },

      // 推荐：设置唯一索引，防止同一个用户对同一个物品有两行记录
      // 这样当用户再获得苹果时，我们是更新数量，而不是插入新行
      unique: [["userId", "itemId"]],
    }
  );
}
