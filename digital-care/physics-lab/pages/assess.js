/**
 * AIGP 物理实验室 — 评估报告页面 v2
 * Canvas 雷达图 + 交互式答题 + 诊断报告 + 补课路径
 */

import { getAllMastery, getRecentAnswers, getLearningOverview } from '../js/storage.js';
import { AssessEngine } from '../js/assess-engine.js';
import { masteryColor } from '../js/utils.js';

export class AssessPage {
  constructor(app) {
    this.app = app;
    this.assessEngine = new AssessEngine();
    this.radarCanvas = null;
    this.radarCtx = null;
    this.radarAnim = null;
    this.radarProgress = 0;
    this.quizActive = false;
    this.currentQuestion = null;
  }

  async init() {
    this.assessEngine.init(this.app.data.questions, this.app.data.knowledgeTree);
    await this.render();
  }

  destroy() {
    if (this.radarAnim) cancelAnimationFrame(this.radarAnim);
    this.radarAnim = null;
  }

  async render() {
    const container = document.getElementById('page-assess');
    if (!container) return;

    const chapters = await this.assessEngine.getChapterOverview();
    const overview = await getLearningOverview();
    const recentAnswers = await getRecentAnswers(15);
    const recommendations = await this.assessEngine.getRecommendations(5);

    const totalKnowledge = this.app.data.knowledgeTree.length || 20;
    const learnedCount = overview.masteryList.filter(m => m.score > 0).length;
    const masteredCount = overview.masteryList.filter(m => m.score >= 80).length;
    const avgScore = overview.masteryList.length > 0
      ? Math.round(overview.masteryList.reduce((s, m) => s + m.score, 0) / totalKnowledge)
      : 0;

    container.className = 'page assess-page';
    container.innerHTML = `
      <!-- 总览卡片 -->
      <div class="assess-overview">
        <div class="assess-title-row">
          <h2>📊 学习诊断报告</h2>
          <div style="display:flex;gap:8px">
            <button class="btn-sm primary" id="btn-start-quiz">📝 开始测验</button>
            <button class="btn-sm" id="btn-quick-quiz">⚡ 快速诊断</button>
          </div>
        </div>
        <div class="assess-stat-grid">
          <div class="assess-stat-item">
            <div class="assess-stat-num" style="color:var(--accent-cyan)">${avgScore}<span style="font-size:14px">%</span></div>
            <div class="assess-stat-desc">平均掌握度</div>
            <div class="assess-stat-bar"><div style="width:${avgScore}%;background:var(--accent-cyan)"></div></div>
          </div>
          <div class="assess-stat-item">
            <div class="assess-stat-num" style="color:var(--accent-yellow)">${learnedCount}<span style="font-size:14px">/${totalKnowledge}</span></div>
            <div class="assess-stat-desc">已学习知识点</div>
            <div class="assess-stat-bar"><div style="width:${totalKnowledge > 0 ? learnedCount / totalKnowledge * 100 : 0}%;background:var(--accent-yellow)"></div></div>
          </div>
          <div class="assess-stat-item">
            <div class="assess-stat-num" style="color:var(--accent-green)">${masteredCount}</div>
            <div class="assess-stat-desc">已掌握（≥80%）</div>
            <div class="assess-stat-bar"><div style="width:${totalKnowledge > 0 ? masteredCount / totalKnowledge * 100 : 0}%;background:var(--accent-green)"></div></div>
          </div>
          <div class="assess-stat-item">
            <div class="assess-stat-num" style="color:var(--accent-purple)">${overview.totalAnswers}<span style="font-size:14px">题</span></div>
            <div class="assess-stat-desc">答题 · 正确率 ${Math.round(overview.accuracy * 100)}%</div>
            <div class="assess-stat-bar"><div style="width:${overview.accuracy * 100}%;background:var(--accent-purple)"></div></div>
          </div>
        </div>
      </div>

      <!-- 雷达图 + 柱状图 -->
      <div class="assess-charts">
        <div class="assess-chart-card">
          <h3>🎯 五维能力雷达图</h3>
          <canvas id="radar-canvas" width="300" height="280"></canvas>
        </div>
        <div class="assess-chart-card" style="flex:1">
          <h3>📊 各章节掌握度</h3>
          <div class="chapter-bars">
            ${chapters.map(ch => {
              const barColor = ch.id === 14 ? '#4a9eff' : ch.id === 15 ? '#a855f7' :
                ch.id === 16 ? '#ff8c00' : ch.id === 17 ? '#ff6b9d' : '#00ff88';
              return `
                <div class="ch-bar-row">
                  <span class="ch-bar-label" style="color:${barColor}">第${ch.id}章</span>
                  <span class="ch-bar-name">${ch.name}</span>
                  <div class="ch-bar-track">
                    <div class="ch-bar-fill" style="width:${ch.averageMastery}%;background:linear-gradient(90deg,${barColor}88,${barColor})"></div>
                  </div>
                  <span class="ch-bar-value" style="color:${barColor}">${ch.averageMastery}%</span>
                  <span class="ch-bar-count">${ch.masteredCount}/${ch.sectionCount}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- 章节详情 + 推荐路径 -->
      <div class="assess-detail-row">
        <!-- 各章节折叠详情 -->
        <div class="assess-sections" style="flex:1">
          <h3>📋 知识点掌握明细</h3>
          ${chapters.map(ch => {
            const barColor = ch.id === 14 ? '#4a9eff' : ch.id === 15 ? '#a855f7' :
              ch.id === 16 ? '#ff8c00' : ch.id === 17 ? '#ff6b9d' : '#00ff88';
            return `
              <div class="chapter-card">
                <div class="chapter-header" data-chapter="${ch.id}">
                  <div style="display:flex;align-items:center;gap:12px">
                    <span style="color:${barColor};font-weight:600">第${ch.id}章</span>
                    <span style="font-weight:600">${ch.name}</span>
                    <span style="font-size:11px;color:${masteryColor(ch.averageMastery)}">${ch.averageMastery}%</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="chapter-bar"><div class="chapter-bar-fill" style="width:${ch.averageMastery}%;background:${barColor}"></div></div>
                    <span style="font-size:11px;color:var(--text-muted)">${ch.masteredCount}/${ch.sectionCount} ▾</span>
                  </div>
                </div>
                <div class="chapter-detail" id="ch-detail-${ch.id}">
                  ${ch.sections.map(sec => `
                    <div class="section-row">
                      <span style="flex:1;cursor:pointer" class="sec-link" data-kid="${sec.id}">
                        §${sec.section} ${sec.name}
                        ${sec.examWeight >= 8 ? '<span style="color:#ff8c00;font-size:9px">🔥高频</span>' : ''}
                      </span>
                      <div class="section-bar"><div class="section-bar-fill" style="width:${sec.mastery}%;background:${masteryColor(sec.mastery)}"></div></div>
                      <span class="section-score" style="color:${masteryColor(sec.mastery)}">${sec.mastery}%</span>
                      ${sec.mastery < 60 ? `<button class="btn-sm sec-practice" data-kid="${sec.id}" style="font-size:9px;padding:2px 6px">练习</button>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- 推荐补课路径 -->
        <div class="assess-recommend">
          <h3>🛤️ AI 补课路径</h3>
          ${recommendations.length === 0 ? '<p style="color:var(--text-muted);font-size:13px">所有知识点掌握良好 🎉</p>' :
            recommendations.map((rec, i) => `
              <div class="rec-path-item" data-kid="${rec.id}" style="cursor:pointer">
                <div class="rec-path-step">${i + 1}</div>
                <div class="rec-path-info">
                  <div class="rec-path-name" style="color:${masteryColor(rec.mastery)}">${rec.name}</div>
                  <div class="rec-path-reason">${rec.reason}${rec.examWeight >= 8 ? ' · 🔥高频考点' : ''}</div>
                  <div class="rec-path-mastery">
                    <div class="rec-path-bar"><div style="width:${rec.mastery}%;background:${masteryColor(rec.mastery)}"></div></div>
                    <span style="color:${masteryColor(rec.mastery)}">${rec.mastery}%</span>
                  </div>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>

      <!-- 最近答题 -->
      ${recentAnswers.length > 0 ? `
      <div class="assess-recent">
        <h3>📝 最近答题记录</h3>
        <div class="answer-list">
          ${recentAnswers.map(a => {
            const kNode = this.app.data.knowledgeTree.find(k => k.id === a.knowledgeId);
            return `
              <div class="answer-item ${a.isCorrect ? 'correct' : 'wrong'}">
                <span class="answer-icon">${a.isCorrect ? '✅' : '❌'}</span>
                <span class="answer-knowledge">${kNode ? kNode.name : a.knowledgeId}</span>
                <span class="answer-time">${new Date(a.timestamp).toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <!-- 测验弹窗 -->
      <div class="quiz-overlay" id="assess-quiz">
        <div class="quiz-card" style="max-width:520px">
          <div class="quiz-header">
            <span id="quiz-title">📝 知识点测验</span>
            <span id="quiz-progress" style="font-size:12px;color:var(--text-muted)"></span>
            <button class="quiz-close" id="quiz-close">✕</button>
          </div>
          <div id="quiz-body"></div>
        </div>
      </div>
    `;

    this.bindEvents(chapters);
    this.drawRadar(chapters);
  }

  drawRadar(chapters) {
    this.radarCanvas = document.getElementById('radar-canvas');
    if (!this.radarCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.radarCanvas.width = 300 * dpr;
    this.radarCanvas.height = 280 * dpr;
    this.radarCanvas.style.width = '300px';
    this.radarCanvas.style.height = '280px';
    this.radarCtx = this.radarCanvas.getContext('2d');
    this.radarCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.radarProgress = 0;
    const animate = () => {
      this.radarProgress = Math.min(1, this.radarProgress + 0.03);
      this._drawRadarFrame(chapters, this.radarProgress);
      if (this.radarProgress < 1) {
        this.radarAnim = requestAnimationFrame(animate);
      }
    };
    animate();
  }

  _drawRadarFrame(chapters, progress) {
    const ctx = this.radarCtx;
    const w = 300, h = 280;
    const cx = w / 2, cy = h / 2 + 5;
    const maxR = 100;
    const n = chapters.length;

    ctx.clearRect(0, 0, w, h);

    // 背景网格
    for (let level = 1; level <= 5; level++) {
      const r = maxR * level / 5;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (i % n) / n * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(74,158,255,${level === 5 ? 0.15 : 0.06})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (level % 2 === 0) {
        ctx.fillStyle = 'rgba(92,100,144,0.4)';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(level * 20 + '%', cx - 4, cy - r + 3);
      }
    }

    // 轴线
    for (let i = 0; i < n; i++) {
      const angle = i / n * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.strokeStyle = 'rgba(74,158,255,0.08)';
      ctx.stroke();
    }

    // 数据区域
    const colors = ['#4a9eff', '#a855f7', '#ff8c00', '#ff6b9d', '#00ff88'];
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = idx / n * Math.PI * 2 - Math.PI / 2;
      const val = (chapters[idx].averageMastery / 100) * progress;
      const r = maxR * val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    gradient.addColorStop(0, 'rgba(0,212,255,0.25)');
    gradient.addColorStop(1, 'rgba(0,212,255,0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,212,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 数据点 + 标签
    for (let i = 0; i < n; i++) {
      const angle = i / n * Math.PI * 2 - Math.PI / 2;
      const val = (chapters[i].averageMastery / 100) * progress;
      const r = maxR * val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      // 数据点
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 标签
      const labelR = maxR + 22;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      ctx.fillStyle = colors[i];
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`第${chapters[i].id}章`, lx, ly);
      ctx.fillStyle = '#a0a8c8';
      ctx.font = '9px sans-serif';
      ctx.fillText(chapters[i].name.slice(4).replace('第', ''), lx, ly + 14);

      // 分数
      const scoreR = maxR * val + 14;
      const sx = cx + Math.cos(angle) * scoreR;
      const sy = cy + Math.sin(angle) * scoreR;
      if (progress > 0.5) {
        ctx.fillStyle = colors[i];
        ctx.font = 'bold 9px monospace';
        ctx.fillText(Math.round(chapters[i].averageMastery * progress) + '%', sx, sy);
      }
    }
  }

  bindEvents(chapters) {
    // 章节展开/收起
    document.querySelectorAll('.chapter-header[data-chapter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const detailEl = document.getElementById(`ch-detail-${btn.dataset.chapter}`);
        if (detailEl) detailEl.classList.toggle('expanded');
      });
    });

    // 知识点链接
    document.querySelectorAll('.sec-link').forEach(el => {
      el.addEventListener('click', () => {
        this.app.goToKnowledge(el.dataset.kid);
      });
    });

    // 练习按钮
    document.querySelectorAll('.sec-practice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startQuiz([btn.dataset.kid]);
      });
    });

    // 推荐路径点击
    document.querySelectorAll('.rec-path-item').forEach(el => {
      el.addEventListener('click', () => {
        const kid = el.dataset.kid;
        const node = this.app.data.knowledgeTree.find(k => k.id === kid);
        if (node?.experimentIds?.[0]) this.app.goToExperiment(node.experimentIds[0]);
        else this.app.goToKnowledge(kid);
      });
    });

    // 开始测验
    document.getElementById('btn-start-quiz')?.addEventListener('click', () => {
      this.startQuiz();
    });

    // 快速诊断
    document.getElementById('btn-quick-quiz')?.addEventListener('click', () => {
      const weakKids = (this.app.data.knowledgeTree || [])
        .filter(k => k.examWeight >= 6)
        .map(k => k.id);
      this.startQuiz(weakKids, 5);
    });

    // 关闭测验
    document.getElementById('quiz-close')?.addEventListener('click', () => {
      this.closeQuiz();
    });
  }

  startQuiz(knowledgeIds, count = 5) {
    const firstQ = this.assessEngine.startQuiz(knowledgeIds, count);
    if (!firstQ) {
      alert('暂无可用题目');
      return;
    }

    const overlay = document.getElementById('assess-quiz');
    if (overlay) overlay.style.display = 'flex';
    this.quizActive = true;

    const quiz = this.assessEngine.currentQuiz;
    document.getElementById('quiz-progress').textContent = `1/${quiz.questions.length}`;
    this.showQuestion(firstQ);
  }

  showQuestion(q) {
    if (!q) {
      this.showQuizResult();
      return;
    }
    this.currentQuestion = q;
    const body = document.getElementById('quiz-body');
    if (!body) return;

    const kNode = this.app.data.knowledgeTree.find(k => k.id === q.knowledgeId);

    body.innerHTML = `
      <div style="margin-bottom:6px;font-size:10px;color:var(--text-muted)">
        ${kNode ? `第${kNode.chapter}章 §${kNode.section} ${kNode.name}` : q.knowledgeId}
        · 难度${'🔥'.repeat(q.difficulty)}
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" data-answer="${String.fromCharCode(65 + i)}">${opt}</button>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback" style="display:none"></div>
    `;

    body.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        body.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

        const answer = btn.dataset.answer;
        const result = await this.assessEngine.submitAnswer(q.id, answer);

        if (result.isCorrect) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
          body.querySelectorAll('.quiz-option').forEach(b => {
            if (b.dataset.answer === result.correctAnswer) b.classList.add('correct');
          });
        }

        const feedbackEl = document.getElementById('quiz-feedback');
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.innerHTML = `
            <div class="${result.isCorrect ? 'feedback-correct' : 'feedback-wrong'}">
              ${result.isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
              <span style="font-size:11px;font-weight:400;color:var(--text-muted)">掌握度 ${result.delta > 0 ? '+' : ''}${result.delta} → ${result.newMastery}%</span>
            </div>
            <div class="feedback-analysis">${result.analysis}</div>
            <button class="btn-sm primary" id="quiz-next" style="margin-top:12px;width:100%;padding:10px">
              ${this.assessEngine.getNextQuestion() ? '下一题 →' : '查看结果'}
            </button>
          `;

          document.getElementById('quiz-next')?.addEventListener('click', () => {
            const nextQ = this.assessEngine.getNextQuestion();
            if (nextQ) {
              const quiz = this.assessEngine.currentQuiz;
              document.getElementById('quiz-progress').textContent = `${quiz.currentIndex + 1}/${quiz.questions.length}`;
              this.showQuestion(nextQ);
            } else {
              this.showQuizResult();
            }
          });
        }
      });
    });
  }

  showQuizResult() {
    const result = this.assessEngine.getQuizResult();
    if (!result) { this.closeQuiz(); return; }

    const body = document.getElementById('quiz-body');
    if (!body) return;

    document.getElementById('quiz-title').textContent = '📊 测验结果';
    document.getElementById('quiz-progress').textContent = '';

    const scorePercent = Math.round(result.accuracy * 100);
    const grade = scorePercent >= 90 ? '🌟 优秀' :
      scorePercent >= 70 ? '👍 良好' :
      scorePercent >= 50 ? '📖 及格' : '💪 需要加油';

    body.innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:48px;font-weight:700;color:${masteryColor(scorePercent)}">${scorePercent}%</div>
        <div style="font-size:18px;margin:8px 0">${grade}</div>
        <div style="font-size:13px;color:var(--text-muted)">
          答对 ${result.correct}/${result.total} 题
        </div>
      </div>
      <div style="margin-top:16px">
        ${result.answers.map((a, i) => {
          const q = this.assessEngine.questions.find(q => q.id === a.questionId);
          const kNode = this.app.data.knowledgeTree.find(k => k.id === q?.knowledgeId);
          return `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid var(--border)">
              <span>${a.isCorrect ? '✅' : '❌'}</span>
              <span style="flex:1;color:var(--text-secondary)">${kNode?.name || ''}</span>
              <span style="color:${a.delta > 0 ? 'var(--accent-green)' : 'var(--accent-red)'};font-family:var(--font-mono);font-size:11px">${a.delta > 0 ? '+' : ''}${a.delta}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn-sm primary" id="quiz-retry" style="flex:1;padding:10px">🔄 再来一次</button>
        <button class="btn-sm" id="quiz-done" style="flex:1;padding:10px">✓ 完成</button>
      </div>
    `;

    document.getElementById('quiz-retry')?.addEventListener('click', () => {
      this.closeQuiz();
      this.startQuiz();
    });
    document.getElementById('quiz-done')?.addEventListener('click', () => {
      this.closeQuiz();
      this.render(); // 刷新页面数据
    });
  }

  closeQuiz() {
    const overlay = document.getElementById('assess-quiz');
    if (overlay) overlay.style.display = 'none';
    this.quizActive = false;
  }
}
