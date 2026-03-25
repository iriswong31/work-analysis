/**
 * AIGP 物理实验室 — 微观/宏观视角切换器
 */

export class MicroMacroToggle {
  constructor(opts = {}) {
    this.mode = 'macro'; // 'micro' | 'macro'
    this.transition = 0;  // 0-1 过渡
    this.transitioning = false;
    this.onModeChange = opts.onModeChange || null;
  }
  
  toggle() {
    this.mode = this.mode === 'micro' ? 'macro' : 'micro';
    this.transitioning = true;
    this.transition = 0;
    
    if (this.onModeChange) {
      this.onModeChange(this.mode);
    }
  }
  
  setMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.transitioning = true;
      this.transition = 0;
    }
  }
  
  update(dt) {
    if (this.transitioning) {
      this.transition += dt * 2;
      if (this.transition >= 1) {
        this.transition = 1;
        this.transitioning = false;
      }
    }
  }
  
  /** 获取混合因子：0=完全宏观，1=完全微观 */
  getMicroFactor() {
    if (this.mode === 'micro') {
      return this.transitioning ? this.transition : 1;
    } else {
      return this.transitioning ? 1 - this.transition : 0;
    }
  }
  
  /** 渲染切换按钮 */
  renderButton(ctx, x, y) {
    const factor = this.getMicroFactor();
    
    // 按钮背景
    ctx.fillStyle = `rgba(${factor > 0.5 ? '0, 212, 255' : '255, 215, 0'}, 0.15)`;
    ctx.strokeStyle = factor > 0.5 ? '#00d4ff' : '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, 100, 28, 14);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = factor > 0.5 ? '#00d4ff' : '#ffd700';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(factor > 0.5 ? '🔬 微观视角' : '👁️ 宏观视角', x + 50, y + 14);
  }
}
