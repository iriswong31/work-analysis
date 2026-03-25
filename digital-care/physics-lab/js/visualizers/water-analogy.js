/**
 * AIGP 物理实验室 — 水压类比动画引擎
 * 将电路参数映射为等效水管系统参数，同步渲染
 */

export class WaterAnalogy {
  constructor(ctx, x, y, width, height) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.voltage = 0;    // 对应水位差
    this.current = 0;    // 对应水流速度
    this.resistance = 0; // 对应管道粗细
    
    this.waterParticles = [];
    this.time = 0;
  }
  
  /** 更新电路参数 */
  setParams(voltage, current, resistance) {
    this.voltage = voltage;
    this.current = current;
    this.resistance = resistance;
  }
  
  update(dt) {
    this.time += dt;
    
    // 更新水粒子
    for (const p of this.waterParticles) {
      p.x += p.speed * dt * 60;
      if (p.x > this.x + this.width - 20) {
        p.x = this.x + 20;
      }
    }
    
    // 补充粒子
    while (this.waterParticles.length < 30 * this.current) {
      this.waterParticles.push({
        x: this.x + 20 + Math.random() * (this.width - 40),
        y: this.y + this.height * 0.5 + (Math.random() - 0.5) * 20,
        speed: 1 + this.current * 2 + Math.random()
      });
    }
    
    // 移除多余粒子
    while (this.waterParticles.length > 30 * Math.max(this.current, 0.5)) {
      this.waterParticles.pop();
    }
  }
  
  render() {
    const ctx = this.ctx;
    const { x, y, width, height } = this;
    
    // 容器背景
    ctx.fillStyle = 'rgba(10, 14, 39, 0.8)';
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = '#00d4ff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💧 水压类比', x + 10, y + 16);
    
    const pipeY = y + height * 0.45;
    const pipeH = Math.max(8, 30 - this.resistance * 0.5); // 电阻大→管道窄
    
    // 水管（管道）
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 15, pipeY - pipeH / 2);
    ctx.lineTo(x + width - 15, pipeY - pipeH / 2);
    ctx.moveTo(x + 15, pipeY + pipeH / 2);
    ctx.lineTo(x + width - 15, pipeY + pipeH / 2);
    ctx.stroke();
    
    // 水流粒子
    ctx.fillStyle = 'rgba(0, 180, 255, 0.6)';
    for (const p of this.waterParticles) {
      ctx.beginPath();
      ctx.arc(p.x, pipeY + (Math.random() - 0.5) * pipeH * 0.6, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 水泵（电池）= 左侧
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x + 5, pipeY - 20, 20, 40, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('泵', x + 15, pipeY + 3);
    
    // 标注
    ctx.fillStyle = '#8892b0';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`水位差=${this.voltage.toFixed(1)} (电压)`, x + 10, y + height - 24);
    ctx.fillText(`流速=${this.current.toFixed(2)} (电流)`, x + 10, y + height - 12);
    ctx.fillText(`管径∝1/R`, x + width / 2, y + height - 12);
  }
}
