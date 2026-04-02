import { Context, Schema } from "koishi";
import { } from 'koishi-plugin-puppeteer'
import * as Database from "./database";
import { StatusService } from "./services/status";
import { ItemService } from "./services/item";
import { BagService } from './services/bag'
import { AIToolService } from './services/aitool'
import { html } from './templates/html'
import * as CoreModule from './modules/core'
import * as ChatModule from './modules/chat'

export const name = "furina-chatbot";

export interface Config {
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  systemPrompt: string;
}

export const inject = ["database"];

export const Config: Schema<Config> = Schema.object({
  openaiApiKey: Schema.string().description("OpenAI API Key (如不填写则聊天不可用)"),
  openaiBaseUrl: Schema.string().default("https://api.openai.com/v1").description("OpenAI Base URL"),
  openaiModel: Schema.string().default("gpt-3.5-turbo").description("OpenAI Model"),
  systemPrompt: Schema.string().role("textarea").default("你是芙宁娜。你现在的状态是：心情 {mood}/100，饱食度 {hunger}/100，口渴度 {thirst}/100，疲劳度 {fatigue}/100。如果用户说的话让你心情变化，请在回复末尾附带 #心情+1#, #饱食度-5#（以此类推，必须是这种格式，支持 + 或 - 变化）。请根据当前状态自然地回复群友。").description("系统提示词"),
});

export function apply(ctx: Context, config: Config) {
  // write your plugin here
  // ctx.database.drop("pet_inventory");

  // 加载各类服务
  ctx.plugin(ItemService);
  ctx.plugin(Database);
  ctx.plugin(StatusService);
  ctx.plugin(BagService);
  ctx.plugin(AIToolService);

  ctx.plugin(CoreModule)
  ctx.plugin(ChatModule, config)
  // 2. 写临时指令测试
  ctx.inject(["petStatus", "petItems", "petBag"], (ctx) => {
    ctx
      .command("pet.test", "查看宠物状态")
      .action(async ({ session }) => {
        const status = await ctx.petStatus.checkUpdate();
        const { hunger, mood, thirst, fatigue, lastUpdate } = status;
        return `你的芙芙当前状态：\n饱食度: ${hunger}\n心情: ${mood}\n口渴度${thirst}\n疲劳值${fatigue}\n上次更新${lastUpdate}`;
      });

    ctx
      .command("feed", "投喂测试")
      .action(async ({ session }) => {
        const current = await ctx.petStatus.addHunger(10);
        return `投喂成功！当前饱食度：${current}`;
      });

    ctx
      .command("resetStatus", "重置宠物状态")
      .action(async ({ session }) => {
        const current = await ctx.petStatus.resetStatus();
        return `重置成功！当前饱食度：${current.hunger}，心情：${current.mood}，口渴度：${current.thirst}，疲劳度：${current.fatigue}`;
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
  });

  ctx.inject(["puppeteer"], (ctx) => {
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
