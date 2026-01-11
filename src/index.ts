import { Context, Schema } from "koishi";
import { } from 'koishi-plugin-puppeteer'
import * as Database from "./database";
import { StatusService } from "./services/status";
import { ItemService } from "./services/item";
import { BagService } from './services/bag'
import { html } from './templates/html'
import * as CoreModule from './modules/core'
export const name = "furina-chatbot";

export interface Config { }

export const inject = ["database"];

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context, config: Config) {
  // write your plugin here
  // ctx.database.drop("pet_inventory");

  // 加载各类服务
  ctx.plugin(ItemService);
  ctx.plugin(Database);
  ctx.plugin(StatusService);
  ctx.plugin(BagService)

  ctx.plugin(CoreModule)
  // 2. 写临时指令测试
  ctx.inject(["petStatus", "petItems", "petBag"], (ctx) => {
    ctx
      .command("pet-test", "查看宠物状态")
      .userFields([
        "id",
        "hunger",
        "mood",
        "affinity",
        "thirst",
        "fatigue",
        "lastUpdate",
      ])
      .action(async ({ session }) => {
        // session.user 会自动获取数据库里的数据
        if (!session.user) return;

        const user = await ctx.petStatus.checkUpdate(session.user.id);
        const { hunger, mood, thirst, fatigue, lastUpdate } = user;
        return `你的芙芙当前状态：\n饱食度: ${hunger}\n心情: ${mood}\n口渴度${thirst}\n疲劳值${fatigue}\n上次更新${lastUpdate}`;
      });

    ctx
      .command("feed", "投喂测试")
      .userFields(["id", "hunger"])
      .action(async ({ session }) => {
        // 调用服务
        // console.log("feed pet");
        const current = await ctx.petStatus.addHunger(session.user.id, 10);
        return `投喂成功！当前饱食度：${current}`;
      });

    ctx
      .command("get", "获取物品测试")
      .userFields(["id"])
      .action(async ({ session }) => {
        return "nihao";
      });

    ctx
      .command("get_item <itemId: string>", "查询物品清单中物品")
      .action(async ({ session }, itemId) => {
        console.log(itemId);
        const Item = ctx.petItems.get(itemId);
        if (!Item) return "物品不存在";
        return Item.name;
      });


    ctx.command("gain_item <itemId:string> <count:number>", "获取物品测试")
      .userFields(["id"])
      .action(async ({ session }, itemId, count) => {

        const item = ctx.petItems.get(itemId);
        if (!item) {
          return `物品${itemId}不存在！`
        }

        const amount = count || 1;
        await ctx.petBag.gainItem(session.user.id, itemId, amount);
        return `获得${item.name} ${amount}个`;

      })

    ctx.command('bag', '查看背包')
      .userFields(['id'])
      .action(async ({ session }) => {
        // 1. 获取数据
        const items = await ctx.petBag.getBagDetails(session.user.id)

        // 2. 判空
        if (items.length === 0) {
          return '你的背包空空如也。'
        }

        // 3. 格式化输出
        // map: 把每个物品对象变成一行文字
        // join: 把数组拼成一个长字符串
        const listString = items.map((item, index) => {
          return `${index + 1}. [${item.name}] x ${item.count}`
        }).join('\n')

        return `🎒 你的背包：\n${listString}\n\n输入 "use <物品ID>" 可以使用。`
      })


    ctx.command('test_shelf', '测试货架渲染')
      .action(async () => {
        // 生成 9 个格子的空货架 HTML
        const market_html = html.getMarket(27);

        // 渲染
        const imgBuf = await ctx.puppeteer.render(market_html)

        return imgBuf;
      })


  });
}
