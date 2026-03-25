/**
 * AIGP 物理实验室 — 危险效果渲染器
 * 短路火花、过热发红、烟雾粒子、触电路径高亮
 */

export class DangerEffects {
  constructor(ctx) {
    this.ctx = ctx;
    this.effects = [];
    this.time = 0;
  }
  
  /** 添加短路火花效果 */
  addSpark(x, y, duration = 2) {
    this.effects.push({
      type: 'spark',
      x, y,
      startTime: this.time,
      duration,
      particles: Array.from({ length: 20 }, () => ({
        angle: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 4,
        life: 0.3 + Math.random() * 0.5
      }))
    });
  }
  
  /** 添加过热发红效果 */
  addOverheat(x, y, width, height, intensity = 1) {
    this.effects.push({
      type: 'overheat',
      x, y, width, height,
      intensity,
      startTime: this.time,
      duration: Infinity // 持续直到移除
    });
  }
  
  /** 添加烟雾效果 */
  addSmoke(x, y, duration = 3) {
    this.effects.push({
      type: 'smoke',
      x, y,
      startTime: this.time,
      duration,
      particles: Array.from({ length: 15 }, () => ({
        offsetX: (Math.random() - 0.5) * 20,
        offsetY: 0,
        speed: 0.5 + Math.random(),
        size: 3 + Math.random() * 5,
        alpha: 0.3 + Math.random() * 0.3
      }))
    });
  }
  
  /** 添加触电路径高亮 */
  addShockPath(path, duration = 1.5) {
    this.effects.push({
      type: 'shock',
      path,
      startTime: this.time,
      duration
    });
  }
  
  /** 清除所有效果 */
  clear() {
    this.effects = [];
  }
  
  update(dt) {
    this.time += dt;
    
    // 移除过期效果
    this.effects = this.effects.filter(e => 
      this.time - e.startTime < e.duration
    );
  }
  
  render() {
    const ctx = this.ctx;
    
    for (const effect of this.effects) {
      const elapsed = this.time - effect.startTime;
      const progress = effect.duration === Infinity ? 0.5 : elapsed / effect.duration;
      
      switch (effect.type) {
        case 'spark':
          this._renderSpark(ctx, effect, elapsed);
          break;
        case 'overheat':
          this._renderOverheat(ctx, effect);
          break;
        case 'smoke':
          this._renderSmoke(ctx, effect, elapsed);
          break;
        case 'shock':
          this._renderShock(ctx, effect, elapsed);
          break;
      }
    }
  }
  
  _renderSpark(ctx, effect, elapsed) {
    for (const p of effect.particles) {
      const t = elapsed / p.life;
      if (t > 1) continue;
      
      const x = effect.x + Math.cos(p.angle) * p.speed * elapsed * 30;
      const y = effect.y + Math.sin(p.angle) * p.speed * elapsed * 30;
      const alpha = 1 - t;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${40 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  _renderOverheat(ctx, effect) {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 6);
    
    ctx.save();
    ctx.globalAlpha = effect.intensity * 0.3 * pulse;
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(effect.x, effect.y, effect.width, effect.height);
    ctx.restore();
  }
  
  _renderSmoke(ctx, effect, elapsed) {
    for (const p of effect.particles) {
      const y = effect.y + p.offsetY - elapsed * p.speed * 30;
      const alpha = p.alpha * Math.max(0, 1 - elapsed / effect.duration);
      const size = p.size + elapsed * 3;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(effect.x + p.offsetX, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  _renderShock(ctx, effect, elapsed) {
    if (!effect.path || effect.path.length < 2) return;
    
    const flash = Math.sin(elapsed * 30) > 0;
    if (!flash) return;
    
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.setLineDash([5, 3]);
    
    ctx.beginPath();
    ctx.moveTo(effect.path[0].x, effect.path[0].y);
    for (let i = 1; i < effect.path.length; i++) {
      ctx.lineTo(effect.path[i].x, effect.path[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}
