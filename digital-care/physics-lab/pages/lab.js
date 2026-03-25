/**
 * AIGP 物理实验室 — 实验台页面
 */

import { CircuitRenderer } from '../js/circuit-renderer.js';
import { createCircuitFromConfig } from '../js/circuit-engine.js';
import { DialogEngine, getDialogTree } from '../js/dialog-engine.js';
import { AssessEngine } from '../js/assess-engine.js';
import { completeExperiment } from '../js/storage.js';

export class LabPage {
  constructor(app) {
    this.app = app;
    this.renderer = null;
    this.circuit = null;
    this.dialogEngine = new DialogEngine();
    this.assessEngine = new AssessEngine();
    this.currentExperiment = null;
    this.quizOverlayVisible = false;
  }
  
  async init() {
    const canvas = document.getElementById('circuit-canvas');
    if (canvas) {
      this.renderer = new CircuitRenderer(canvas);
      this.renderer.onComponentClick = (comp) => this._onComponentClick(comp);
      this.renderer.startAnimation();
    }
    
    this.assessEngine.init(this.app.data.questions, this.app.data.knowledgeTree);
    this._setupComponentPanel();
    this._setupDialogCallbacks();
  }
  
  destroy() {
    if (this.renderer) {
      this.renderer.stopAnimation();
    }
  }
  
  _setupComponentPanel() {
    const panel = document.querySelector('.component-panel');
    if (!panel) return;
    
    panel.innerHTML = `
      <div class="panel-title">📋 实验列表</div>
      <div class="experiment-list">
        ${(this.app.data.experiments || []).map(exp => `
          <button class="exp-btn" data-exp="${exp.id}" title="${exp.description}">
            <span class="exp-icon">${this._getExpIcon(exp.chapter)}</span>
            <span class="exp-name">${exp.name}</span>
          </button>
        `).join('')}
      </div>
      <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--border)">
        <div class="panel-title" style="font-size:11px;margin-bottom:8px">💡 操作提示</div>
        <div style="font-size:11px;color:var(--text-muted);line-height:1.6">
          • 点击<b>开关</b>闭合/断开电路<br>
          • 点击<b>变阻器</b>调节阻值<br>
          • 跟随AI老师的引导实验
        </div>
      </div>
    `;
    
    panel.querySelectorAll('.exp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const expId = btn.dataset.exp;
        this.loadExperiment(expId);
      });
    });
  }
  
  _getExpIcon(chapter) {
    const icons = { 14: '💡', 15: '🔌', 16: '⚡', 17: '🧲', 18: '🔋' };
    return icons[chapter] || '🔬';
  }
  
  _setupDialogCallbacks() {
    this.dialogEngine.onMessage = (text, role, options) => {
      this._addMessage(text, role, options);
    };
    
    this.dialogEngine.onComplete = () => {
      this._onDialogComplete();
    };
  }
  
  // 加载实验
  loadExperiment(expId) {
    const exp = (this.app.data.experiments || []).find(e => e.id === expId);
    if (!exp) return;
    
    this.currentExperiment = exp;
    
    // 创建电路
    this.circuit = createCircuitFromConfig(exp.circuit);
    this.renderer.setCircuit(this.circuit);
    
    // 更新 UI
    const titleEl = document.querySelector('.experiment-title');
    if (titleEl) titleEl.textContent = `🔬 ${exp.name}`;
    
    const goalEl = document.querySelector('.status-goal');
    if (goalEl) goalEl.textContent = exp.goals?.[0] || '完成实验';
    
    // 更新按钮
    const actionsEl = document.querySelector('.status-actions');
    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="btn-sm" onclick="document.dispatchEvent(new CustomEvent('lab-reset'))">🔄 重置</button>
        <button class="btn-sm primary" onclick="document.dispatchEvent(new CustomEvent('lab-quiz'))">📝 练习题</button>
      `;
    }
    
    // 高亮当前实验按钮
    document.querySelectorAll('.exp-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exp === expId);
    });
    
    // 清空对话并启动对话树
    this._clearMessages();
    const tree = getDialogTree(exp.dialogTreeId);
    if (tree) {
      this.dialogEngine.loadTree(tree);
      this.dialogEngine.start();
    } else {
      this._addMessage(`🔬 欢迎来到「${exp.name}」实验！\n\n试着闭合开关，观察电路变化。`, 'teacher');
    }
    
    // 绑定事件
    document.removeEventListener('lab-reset', this._handleReset);
    document.removeEventListener('lab-quiz', this._handleQuiz);
    this._handleReset = () => this.loadExperiment(expId);
    this._handleQuiz = () => this._showQuiz();
    document.addEventListener('lab-reset', this._handleReset);
    document.addEventListener('lab-quiz', this._handleQuiz);
  }
  
  _onComponentClick(comp) {
    if (comp.type === 'switch') {
      this.dialogEngine.check('switch_on', comp.isOn);
      if (comp.isOn) {
        this._addMessage('🔛 我闭合了开关', 'student');
      } else {
        this._addMessage('🔓 我断开了开关', 'student');
      }
    }
  }
  
  // === 对话 ===
  
  _clearMessages() {
    const container = document.querySelector('.dialog-messages');
    if (container) container.innerHTML = '';
    const actions = document.querySelector('.dialog-actions');
    if (actions) actions.innerHTML = '';
  }
  
  _addMessage(text, role, options) {
    const container = document.querySelector('.dialog-messages');
    if (!container) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    container.appendChild(msgDiv);
    
    // 滚动到底部
    container.scrollTop = container.scrollHeight;
    
    // 如果有选项，显示选择按钮
    if (options && options.length > 0) {
      const actionsDiv = document.querySelector('.dialog-actions');
      if (actionsDiv) {
        actionsDiv.innerHTML = options.map(opt => `
          <button class="dialog-btn" data-answer="${opt.id || opt.text}">${opt.text}</button>
        `).join('');
        
        actionsDiv.querySelectorAll('.dialog-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.dialogEngine.answer(btn.dataset.answer);
            actionsDiv.innerHTML = '';
          });
        });
      }
    }
  }
  
  _onDialogComplete() {
    if (this.currentExperiment) {
      completeExperiment(this.currentExperiment.id);
      this.app.updateProgress();
    }
    
    const actionsDiv = document.querySelector('.dialog-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        <button class="dialog-btn primary" onclick="document.dispatchEvent(new CustomEvent('lab-quiz'))">📝 做几道练习题</button>
      `;
    }
  }
  
  // === 练习题 ===
  
  _showQuiz() {
    const knowledgeIds = this.currentExperiment?.knowledgeIds || [];
    const question = this.assessEngine.getRandomQuestion(knowledgeIds[0]);
    if (!question) {
      this._addMessage('暂时没有练习题，继续探索其他实验吧！', 'teacher');
      return;
    }
    
    this._showQuizOverlay(question);
  }
  
  _showQuizOverlay(question) {
    // 创建遮罩
    let overlay = document.getElementById('quiz-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'quiz-overlay';
      overlay.className = 'quiz-overlay';
      document.querySelector('.canvas-area')?.appendChild(overlay);
    }
    
    overlay.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-header">
          <span>📝 练习题</span>
          <button class="quiz-close" onclick="document.getElementById('quiz-overlay').style.display='none'">✕</button>
        </div>
        <div class="quiz-question">${question.question}</div>
        <div class="quiz-options">
          ${question.options.map((opt, i) => `
            <button class="quiz-option" data-answer="${String.fromCharCode(65 + i)}">${opt}</button>
          `).join('')}
        </div>
        <div class="quiz-feedback" style="display:none"></div>
      </div>
    `;
    
    overlay.style.display = 'flex';
    
    overlay.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', async () => {
        const answer = btn.dataset.answer;
        const result = await this.assessEngine.submitAnswer(question.id, answer);
        
        // 高亮正确/错误
        overlay.querySelectorAll('.quiz-option').forEach(b => {
          if (b.dataset.answer === result.correctAnswer) {
            b.classList.add('correct');
          } else if (b.dataset.answer === answer && !result.isCorrect) {
            b.classList.add('wrong');
          }
          b.disabled = true;
        });
        
        const feedback = overlay.querySelector('.quiz-feedback');
        if (feedback) {
          feedback.style.display = 'block';
          feedback.innerHTML = `
            <div class="${result.isCorrect ? 'feedback-correct' : 'feedback-wrong'}">
              ${result.isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
            </div>
            <div class="feedback-analysis">${result.analysis}</div>
            <button class="btn-sm primary" style="margin-top:12px" onclick="document.getElementById('quiz-overlay').style.display='none'">关闭</button>
          `;
        }
        
        this.app.updateProgress();
      });
    });
  }
}
