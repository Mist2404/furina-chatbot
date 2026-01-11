import { Service, Context } from "koishi";

declare module "koishi" {
  interface Context {
    petBag: BagService;
  }
}

export class BagService extends Service {
  constructor(ctx: Context) {
    super(ctx, "petBag");
  }

  // 获得物品

  async gainItem(userId: number, itemId: string, count: number = 1){
    const [existing] = await this.ctx.database.get("pet_inventory", {userId, itemId});
    if(existing){
      await this.ctx.database.set("pet_inventory", {id:userId, itemId:itemId},{counts:existing.counts + count});

    }
    else {
      await this.ctx.database.create("pet_inventory", {userId, itemId:itemId, counts:count})
    }

  }

  async loseItem(userId: number, itemId:string, count: number = 1) : Promise<boolean>{
    const [existing] = await this.ctx.database.get("pet_inventory", {userId, itemId});

    // 物品不存在
    if (!existing || existing.counts < count) {
      return false
    }
    
    // 物品数量等于要消耗的数量
    if(existing.counts == count){
      await this.ctx.database.remove("pet_inventory", {id:userId, itemId})
    }
    // 物品数量大于要消耗的数量
    else {
      await this.ctx.database.set("pet_inventory", {id:userId},{counts:existing.counts - count})
    }
    return true

  }

async getBagDetails(userId: number) {
    // 1. 从数据库拿“只有ID和数量”的原始数据
    const rows = await this.ctx.database.get('pet_inventory', { userId })
    
    // 2. 过滤掉 count <= 0 的脏数据 (防御性编程)
    const validRows = rows.filter(r => r.counts > 0)

    // 3. 数据组装 (Data Mapping)
    const details = validRows.map(row => {
      // 去 ItemService 查字典
      const itemDef = this.ctx.petItems.get(row.itemId)
      
      return {
        id: row.itemId,
        // 如果代码里把物品删了，给个默认名
        name: itemDef ? itemDef.name : '未知物品', 
        description: itemDef ? itemDef.description : '该物品已失效',
        count: row.counts,
        price: itemDef?.price || 0
      }
    })

    return details
  }
}
