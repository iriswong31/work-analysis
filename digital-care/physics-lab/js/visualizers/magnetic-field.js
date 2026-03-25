/**
 * AIGP 物理实验室 — 磁场可视化引擎
 * 基于磁偶极子模型计算磁力线分布
 */

export class MagneticField {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.magnets = []; // [{x, y, strength, angle}]
    this.fieldLines = [];
    this.particles = [];
    this.time = 0;
  }
  
  addMagnet(x, y, strength = 1, angle = 0) {
    this.magnets.push({ x, y, strength, angle });
    this.recalculate();
  }
  
  clearMagnets() {
    this.magnets = [];
    this.fieldLines = [];
    this.particles = [];
  }
  
  recalculate() {
    this.fieldLines = [];
    
    for (const magnet of this.magnets) {
      // 从 N 极发出磁力线
      const numLines = 12;
      for (let i = 0; i < numLines; i++) {
        const angle = magnet.angle + (i / numLines) * Math.PI * 2;
        const startX = magnet.x + Math.cos(angle) * 20;
        const startY = magnet.y + Math.sin(angle) * 20;
        
        const line = this.traceLine(startX, startY, 1);
        if (line.length > 2) {
          this.fieldLines.push(line);
        }
      }
    }
    
    // 生成沿磁力线运动的粒子
    this.particles = [];
    for (const line of this.fieldLines) {
      if (line.length < 3) continue;
      this.particles.push({
        line,
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.2
      });
    }
  }
  
  /** 追踪磁力线 */
  traceLine(startX, startY, direction) {
    const points = [{ x: startX, y: startY }];
    let x = startX, y = startY;
    const step = 3;
    const maxSteps = 200;
    
    for (let i = 0; i < maxSteps; i++) {
      const { bx, by } = this.getFieldAt(x, y);
      const mag = Math.sqrt(bx * bx + by * by);
      if (mag < 0.001) break;
      
      x += (bx / mag) * step * direction;
      y += (by / mag) * step * direction;
      
      // 边界检查
      if (x < 0 || x > this.width || y < 0 || y > this.height) break;
      
      // 检查是否回到磁铁附近
      for (const m of this.magnets) {
        const d = Math.sqrt((x - m.x) ** 2 + (y - m.y) ** 2);
        if (d < 15 && points.length > 10) {
          points.push({ x, y });
          return points;
        }
      }
      
      points.push({ x, y });
    }
    
    return points;
  }
  
  /** 计算某点的磁场 */
  getFieldAt(px, py) {
    let bx = 0, by = 0;
    
    for (const m of this.magnets) {
      const dx = px - m.x;
      const dy = py - m.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      if (r < 5) continue;
      
      // 偶极子近似
      const mx = Math.cos(m.angle) * m.strength;
      const my = Math.sin(m.angle) * m.strength;
      
      const r5 = r2 * r2 * r;
      const dot = mx * dx + my * dy;
      
      bx += (3 * dx * dot / r5 - mx / (r2 * r)) * 1000;
      by += (3 * dy * dot / r5 - my / (r2 * r)) * 1000;
    }
    
    return { bx, by };
  }
  
  update(dt) {
    this.time += dt;
    
    for (const p of this.particles) {
      p.progress += p.speed * dt;
      if (p.progress >= 1) p.progress -= 1;
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    // 磁力线
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    
    for (const line of this.fieldLines) {
      if (line.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y);
      }
      ctx.stroke();
    }
    
    // 粒子
    for (const p of this.particles) {
      const idx = Math.floor(p.progress * (p.line.length - 1));
      const pt = p.line[idx];
      if (!pt) continue;
      
      const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 4);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(pt.x - 4, pt.y - 4, 8, 8);
    }
    
    // 磁铁
    for (const m of this.magnets) {
      this._drawMagnet(ctx, m);
    }
  }
  
  _drawMagnet(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);
    
    // N极（红色）
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(-20, -8, 20, 16);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', -10, 0);
    
    // S极（蓝色）
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(0, -8, 20, 16);
    ctx.fillStyle = '#fff';
    ctx.fillText('S', 10, 0);
    
    ctx.restore();
  }
}
