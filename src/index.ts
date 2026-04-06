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
import * as AIToolsPlugin from './tools/index'

export const name = "furina-chatbot";

export interface Config {
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  systemPrompt: string;
  maxHistorySize: number;
}

export const inject = ["database"];

export const Config: Schema<Config> = Schema.object({
  openaiApiKey: Schema.string().description("OpenAI API Key (如不填写则聊天不可用)"),
  openaiBaseUrl: Schema.string().default("https://api.openai.com/v1").description("OpenAI Base URL"),
  openaiModel: Schema.string().default("gpt-3.5-turbo").description("OpenAI Model"),
  maxHistorySize: Schema.number().default(20).description("上下文记忆的最大消息条数（比如20条代表记忆最近10轮对话）"),
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
  ctx.plugin(AIToolsPlugin);

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

    ctx.command('recruit [...tags]', '查询明日方舟公开招募组合')
      .action(async ({ session }, ...tags) => {
        if (!tags || tags.length === 0) {
          return '⚠️ 请提供至少一个招募标签，例如：/recruit 高级资深干员 爆发';
        }

        try {
          const url = new URL('http://127.0.0.1:8000/recruit');
          tags.forEach(tag => url.searchParams.append('tags', tag));

          const response = await fetch(url.toString());
          if (!response.ok) {
            return `API请求失败: ${response.status}`;
          }

          const data = await response.json();
          if (data.code !== 200) {
            return `招募查询失败: ${data.message}`;
          }

          // 预先将所有的头像 URL 转为 Base64，彻底解决 Puppeteer 截图过快导致的图片裂开以及防盗链问题
          const recruitData = data.data;
          const avatarUrls = new Set<string>();
          if (recruitData && recruitData.combinations) {
            recruitData.combinations.forEach((combo: any) => {
              combo.operators.forEach((op: any) => {
                if (op.rarity >= 4 && op.avatar_url) {
                  avatarUrls.add(op.avatar_url);
                }
              });
            });
          }

          const avatarMap = new Map<string, string>();
          // 并发下载图片
          await Promise.all(Array.from(avatarUrls).map(async (imgUrl) => {
            try {
              // 伪装浏览器 User-Agent，避免被 PRTS 拦截
              const imgRes = await fetch(imgUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Referer': 'https://prts.wiki/'
                }
              });
              if (imgRes.ok) {
                const buffer = await imgRes.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const mime = imgRes.headers.get('content-type') || 'image/png';
                avatarMap.set(imgUrl, `data:${mime};base64,${base64}`);
              }
            } catch (e) {
              console.error(`[Recruit] 获取头像失败: ${imgUrl}`, e);
            }
          }));

          // 将 Base64 替换回原数据中
          if (recruitData && recruitData.combinations) {
            recruitData.combinations.forEach((combo: any) => {
              combo.operators.forEach((op: any) => {
                if (avatarMap.has(op.avatar_url)) {
                  op.avatar_url = avatarMap.get(op.avatar_url);
                }
              });
            });
          }

          const recruitHtml = html.getRecruitResult(recruitData);
          const imgBuf = await ctx.puppeteer.render(recruitHtml);
          return imgBuf;
        } catch (error) {
          return `查询异常: ${error instanceof Error ? error.message : String(error)}`;
        }
      });
  });
}
