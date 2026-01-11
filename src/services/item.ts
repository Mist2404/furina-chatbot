import { Service, Context } from "koishi";
import { Item } from "../types"; // 假设你把接口定义放在这里
import { AllItems } from "../items";
declare module "koishi" {
  interface Context {
    petItems: ItemService;
  }
}

// 物品服务 用于管理所有物品相关接口
export class ItemService extends Service {
  private items = new Map<string, Item>();

  constructor(ctx: Context) {
    // 注册服务名为 'petItems'
    super(ctx, "petItems");
  }

  protected start() {
    //在这里自己加载数据
    for (const item of AllItems) {
      this.register(item);
    }
  }
  // 注册物品
  register(item: Item) {
    if (this.items.has(item.id)) {
      this.ctx.logger.warn(`重复注册物品: ${item.id}, 旧的物品将被覆盖`);
    }
    this.items.set(item.id, item);
  }

  // 1. 严谨的系统内部调用 (查 ID)
  get(id: string): Item | undefined {
    return this.items.get(id);
  }

  // 2. 宽容的用户交互调用 (查 ID 或 名字)
  resolve(keyword: string): Item | undefined {
    // 先查 ID
    const byId = this.items.get(keyword);
    if (byId) return byId;

    // 再查名字 (支持模糊匹配，比如输入 '苹果' 也能找到 '红苹果')
    for (const item of this.items.values()) {
      if (item.name.includes(keyword)) return item;
    }
    return undefined;
  }
}
