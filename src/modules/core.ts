import { Context } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
export const name = 'pet-module-core'
import { html } from '../templates/html'

import { readFileSync } from 'fs'
import { resolve, join } from 'path'

export function apply(ctx: Context) {
    ctx.inject(['petStatus', 'puppeteer'], (ctx) => {
        // 1. 查看状态
        ctx.command('pet', '查看宠物状态')
            .action(async ({ session }) => {
                const status = await ctx.petStatus.checkUpdate();
                // 使用简单的进度条可视化
                // const bar = (val: number) => '█'.repeat(Math.floor(val / 10)) + '░'.repeat(10 - Math.floor(val / 10))

                const imagePath = resolve(__dirname, '../templates/furina1.jpg')

                // 读取并转换为 base64
                const imageBuffer = readFileSync(imagePath)
                const base64Image = 'data:image/jpeg;base64,' + imageBuffer.toString('base64')

                const pic_html = html.getPetStatus(status, base64Image);

                const pic = await ctx.puppeteer.render(pic_html);

                return pic;
            })
    })


    ctx.inject(['petStatus'], (ctx) => {
        ctx.command('pet.touch', '抚摸宠物')
            .alias('摸摸')
            .action(async ({ session }) => {
                // 调用 Service 增加心情
                const newMood = await ctx.petStatus.addMood(5)
                return `你摸了摸芙芙的头，她看起来很开心！(心情 +5)`
            })
    })

    ctx.inject(['petStatus', 'petItems'], (ctx) => {
        ctx.command('pet.feed <itemId:string>', '投喂')
            .alias('投喂芙芙')
            .userFields(['id'])
            .action(async ({ session }, itemId) => {
                const item = ctx.petItems.resolve(itemId)
                if (!item) return '物品未拥有'
                if (item.type !== 'food') return '你要给芙芙吃什么呢！'

                // 先消耗物品（原本这里好像没有扣背包物品的逻辑，这里暂时不动它）
                // 更新状态
                await ctx.petStatus.checkUpdate();
                const newHunger = await ctx.petStatus.addHunger(item.nutrition.hunger)
                const newThirst = await ctx.petStatus.addThirst(item.nutrition.thirst)




                return `你喂了芙芙 ${item.name}，她看起来很开心！(饱食度 +${item.nutrition.hunger})`
            })
    })

}

