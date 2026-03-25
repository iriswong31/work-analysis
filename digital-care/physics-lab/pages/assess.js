/**
 * AIGP 物理实验室 — 评估报告页面
 */

import { getAllMastery, getRecentAnswers, getLearningOverview } from '../js/storage.js';
import { AssessEngine } from '../js/assess-engine.js';
import { masteryColor } from '../js/utils.js';

export class AssessPage {
  constructor(app) {
    this.app = app;
    this.assessEngine = new AssessEngine();
  }
  
  async init() {
    this.assessEngine.init(this.app.data.questions, this.app.data.knowledgeTree);
    await this.render();
  }
  
  destroy() {}
  
  async render() {
    const container = document.getElementById('page-assess');
    if (!container) return;
    
    const chapters = await this.assessEngine.getChapterOverview();
    const overview = await getLearningOverview();
    const recentAnswers = await getRecentAnswers(10);
    
    const totalKnowledge = this.app.data.knowledgeTree.length || 20;
    const learnedCount = overview.masteryList.filter(m => m.score > 0).length;
    const masteredCount = overview.masteryList.filter(m => m.score >= 80).length;
    const avgScore = overview.masteryList.length > 0 
      ? Math.round(overview.masteryList.reduce((s, m) => s + m.score, 0) / totalKnowledge) 
      : 0;
    
    container.className = 'page assess-page';
    container.innerHTML = `
      <!-- 总览 -->
      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
        <div>
          <h2 style="font-size:22px;margin-bottom:8px">📊 学习诊断报告</h2>
          <p style="font-size:13px;color:var(--text-secondary)">
            已学习 ${learnedCount}/${totalKnowledge} 个知识点，
            掌握 ${masteredCount} 个，
            完成 ${overview.completedExperiments} 个实验，
            答题 ${overview.totalAnswers} 题 (正确率 ${Math.round(overview.accuracy * 100)}%)
          </p>
        </div>
        <div style="margin-left:auto;display:flex;gap:12px">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--accent-cyan)">${avgScore}%</div>
            <div class="stat-label">平均掌握度</div>
          </div>
        </div>
      </div>
      
      <!-- 章节柱状图 -->
      <div>
        <h3 style="font-size:16px;margin-bottom:16px">各章节掌握度</h3>
        <div style="display:flex;gap:16px;align-items:flex-end;height:200px;padding:16px;background:var(--bg-card);border-radius:10px;border:1px solid var(--border)">
          ${chapters.map(ch => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end">
              <div style="font-family:var(--font-mono);font-size:12px;color:${masteryColor(ch.averageMastery)};margin-bottom:4px">${ch.averageMastery}%</div>
              <div style="width:100%;max-width:60px;height:${Math.max(4, ch.averageMastery * 1.5)}px;background:linear-gradient(to top,${masteryColor(ch.averageMastery)},${masteryColor(ch.averageMastery)}88);border-radius:4px 4px 0 0;transition:height 0.5s ease"></div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:8px;text-align:center">第${ch.id}章</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- 章节详情 -->
      <div>
        <h3 style="font-size:16px;margin-bottom:16px">📋 各章节详情</h3>
        ${chapters.map(ch => `
          <div class="chapter-card" style="margin-bottom:8px">
            <div class="chapter-header" onclick="this.nextElementSibling.classList.toggle('expanded')">
              <div style="display:flex;align-items:center;gap:12px">
                <span style="font-weight:600">第${ch.id}章 ${ch.name}</span>
                <span style="font-size:12px;color:${masteryColor(ch.averageMastery)}">${ch.averageMastery}%</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="chapter-bar"><div class="chapter-bar-fill" style="width:${ch.averageMastery}%;background:${masteryColor(ch.averageMastery)}"></div></div>
                <span style="font-size:12px;color:var(--text-muted)">${ch.masteredCount}/${ch.sectionCount} ▾</span>
              </div>
            </div>
            <div class="chapter-detail">
              ${ch.sections.map(sec => `
                <div class="section-row">
                  <span style="flex:1">§${sec.section} ${sec.name}</span>
                  <div class="section-bar"><div class="section-bar-fill" style="width:${sec.mastery}%;background:${masteryColor(sec.mastery)}"></div></div>
                  <span class="section-score" style="color:${masteryColor(sec.mastery)}">${sec.mastery}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- 最近答题 -->
      ${recentAnswers.length > 0 ? `
      <div>
        <h3 style="font-size:16px;margin-bottom:16px">📝 最近答题记录</h3>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:16px">
          ${recentAnswers.map(a => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;border-bottom:1px solid var(--border)">
              <span style="color:${a.isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}">${a.isCorrect ? '✅' : '❌'}</span>
              <span style="flex:1;color:var(--text-secondary)">${a.knowledgeId}</span>
              <span style="font-size:11px;color:var(--text-muted)">${new Date(a.timestamp).toLocaleString('zh-CN', {hour:'2-digit',minute:'2-digit'})}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    `;
  }
}
