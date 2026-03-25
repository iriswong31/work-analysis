/**
 * AIGP 物理实验室 — 学习地图页面
 */

import { getAllMastery } from '../js/storage.js';
import { masteryColor, hsl } from '../js/utils.js';

export class MapPage {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.nodes = [];
    this.hoveredNode = null;
  }
  
  async init() {
    await this.buildMap();
    this.render();
    this.bindEvents();
  }
  
  destroy() {}
  
  async buildMap() {
    const mastery = await getAllMastery();
    const masteryMap = new Map(mastery.map(m => [m.knowledgeId, m.score]));
    const knowledgeTree = this.app.data.knowledgeTree || [];
    
    // 构建节点
    const chapters = [
      { id: 14, name: '了解电路', color: '#4a9eff' },
      { id: 15, name: '探究电路', color: '#a855f7' },
      { id: 16, name: '电功率', color: '#ff8c00' },
      { id: 17, name: '磁', color: '#ff6b9d' },
      { id: 18, name: '电能', color: '#00ff88' }
    ];
    
    this.nodes = [];
    
    chapters.forEach((ch, ci) => {
      const sections = knowledgeTree.filter(n => n.chapter === ch.id);
      sections.forEach((sec, si) => {
        this.nodes.push({
          ...sec,
          chapterName: ch.name,
          chapterColor: ch.color,
          mastery: masteryMap.get(sec.id) || 0,
          cx: 0, cy: 0 // will be calculated
        });
      });
    });
    
    // 更新统计
    this.updateStats(masteryMap);
  }
  
  updateStats(masteryMap) {
    const total = this.nodes.length;
    const learned = this.nodes.filter(n => n.mastery > 0).length;
    const mastered = this.nodes.filter(n => n.mastery >= 80).length;
    
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
      `;
    }
  }
  
  render() {
    const container = document.getElementById('knowledge-map');
    if (!container) return;
    
    // 使用 HTML/CSS 布局代替 Canvas（更灵活）
    const chapters = [14, 15, 16, 17, 18];
    const chapterNames = {
      14: '第14章 了解电路',
      15: '第15章 探究电路',
      16: '第16章 电流做功与电功率',
      17: '第17章 从指南针到磁悬浮列车',
      18: '第18章 电能从哪里来'
    };
    const chapterColors = {
      14: '#4a9eff', 15: '#a855f7', 16: '#ff8c00', 17: '#ff6b9d', 18: '#00ff88'
    };
    
    container.innerHTML = chapters.map(ch => {
      const nodes = this.nodes.filter(n => n.chapter === ch);
      const avgMastery = nodes.length > 0 
        ? Math.round(nodes.reduce((s, n) => s + n.mastery, 0) / nodes.length)
        : 0;
      
      return `
        <div class="chapter-map-card" style="border-left:3px solid ${chapterColors[ch]}">
          <div class="chapter-map-header">
            <span style="color:${chapterColors[ch]};font-weight:700">${chapterNames[ch]}</span>
            <span style="font-size:12px;color:var(--text-muted)">掌握度 ${avgMastery}%</span>
          </div>
          <div class="chapter-map-nodes">
            ${nodes.map(node => `
              <div class="map-node" data-id="${node.id}" style="cursor:pointer" 
                title="${node.name} - 掌握度${node.mastery}%">
                <div class="map-node-circle" style="
                  background:${masteryColor(node.mastery)};
                  box-shadow:0 0 ${8 + node.mastery * 0.2}px ${masteryColor(node.mastery)};
                  width:${24 + (node.examWeight || 5) * 2}px;
                  height:${24 + (node.examWeight || 5) * 2}px;
                ">
                  <span style="font-size:10px;color:#000;font-weight:700">${node.mastery}</span>
                </div>
                <div class="map-node-label">${node.name}</div>
                ${node.examWeight >= 8 ? '<div class="map-node-badge">🔥高频考点</div>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
    // 绑定点击
    container.querySelectorAll('.map-node').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const node = this.nodes.find(n => n.id === id);
        if (node && node.experimentIds && node.experimentIds[0]) {
          this.app.goToExperiment(node.experimentIds[0]);
        } else {
          this.app.goToKnowledge(id);
        }
      });
    });
    
    // 添加推荐面板
    this.renderRecommendations();
  }
  
  async renderRecommendations() {
    const recEl = document.querySelector('.recommend-panel');
    if (!recEl) return;
    
    const weak = this.nodes
      .filter(n => n.mastery < 60)
      .sort((a, b) => (b.examWeight || 5) * (60 - b.mastery) - (a.examWeight || 5) * (60 - a.mastery))
      .slice(0, 5);
    
    recEl.innerHTML = `
      <div class="panel-title" style="margin-bottom:12px">📌 推荐学习</div>
      ${weak.length === 0 ? '<p style="font-size:13px;color:var(--text-muted)">暂无推荐，继续学习新知识点吧！</p>' :
        weak.map(node => `
          <div class="recommend-card" data-id="${node.id}" style="cursor:pointer">
            <div class="rec-title" style="color:${masteryColor(node.mastery)}">${node.name}</div>
            <div class="rec-reason">${node.mastery === 0 
              ? '📖 还没有学过，建议优先学习'
              : `📊 掌握度 ${node.mastery}%，需要巩固`}
              ${node.examWeight >= 8 ? ' · 🔥高频考点' : ''}</div>
          </div>
        `).join('')
      }
    `;
    
    recEl.querySelectorAll('.recommend-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const node = this.nodes.find(n => n.id === id);
        if (node?.experimentIds?.[0]) {
          this.app.goToExperiment(node.experimentIds[0]);
        }
      });
    });
  }
  
  bindEvents() {}
}
