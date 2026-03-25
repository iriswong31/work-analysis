/**
 * AIGP 物理实验室 — 应用入口
 */

import { initDB, getAllMastery } from './storage.js';
import { LabPage } from '../pages/lab.js';
import { MapPage } from '../pages/map.js';
import { AssessPage } from '../pages/assess.js';
import { WikiPage } from '../pages/wiki.js';

class App {
  constructor() {
    this.data = {
      knowledgeTree: [],
      experiments: [],
      questions: []
    };
    this.pages = {};
    this.currentPage = 'lab';
  }
  
  async init() {
    try {
      // 初始化数据库
      await initDB();
      
      // 加载数据
      await this._loadData();
      
      // 初始化页面
      this.pages.lab = new LabPage(this);
      this.pages.map = new MapPage(this);
      this.pages.assess = new AssessPage(this);
      this.pages.wiki = new WikiPage(this);
      
      // 绑定导航
      this._bindNavigation();
      
      // 初始化当前页面
      await this._switchPage('lab');
      
      // 更新进度
      await this.updateProgress();
      
      // 隐藏加载屏
      const loading = document.getElementById('loading');
      if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => loading.remove(), 500);
      }
      
      console.log('AIGP 物理实验室初始化完成 ⚡');
    } catch (err) {
      console.error('初始化失败:', err);
      const loading = document.getElementById('loading');
      if (loading) {
        loading.querySelector('.loading-text').textContent = '加载失败，请刷新页面重试';
        loading.querySelector('.loading-spinner').style.display = 'none';
      }
    }
  }
  
  async _loadData() {
    const basePath = import.meta.url.includes('/js/') 
      ? import.meta.url.replace(/\/js\/.*$/, '')
      : '.';
    
    const [knowledgeTree, experiments, questions] = await Promise.all([
      fetch(`${basePath}/data/knowledge-tree.json`).then(r => r.json()).catch(() => []),
      fetch(`${basePath}/data/experiments.json`).then(r => r.json()).catch(() => []),
      fetch(`${basePath}/data/questions.json`).then(r => r.json()).catch(() => [])
    ]);
    
    this.data.knowledgeTree = knowledgeTree;
    this.data.experiments = experiments;
    this.data.questions = questions;
  }
  
  _bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page) this._switchPage(page);
      });
    });
    
    // Hash 路由
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1);
      if (hash && this.pages[hash]) {
        this._switchPage(hash);
      }
    });
    
    // 初始 hash
    const hash = location.hash.slice(1);
    if (hash && this.pages[hash]) {
      this._switchPage(hash);
    }
  }
  
  async _switchPage(pageId) {
    if (!this.pages[pageId]) return;
    
    // 销毁当前页面
    if (this.pages[this.currentPage]?.destroy) {
      this.pages[this.currentPage].destroy();
    }
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    
    // 显示目标页面
    const pageEl = document.getElementById(`page-${pageId}`);
    if (pageEl) pageEl.classList.add('active');
    
    // 更新导航
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });
    
    this.currentPage = pageId;
    
    // 初始化页面
    if (this.pages[pageId].init) {
      await this.pages[pageId].init();
    }
    
    // 更新 hash（不触发 hashchange）
    history.replaceState(null, '', `#${pageId}`);
  }
  
  async updateProgress() {
    const mastery = await getAllMastery();
    const total = this.data.knowledgeTree.length || 20;
    const masteredCount = mastery.filter(m => m.score >= 80).length;
    const progress = total > 0 ? Math.round(masteredCount / total * 100) : 0;
    
    // 更新进度环
    const ringFg = document.querySelector('.ring-fg');
    const ringText = document.querySelector('.ring-text');
    if (ringFg) {
      const circumference = 2 * Math.PI * 14; // r=14
      ringFg.setAttribute('stroke-dashoffset', circumference * (1 - progress / 100));
    }
    if (ringText) {
      ringText.textContent = `${progress}%`;
    }
  }
  
  // 导航辅助
  goToExperiment(expId) {
    this._switchPage('lab');
    setTimeout(() => {
      if (this.pages.lab.loadExperiment) {
        this.pages.lab.loadExperiment(expId);
      }
    }, 100);
  }
  
  goToKnowledge(knowledgeId) {
    this._switchPage('wiki');
    setTimeout(() => {
      if (this.pages.wiki.showKnowledge) {
        this.pages.wiki.showKnowledge(knowledgeId);
      }
    }, 100);
  }
}

// 启动应用
const app = new App();
app.init();
