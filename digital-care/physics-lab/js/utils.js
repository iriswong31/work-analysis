/**
 * AIGP 物理实验室 — 工具函数集
 */

// === 物理计算 ===

export function parallelResistance(...resistances) {
  const valid = resistances.filter(r => r > 0 && isFinite(r));
  if (valid.length === 0) return Infinity;
  if (valid.length === 1) return valid[0];
  const sum = valid.reduce((s, r) => s + 1 / r, 0);
  return sum > 0 ? 1 / sum : Infinity;
}

export function seriesResistance(...resistances) {
  return resistances.reduce((s, r) => s + (r || 0), 0);
}

export function ohmsLaw(voltage, resistance) {
  if (!resistance || resistance <= 0) return Infinity;
  return voltage / resistance;
}

export function power(voltage, current) {
  return voltage * current;
}

export function jouleHeat(current, resistance, time) {
  return current * current * resistance * time;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// === 缓动函数 ===

export const easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutElastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeOutBounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
};

// === Canvas 辅助 ===

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawGlow(ctx, x, y, radius, color, alpha = 0.3) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawArrow(ctx, fromX, fromY, toX, toY, size = 8) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// === DOM 辅助 ===

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else if (k === 'className') {
      el.className = v;
    } else if (k.startsWith('on')) {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      el.setAttribute(k, v);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  });
  return el;
}

export function $(selector) {
  return document.querySelector(selector);
}

export function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

// === 格式化 ===

export function formatResistance(v) {
  if (!isFinite(v)) return '∞ Ω';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' MΩ';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + ' kΩ';
  return v.toFixed(1) + ' Ω';
}

export function formatCurrent(v) {
  if (!isFinite(v)) return '— A';
  if (Math.abs(v) < 0.001) return (v * 1e6).toFixed(0) + ' μA';
  if (Math.abs(v) < 1) return (v * 1000).toFixed(1) + ' mA';
  return v.toFixed(2) + ' A';
}

export function formatVoltage(v) {
  if (!isFinite(v)) return '— V';
  if (Math.abs(v) < 0.001) return (v * 1000).toFixed(1) + ' mV';
  return v.toFixed(2) + ' V';
}

export function formatPower(v) {
  if (!isFinite(v)) return '— W';
  if (Math.abs(v) < 0.001) return (v * 1000).toFixed(1) + ' mW';
  return v.toFixed(2) + ' W';
}

export function formatPercent(v) {
  return Math.round(v) + '%';
}

export function masteryColor(score) {
  if (score >= 80) return '#00ff88';
  if (score >= 50) return '#ffcc00';
  if (score > 0) return '#ff8c00';
  return '#ff4466';
}

export function hsl(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// === 随机 ===

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
