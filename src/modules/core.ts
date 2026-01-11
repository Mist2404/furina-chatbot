import { Context } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
export const name = 'pet-module-core'
import { html } from '../templates/html'

import { readFileSync } from 'fs'
import { resolve, join } from 'path'

export function apply(ctx: Context) {
    ctx.inject(['petStatus'], (ctx) => {
        // 1. 查看状态
        ctx.command('pet', '查看宠物状态')
            .userFields(['id'])
            .action(async ({ session }) => {
                const user = await ctx.petStatus.checkUpdate(session.user.id);
                // 使用简单的进度条可视化
                // const bar = (val: number) => '█'.repeat(Math.floor(val / 10)) + '░'.repeat(10 - Math.floor(val / 10))

                const imagePath = resolve(__dirname, '../assets/furina1.jpg')

                // 读取并转换为 base64
                const imageBuffer = readFileSync(imagePath)
                const base64Image = 'data:image/jpeg;base64,' + imageBuffer.toString('base64')

                const pic_html = html.getPetStatus(user, base64Image);

                const pic = await ctx.puppeteer.render(pic_html);

                return pic;
            })
    })

    ctx.command('pet.touch', '抚摸宠物')
        .alias('摸摸')
        .userFields(['id'])
        .action(async ({ session }) => {
            // 调用 Service 增加心情
            const newMood = await ctx.petStatus.addMood(session.user.id, 5)
            return `你摸了摸芙芙的头，她看起来很开心！(心情 +5)`
        })


    ctx.command('pet.feed <itemId:string>', '投喂')
        .alias('投喂芙芙')
        .userFields(['id'])
        .action(async ({ session }, itemId) => {
            const item = ctx.petItems.resolve(itemId)
            if (!item) return '物品未拥有'
            if (item.type !== 'food') return '你要给芙芙吃什么呢！'
            // 调用 Service 增加饱食度
            //先更新再增加
            const user = ctx.petStatus.checkUpdate(session.user.id);

            const newHunger = await ctx.petStatus.addHunger(session.user.id, item.nutrition.hunger)
            const newThirst = await ctx.petStatus.addThirst(session.user.id, item.nutrition.thirst)




            return `你喂了芙芙 ${item.name}，她看起来很开心！(饱食度 +${item.nutrition.hunger})`
        })


}

