/**
 * AIGP 物理实验室 — 粒子系统
 */

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pathEmitters = [];
    this.pointEmitters = [];
    this.particles = [];
    this.animating = false;
  }
  
  addPathEmitter(config) {
    const emitter = {
      id: config.id || `pe_${Date.now()}`,
      path: config.path || [],    // [{x, y}, ...]
      rate: config.rate || 30,    // particles count
      speed: config.speed || 1,
      color: config.color || '#ffdc32',
      size: config.size || 2,
      loop: config.loop !== false
    };
    
    // Generate initial particles
    for (let i = 0; i < emitter.rate; i++) {
      this.particles.push(this._createPathParticle(emitter, Math.random()));
    }
    
    this.pathEmitters.push(emitter);
    return emitter.id;
  }
  
  addPointEmitter(config) {
    const emitter = {
      id: config.id || `pt_${Date.now()}`,
      x: config.x || 0,
      y: config.y || 0,
      rate: config.rate || 5,
      speed: config.speed || 2,
      color: config.color || '#ff4466',
      size: config.size || 3,
      spread: config.spread || Math.PI * 2,
      direction: config.direction || 0,
      lifetime: config.lifetime || 60,
      gravity: config.gravity || 0
    };
    
    this.pointEmitters.push(emitter);
    return emitter.id;
  }
  
  removeEmitter(id) {
    this.pathEmitters = this.pathEmitters.filter(e => e.id !== id);
    this.pointEmitters = this.pointEmitters.filter(e => e.id !== id);
    this.particles = this.particles.filter(p => p.emitterId !== id);
  }
  
  clear() {
    this.pathEmitters = [];
    this.pointEmitters = [];
    this.particles = [];
  }
  
  _createPathParticle(emitter, initialProgress = 0) {
    return {
      type: 'path',
      emitterId: emitter.id,
      path: emitter.path,
      progress: initialProgress,
      speed: emitter.speed * (0.8 + Math.random() * 0.4),
      color: emitter.color,
      size: emitter.size * (0.7 + Math.random() * 0.6),
      alpha: 0.5 + Math.random() * 0.5,
      loop: emitter.loop
    };
  }
  
  update() {
    // Update path particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      if (p.type === 'path') {
        p.progress += p.speed * 0.003;
        if (p.progress >= 1) {
          if (p.loop) {
            p.progress -= 1;
          } else {
            this.particles.splice(i, 1);
          }
        }
      } else if (p.type === 'point') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
    
    // Emit new point particles
    for (const emitter of this.pointEmitters) {
      for (let i = 0; i < emitter.rate; i++) {
        const angle = emitter.direction + (Math.random() - 0.5) * emitter.spread;
        const speed = emitter.speed * (0.5 + Math.random() * 0.5);
        this.particles.push({
          type: 'point',
          emitterId: emitter.id,
          x: emitter.x + (Math.random() - 0.5) * 4,
          y: emitter.y + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: emitter.gravity,
          color: emitter.color,
          size: emitter.size * (0.5 + Math.random() * 0.5),
          alpha: 1,
          life: emitter.lifetime * (0.5 + Math.random() * 0.5),
          maxLife: emitter.lifetime
        });
      }
    }
  }
  
  draw() {
    const ctx = this.ctx;
    
    for (const p of this.particles) {
      let x, y;
      
      if (p.type === 'path') {
        const pos = this._getPathPosition(p.path, p.progress);
        if (!pos) continue;
        x = pos.x;
        y = pos.y;
      } else {
        x = p.x;
        y = p.y;
      }
      
      // Core
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = this._colorWithAlpha(p.color, p.alpha);
      ctx.fill();
      
      // Glow
      ctx.beginPath();
      ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = this._colorWithAlpha(p.color, p.alpha * 0.15);
      ctx.fill();
    }
  }
  
  _getPathPosition(path, progress) {
    if (!path || path.length < 2) return null;
    
    let totalLen = 0;
    const segLens = [];
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      segLens.push(Math.sqrt(dx * dx + dy * dy));
      totalLen += segLens[segLens.length - 1];
    }
    
    if (totalLen === 0) return path[0];
    
    let target = progress * totalLen;
    for (let i = 0; i < segLens.length; i++) {
      if (target <= segLens[i]) {
        const t = target / segLens[i];
        return {
          x: path[i].x + (path[i + 1].x - path[i].x) * t,
          y: path[i].y + (path[i + 1].y - path[i].y) * t
        };
      }
      target -= segLens[i];
    }
    
    return path[path.length - 1];
  }
  
  _colorWithAlpha(hex, alpha) {
    if (hex.startsWith('rgba')) return hex;
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return hex;
  }
  
  start() {
    if (this.animating) return;
    this.animating = true;
    this._loop();
  }
  
  stop() {
    this.animating = false;
  }
  
  _loop() {
    if (!this.animating) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this._loop());
  }
}
