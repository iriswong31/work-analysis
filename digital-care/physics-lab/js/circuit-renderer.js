/**
 * AIGP 物理实验室 — 电路 Canvas 渲染器
 */

import { clearCanvas, drawGlow, drawArrow, roundRect, randomRange } from './utils.js';

export class CircuitRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.circuit = null;
    this.animating = false;
    this.particles = [];
    this.frame = 0;
    this.hoveredComponent = null;
    this.layoutPositions = new Map(); // compId -> {x, y, w, h, angle}
    
    this._resizeCanvas();
    this._bindMouse();
    window.addEventListener('resize', () => this._resizeCanvas());
  }
  
  _resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = rect.width;
    this.H = rect.height;
  }
  
  _bindMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.hoveredComponent = this._hitTest(mx, my);
      this.canvas.style.cursor = this.hoveredComponent ? 'pointer' : 'default';
    });
    
    this.canvas.addEventListener('click', (e) => {
      if (!this.hoveredComponent || !this.circuit) return;
      const comp = this.circuit.getComponent(this.hoveredComponent);
      if (!comp) return;
      
      if (comp.type === 'switch') {
        comp.toggle();
        this.circuit.solve();
        this._resetParticles();
        if (this.onComponentClick) this.onComponentClick(comp);
      }
    });
  }
  
  _hitTest(mx, my) {
    for (const [id, pos] of this.layoutPositions) {
      if (mx >= pos.x - pos.w / 2 - 10 && mx <= pos.x + pos.w / 2 + 10 &&
          my >= pos.y - pos.h / 2 - 10 && my <= pos.y + pos.h / 2 + 10) {
        return id;
      }
    }
    return null;
  }
  
  setCircuit(circuit) {
    this.circuit = circuit;
    this._layoutRectangular();
    this._resetParticles();
    circuit.solve();
  }
  
  // 矩形布局（最常见的初中电路布局）
  _layoutRectangular() {
    if (!this.circuit) return;
    const comps = Array.from(this.circuit.components.values());
    const cx = this.W / 2;
    const cy = this.H / 2;
    const w = Math.min(this.W * 0.6, 400);
    const h = Math.min(this.H * 0.5, 250);
    
    // 找到电池和其他元件
    const battery = comps.find(c => c.type === 'battery');
    const others = comps.filter(c => c.type !== 'battery');
    
    if (!battery) return;
    
    // 电池在底部中间
    this.layoutPositions.set(battery.id, {
      x: cx, y: cy + h / 2, w: 60, h: 40, segment: 'bottom'
    });
    
    // 其他元件分配到上方
    const topCount = others.length;
    const spacing = w / (topCount + 1);
    
    others.forEach((comp, i) => {
      const px = cx - w / 2 + spacing * (i + 1);
      const py = cy - h / 2;
      this.layoutPositions.set(comp.id, {
        x: px, y: py, w: 50, h: 40, segment: 'top'
      });
    });
    
    // 构建导线路径
    this._buildWirePaths();
  }
  
  _buildWirePaths() {
    this.wirePaths = [];
    if (!this.circuit) return;
    
    const positions = this.layoutPositions;
    const cx = this.W / 2;
    const cy = this.H / 2;
    const w = Math.min(this.W * 0.6, 400);
    const h = Math.min(this.H * 0.5, 250);
    
    const comps = Array.from(this.circuit.components.values());
    const battery = comps.find(c => c.type === 'battery');
    const others = comps.filter(c => c.type !== 'battery');
    
    if (!battery || others.length === 0) return;
    
    const batPos = positions.get(battery.id);
    
    // 根据拓扑，构建导线
    // 简化版：电池底部中间，其他元件顶部一排
    // 导线：电池右 -> 右上角 -> 顶部右边第一个元件 -> ... -> 顶部左边最后一个元件 -> 左上角 -> 电池左
    
    const sortedOthers = [...others].sort((a, b) => {
      const pa = positions.get(a.id);
      const pb = positions.get(b.id);
      return (pb?.x || 0) - (pa?.x || 0); // 从右到左
    });
    
    const topY = cy - h / 2;
    const rightX = cx + w / 2;
    const leftX = cx - w / 2;
    
    // 路径段落
    // 1. 电池正极(右) -> 右上角
    this.wirePaths.push([
      { x: batPos.x + 30, y: batPos.y },
      { x: rightX, y: batPos.y },
      { x: rightX, y: topY }
    ]);
    
    // 2. 右上角 -> 各元件（从右到左）
    if (sortedOthers.length > 0) {
      const firstPos = positions.get(sortedOthers[0].id);
      this.wirePaths.push([
        { x: rightX, y: topY },
        { x: firstPos.x + 25, y: topY }
      ]);
      
      for (let i = 0; i < sortedOthers.length - 1; i++) {
        const curPos = positions.get(sortedOthers[i].id);
        const nextPos = positions.get(sortedOthers[i + 1].id);
        this.wirePaths.push([
          { x: curPos.x - 25, y: topY },
          { x: nextPos.x + 25, y: topY }
        ]);
      }
      
      const lastPos = positions.get(sortedOthers[sortedOthers.length - 1].id);
      this.wirePaths.push([
        { x: lastPos.x - 25, y: topY },
        { x: leftX, y: topY }
      ]);
    }
    
    // 3. 左上角 -> 电池负极(左)
    this.wirePaths.push([
      { x: leftX, y: topY },
      { x: leftX, y: batPos.y },
      { x: batPos.x - 30, y: batPos.y }
    ]);
  }
  
  _resetParticles() {
    this.particles = [];
    if (!this.circuit || !this.circuit.solved) return;
    
    // 检查是否有电流
    const battery = Array.from(this.circuit.components.values()).find(c => c.type === 'battery');
    if (!battery || battery.current <= 0) return;
    
    // 生成粒子在所有导线路径上
    const speed = Math.min(2, battery.current * 3);
    const numParticles = Math.min(60, Math.floor(battery.current * 30));
    
    for (let i = 0; i < numParticles; i++) {
      const pathIdx = Math.floor(Math.random() * this.wirePaths.length);
      this.particles.push({
        pathIndex: pathIdx,
        progress: Math.random(),
        speed: speed * (0.8 + Math.random() * 0.4),
        size: 2 + Math.random() * 2,
        alpha: 0.5 + Math.random() * 0.5
      });
    }
  }
  
  // === 绘制 ===
  
  startAnimation() {
    if (this.animating) return;
    this.animating = true;
    this._animate();
  }
  
  stopAnimation() {
    this.animating = false;
  }
  
  _animate() {
    if (!this.animating) return;
    this.frame++;
    this._draw();
    requestAnimationFrame(() => this._animate());
  }
  
  _draw() {
    const ctx = this.ctx;
    clearCanvas(ctx, { width: this.W, height: this.H });
    
    // 深色背景
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, this.W, this.H);
    
    // 网格点
    this._drawGrid();
    
    if (!this.circuit) {
      this._drawPlaceholder();
      return;
    }
    
    // 导线
    this._drawWires();
    
    // 粒子（电流动画）
    this._updateAndDrawParticles();
    
    // 元件
    for (const [id, comp] of this.circuit.components) {
      const pos = this.layoutPositions.get(id);
      if (!pos) continue;
      
      const isHovered = this.hoveredComponent === id;
      
      switch (comp.type) {
        case 'battery': this._drawBattery(ctx, pos, comp, isHovered); break;
        case 'resistor': this._drawResistor(ctx, pos, comp, isHovered); break;
        case 'bulb': this._drawBulb(ctx, pos, comp, isHovered); break;
        case 'switch': this._drawSwitch(ctx, pos, comp, isHovered); break;
        case 'ammeter': this._drawMeter(ctx, pos, comp, isHovered, 'A'); break;
        case 'voltmeter': this._drawMeter(ctx, pos, comp, isHovered, 'V'); break;
        case 'rheostat': this._drawRheostat(ctx, pos, comp, isHovered); break;
      }
      
      // 标签
      this._drawLabel(ctx, pos, comp);
    }
    
    // 错误叠加
    if (this.circuit.hasError) {
      this._drawErrorOverlay();
    }
  }
  
  _drawGrid() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(74, 158, 255, 0.05)';
    const spacing = 30;
    for (let x = spacing; x < this.W; x += spacing) {
      for (let y = spacing; y < this.H; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  _drawPlaceholder() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(74, 158, 255, 0.3)';
    ctx.font = '16px "SF Pro Display", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择一个实验开始电路仿真', this.W / 2, this.H / 2);
    ctx.textAlign = 'start';
  }
  
  _drawWires() {
    const ctx = this.ctx;
    for (const path of this.wirePaths) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 发光效果
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.15)';
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }
  
  _updateAndDrawParticles() {
    const ctx = this.ctx;
    
    for (const p of this.particles) {
      p.progress += p.speed * 0.005;
      if (p.progress > 1) p.progress -= 1;
      
      const path = this.wirePaths[p.pathIndex];
      if (!path || path.length < 2) continue;
      
      // 计算粒子位置
      const pos = this._getPointOnPath(path, p.progress);
      if (!pos) continue;
      
      // 绘制粒子
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 50, ${p.alpha})`;
      ctx.fill();
      
      // 发光
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 50, ${p.alpha * 0.2})`;
      ctx.fill();
    }
  }
  
  _getPointOnPath(path, progress) {
    // 计算路径总长度
    let totalLen = 0;
    const segLens = [];
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segLens.push(len);
      totalLen += len;
    }
    
    if (totalLen === 0) return path[0];
    
    let targetDist = progress * totalLen;
    for (let i = 0; i < segLens.length; i++) {
      if (targetDist <= segLens[i]) {
        const t = targetDist / segLens[i];
        return {
          x: path[i].x + (path[i + 1].x - path[i].x) * t,
          y: path[i].y + (path[i + 1].y - path[i].y) * t
        };
      }
      targetDist -= segLens[i];
    }
    return path[path.length - 1];
  }
  
  // === 元件绘制 ===
  
  _drawBattery(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    // 外框发光
    if (hovered) {
      drawGlow(ctx, x, y, 40, 'rgba(74, 158, 255, 0.3)');
    }
    
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    
    // 长线（正极）
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 15);
    ctx.lineTo(x + 5, y + 15);
    ctx.stroke();
    
    // 短线（负极）
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 10);
    ctx.lineTo(x - 5, y + 10);
    ctx.stroke();
    
    // +/- 标记
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('+', x + 12, y + 4);
    ctx.fillStyle = '#4a9eff';
    ctx.fillText('−', x - 20, y + 4);
    
    // 电压值
    ctx.font = '11px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.fillText(`${comp.voltage}V`, x, y + 30);
    ctx.textAlign = 'start';
  }
  
  _drawResistor(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) {
      drawGlow(ctx, x, y, 35, 'rgba(168, 85, 247, 0.3)');
    }
    
    // 锯齿形
    ctx.beginPath();
    ctx.moveTo(x - 25, y);
    const teeth = 6;
    const tw = 50 / teeth;
    const th = 10;
    for (let i = 0; i < teeth; i++) {
      const tx = x - 25 + tw * i;
      ctx.lineTo(tx + tw * 0.25, y - th);
      ctx.lineTo(tx + tw * 0.75, y + th);
      ctx.lineTo(tx + tw, y);
    }
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 阻值
    ctx.font = '11px monospace';
    ctx.fillStyle = '#a855f7';
    ctx.textAlign = 'center';
    ctx.fillText(`${comp.resistance}Ω`, x, y - 18);
    ctx.textAlign = 'start';
  }
  
  _drawBulb(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    const brightness = comp.brightness || 0;
    
    // 发光效果
    if (brightness > 0) {
      const glowRadius = 20 + brightness * 30;
      const glowAlpha = brightness * 0.4;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
      gradient.addColorStop(0, `rgba(255, 220, 50, ${glowAlpha})`);
      gradient.addColorStop(0.5, `rgba(255, 180, 50, ${glowAlpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (hovered) {
      drawGlow(ctx, x, y, 35, 'rgba(255, 200, 50, 0.3)');
    }
    
    // 灯泡圆圈
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = brightness > 0 ? `rgba(255, 220, 50, ${0.5 + brightness * 0.5})` : '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 内部 X
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x + 8, y + 8);
    ctx.moveTo(x + 8, y - 8);
    ctx.lineTo(x - 8, y + 8);
    ctx.strokeStyle = brightness > 0 ? `rgba(255, 220, 50, ${0.5 + brightness * 0.5})` : '#555';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  
  _drawSwitch(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) {
      drawGlow(ctx, x, y, 30, 'rgba(0, 255, 136, 0.3)');
    }
    
    // 两个端点
    ctx.beginPath();
    ctx.arc(x - 15, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = comp.isOn ? '#00ff88' : '#ff4466';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + 15, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4a9eff';
    ctx.fill();
    
    // 开关臂
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    if (comp.isOn) {
      ctx.lineTo(x + 15, y);
    } else {
      ctx.lineTo(x + 10, y - 18);
    }
    ctx.strokeStyle = comp.isOn ? '#00ff88' : '#ff4466';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // 状态文字
    ctx.font = '10px monospace';
    ctx.fillStyle = comp.isOn ? '#00ff88' : '#ff4466';
    ctx.textAlign = 'center';
    ctx.fillText(comp.isOn ? '闭合' : '断开', x, y + 20);
    ctx.textAlign = 'start';
  }
  
  _drawMeter(ctx, pos, comp, hovered, type) {
    const { x, y } = pos;
    const color = type === 'A' ? '#00ff88' : '#ff6b9d';
    
    if (hovered) {
      drawGlow(ctx, x, y, 30, color.replace(')', ',0.3)').replace('#', 'rgba('));
    }
    
    // 圆形表盘
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 字母
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, x, y);
    ctx.textBaseline = 'alphabetic';
    
    // 读数
    const reading = type === 'A' ? comp.current : comp.voltage;
    const formatted = type === 'A' ? `${reading.toFixed(2)}A` : `${reading.toFixed(1)}V`;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(formatted, x, y + 28);
    ctx.textAlign = 'start';
  }
  
  _drawRheostat(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) {
      drawGlow(ctx, x, y, 35, 'rgba(255, 140, 0, 0.3)');
    }
    
    // 电阻体（矩形）
    roundRect(ctx, x - 25, y - 8, 50, 16, 3);
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 滑片位置
    const ratio = comp.resistance / (comp.maxResistance || 1);
    const sliderX = x - 25 + ratio * 50;
    
    // 有效部分
    ctx.fillStyle = 'rgba(255, 140, 0, 0.2)';
    roundRect(ctx, x - 25, y - 8, ratio * 50, 16, 3);
    ctx.fill();
    
    // 滑片
    ctx.beginPath();
    ctx.moveTo(sliderX, y - 14);
    ctx.lineTo(sliderX - 5, y - 22);
    ctx.lineTo(sliderX + 5, y - 22);
    ctx.closePath();
    ctx.fillStyle = '#ff8c00';
    ctx.fill();
    
    // 阻值
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ff8c00';
    ctx.textAlign = 'center';
    ctx.fillText(`${comp.resistance.toFixed(0)}/${comp.maxResistance}Ω`, x, y + 24);
    ctx.textAlign = 'start';
  }
  
  _drawLabel(ctx, pos, comp) {
    if (!comp.label) return;
    ctx.font = '11px "SF Pro Display", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    
    const yOffset = comp.type === 'battery' ? 44 : comp.type === 'rheostat' ? 38 : 42;
    ctx.fillText(comp.label, pos.x, pos.y + yOffset);
    ctx.textAlign = 'start';
  }
  
  _drawErrorOverlay() {
    const ctx = this.ctx;
    const pulse = Math.sin(this.frame * 0.1) * 0.5 + 0.5;
    
    ctx.fillStyle = `rgba(255, 50, 50, ${0.05 + pulse * 0.1})`;
    ctx.fillRect(0, 0, this.W, this.H);
    
    ctx.font = 'bold 16px "SF Pro Display", sans-serif';
    ctx.fillStyle = `rgba(255, 68, 102, ${0.7 + pulse * 0.3})`;
    ctx.textAlign = 'center';
    ctx.fillText(
      this.circuit.errorType === 'short-circuit' ? '⚠️ 短路！请检查电路' : '⚠️ 电路异常',
      this.W / 2, 30
    );
    ctx.textAlign = 'start';
  }
  
  // 外部控制接口
  onComponentClick = null;
  
  destroy() {
    this.stopAnimation();
  }
}
