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
  static inject = ['database'];

  constructor(ctx: Context) {
    super(ctx, "petStatus");
  }

  async getBotStatus() {
    let [status] = await this.ctx.database.get("bot_status", { id: 1 });
    if (!status) {
      status = await this.ctx.database.create("bot_status", { id: 1 });
    }
    return status;
  }

  // 增加/减少 饱食度
  async addHunger(amount: number) {
    const status = await this.getBotStatus();
    let newHunger = status.hunger + amount;
    if (newHunger > 100) newHunger = 100;
    if (newHunger < 0) newHunger = 0;

    await this.ctx.database.set("bot_status", { id: 1 }, { hunger: newHunger });
    return newHunger;
  }

  async addMood(amount: number) {
    const status = await this.getBotStatus();
    let newMood = status.mood + amount;
    if (newMood > 100) newMood = 100;
    if (newMood < 0) newMood = 0;

    await this.ctx.database.set("bot_status", { id: 1 }, { mood: newMood });
    return newMood;
  }

  async addThirst(amount: number) {
    const status = await this.getBotStatus();
    let newThirst = status.thirst + amount;
    if (newThirst > 100) newThirst = 100;
    if (newThirst < 0) newThirst = 0;

    await this.ctx.database.set("bot_status", { id: 1 }, { thirst: newThirst });
    return newThirst;
  }

  // 增加疲劳度(越低越疲劳)
  async addFatigue(amount: number) {
    const status = await this.getBotStatus();
    let newFatigue = status.fatigue + amount;
    if (newFatigue > 100) newFatigue = 100;
    if (newFatigue < 0) newFatigue = 0;

    await this.ctx.database.set("bot_status", { id: 1 }, { fatigue: newFatigue });
    return newFatigue;
  }

  async checkUpdate() {
    const status = await this.getBotStatus();

    // 获取当前时间
    const now = Date.now();
    // 用户第一次交互
    if (status.lastUpdate == 0) {
      await this.ctx.database.set("bot_status", { id: 1 }, { lastUpdate: now });
      return status;
    }

    // 计算距离上次交互时间差
    const diffMillis = now - status.lastUpdate;
    const diffHours = diffMillis / (1000 * 60 * 60);

    if (diffHours < 0.016) return status;
    // 3. 计算扣除数值
    const hungerLost = Math.floor(diffHours * CONFIG.HUNGER_DECAY_PER_HOUR);
    const moodLost = Math.floor(diffHours * CONFIG.MOOD_DECAY_PER_HOUR);
    const thirstLost = Math.floor(diffHours * CONFIG.THIRST_DECAY_PER_HOUR);

    // 4. 应用扣除 (确保不低于 0)
    const newHunger = Math.max(0, status.hunger - hungerLost);
    const newMood = Math.max(0, status.mood - moodLost);
    const newThirst = Math.max(0, status.thirst - thirstLost);
    const newFatigue = Math.max(0, status.fatigue - diffHours * CONFIG.FATIGUE_DECAY_PER_HOUR);

    let finalMood = newMood;
    if (newHunger < 20) {
      let extraMoodPenalty = Math.floor(diffHours * 0.6);
      finalMood = Math.max(0, finalMood - extraMoodPenalty);
    }

    await this.ctx.database.set(
      "bot_status",
      { id: 1 },
      {
        hunger: newHunger,
        mood: finalMood,
        thirst: newThirst,
        fatigue: newFatigue,
        lastUpdate: now, // 【重要】更新时间戳
      }
    );

    return {
      ...status,
      hunger: newHunger,
      mood: finalMood,
      thirst: newThirst,
      lastUpdate: now,
    };
  }





}
