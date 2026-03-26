/**
 * AIGP 物理实验室 — 学习地图页面 v2
 * Canvas 力导向知识图谱 + 掌握度可视化
 */

import { getAllMastery } from '../js/storage.js';
import { masteryColor } from '../js/utils.js';

export class MapPage {
  constructor(app) {
    this.app = app;
    this.nodes = [];
    this.edges = [];
    this.hoveredNode = null;
    this.animFrame = null;
    this.canvas = null;
    this.ctx = null;
    this.time = 0;
    this.dpr = window.devicePixelRatio || 1;
  }

  async init() {
    await this.buildGraph();
    this.setupCanvas();
    this.render();
    this.updateStats();
    this.renderRecommendations();
    this.startAnimation();
    this.bindEvents();
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.animFrame = null;
  }

  async buildGraph() {
    const mastery = await getAllMastery();
    const masteryMap = new Map(mastery.map(m => [m.knowledgeId, m.score]));
    const tree = this.app.data.knowledgeTree || [];

    const chapters = [
      { id: 14, name: '了解电路', color: '#4a9eff', emoji: '⚡' },
      { id: 15, name: '探究电路', color: '#a855f7', emoji: '🔍' },
      { id: 16, name: '电功率', color: '#ff8c00', emoji: '💡' },
      { id: 17, name: '磁', color: '#ff6b9d', emoji: '🧲' },
      { id: 18, name: '电能', color: '#00ff88', emoji: '🔋' }
    ];

    const chapterMap = new Map(chapters.map(c => [c.id, c]));
    this.nodes = [];
    this.edges = [];

    // 布局：按章节分区，圆形排列
    const chapterGroups = chapters.map((ch, ci) => {
      return tree.filter(n => n.chapter === ch.id);
    });

    let nodeIndex = 0;
    chapterGroups.forEach((group, ci) => {
      const ch = chapters[ci];
      const centerAngle = (ci / chapters.length) * Math.PI * 2 - Math.PI / 2;
      const centerR = 200;
      const cx = Math.cos(centerAngle) * centerR;
      const cy = Math.sin(centerAngle) * centerR;

      group.forEach((sec, si) => {
        const angle = centerAngle + (si - (group.length - 1) / 2) * 0.3;
        const r = centerR + 40 + si * 25;
        const score = masteryMap.get(sec.id) || 0;
        const nodeR = 16 + (sec.examWeight || 5) * 1.2;

        this.nodes.push({
          ...sec,
          idx: nodeIndex++,
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          vx: 0, vy: 0,
          radius: nodeR,
          mastery: score,
          chapterColor: ch.color,
          chapterName: ch.name,
          chapterEmoji: ch.emoji,
          pulsePhase: Math.random() * Math.PI * 2
        });
      });
    });

    // 构建边（前置依赖关系）
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    this.nodes.forEach(node => {
      if (node.prerequisites) {
        node.prerequisites.forEach(preId => {
          const pre = nodeMap.get(preId);
          if (pre) {
            this.edges.push({ from: pre, to: node });
          }
        });
      }
    });

    // 简单力导向模拟（10次迭代让布局更舒展）
    for (let iter = 0; iter < 30; iter++) {
      // 排斥力
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const a = this.nodes[i], b = this.nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (a.radius + b.radius) * 2.5;
          if (dist < minDist) {
            const force = (minDist - dist) * 0.3;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.x -= fx; a.y -= fy;
            b.x += fx; b.y += fy;
          }
        }
      }
      // 弹簧力（连线的节点间）
      this.edges.forEach(e => {
        const dx = e.to.x - e.from.x;
        const dy = e.to.y - e.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = 80;
        const force = (dist - idealDist) * 0.02;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        e.from.x += fx; e.from.y += fy;
        e.to.x -= fx; e.to.y -= fy;
      });
    }
  }

  setupCanvas() {
    const container = document.getElementById('knowledge-map');
    if (!container) return;

    container.innerHTML = '<canvas id="map-canvas" style="width:100%;height:100%;cursor:pointer"></canvas>';
    this.canvas = document.getElementById('map-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.cw = rect.width;
    this.ch = rect.height;
  }

  startAnimation() {
    const animate = () => {
      this.time += 0.02;
      this.draw();
      this.animFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.cw, h = this.ch;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);

    // 1. 画连线
    this.edges.forEach(e => {
      ctx.beginPath();
      ctx.moveTo(e.from.x, e.from.y);
      ctx.lineTo(e.to.x, e.to.y);
      
      const fromScore = e.from.mastery;
      const toScore = e.to.mastery;
      const avgScore = (fromScore + toScore) / 2;
      
      if (avgScore > 60) {
        ctx.strokeStyle = 'rgba(0,255,136,0.2)';
      } else if (avgScore > 0) {
        ctx.strokeStyle = 'rgba(255,204,0,0.15)';
      } else {
        ctx.strokeStyle = 'rgba(74,158,255,0.08)';
      }
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 箭头
      const dx = e.to.x - e.from.x;
      const dy = e.to.y - e.from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        const arrowX = e.to.x - nx * e.to.radius;
        const arrowY = e.to.y - ny * e.to.radius;
        const arrowSize = 5;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - nx * arrowSize + ny * arrowSize * 0.5, arrowY - ny * arrowSize - nx * arrowSize * 0.5);
        ctx.lineTo(arrowX - nx * arrowSize - ny * arrowSize * 0.5, arrowY - ny * arrowSize + nx * arrowSize * 0.5);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    });

    // 2. 画节点
    this.nodes.forEach(node => {
      const isHovered = this.hoveredNode === node;
      const r = node.radius + (isHovered ? 4 : 0);
      const pulse = Math.sin(this.time * 2 + node.pulsePhase) * 0.15 + 1;
      const drawR = r * (isHovered ? 1 : pulse);

      // 光晕
      const glowR = drawR * 2.5;
      const glow = ctx.createRadialGradient(node.x, node.y, drawR * 0.5, node.x, node.y, glowR);
      const mColor = masteryColor(node.mastery);
      glow.addColorStop(0, mColor + '30');
      glow.addColorStop(1, mColor + '00');
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // 填充圆
      const grad = ctx.createRadialGradient(
        node.x - drawR * 0.3, node.y - drawR * 0.3, 0,
        node.x, node.y, drawR
      );
      grad.addColorStop(0, mColor + 'cc');
      grad.addColorStop(1, mColor + '60');
      ctx.beginPath();
      ctx.arc(node.x, node.y, drawR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // 边框
      ctx.strokeStyle = isHovered ? '#fff' : mColor;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke();

      // 掌握度数字
      ctx.fillStyle = node.mastery > 40 ? '#000' : '#fff';
      ctx.font = `bold ${Math.max(9, drawR * 0.55)}px ${getComputedStyle(document.body).getPropertyValue('--font-mono').trim() || 'monospace'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.mastery + '%', node.x, node.y);

      // 名称
      ctx.fillStyle = isHovered ? '#fff' : 'rgba(232,236,248,0.7)';
      ctx.font = `${isHovered ? '600 ' : ''}${isHovered ? 12 : 10}px ${getComputedStyle(document.body).getPropertyValue('--font-main').trim() || 'sans-serif'}`;
      ctx.fillText(node.name, node.x, node.y + drawR + 12);

      // 高频考点标记
      if (node.examWeight >= 8) {
        ctx.fillStyle = '#ff8c00';
        ctx.font = `9px sans-serif`;
        ctx.fillText('🔥高频', node.x, node.y + drawR + 24);
      }
    });

    // 3. 悬停信息卡
    if (this.hoveredNode) {
      this._drawInfoCard(ctx, this.hoveredNode);
    }

    // 4. 图例
    this._drawLegend(ctx, w, h);

    ctx.restore();
  }

  _drawInfoCard(ctx, node) {
    const cardW = 200, cardH = 100;
    let cx = node.x + node.radius + 15;
    let cy = node.y - cardH / 2;

    // 防止超出画布
    if (cx + cardW > this.cw / 2) cx = node.x - node.radius - 15 - cardW;
    if (cy - cardH / 2 < -this.ch / 2 + 20) cy = -this.ch / 2 + 20;

    ctx.fillStyle = 'rgba(17,22,51,0.95)';
    ctx.strokeStyle = node.chapterColor + '80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = node.chapterColor;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${node.chapterEmoji} ${node.name}`, cx + 12, cy + 20);

    ctx.fillStyle = '#a0a8c8';
    ctx.font = '10px sans-serif';
    ctx.fillText(`第${node.chapter}章 ${node.chapterName} · §${node.section}`, cx + 12, cy + 38);

    const mColor = masteryColor(node.mastery);
    ctx.fillStyle = mColor;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`掌握度 ${node.mastery}%`, cx + 12, cy + 56);

    // 掌握度条
    ctx.fillStyle = 'rgba(74,158,255,0.1)';
    ctx.fillRect(cx + 12, cy + 64, cardW - 24, 6);
    ctx.fillStyle = mColor;
    ctx.fillRect(cx + 12, cy + 64, (cardW - 24) * node.mastery / 100, 6);

    ctx.fillStyle = '#5c6490';
    ctx.font = '9px sans-serif';
    const diffText = '🔥'.repeat(node.difficulty || 1) + ` 难度${node.difficulty}`;
    const weightText = `⭐ 考试权重${node.examWeight}/10`;
    ctx.fillText(`${diffText}  ${weightText}`, cx + 12, cy + 88);
  }

  _drawLegend(ctx, w, h) {
    const lx = -w / 2 + 16, ly = h / 2 - 70;
    ctx.fillStyle = 'rgba(17,22,51,0.85)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, 160, 58, 6);
    ctx.fill();

    const colors = [
      { label: '未学习', color: masteryColor(0) },
      { label: '学习中', color: masteryColor(40) },
      { label: '已掌握', color: masteryColor(90) }
    ];

    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    colors.forEach((item, i) => {
      const x = lx + 12 + i * 52;
      const y = ly + 12;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x + 4, y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a0a8c8';
      ctx.fillText(item.label, x + 12, y + 7);
    });

    ctx.fillStyle = '#5c6490';
    ctx.font = '9px sans-serif';
    ctx.fillText('● 节点大小 = 考试权重', lx + 12, ly + 32);
    ctx.fillText('● 连线 = 前置知识依赖', lx + 12, ly + 46);
  }

  updateStats() {
    const total = this.nodes.length;
    const learned = this.nodes.filter(n => n.mastery > 0).length;
    const mastered = this.nodes.filter(n => n.mastery >= 80).length;
    const avgMastery = total > 0
      ? Math.round(this.nodes.reduce((s, n) => s + n.mastery, 0) / total)
      : 0;

    const statsEl = document.querySelector('.map-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent-cyan)">${total}</div>
          <div class="stat-label">总知识点</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent-yellow)">${learned}</div>
          <div class="stat-label">已学习</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent-green)">${mastered}</div>
          <div class="stat-label">已掌握</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent-purple)">${avgMastery}%</div>
          <div class="stat-label">平均掌握</div>
        </div>
      `;
    }
  }

  async renderRecommendations() {
    const recEl = document.querySelector('.recommend-panel');
    if (!recEl) return;

    const weak = this.nodes
      .filter(n => n.mastery < 60)
      .sort((a, b) => (b.examWeight || 5) * (60 - b.mastery) - (a.examWeight || 5) * (60 - a.mastery))
      .slice(0, 5);

    recEl.innerHTML = `
      <div class="panel-title" style="margin-bottom:12px">🎯 AI 推荐学习路径</div>
      ${weak.length === 0 ? '<p style="font-size:13px;color:var(--text-muted)">所有知识点掌握良好 🎉</p>' :
        weak.map((node, i) => `
          <div class="recommend-card" data-id="${node.id}" style="cursor:pointer">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="background:${node.chapterColor}30;color:${node.chapterColor};font-size:10px;padding:2px 6px;border-radius:4px">第${node.chapter}章</span>
              <span class="rec-title" style="color:${masteryColor(node.mastery)}">${node.name}</span>
            </div>
            <div class="rec-reason">${
              node.mastery === 0 ? '📖 还没有学过' :
              node.mastery < 30 ? '🔴 掌握度很低，急需巩固' :
              `📊 掌握度 ${node.mastery}%，需要练习`
            }${node.examWeight >= 8 ? ' · 🔥高频考点' : ''}</div>
            <div style="display:flex;gap:4px;margin-top:6px">
              ${node.experimentIds?.length > 0 ? `<button class="btn-sm rec-go-exp" data-exp="${node.experimentIds[0]}" style="font-size:10px;padding:4px 8px">🔬 去实验</button>` : ''}
              <button class="btn-sm rec-go-wiki" data-kid="${node.id}" style="font-size:10px;padding:4px 8px">📚 看知识点</button>
            </div>
          </div>
        `).join('')
      }

      <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">
        <div class="panel-title" style="margin-bottom:8px;font-size:11px">📊 章节进度</div>
        ${this._getChapterProgress().map(ch => `
          <div style="margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px">
              <span style="color:${ch.color}">${ch.name}</span>
              <span style="color:var(--text-muted)">${ch.avg}%</span>
            </div>
            <div style="height:4px;background:rgba(74,158,255,0.08);border-radius:2px">
              <div style="height:100%;width:${ch.avg}%;background:${ch.color};border-radius:2px;transition:width 0.5s"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    recEl.querySelectorAll('.recommend-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('rec-go-exp')) {
          this.app.goToExperiment(e.target.dataset.exp);
        } else if (e.target.classList.contains('rec-go-wiki')) {
          this.app.goToKnowledge(e.target.dataset.kid);
        } else {
          const id = card.dataset.id;
          const node = this.nodes.find(n => n.id === id);
          if (node?.experimentIds?.[0]) this.app.goToExperiment(node.experimentIds[0]);
          else this.app.goToKnowledge(id);
        }
      });
    });
  }

  _getChapterProgress() {
    const chapters = [
      { id: 14, name: '了解电路', color: '#4a9eff' },
      { id: 15, name: '探究电路', color: '#a855f7' },
      { id: 16, name: '电功率', color: '#ff8c00' },
      { id: 17, name: '磁', color: '#ff6b9d' },
      { id: 18, name: '电能', color: '#00ff88' }
    ];
    return chapters.map(ch => {
      const nodes = this.nodes.filter(n => n.chapter === ch.id);
      const avg = nodes.length > 0 ? Math.round(nodes.reduce((s, n) => s + n.mastery, 0) / nodes.length) : 0;
      return { ...ch, avg };
    });
  }

  bindEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - this.cw / 2;
      const my = e.clientY - rect.top - this.ch / 2;

      this.hoveredNode = null;
      for (const node of this.nodes) {
        const dx = mx - node.x, dy = my - node.y;
        if (dx * dx + dy * dy < (node.radius + 5) * (node.radius + 5)) {
          this.hoveredNode = node;
          this.canvas.style.cursor = 'pointer';
          break;
        }
      }
      if (!this.hoveredNode) this.canvas.style.cursor = 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredNode) {
        const node = this.hoveredNode;
        if (node.experimentIds && node.experimentIds[0]) {
          this.app.goToExperiment(node.experimentIds[0]);
        } else {
          this.app.goToKnowledge(node.id);
        }
      }
    });

    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }
}
