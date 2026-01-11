// src/services/status.ts
import { Service, Context } from "koishi";

declare module "koishi" {
  interface Context {
    petStatus: StatusService;
  }
}

const CONFIG = {
  HUNGER_DECAY_PER_HOUR: 0.6, // 每小时饿 0.6 点
  MOOD_DECAY_PER_HOUR: 0.2, // 每小时心情掉 0.2 点
  THIRST_DECAY_PER_HOUR: 1.2, // 每小时渴 0.4 点
  FATIGUE_DECAY_PER_HOUR: 0.8, // 每小时疲劳掉 0.8 点
};

export class StatusService extends Service {
  constructor(ctx: Context) {
    super(ctx, "petStatus");
  }

  // 增加/减少 饱食度
  async addHunger(userId: number, amount: number) {
    const [user] = await this.ctx.database.get("user", { id: userId });


    if (!user) return;
    // 简单的数值限制逻辑

    let newHunger = user.hunger + amount;
    if (newHunger > 100) newHunger = 100;
    if (newHunger < 0) newHunger = 0;

    await this.ctx.database.set("user", { id: userId }, { hunger: newHunger });
    return newHunger;
  }

  async addMood(userId: number, amount: number) {
    const [user] = await this.ctx.database.get("user", { id: userId });
    if (!user) return;
    // 简单的数值限制逻辑
    let newMood = user.mood + amount;
    if (newMood > 100) newMood = 100;
    if (newMood < 0) newMood = 0;

    await this.ctx.database.set("user", { id: userId }, { mood: newMood });
    return newMood;
  }

  async addThirst(userId: number, amount: number) {
    const [user] = await this.ctx.database.get("user", { id: userId });
    if (!user) return;
    // 简单的数值限制逻辑
    let newThirst = user.thirst + amount;
    if (newThirst > 100) newThirst = 100;
    if (newThirst < 0) newThirst = 0;

    await this.ctx.database.set("user", { id: userId }, { thirst: newThirst });
    return newThirst;
  }

  // 增加疲劳度(越低越疲劳)
  async addFatigue(userId: number, amount: number) {
    const [user] = await this.ctx.database.get("user", { id: userId });
    if (!user) return;
    // 简单的数值限制逻辑
    let newFatigue = user.fatigue + amount;
    if (newFatigue > 100) newFatigue = 100;
    if (newFatigue < 0) newFatigue = 0;

    await this.ctx.database.set("user", { id: userId }, { fatigue: newFatigue });
    return newFatigue;
  }

  async checkUpdate(userId: number) {
    const [user] = await this.ctx.database.get("user", { id: userId });
    if (!user) return;

    // 获取当前时间
    const now = Date.now();
    // 用户第一次交互
    if (user.lastUpdate == 0) {
      await this.ctx.database.set("user", { id: userId }, { lastUpdate: now });
      return user;
    }

    // 计算距离上次交互时间差
    const diffMillis = now - user.lastUpdate;
    const diffHours = diffMillis / (1000 * 60 * 60);

    if (diffHours < 0.016) return user;
    // 3. 计算扣除数值
    const hungerLost = Math.floor(diffHours * CONFIG.HUNGER_DECAY_PER_HOUR);
    const moodLost = Math.floor(diffHours * CONFIG.MOOD_DECAY_PER_HOUR);
    const thirstLost = Math.floor(diffHours * CONFIG.THIRST_DECAY_PER_HOUR);

    // 4. 应用扣除 (确保不低于 0)
    const newHunger = Math.max(0, user.hunger - hungerLost);
    const newMood = Math.max(0, user.mood - moodLost);
    const newThirst = Math.max(0, user.thirst - thirstLost);
    const newFatigue = Math.max(0, user.fatigue - diffHours * CONFIG.FATIGUE_DECAY_PER_HOUR);

    let finalMood = newMood;
    if (newHunger < 20) {
      let extraMoodPenalty = Math.floor(diffHours * 0.6);
      finalMood = Math.max(0, finalMood - extraMoodPenalty);
    }

    await this.ctx.database.set(
      "user",
      { id: userId },
      {
        hunger: newHunger,
        mood: finalMood,
        thirst: newThirst,
        fatigue: newFatigue,
        lastUpdate: now, // 【重要】更新时间戳
      }
    );

    return {
      ...user,
      hunger: newHunger,
      mood: finalMood,
      thirst: newThirst,
      lastUpdate: now,
    };
  }





}
