/**
 * AIGP 物理实验室 — 能量流动可视化
 * 彩色能量条显示电能→光/热/动能转化
 */

export class EnergyFlow {
  constructor(ctx, x, y, width, height) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.sources = []; // [{type, ratio, color}]
    this.totalPower = 0;
    this.time = 0;
  }
  
  setEnergy(totalPower, conversions) {
    this.totalPower = totalPower;
    this.sources = conversions; // [{type:'light', ratio:0.3, color:'#ffd700'}, ...]
  }
  
  update(dt) {
    this.time += dt;
  }
  
  render() {
    const ctx = this.ctx;
    const { x, y, width, height } = this;
    
    // 背景
    ctx.fillStyle = 'rgba(10, 14, 39, 0.8)';
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = '#8892b0';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('能量流动', x + 8, y + 14);
    
    // 能量条
    const barY = y + 22;
    const barH = 12;
    const barW = width - 16;
    let offsetX = x + 8;
    
    for (const src of this.sources) {
      const segW = barW * src.ratio;
      
      // 动画流动效果
      const shimmer = 0.7 + 0.3 * Math.sin(this.time * 3 + offsetX * 0.1);
      
      ctx.fillStyle = src.color;
      ctx.globalAlpha = shimmer;
      ctx.beginPath();
      ctx.roundRect(offsetX, barY, segW, barH, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // 标签
      if (segW > 30) {
        ctx.fillStyle = '#000';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(src.type, offsetX + segW / 2, barY + barH - 3);
      }
      
      offsetX += segW;
    }
    
    // 功率数值
    ctx.fillStyle = '#e8ecff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.totalPower.toFixed(2)}W`, x + width - 8, y + 14);
  }
}

/** 能量类型配置 */
export const EnergyTypes = {
  electric: { name: '电能', color: '#4a9eff' },
  light: { name: '光能', color: '#ffd700' },
  heat: { name: '热能', color: '#ff4757' },
  kinetic: { name: '动能', color: '#00ff88' },
  magnetic: { name: '磁能', color: '#a855f7' }
};
