/**
 * AIGP 物理实验室 — 电路 Canvas 渲染器 v2
 * 修复: Canvas 状态隔离 / 颜色解析 / resize重算布局
 * 新增: 变阻器拖拽 / 电压源调节 / 双视图(实物图+电路图)
 */

import { clearCanvas, drawGlow, roundRect, parseColor, rgba } from './utils.js';

// 电压档位（干电池叠加）
const VOLTAGE_PRESETS = [1.5, 3, 4.5, 6, 9, 12];

export class CircuitRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.circuit = null;
    this.animating = false;
    this.particles = [];
    this.frame = 0;
    this.hoveredComponent = null;
    this.layoutPositions = new Map();
    
    // 拖拽状态
    this.dragging = null; // { compId, startX }
    
    // 视图模式: 'schematic' (电路原理图) | 'realistic' (实物连接图)
    this.viewMode = 'schematic';
    
    this._resizeCanvas();
    this._bindMouse();
    this._resizeHandler = () => { this._resizeCanvas(); this._relayout(); };
    window.addEventListener('resize', this._resizeHandler);
  }
  
  // === 视图切换 ===
  setViewMode(mode) {
    this.viewMode = mode;
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
  
  _relayout() {
    if (this.circuit) {
      this._layoutRectangular();
      this._resetParticles();
    }
  }
  
  // === 鼠标交互 (修复版 + 变阻器拖拽 + 电压源调节) ===
  
  _bindMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      // 变阻器拖拽中
      if (this.dragging) {
        this._handleDrag(mx);
        return;
      }
      
      this.hoveredComponent = this._hitTest(mx, my);
      this.canvas.style.cursor = this.hoveredComponent ? 'pointer' : 'default';
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.hoveredComponent || !this.circuit) return;
      const comp = this.circuit.getComponent(this.hoveredComponent);
      if (!comp) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      
      // 变阻器：开始拖拽
      if (comp.type === 'rheostat') {
        this.dragging = { compId: comp.id, startX: mx };
        this.canvas.style.cursor = 'ew-resize';
        e.preventDefault();
      }
    });
    
    this.canvas.addEventListener('mouseup', () => {
      if (this.dragging) {
        this.dragging = null;
        this.canvas.style.cursor = 'default';
      }
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      if (this.dragging) {
        this.dragging = null;
      }
      this.hoveredComponent = null;
      this.canvas.style.cursor = 'default';
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
      } else if (comp.type === 'battery') {
        // 电压源点击循环切换
        this._cycleVoltage(comp);
        if (this.onComponentClick) this.onComponentClick(comp);
      }
    });
  }
  
  _handleDrag(mx) {
    if (!this.dragging || !this.circuit) return;
    const comp = this.circuit.getComponent(this.dragging.compId);
    const pos = this.layoutPositions.get(this.dragging.compId);
    if (!comp || !pos) return;
    
    // 将鼠标位置映射到变阻器比例
    const left = pos.x - 30;
    const right = pos.x + 30;
    const ratio = Math.max(0, Math.min(1, (mx - left) / (right - left)));
    const newR = ratio * (comp.maxResistance || 50);
    comp.setRheostat(newR);
    this.circuit.solve();
    this._resetParticles();
    
    if (this.onRheostatChange) this.onRheostatChange(comp);
  }
  
  _cycleVoltage(comp) {
    const currentIdx = VOLTAGE_PRESETS.indexOf(comp.voltage);
    const nextIdx = (currentIdx + 1) % VOLTAGE_PRESETS.length;
    comp.voltage = VOLTAGE_PRESETS[nextIdx];
    comp.label = `电源 ${comp.voltage}V`;
    this.circuit.solve();
    this._resetParticles();
    
    if (this.onVoltageChange) this.onVoltageChange(comp);
  }
  
  _hitTest(mx, my) {
    for (const [id, pos] of this.layoutPositions) {
      const hw = (pos.w || 50) / 2 + 12;
      const hh = (pos.h || 40) / 2 + 12;
      if (mx >= pos.x - hw && mx <= pos.x + hw &&
          my >= pos.y - hh && my <= pos.y + hh) {
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
  
  // === 布局（矩形，初中电路标准布局）===
  
  _layoutRectangular() {
    if (!this.circuit) return;
    this.layoutPositions.clear();
    
    const comps = Array.from(this.circuit.components.values());
    const cx = this.W / 2;
    const cy = this.H / 2;
    const w = Math.min(this.W * 0.65, 450);
    const h = Math.min(this.H * 0.55, 280);
    
    const battery = comps.find(c => c.type === 'battery');
    const others = comps.filter(c => c.type !== 'battery');
    
    if (!battery) return;
    
    // 电池在底部中间
    this.layoutPositions.set(battery.id, {
      x: cx, y: cy + h / 2, w: 70, h: 45, segment: 'bottom'
    });
    
    // 其他元件分配到上方
    const topCount = others.length;
    const spacing = w / (topCount + 1);
    
    others.forEach((comp, i) => {
      const px = cx - w / 2 + spacing * (i + 1);
      const py = cy - h / 2;
      const cw = comp.type === 'rheostat' ? 70 : 55;
      const ch = comp.type === 'rheostat' ? 50 : 45;
      this.layoutPositions.set(comp.id, {
        x: px, y: py, w: cw, h: ch, segment: 'top'
      });
    });
    
    this._buildWirePaths();
  }
  
  _buildWirePaths() {
    this.wirePaths = [];
    if (!this.circuit) return;
    
    const cx = this.W / 2;
    const cy = this.H / 2;
    const w = Math.min(this.W * 0.65, 450);
    const h = Math.min(this.H * 0.55, 280);
    
    const comps = Array.from(this.circuit.components.values());
    const battery = comps.find(c => c.type === 'battery');
    const others = comps.filter(c => c.type !== 'battery');
    
    if (!battery || others.length === 0) return;
    
    const batPos = this.layoutPositions.get(battery.id);
    const topY = cy - h / 2;
    const rightX = cx + w / 2;
    const leftX = cx - w / 2;
    
    const sortedOthers = [...others].sort((a, b) => {
      const pa = this.layoutPositions.get(a.id);
      const pb = this.layoutPositions.get(b.id);
      return (pb?.x || 0) - (pa?.x || 0);
    });
    
    // 电池正极 → 右上角
    this.wirePaths.push([
      { x: batPos.x + 35, y: batPos.y },
      { x: rightX, y: batPos.y },
      { x: rightX, y: topY }
    ]);
    
    // 右上角 → 各元件
    if (sortedOthers.length > 0) {
      const firstPos = this.layoutPositions.get(sortedOthers[0].id);
      this.wirePaths.push([
        { x: rightX, y: topY },
        { x: firstPos.x + 28, y: topY }
      ]);
      
      for (let i = 0; i < sortedOthers.length - 1; i++) {
        const curPos = this.layoutPositions.get(sortedOthers[i].id);
        const nextPos = this.layoutPositions.get(sortedOthers[i + 1].id);
        this.wirePaths.push([
          { x: curPos.x - 28, y: topY },
          { x: nextPos.x + 28, y: topY }
        ]);
      }
      
      const lastPos = this.layoutPositions.get(sortedOthers[sortedOthers.length - 1].id);
      this.wirePaths.push([
        { x: lastPos.x - 28, y: topY },
        { x: leftX, y: topY }
      ]);
    }
    
    // 左上角 → 电池负极
    this.wirePaths.push([
      { x: leftX, y: topY },
      { x: leftX, y: batPos.y },
      { x: batPos.x - 35, y: batPos.y }
    ]);
  }
  
  _resetParticles() {
    this.particles = [];
    if (!this.circuit || !this.circuit.solved) return;
    
    const battery = Array.from(this.circuit.components.values()).find(c => c.type === 'battery');
    if (!battery || battery.current <= 0) return;
    
    const speed = Math.min(2.5, battery.current * 2.5);
    const numParticles = Math.min(80, Math.floor(battery.current * 25 + 10));
    
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
    
    this._drawGrid();
    
    if (!this.circuit) {
      this._drawPlaceholder();
      return;
    }
    
    this._drawWires();
    this._updateAndDrawParticles();
    
    // 每个元件绘制都用 save/restore 隔离
    for (const [id, comp] of this.circuit.components) {
      const pos = this.layoutPositions.get(id);
      if (!pos) continue;
      
      const isHovered = this.hoveredComponent === id;
      
      ctx.save();
      try {
        if (this.viewMode === 'realistic') {
          this._drawComponentRealistic(ctx, pos, comp, isHovered);
        } else {
          this._drawComponentSchematic(ctx, pos, comp, isHovered);
        }
      } catch (e) {
        // 防止单个元件绘制错误影响其他元件
        console.warn('Component draw error:', comp.id, e);
      }
      ctx.restore();
      
      ctx.save();
      this._drawLabel(ctx, pos, comp);
      ctx.restore();
    }
    
    // 视图模式标签
    this._drawViewModeLabel();
    
    // 错误叠加
    if (this.circuit.hasError) {
      ctx.save();
      this._drawErrorOverlay();
      ctx.restore();
    }
  }
  
  // === 电路原理图模式（标准电路符号）===
  
  _drawComponentSchematic(ctx, pos, comp, hovered) {
    switch (comp.type) {
      case 'battery': this._drawBatterySchematic(ctx, pos, comp, hovered); break;
      case 'resistor': this._drawResistorSchematic(ctx, pos, comp, hovered); break;
      case 'bulb': this._drawBulbSchematic(ctx, pos, comp, hovered); break;
      case 'switch': this._drawSwitchSchematic(ctx, pos, comp, hovered); break;
      case 'ammeter': this._drawMeterSchematic(ctx, pos, comp, hovered, 'A'); break;
      case 'voltmeter': this._drawMeterSchematic(ctx, pos, comp, hovered, 'V'); break;
      case 'rheostat': this._drawRheostatSchematic(ctx, pos, comp, hovered); break;
    }
  }
  
  // === 实物连接图模式（拟真外观）===
  
  _drawComponentRealistic(ctx, pos, comp, hovered) {
    switch (comp.type) {
      case 'battery': this._drawBatteryRealistic(ctx, pos, comp, hovered); break;
      case 'resistor': this._drawResistorRealistic(ctx, pos, comp, hovered); break;
      case 'bulb': this._drawBulbRealistic(ctx, pos, comp, hovered); break;
      case 'switch': this._drawSwitchRealistic(ctx, pos, comp, hovered); break;
      case 'ammeter': this._drawMeterRealistic(ctx, pos, comp, hovered, 'A'); break;
      case 'voltmeter': this._drawMeterRealistic(ctx, pos, comp, hovered, 'V'); break;
      case 'rheostat': this._drawRheostatRealistic(ctx, pos, comp, hovered); break;
    }
  }
  
  // ==========================================
  //  电路原理图元件
  // ==========================================
  
  _drawBatterySchematic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) drawGlow(ctx, x, y, 40, '#4a9eff', 0.3);
    
    // 电池符号：长短线
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 16);
    ctx.lineTo(x + 5, y + 16);
    ctx.stroke();
    
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 10);
    ctx.lineTo(x - 5, y + 10);
    ctx.stroke();
    
    // +/- 标记
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('+', x + 15, y + 4);
    ctx.fillStyle = '#4a9eff';
    ctx.fillText('−', x - 16, y + 4);
    
    // 电压值（可点击提示）
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.fillText(`${comp.voltage}V`, x, y + 32);
    
    if (hovered) {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = rgba('#ffcc00', 0.6);
      ctx.fillText('点击切换电压', x, y + 44);
    }
  }
  
  _drawResistorSchematic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) drawGlow(ctx, x, y, 35, '#a855f7', 0.3);
    
    // 锯齿形电阻符号
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
    
    ctx.font = '11px monospace';
    ctx.fillStyle = '#a855f7';
    ctx.textAlign = 'center';
    ctx.fillText(`${comp.resistance}Ω`, x, y - 18);
  }
  
  _drawBulbSchematic(ctx, pos, comp, hovered) {
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
    
    if (hovered) drawGlow(ctx, x, y, 35, '#ffc832', 0.3);
    
    // 灯泡：圆圈 + X
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = brightness > 0 ? `rgba(255, 220, 50, ${0.5 + brightness * 0.5})` : '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x + 8, y + 8);
    ctx.moveTo(x + 8, y - 8);
    ctx.lineTo(x - 8, y + 8);
    ctx.strokeStyle = brightness > 0 ? `rgba(255, 220, 50, ${0.5 + brightness * 0.5})` : '#555';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  
  _drawSwitchSchematic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) drawGlow(ctx, x, y, 30, '#00ff88', 0.3);
    
    // 端点
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
    
    // 状态
    ctx.font = '10px sans-serif';
    ctx.fillStyle = comp.isOn ? '#00ff88' : '#ff4466';
    ctx.textAlign = 'center';
    ctx.fillText(comp.isOn ? '闭合' : '断开', x, y + 22);
    
    if (hovered) {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = rgba(comp.isOn ? '#00ff88' : '#ff4466', 0.6);
      ctx.fillText('点击切换', x, y + 33);
    }
  }
  
  _drawMeterSchematic(ctx, pos, comp, hovered, type) {
    const { x, y } = pos;
    const color = type === 'A' ? '#00ff88' : '#ff6b9d';
    
    if (hovered) drawGlow(ctx, x, y, 30, color, 0.3);
    
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
    if (reading !== undefined && isFinite(reading)) {
      const formatted = type === 'A' ? `${reading.toFixed(2)}A` : `${reading.toFixed(1)}V`;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(formatted, x, y + 28);
    }
  }
  
  _drawRheostatSchematic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    const isDragging = this.dragging && this.dragging.compId === comp.id;
    
    if (hovered || isDragging) drawGlow(ctx, x, y, 38, '#ff8c00', 0.35);
    
    // 电阻体矩形
    roundRect(ctx, x - 30, y - 8, 60, 16, 3);
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 滑片位置
    const ratio = comp.resistance / (comp.maxResistance || 1);
    const sliderX = x - 30 + ratio * 60;
    
    // 有效部分
    ctx.fillStyle = 'rgba(255, 140, 0, 0.15)';
    roundRect(ctx, x - 30, y - 8, ratio * 60, 16, 3);
    ctx.fill();
    
    // 刻度线
    for (let i = 0; i <= 4; i++) {
      const lx = x - 30 + (i / 4) * 60;
      ctx.beginPath();
      ctx.moveTo(lx, y + 8);
      ctx.lineTo(lx, y + 12);
      ctx.strokeStyle = rgba('#ff8c00', 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // 滑片（三角形 + 手柄）
    ctx.beginPath();
    ctx.moveTo(sliderX, y - 10);
    ctx.lineTo(sliderX - 6, y - 22);
    ctx.lineTo(sliderX + 6, y - 22);
    ctx.closePath();
    ctx.fillStyle = isDragging ? '#ffaa44' : '#ff8c00';
    ctx.fill();
    
    // 手柄横条
    ctx.fillStyle = isDragging ? '#ffaa44' : '#ff8c00';
    roundRect(ctx, sliderX - 8, y - 28, 16, 8, 2);
    ctx.fill();
    
    // 阻值显示
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ff8c00';
    ctx.textAlign = 'center';
    ctx.fillText(`${comp.resistance.toFixed(0)}/${comp.maxResistance}Ω`, x, y + 26);
    
    if (hovered && !isDragging) {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = rgba('#ff8c00', 0.6);
      ctx.fillText('拖拽滑片调节', x, y + 37);
    }
  }
  
  // ==========================================
  //  实物连接图元件
  // ==========================================
  
  _drawBatteryRealistic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) drawGlow(ctx, x, y, 45, '#4a9eff', 0.25);
    
    // 电池本体 - 圆柱形侧视图
    const bw = 50, bh = 24;
    
    // 金属外壳
    const grad = ctx.createLinearGradient(x - bw/2, y - bh/2, x - bw/2, y + bh/2);
    grad.addColorStop(0, '#5577cc');
    grad.addColorStop(0.3, '#3355aa');
    grad.addColorStop(0.7, '#2244aa');
    grad.addColorStop(1, '#1a3388');
    ctx.fillStyle = grad;
    roundRect(ctx, x - bw/2, y - bh/2, bw, bh, 4);
    ctx.fill();
    
    // 外壳边框
    roundRect(ctx, x - bw/2, y - bh/2, bw, bh, 4);
    ctx.strokeStyle = '#6688dd';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 正极凸起
    ctx.fillStyle = '#cc8833';
    roundRect(ctx, x + bw/2 - 1, y - 5, 6, 10, 2);
    ctx.fill();
    ctx.strokeStyle = '#ddaa44';
    ctx.lineWidth = 1;
    roundRect(ctx, x + bw/2 - 1, y - 5, 6, 10, 2);
    ctx.stroke();
    
    // 标签
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${comp.voltage}V`, x, y);
    ctx.textBaseline = 'alphabetic';
    
    // +/- 标记
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('+', x + bw/2 + 10, y + 4);
    ctx.fillStyle = '#4a9eff';
    ctx.fillText('−', x - bw/2 - 10, y + 4);
    
    if (hovered) {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = rgba('#ffcc00', 0.6);
      ctx.textAlign = 'center';
      ctx.fillText('点击切换电压', x, y + bh/2 + 14);
    }
  }
  
  _drawResistorRealistic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) drawGlow(ctx, x, y, 35, '#a855f7', 0.25);
    
    // 色环电阻外形
    const rw = 40, rh = 14;
    
    // 引线
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - rw/2 - 10, y);
    ctx.lineTo(x - rw/2, y);
    ctx.moveTo(x + rw/2, y);
    ctx.lineTo(x + rw/2 + 10, y);
    ctx.stroke();
    
    // 本体 - 米色圆柱
    const grad = ctx.createLinearGradient(x, y - rh/2, x, y + rh/2);
    grad.addColorStop(0, '#d4c8a0');
    grad.addColorStop(0.5, '#c4b890');
    grad.addColorStop(1, '#b4a878');
    ctx.fillStyle = grad;
    roundRect(ctx, x - rw/2, y - rh/2, rw, rh, rh/2);
    ctx.fill();
    
    // 色环（简化3道）
    const colors = ['#964B00', '#000000', '#ff8c00']; // 棕黑橙 示意
    colors.forEach((c, i) => {
      const cx2 = x - rw/2 + 10 + i * 10;
      ctx.fillStyle = c;
      ctx.fillRect(cx2, y - rh/2 + 1, 4, rh - 2);
    });
    
    // 阻值标注
    ctx.font = '10px monospace';
    ctx.fillStyle = '#a855f7';
    ctx.textAlign = 'center';
    ctx.fillText(`${comp.resistance}Ω`, x, y - rh/2 - 6);
  }
  
  _drawBulbRealistic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    const brightness = comp.brightness || 0;
    
    // 发光效果
    if (brightness > 0) {
      const glowRadius = 25 + brightness * 35;
      const gradient = ctx.createRadialGradient(x, y - 4, 0, x, y - 4, glowRadius);
      gradient.addColorStop(0, `rgba(255, 230, 80, ${brightness * 0.5})`);
      gradient.addColorStop(0.4, `rgba(255, 200, 50, ${brightness * 0.3})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y - 4, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (hovered) drawGlow(ctx, x, y, 35, '#ffc832', 0.25);
    
    // 灯泡玻璃外壳（上半部分椭圆）
    ctx.beginPath();
    ctx.ellipse(x, y - 4, 12, 15, 0, 0, Math.PI * 2);
    const glassGrad = ctx.createRadialGradient(x - 3, y - 8, 2, x, y - 4, 14);
    if (brightness > 0) {
      glassGrad.addColorStop(0, `rgba(255, 240, 100, ${0.3 + brightness * 0.4})`);
      glassGrad.addColorStop(1, `rgba(255, 200, 50, ${0.1 + brightness * 0.2})`);
    } else {
      glassGrad.addColorStop(0, 'rgba(200, 200, 220, 0.15)');
      glassGrad.addColorStop(1, 'rgba(150, 150, 170, 0.08)');
    }
    ctx.fillStyle = glassGrad;
    ctx.fill();
    ctx.strokeStyle = brightness > 0 ? `rgba(255, 220, 50, 0.6)` : 'rgba(150,150,170,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 灯丝
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 6);
    ctx.lineTo(x - 2, y - 6);
    ctx.lineTo(x + 2, y - 2);
    ctx.lineTo(x + 4, y - 8);
    ctx.strokeStyle = brightness > 0 ? `rgba(255, 200, 50, ${0.6 + brightness * 0.4})` : 'rgba(180,180,180,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 灯座（下方金属部分）
    ctx.fillStyle = '#888';
    roundRect(ctx, x - 8, y + 10, 16, 6, 2);
    ctx.fill();
  }
  
  _drawSwitchRealistic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    
    if (hovered) drawGlow(ctx, x, y, 32, '#00ff88', 0.25);
    
    // 底座
    ctx.fillStyle = '#2a2a3a';
    roundRect(ctx, x - 22, y - 6, 44, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    roundRect(ctx, x - 22, y - 6, 44, 18, 4);
    ctx.stroke();
    
    // 接线柱
    ctx.beginPath();
    ctx.arc(x - 14, y + 3, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#cc8833';
    ctx.fill();
    ctx.strokeStyle = '#ddaa44';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x + 14, y + 3, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#cc8833';
    ctx.fill();
    ctx.stroke();
    
    // 刀片
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 3);
    if (comp.isOn) {
      ctx.lineTo(x + 14, y + 3);
      ctx.strokeStyle = '#00ff88';
    } else {
      ctx.lineTo(x + 8, y - 16);
      ctx.strokeStyle = '#ff4466';
    }
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 状态灯
    ctx.beginPath();
    ctx.arc(x, y - 14, 3, 0, Math.PI * 2);
    ctx.fillStyle = comp.isOn ? '#00ff88' : '#ff4466';
    ctx.fill();
    
    ctx.font = '9px sans-serif';
    ctx.fillStyle = comp.isOn ? '#00ff88' : '#ff4466';
    ctx.textAlign = 'center';
    ctx.fillText(comp.isOn ? '闭合' : '断开', x, y + 22);
    
    if (hovered) {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = rgba(comp.isOn ? '#00ff88' : '#ff4466', 0.5);
      ctx.fillText('点击切换', x, y + 32);
    }
  }
  
  _drawMeterRealistic(ctx, pos, comp, hovered, type) {
    const { x, y } = pos;
    const color = type === 'A' ? '#00ff88' : '#ff6b9d';
    
    if (hovered) drawGlow(ctx, x, y, 35, color, 0.25);
    
    // 表壳（方形）
    const mw = 32, mh = 32;
    ctx.fillStyle = '#1a1a2e';
    roundRect(ctx, x - mw/2, y - mh/2, mw, mh, 4);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x - mw/2, y - mh/2, mw, mh, 4);
    ctx.stroke();
    
    // 表盘（白色扇形区域）
    ctx.beginPath();
    ctx.arc(x, y + 2, 12, Math.PI, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    
    // 指针
    const reading = type === 'A' ? comp.current : comp.voltage;
    const maxReading = type === 'A' ? 3 : 15; // 常见量程
    const angle = Math.PI + (Math.min(reading || 0, maxReading) / maxReading) * Math.PI;
    const needleLen = 10;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + Math.cos(angle) * needleLen, y + 2 + Math.sin(angle) * needleLen);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 中心点
    ctx.beginPath();
    ctx.arc(x, y + 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
    
    // 字母
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, x, y - mh/2 + 8);
    ctx.textBaseline = 'alphabetic';
    
    // 读数
    if (reading !== undefined && isFinite(reading)) {
      const formatted = type === 'A' ? `${reading.toFixed(2)}A` : `${reading.toFixed(1)}V`;
      ctx.font = '9px monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(formatted, x, y + mh/2 + 12);
    }
  }
  
  _drawRheostatRealistic(ctx, pos, comp, hovered) {
    const { x, y } = pos;
    const isDragging = this.dragging && this.dragging.compId === comp.id;
    
    if (hovered || isDragging) drawGlow(ctx, x, y, 40, '#ff8c00', 0.3);
    
    // 陶瓷底座
    ctx.fillStyle = '#3a3020';
    roundRect(ctx, x - 35, y - 5, 70, 18, 3);
    ctx.fill();
    ctx.strokeStyle = '#5a5040';
    ctx.lineWidth = 1;
    roundRect(ctx, x - 35, y - 5, 70, 18, 3);
    ctx.stroke();
    
    // 电阻丝线圈（一排小弧线）
    ctx.strokeStyle = '#cc8844';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const cx2 = x - 30 + i * 5;
      ctx.beginPath();
      ctx.arc(cx2, y + 3, 3, Math.PI, 0);
      ctx.stroke();
    }
    
    // 导轨
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 35, y - 10);
    ctx.lineTo(x + 35, y - 10);
    ctx.stroke();
    
    // 滑片位置
    const ratio = comp.resistance / (comp.maxResistance || 1);
    const sliderX = x - 30 + ratio * 60;
    
    // 滑片本体（金属块）
    const sliderColor = isDragging ? '#ffaa44' : '#cc8833';
    ctx.fillStyle = sliderColor;
    roundRect(ctx, sliderX - 8, y - 20, 16, 14, 3);
    ctx.fill();
    ctx.strokeStyle = '#ddaa44';
    ctx.lineWidth = 1;
    roundRect(ctx, sliderX - 8, y - 20, 16, 14, 3);
    ctx.stroke();
    
    // 滑片手柄
    ctx.fillStyle = '#555';
    roundRect(ctx, sliderX - 4, y - 28, 8, 10, 2);
    ctx.fill();
    
    // 刻度标记
    ctx.font = '8px monospace';
    ctx.fillStyle = rgba('#ff8c00', 0.5);
    ctx.textAlign = 'center';
    ctx.fillText('0', x - 30, y + 22);
    ctx.fillText(`${comp.maxResistance}`, x + 30, y + 22);
    
    // 当前阻值
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ff8c00';
    ctx.fillText(`${comp.resistance.toFixed(0)}Ω`, x, y + 32);
    
    if (hovered && !isDragging) {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = rgba('#ff8c00', 0.5);
      ctx.fillText('拖拽滑片调节', x, y + 42);
    }
  }
  
  // === 通用绘制 ===
  
  _drawGrid() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(74, 158, 255, 0.04)';
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
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择一个实验开始电路仿真', this.W / 2, this.H / 2);
  }
  
  _drawWires() {
    const ctx = this.ctx;
    for (const path of this.wirePaths) {
      // 主线
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = this.viewMode === 'realistic' 
        ? 'rgba(200, 60, 60, 0.7)'  // 红色导线（实物模式）
        : 'rgba(74, 158, 255, 0.6)'; // 蓝色线（电路图模式）
      ctx.lineWidth = this.viewMode === 'realistic' ? 3 : 2;
      ctx.stroke();
      
      // 发光
      ctx.strokeStyle = this.viewMode === 'realistic'
        ? 'rgba(200, 60, 60, 0.1)'
        : 'rgba(74, 158, 255, 0.12)';
      ctx.lineWidth = this.viewMode === 'realistic' ? 6 : 5;
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
      
      const pos = this._getPointOnPath(path, p.progress);
      if (!pos) continue;
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 50, ${p.alpha})`;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 50, ${p.alpha * 0.15})`;
      ctx.fill();
    }
  }
  
  _getPointOnPath(path, progress) {
    let totalLen = 0;
    const segLens = [];
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      segLens.push(Math.sqrt(dx * dx + dy * dy));
      totalLen += segLens[segLens.length - 1];
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
  
  _drawLabel(ctx, pos, comp) {
    if (!comp.label) return;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    
    const yOffset = comp.type === 'battery' ? 48 
                   : comp.type === 'rheostat' ? (this.viewMode === 'realistic' ? 52 : 48) 
                   : 44;
    ctx.fillText(comp.label, pos.x, pos.y + yOffset);
  }
  
  _drawViewModeLabel() {
    const ctx = this.ctx;
    ctx.save();
    const label = this.viewMode === 'realistic' ? '📷 实物连接图' : '📐 电路原理图';
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(label, this.W - 16, 24);
    ctx.restore();
  }
  
  _drawErrorOverlay() {
    const ctx = this.ctx;
    const pulse = Math.sin(this.frame * 0.1) * 0.5 + 0.5;
    
    ctx.fillStyle = `rgba(255, 50, 50, ${0.05 + pulse * 0.08})`;
    ctx.fillRect(0, 0, this.W, this.H);
    
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = `rgba(255, 68, 102, ${0.7 + pulse * 0.3})`;
    ctx.textAlign = 'center';
    ctx.fillText(
      this.circuit.errorType === 'short-circuit' ? '⚠️ 短路！请检查电路' : '⚠️ 电路异常',
      this.W / 2, 30
    );
  }
  
  // === 外部接口 ===
  onComponentClick = null;
  onRheostatChange = null;
  onVoltageChange = null;
  
  destroy() {
    this.stopAnimation();
    window.removeEventListener('resize', this._resizeHandler);
  }
}
