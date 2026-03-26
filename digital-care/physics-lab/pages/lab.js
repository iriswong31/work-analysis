/**
 * AIGP 物理实验室 — 实验台页面 v2
 * 新增: 视图切换 / 变阻器拖拽反馈 / 电压源调节反馈 / 考题仿真模式
 */

import { CircuitRenderer } from '../js/circuit-renderer.js';
import { createCircuitFromConfig } from '../js/circuit-engine.js';
import { DialogEngine, getDialogTree } from '../js/dialog-engine.js';
import { AssessEngine } from '../js/assess-engine.js';
import { completeExperiment } from '../js/storage.js';
import { formatVoltage, formatCurrent, formatPower, formatResistance } from '../js/utils.js';

export class LabPage {
  constructor(app) {
    this.app = app;
    this.renderer = null;
    this.circuit = null;
    this.dialogEngine = new DialogEngine();
    this.assessEngine = new AssessEngine();
    this.currentExperiment = null;
    this.quizOverlayVisible = false;
    this.isExamMode = false; // 考题仿真模式
  }
  
  async init() {
    const canvas = document.getElementById('circuit-canvas');
    if (canvas) {
      this.renderer = new CircuitRenderer(canvas);
      this.renderer.onComponentClick = (comp) => this._onComponentClick(comp);
      this.renderer.onRheostatChange = (comp) => this._onRheostatChange(comp);
      this.renderer.onVoltageChange = (comp) => this._onVoltageChange(comp);
      this.renderer.startAnimation();
    }
    
    this.assessEngine.init(this.app.data.questions, this.app.data.knowledgeTree);
    this._setupComponentPanel();
    this._setupDialogCallbacks();
    this._setupViewToggle();
  }
  
  destroy() {
    if (this.renderer) {
      this.renderer.stopAnimation();
    }
  }
  
  _setupComponentPanel() {
    const panel = document.querySelector('.component-panel');
    if (!panel) return;
    
    const experiments = this.app.data.experiments || [];
    // 分离普通实验和考题
    const regularExps = experiments.filter(e => !e.isExam);
    const examExps = experiments.filter(e => e.isExam);
    
    panel.innerHTML = `
      <div class="panel-title">📋 实验列表</div>
      <div class="experiment-list">
        ${regularExps.map(exp => `
          <button class="exp-btn" data-exp="${exp.id}" title="${exp.description}">
            <span class="exp-icon">${this._getExpIcon(exp.chapter)}</span>
            <span class="exp-name">${exp.name}</span>
          </button>
        `).join('')}
      </div>
      ${examExps.length > 0 ? `
        <div class="panel-title" style="margin-top:16px">📝 考题仿真</div>
        <div class="experiment-list">
          ${examExps.map(exp => `
            <button class="exp-btn exam-btn" data-exp="${exp.id}" title="${exp.description}">
              <span class="exp-icon">📝</span>
              <span class="exp-name">${exp.name}</span>
            </button>
          `).join('')}
        </div>
      ` : ''}
      <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--border)">
        <div class="panel-title" style="font-size:11px;margin-bottom:8px">💡 操作提示</div>
        <div style="font-size:11px;color:var(--text-muted);line-height:1.6">
          • 点击<b>开关</b>闭合/断开电路<br>
          • 拖拽<b>变阻器滑片</b>调节阻值<br>
          • 点击<b>电池</b>切换电压<br>
          • 点击右上角切换<b>实物/电路图</b>
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
  
  // 视图切换按钮
  _setupViewToggle() {
    const canvasArea = document.querySelector('.canvas-area');
    if (!canvasArea) return;
    
    // 检查是否已存在
    if (canvasArea.querySelector('.view-toggle-group')) return;
    
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'view-toggle-group';
    toggleGroup.style.cssText = 'position:absolute;top:12px;right:12px;display:flex;gap:4px;z-index:10;';
    
    toggleGroup.innerHTML = `
      <button class="view-toggle-btn active" data-view="schematic" title="电路原理图">📐 原理图</button>
      <button class="view-toggle-btn" data-view="realistic" title="实物连接图">📷 实物图</button>
    `;
    
    canvasArea.appendChild(toggleGroup);
    
    toggleGroup.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.view;
        this.renderer.setViewMode(mode);
        toggleGroup.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
  
  // 加载实验
  loadExperiment(expId) {
    const exp = (this.app.data.experiments || []).find(e => e.id === expId);
    if (!exp) return;
    
    this.currentExperiment = exp;
    this.isExamMode = !!exp.isExam;
    
    // 创建电路
    this.circuit = createCircuitFromConfig(exp.circuit);
    this.renderer.setCircuit(this.circuit);
    
    // 更新 UI
    const titleEl = document.querySelector('.experiment-title');
    if (titleEl) titleEl.textContent = this.isExamMode ? `📝 ${exp.name}` : `🔬 ${exp.name}`;
    
    const goalEl = document.querySelector('.status-goal');
    if (goalEl) goalEl.textContent = exp.goals?.[0] || '完成实验';
    
    // 更新按钮
    const actionsEl = document.querySelector('.status-actions');
    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="btn-sm" onclick="document.dispatchEvent(new CustomEvent('lab-reset'))">🔄 重置</button>
        ${!this.isExamMode ? `<button class="btn-sm primary" onclick="document.dispatchEvent(new CustomEvent('lab-quiz'))">📝 练习题</button>` : ''}
      `;
    }
    
    // 数据面板（实时显示电路参数）
    this._updateDataPanel();
    
    // 高亮当前实验按钮
    document.querySelectorAll('.exp-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exp === expId);
    });
    
    // 清空对话并启动
    this._clearMessages();
    
    if (this.isExamMode) {
      // 考题模式：显示题目
      this._addMessage(`📝 <b>考题仿真</b>\n\n${exp.description}\n\n<b>任务目标：</b>\n${(exp.goals || []).map((g, i) => `${i + 1}. ${g}`).join('\n')}`, 'teacher');
      this._addMessage('⚡ 先闭合开关，然后通过调节变阻器滑片和切换电压来完成题目要求。', 'teacher');
    } else {
      const tree = getDialogTree(exp.dialogTreeId);
      if (tree) {
        this.dialogEngine.loadTree(tree);
        this.dialogEngine.start();
      } else {
        this._addMessage(`🔬 欢迎来到「${exp.name}」实验！\n\n试着闭合开关，观察电路变化。`, 'teacher');
      }
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
      this._updateDataPanel();
    } else if (comp.type === 'battery') {
      this._addMessage(`🔋 电源调节为 ${comp.voltage}V`, 'student');
      this._updateDataPanel();
    }
  }
  
  _onRheostatChange(comp) {
    this._updateDataPanel();
  }
  
  _onVoltageChange(comp) {
    this._updateDataPanel();
  }
  
  // 实时数据面板
  _updateDataPanel() {
    if (!this.circuit) return;
    
    let dataHtml = '';
    const battery = Array.from(this.circuit.components.values()).find(c => c.type === 'battery');
    
    if (battery && this.circuit.solved && !this.circuit.hasError) {
      dataHtml += `<div class="data-row"><span>电源电压</span><span class="data-val">${formatVoltage(battery.voltage)}</span></div>`;
      dataHtml += `<div class="data-row"><span>总电流</span><span class="data-val">${formatCurrent(battery.current)}</span></div>`;
      
      for (const [, comp] of this.circuit.components) {
        if (comp.type === 'resistor' || comp.type === 'bulb' || comp.type === 'rheostat') {
          const label = comp.label || comp.id;
          dataHtml += `<div class="data-row"><span>${label}</span><span class="data-val">${formatVoltage(comp.voltage)} / ${formatCurrent(comp.current)} / ${formatPower(comp.power)}</span></div>`;
        }
      }
    }
    
    // 找或创建数据面板
    let dataPanel = document.querySelector('.circuit-data-panel');
    if (!dataPanel) {
      const canvasInfo = document.querySelector('.canvas-info');
      if (canvasInfo) {
        dataPanel = document.createElement('div');
        dataPanel.className = 'circuit-data-panel';
        dataPanel.style.cssText = 'margin-top:8px;background:rgba(10,14,39,0.85);padding:8px 12px;border-radius:6px;border:1px solid var(--border);font-size:11px;max-width:260px;';
        canvasInfo.appendChild(dataPanel);
      }
    }
    if (dataPanel) {
      dataPanel.innerHTML = dataHtml || '<span style="color:var(--text-muted)">闭合开关后显示数据</span>';
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
    
    container.scrollTop = container.scrollHeight;
    
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
