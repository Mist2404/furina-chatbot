export interface PetUser {
  hunger: number;
  mood: number;
  thirst: number;
  fatigue: number;
  // 如果还有名字或其他字段，也加在这里
  // name?: string; 
}

export const html = {

  getPetStatus(user: PetUser, avatarBase64: string) {
    const getWidth = (val: number) => Math.max(0, Math.min(100, val));
    return `
        <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap');

      /* 【核心修改区域】 */
      html, body {
        /* 关键 1: 让浏览器视窗大小自动适应内容大小 */
        width: fit-content;
        height: fit-content;
        
        /* 关键 2: 清除默认边距 */
        margin: 0;
        padding: 0;

        /* 确保背景透明，这样如果卡片有圆角，角落也是透明的 */
        background: transparent;
      }
      
      /* 如果你想要极窄的留白，可以在 body 上加一点点 padding */
      body {
        /* 这里设置 8px 的 padding，意味着最终图片四周会有 8px 的留白 */
        padding: 8px; 
        font-family: 'Noto Sans SC', system-ui, sans-serif;
      }
      /* 【核心修改结束】 */


      .card-container {
        width: 340px; /* 控制面板核心宽度 */
        background: #fff;
        border-radius: 16px;
        /* 添加阴影让卡片更有立体感 */
        box-shadow: 0 4px 15px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05);
        overflow: hidden; 
        border: 1px solid rgba(0,0,0,0.05);
        /* 为了防止阴影被切掉，给卡片自身也加一点 margin。
           因为 body 已经设置了 padding fit-content，
           这个 margin 会撑大 body，确保阴影在截图范围内。
        */
        margin: 4px;
      }

      /* --- 以下样式基本没变，只是为了美观微调 --- */

      .header {
        background: linear-gradient(to right, #f8f9fa, #fff);
        padding: 15px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #eee;
      }
      
      .avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        margin-right: 15px;
        object-fit: cover;
        flex-shrink: 0; /* 防止头像被挤压 */
      }

      .header h1 {
        margin: 0;
        font-size: 16px;
        color: #333;
        font-weight: 700;
      }

      .content {
        padding: 15px 20px;
      }

      .row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        font-size: 13px;
      }
      
      .label {
        width: 40px;
        font-weight: bold;
        color: #666;
      }

      .progress-track {
        flex: 1;
        height: 8px;
        background: #f0f2f5;
        border-radius: 4px;
        margin: 0 12px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      
      .value {
        width: 25px;
        text-align: right;
        color: #888;
        font-family: 'Courier New', monospace; /* 用等宽字体让数字对齐更好看 */
        font-weight: bold;
      }

      /* 使用更柔和的渐变色 */
      .bar-hunger { background: linear-gradient(90deg, #ff9a9e 0%, #fad0c4 100%); width: var(--w-hunger); }
      .bar-mood { background: linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%); width: var(--w-mood); }
      .bar-thirst { background: linear-gradient(90deg, #84fab0 0%, #8fd3f4 100%); width: var(--w-thirst); }
      .bar-fatigue { background: linear-gradient(90deg, #fccb90 0%, #d57eeb 100%); width: var(--w-fatigue); }

    </style>
  </head>
  <body>
    <div class="card-container">
      <div class="header">
        ${avatarBase64 ? `<img src="${avatarBase64}" class="avatar" />` : ''}
        <h1>芙芙的状态</h1>
      </div>
      <div class="content">
        <div class="row" style="--w-hunger: ${getWidth(user.hunger)}%">
          <span class="label">饱食</span>
          <div class="progress-track"><div class="progress-bar bar-hunger"></div></div>
          <span class="value">${user.hunger}</span>
        </div>
        <div class="row" style="--w-mood: ${getWidth(user.mood)}%">
          <span class="label">心情</span>
          <div class="progress-track"><div class="progress-bar bar-mood"></div></div>
          <span class="value">${user.mood}</span>
        </div>
        <div class="row" style="--w-thirst: ${getWidth(user.thirst)}%">
          <span class="label">口渴</span>
          <div class="progress-track"><div class="progress-bar bar-thirst"></div></div>
          <span class="value">${user.thirst}</span>
        </div>
        <div class="row" style="--w-fatigue: ${getWidth(user.fatigue)}%">
          <span class="label">疲劳</span>
          <div class="progress-track"><div class="progress-bar bar-fatigue"></div></div>
          <span class="value">${user.fatigue}</span>
        </div>
      </div>
    </div>
  </body>
  </html>
        
        `



  },


  getMarket(totalSlots: number = 9) {
    const emptySlots = Array(totalSlots).fill(0);

    return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&display=swap');

      /* 1. 核心布局设置：紧贴内容 */
      html, body {
        width: fit-content;
        height: fit-content;
        margin: 0;
        padding: 0;
        background: transparent;
      }

      body {
        /* 给一点外部留白，防止阴影被切 */
        padding: 10px;
        font-family: 'Noto Sans SC', sans-serif;
      }

      /* 2. 货架整体容器 */
      .shelf-container {
        width: 360px; /* 设定一个适合手机屏幕的宽度 */
        background: #fdf6e3; /* 米黄色背景 */
        border: 4px solid #d4c5a9; /* 深米色边框 */
        border-radius: 16px;
        box-shadow: 
          0 8px 25px rgba(0,0,0,0.15), /* 外部大投影 */
          inset 0 0 0 2px #fff; /* 内部再加一道白线增加精致感 */
        overflow: hidden;
      }

      /* 3. 顶部标题栏 */
      .header {
        background: #e8dbc3;
        color: #8a7352;
        padding: 12px;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        border-bottom: 2px solid #d4c5a9;
        text-shadow: 0 1px 0 rgba(255,255,255,0.8);
      }

      /* 4. 网格布局区域 */
      .grid-box {
        padding: 15px;
        display: grid;
        /* 每行 3 个，自动等宽 */
        grid-template-columns: repeat(3, 1fr); 
        /* 格子间距 */
        gap: 10px; 
      }

      /* 5. 单个格子样式 (空状态) */
      .slot {
        aspect-ratio: 1 / 1; /* 强制正方形 */
        background: rgba(0,0,0,0.04); /* 微微的深色背景 */
        border-radius: 8px;
        border: 2px dashed #d0c0a0; /* 虚线边框表示空置 */
        
        /* 内部居中 N/A 文字 */
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        
        /* 内阴影：制造“凹槽”感 */
        box-shadow: inset 0 3px 6px rgba(0,0,0,0.06);
        position: relative;
      }

      /* 格子序号或 N/A 文字 */
      .slot-text {
        font-size: 20px;
        color: #d0c0a0;
        font-weight: bold;
        user-select: none;
      }

      .slot-sub {
        font-size: 10px;
        color: #e0d0b0;
        margin-top: 4px;
      }

    </style>
  </head>
  <body>
    <div class="shelf-container">
      <div class="header">
        🛒 商店货架预览
      </div>
      <div class="grid-box">
        ${emptySlots.map((_, index) => `
          <div class="slot">
            <div class="slot-text">N/A</div>
            <div class="slot-sub">SLOT ${index + 1}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </body>
  </html>
  `;


  }
}