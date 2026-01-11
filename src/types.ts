import { Session } from "koishi";

export interface ItemBase {
  id: string; // 唯一标识，如 'apple'
  name: string; // 显示名称，如 '红苹果'
  description: string; // 描述
  price: number; // 商店价格
  // 核心：物品的使用效果
  // 返回 string 代表执行后的回复文本，返回 void 代表无回复
  onUse?: (session: Session) => Promise<string | void>;
}

export interface FoodItem extends ItemBase {
  type: "food";
  nutrition:{
    hunger: number;
    thirst: number;
    mood?:number;
    fatigue?:number;
  }

}

export interface ToolItem extends ItemBase {
  type: 'tool'
  durability: number // 耐久度
  usageType: 'fishing' | 'cleaning' | 'playing' // 用途分类
}


export type Item = FoodItem | ToolItem;