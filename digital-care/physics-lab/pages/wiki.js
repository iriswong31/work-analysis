/**
 * AIGP 物理实验室 — 知识百科页面
 */

import { masteryColor } from '../js/utils.js';

export class WikiPage {
  constructor(app) {
    this.app = app;
    this.currentKnowledgeId = null;
  }
  
  init() {
    this.buildSidebar();
    const tree = this.app.data.knowledgeTree || [];
    if (tree.length > 0 && !this.currentKnowledgeId) {
      this.showKnowledge(tree[0].id);
    }
  }
  
  destroy() {}
  
  buildSidebar() {
    const sidebar = document.querySelector('.wiki-sidebar');
    if (!sidebar) return;
    
    const tree = this.app.data.knowledgeTree || [];
    const chapters = [
      { id: 14, name: '第14章 了解电路' },
      { id: 15, name: '第15章 探究电路' },
      { id: 16, name: '第16章 电流做功与电功率' },
      { id: 17, name: '第17章 从指南针到磁悬浮列车' },
      { id: 18, name: '第18章 电能从哪里来' }
    ];
    
    sidebar.innerHTML = `
      <input type="text" class="wiki-search" placeholder="🔍 搜索知识点..." id="wiki-search">
      ${chapters.map(ch => {
        const sections = tree.filter(n => n.chapter === ch.id);
        return `
          <div class="wiki-chapter">
            <div class="wiki-chapter-title" data-chapter="${ch.id}">
              📘 ${ch.name}
            </div>
            <div class="wiki-section-list" id="wiki-ch-${ch.id}">
              ${sections.map(sec => `
                <button class="wiki-section-item" data-id="${sec.id}">
                  §${sec.section} ${sec.name}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    `;
    
    // 章节展开/收起
    sidebar.querySelectorAll('.wiki-chapter-title').forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionEl = document.getElementById(`wiki-ch-${btn.dataset.chapter}`);
        if (sectionEl) {
          const isHidden = sectionEl.style.display === 'none';
          sectionEl.style.display = isHidden ? 'block' : 'none';
        }
      });
    });
    
    // 知识点点击
    sidebar.querySelectorAll('.wiki-section-item').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.querySelectorAll('.wiki-section-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.showKnowledge(btn.dataset.id);
      });
    });
    
    // 搜索
    document.getElementById('wiki-search')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      sidebar.querySelectorAll('.wiki-section-item').forEach(btn => {
        btn.style.display = btn.textContent.toLowerCase().includes(query) || !query ? '' : 'none';
      });
    });
  }
  
  showKnowledge(knowledgeId) {
    this.currentKnowledgeId = knowledgeId;
    const tree = this.app.data.knowledgeTree || [];
    const node = tree.find(n => n.id === knowledgeId);
    if (!node) return;
    
    const content = document.querySelector('.wiki-content');
    if (!content) return;
    
    const chapterNames = {
      14: '了解电路', 15: '探究电路',
      16: '电流做功与电功率', 17: '从指南针到磁悬浮列车',
      18: '电能从哪里来'
    };
    
    const prevNode = this._getAdjacentNode(node, -1);
    const nextNode = this._getAdjacentNode(node, 1);
    
    content.innerHTML = `
      <div class="knowledge-detail">
        <div class="knowledge-meta">
          第${node.chapter}章 ${chapterNames[node.chapter]} › 第${node.section}节
        </div>
        
        <h2>${node.name}</h2>
        
        <div class="knowledge-section">
          <h3>📖 知识概要</h3>
          <p style="line-height:1.8;color:var(--text-secondary)">${node.description}</p>
        </div>
        
        ${node.formulas && node.formulas.length > 0 ? `
          <div class="knowledge-section">
            <h3>📐 核心公式</h3>
            <ul class="formula-list">
              ${node.formulas.map(f => `<li class="formula-item">${f}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${node.keyPoints && node.keyPoints.length > 0 ? `
          <div class="knowledge-section">
            <h3>🎯 要点精析</h3>
            <ul class="point-list">
              ${node.keyPoints.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${node.commonMistakes && node.commonMistakes.length > 0 ? `
          <div class="knowledge-section">
            <h3>⚠️ 易错提醒</h3>
            <ul class="point-list mistake-list">
              ${node.commonMistakes.map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="knowledge-section">
          <h3>💡 中考提示</h3>
          <p style="color:var(--text-secondary)">
            海南中考权重：${'⭐'.repeat(Math.min(5, Math.ceil((node.examWeight || 5) / 2)))} (${node.examWeight || 5}/10)
            &nbsp;&nbsp;难度等级：${'🔥'.repeat(node.difficulty || 1)}
          </p>
        </div>
        
        ${node.experimentIds && node.experimentIds.length > 0 ? `
          <div class="knowledge-section">
            <button class="btn-sm primary" style="padding:10px 20px;font-size:13px" 
              id="wiki-go-exp" data-exp="${node.experimentIds[0]}">
              🔬 进入仿真实验
            </button>
          </div>
        ` : ''}
        
        <div class="wiki-nav">
          <button ${prevNode ? `id="wiki-prev" data-id="${prevNode.id}"` : 'disabled'}>
            ← ${prevNode ? prevNode.name : ''}
          </button>
          <button ${nextNode ? `id="wiki-next" data-id="${nextNode.id}"` : 'disabled'}>
            ${nextNode ? nextNode.name : ''} →
          </button>
        </div>
      </div>
    `;
    
    // 绑定事件
    document.getElementById('wiki-go-exp')?.addEventListener('click', (e) => {
      this.app.goToExperiment(e.target.dataset.exp);
    });
    document.getElementById('wiki-prev')?.addEventListener('click', (e) => {
      this.showKnowledge(e.target.dataset.id);
    });
    document.getElementById('wiki-next')?.addEventListener('click', (e) => {
      this.showKnowledge(e.target.dataset.id);
    });
    
    // 高亮侧边栏
    document.querySelectorAll('.wiki-section-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === knowledgeId);
    });
  }
  
  _getAdjacentNode(current, offset) {
    const tree = this.app.data.knowledgeTree || [];
    const idx = tree.findIndex(n => n.id === current.id);
    const targetIdx = idx + offset;
    return targetIdx >= 0 && targetIdx < tree.length ? tree[targetIdx] : null;
  }
}
