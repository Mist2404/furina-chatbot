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


  },

  getRecruitResult(data: any) {
    if (!data || !data.combinations) return '<div>No Data</div>';

    // 过滤出有价值的组合（至少包含一个 >=4 星的干员）
    const validCombinations = data.combinations.map((combo: any) => {
      const highRarityOps = combo.operators.filter((op: any) => op.rarity >= 4);
      // 按照星级降序排序
      highRarityOps.sort((a: any, b: any) => b.rarity - a.rarity);
      return {
        ...combo,
        operators: highRarityOps
      };
    }).filter((combo: any) => combo.operators.length > 0);

    const getRarityColor = (rarity: number) => {
      if (rarity === 6) return '#ffb300'; // 金色
      if (rarity === 5) return '#ffca28'; // 黄色
      if (rarity === 4) return '#b388ff'; // 紫色
      return '#cccccc';
    };

    const getRarityShadow = (rarity: number) => {
      if (rarity === 6) return '0 0 10px rgba(255, 179, 0, 0.4)';
      if (rarity === 5) return '0 0 8px rgba(255, 202, 40, 0.3)';
      if (rarity === 4) return '0 0 6px rgba(179, 136, 255, 0.2)';
      return 'none';
    };

    return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap');
      
      html, body {
        width: fit-content;
        height: fit-content;
        margin: 0;
        padding: 0;
        background: transparent;
      }
      body {
        padding: 15px;
        font-family: 'Noto Sans SC', sans-serif;
      }
      .recruit-container {
        width: 580px;
        background: #1a1a1a;
        background-image: 
          linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111), 
          linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111);
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
        border: 2px solid #333;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.6);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(90deg, #2a2a2a, #1a1a1a);
        border-bottom: 2px solid #ffb300;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header h1 {
        color: #fff;
        margin: 0;
        font-size: 20px;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      .header .sub-title {
        color: #aaa;
        font-size: 12px;
      }
      .tags-input {
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.4);
        border-bottom: 1px solid #333;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .tags-input span {
        color: #aaa;
        font-size: 13px;
        margin-right: 5px;
      }
      .tag-badge {
        background: #333;
        color: #ddd;
        border: 1px solid #555;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 13px;
      }
      .content {
        padding: 15px 20px;
      }
      .combo-card {
        background: rgba(30, 30, 30, 0.9);
        border-left: 4px solid #fff;
        border-radius: 4px 8px 8px 4px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        transition: transform 0.2s;
      }
      .combo-card:last-child {
        margin-bottom: 0;
      }
      .combo-tags {
        display: flex;
        gap: 8px;
        margin-bottom: 15px;
        flex-wrap: wrap;
      }
      .combo-tag {
        background: #eee;
        color: #111;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 14px;
      }
      .operators-grid {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }
      .operator-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 64px;
      }
      .avatar-wrap {
        width: 56px;
        height: 56px;
        border-radius: 6px;
        border: 2px solid;
        overflow: hidden;
        background: #000;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .avatar-wrap img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        color: transparent;
      }
      .op-name {
        color: #eee;
        font-size: 12px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        font-weight: bold;
      }
      .combo-status {
        padding: 3px 10px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 12px;
        display: flex;
        align-items: center;
        margin-left: auto;
      }
      .guaranteed-high {
        background: rgba(255, 179, 0, 0.15);
        color: #ffb300;
        border: 1px solid rgba(255, 179, 0, 0.4);
      }
      .possible-low {
        background: rgba(255, 82, 82, 0.1);
        color: #ff5252;
        border: 1px dashed rgba(255, 82, 82, 0.4);
      }
      .empty-notice {
        color: #888;
        font-size: 14px;
        text-align: center;
        padding: 20px;
      }
      .watermark {
        text-align: right;
        padding: 10px 20px;
        color: #555;
        font-size: 10px;
      }
    </style>
  </head>
  <body>
    <!-- Script ensure fonts and images loading finishes before koishi takes snapshot -->
    <script>
      window.onload = function() {
        const images = document.querySelectorAll('img');
        let loaded = 0;
        if(images.length === 0) return;
        images.forEach(img => {
          if(img.complete) {
            loaded++;
          } else {
            img.addEventListener('load', () => { loaded++; });
            img.addEventListener('error', () => { loaded++; });
          }
        });
      };
    </script>
    <div class="recruit-container">
      <div class="header">
        <h1>HR RECRUITMENT</h1>
        <div class="sub-title">公开招募网络演算终端</div>
      </div>
      
      <div class="tags-input">
        <span>收到标签：</span>
        ${data.tags_received.map((tag: string) => `<div class="tag-badge">${tag}</div>`).join('')}
      </div>

      <div class="content">
        ${validCombinations.length === 0 ? '<div class="empty-notice">⚠️ 未找到必定包含4星及以上干员的标签组合。</div>' : ''}
        
        ${validCombinations.map((combo: any) => {
      // 根据组合里最高星级决定边框颜色
      const maxRarity = combo.operators.length > 0 ? combo.operators[0].rarity : 4;
      const cardBorderColor = getRarityColor(maxRarity);
      const shadow = getRarityShadow(maxRarity);

      return `
            <div class="combo-card" style="border-left-color: ${cardBorderColor}; box-shadow: ${shadow};">
              <div class="combo-tags">
                ${combo.combination.map((tag: string) => `<div class="combo-tag">${tag}</div>`).join('')}
                ${combo.min_rarity >= 4 ? `<div class="combo-status guaranteed-high">必定★4及以上</div>` : ''}
                ${combo.min_rarity <= 3 ? `<div class="combo-status possible-low">含有★3及以下可能</div>` : ''}
              </div>
              <div class="operators-grid">
                ${combo.operators.map((op: any) => `
                  <div class="operator-item">
                    <div class="avatar-wrap" style="border-color: ${getRarityColor(op.rarity)};">
                      <img referrerpolicy="no-referrer" src="${op.avatar_url}" alt="${op.name}" />
                    </div>
                    <div class="op-name" style="color: ${getRarityColor(op.rarity)};">${op.name}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
    }).join('')}
      </div>
      
      <div class="watermark">FURINA BOT ENGINE // PRTS DATA // ONLY SHOWS ≥ ★4</div>
    </div>
  </body>
  </html>
    `;
  }
}