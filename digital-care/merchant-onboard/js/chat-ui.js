// ========== 对话界面 UI 渲染层 ==========
const botAvatar = `<svg class="mini-heart-avatar" viewBox="0 0 40 40"><path d="M20 35C20 35 5 24 5 15C5 8 12 4 20 12C28 4 35 8 35 15C35 24 20 35 20 35Z" fill="#E84142"/><circle cx="14" cy="17" r="2" fill="white"/><circle cx="14" cy="17" r="1" fill="#333"/><circle cx="24" cy="17" r="2" fill="white"/><circle cx="24" cy="17" r="1" fill="#333"/><path d="M16 22Q19 25 23 22" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;

const ChatUI = {
  currentRoleId: null,

  init(roleId) {
    this.currentRoleId = roleId;
    const role = getRole(roleId);
    if (!role) return;

    // 设置导航栏标题
    document.getElementById('chatNavTitle').textContent = '关爱龙虾';

    // 返回按钮
    document.getElementById('chatBackBtn').onclick = () => {
      this.resetChat();
      Router.goBack();
    };

    // 渲染功能快捷入口
    this.renderFeatureCards(roleId);

    // 显示欢迎区域，隐藏消息区
    document.getElementById('chatWelcome').classList.remove('hidden');
    document.getElementById('chatMessages').classList.add('hidden');
    document.getElementById('chatMessages').innerHTML = '';

    // 绑定输入
    document.getElementById('chatInput').onkeydown = (e) => { if (e.key === 'Enter') this.sendMessage(); };
    document.getElementById('chatSendBtn').onclick = () => this.sendMessage();
    document.getElementById('chatImgBtn').onclick = () => this.triggerImageUpload();
  },

  renderFeatureCards(roleId) {
    const features = getFeaturesForRole(roleId);
    const container = document.getElementById('featureList');
    if (!container) return;

    // 真实可用的功能卡片
    let html = features.map(f => `
      <div class="feature-chip" data-feature="${f.id}">
        <span class="feature-chip-icon">${f.icon}</span>
        <span class="feature-chip-name">${f.name}</span>
      </div>
    `).join('');

    // 灰色置灰的即将上线卡片
    const comingSoonItems = [
      { icon: '🎫', name: '现有商家一站式配券' },
      { icon: '🤝', name: '多商家活动参与' },
      { icon: '📊', name: '活动数据报表' },
    ];
    comingSoonItems.forEach(item => {
      html += `
        <div class="feature-chip feature-chip-disabled">
          <span class="feature-chip-icon">${item.icon}</span>
          <span class="feature-chip-name">${item.name}</span>
          <span class="feature-chip-soon">即将上线</span>
        </div>
      `;
    });

    container.innerHTML = html;

    // 绑定点击（只绑定真实可用的卡片）
    container.querySelectorAll('.feature-chip:not(.feature-chip-disabled)').forEach(chip => {
      chip.addEventListener('click', () => {
        const featureId = chip.dataset.feature;
        ChatEngine.loadFeature(featureId);
        // 显示该功能的场景入口
        this.showFeatureScenarios(featureId);
      });
    });
  },

  showFeatureScenarios(featureId) {
    const feature = FEATURES[featureId];
    if (!feature) return;

    // 隐藏欢迎，显示消息区
    document.getElementById('chatWelcome').classList.add('hidden');
    document.getElementById('chatMessages').classList.remove('hidden');

    // Agent 打招呼
    this.addMsg('bot', `${feature.greeting || '你好！我可以帮你完成以下操作：'}`);

    // 如果配置了 autoStartScenario，直接启动该场景，跳过选择步骤
    if (feature.autoStartScenario) {
      // 直接启动全自动场景
      ChatEngine.startScenario(feature.autoStartScenario, false);
      return;
    }

    // 否则显示场景选择
    if (feature.scenarioList && feature.scenarioList.length > 0) {
      const mc = document.getElementById('chatMessages');
      const div = document.createElement('div');
      div.className = 'scenario-choices';
      div.innerHTML = feature.scenarioList.map(s => `
        <div class="scenario-choice-item" onclick="ChatEngine.startScenario('${s.id}')">
          <span class="scenario-choice-icon">${s.icon}</span>
          <div class="scenario-choice-info">
            <div class="scenario-choice-name">${s.name}</div>
            <div class="scenario-choice-desc">${s.desc}</div>
          </div>
        </div>
      `).join('');
      mc.appendChild(div);
    }
    this.scrollToBottom();
  },

  addMsg(type, content, opts = {}) {
    const ws = document.getElementById('chatWelcome');
    const mc = document.getElementById('chatMessages');
    if (ws && !ws.classList.contains('hidden')) { ws.classList.add('hidden'); mc.classList.remove('hidden'); }

    const div = document.createElement('div');
    div.className = `msg ${type}`;

    let html = type === 'bot'
      ? `<div class="avatar">${botAvatar}</div><div class="bubble">`
      : `<div class="avatar" style="background:#E8F4FD;font-size:14px;">👤</div><div class="bubble">`;

    html += content;

    if (opts.screenshot) {
      html += `<div style="margin-top:6px;"><img class="screenshot-preview" src="data:image/svg+xml,${encodeURIComponent(MerchantOnboard.mockScreenshotSVG())}" alt="大众点评截图"></div>`;
    }

    if (opts.license) {
      html += `<div style="margin-top:6px;"><div class="license-preview">
        <svg viewBox="0 0 180 120" width="180" height="120">
          <rect width="180" height="120" rx="6" fill="#FFFDE7" stroke="#E0C060" stroke-width="1"/>
          <rect x="8" y="8" width="164" height="14" rx="2" fill="none"/>
          <text x="90" y="19" font-size="9" font-weight="bold" fill="#B71C1C" text-anchor="middle">营 业 执 照</text>
          <text x="155" y="19" font-size="5" fill="#999">副本</text>
          <line x1="8" y1="26" x2="172" y2="26" stroke="#E0C060" stroke-width="0.5"/>
          <text x="12" y="38" font-size="6" fill="#666">统一社会信用代码：</text>
          <text x="78" y="38" font-size="6" fill="#333" font-weight="bold">91440300MA5G8B2C1X</text>
          <text x="12" y="50" font-size="6" fill="#666">名　　称：</text>
          <text x="52" y="50" font-size="6" fill="#333">深圳市状元甲餐饮管理有限公司</text>
          <text x="12" y="62" font-size="6" fill="#666">法定代表人：</text>
          <text x="56" y="62" font-size="6" fill="#333" font-weight="bold">张伟</text>
          <text x="12" y="74" font-size="6" fill="#666">注册资本：</text>
          <text x="52" y="74" font-size="6" fill="#333">500万人民币</text>
          <text x="12" y="86" font-size="6" fill="#666">成立日期：</text>
          <text x="52" y="86" font-size="6" fill="#333">2018年06月15日</text>
          <text x="12" y="98" font-size="6" fill="#666">经营范围：</text>
          <text x="52" y="98" font-size="6" fill="#333">餐饮服务；食品经营；...</text>
          <rect x="130" y="70" width="38" height="38" rx="4" fill="none" stroke="#C62828" stroke-width="0.8" opacity="0.3"/>
          <text x="149" y="93" font-size="8" fill="#C62828" text-anchor="middle" opacity="0.25">公章</text>
        </svg>
      </div></div>`;
    }

    if (opts.extracted) {
      html += `<div class="extracted-info"><div class="ext-title">${opts.extracted.title}</div>`;
      opts.extracted.items.forEach(i => {
        html += `<div class="ext-row"><span class="${i.s === '✅' ? 'check' : 'missing'}">${i.s}</span><b>${i.label}：</b>${i.value}</div>`;
      });
      html += '</div>';
    }

    if (opts.afterContent) html += opts.afterContent;

    if (opts.missingInfo) {
      html += `<div class="missing-info"><div class="ext-title">${opts.missingInfo.title}</div>`;
      opts.missingInfo.items.forEach(i => {
        html += `<div class="ext-row"><span class="missing">${i.s}</span><b>${i.label}</b> ${i.value}</div>`;
      });
      html += '</div>';
    }

    if (opts.card) {
      html += '<div class="info-card">';
      opts.card.rows.forEach(r => html += `<div class="row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`);
      html += '</div>';
    }

    if (opts.tools) {
      opts.tools.forEach(t => {
        html += `<div class="tool-call"><div class="tool-name">🔧 ${t.name}</div><div class="tool-params">${t.params}</div><div class="tool-result">${t.result}</div></div>`;
      });
    }

    if (opts.activityRecommend) {
      html += `<div class="activity-recommend"><div class="rec-title">${opts.activityRecommend.title}</div>`;
      opts.activityRecommend.items.forEach(item => {
        html += `<div class="rec-item" onclick="selectActivity('${item.scenario}')">
          <div class="rec-icon">${item.icon}</div>
          <div class="rec-info">
            <div class="rec-name">${item.name}</div>
            <div class="rec-desc">${item.desc}</div>
            <div class="rec-tag">${item.tag}</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    if (opts.activityForm) {
      html += this.renderActivityForm(opts.activityForm);
    }

    if (opts.activityDetailCard) {
      html += this.renderActivityDetailCard(opts.activityDetailCard);
    }

    if (opts.configSummary) {
      html += opts.configSummary;
    }

    if (opts.confirm) {
      html += `<div class="confirm-buttons"><button class="btn-primary" onclick="handleConfirm(true)">${opts.confirmText || '确认'}</button><button class="btn-outline" onclick="handleConfirm(false)">修改</button></div>`;
    }

    html += '</div>';
    div.innerHTML = html;
    mc.appendChild(div);
    this.scrollToBottom();
    return div;
  },

  renderActivityDetailCard(data) {
    const honorText = data.honorText || `恭喜${data.merchant}，成为蛇口社区第1家为${data.group}提供${data.name.split('·')[0].trim()}的商家`;
    return `<div class="activity-detail-card" onclick="openActivityDetail()">
      <div class="adc-honor">
        <span class="adc-honor-icon">🏆</span>
        <span class="adc-honor-text">${honorText}</span>
      </div>
      <div class="adc-body">
        <div class="adc-org">深圳市南山区蛇口社区基金会</div>
        <div class="adc-name">${data.name}</div>
        <div class="adc-meta">
          <span class="adc-status-dot"></span>
          <span>${data.status}</span>
          <span class="adc-period">${data.period}</span>
        </div>
      </div>
      <div class="adc-card-section">
        <div class="adc-card-label">❤️ ${data.cardType}</div>
        <div class="adc-card-merchant">${data.merchant}</div>
        <div class="adc-card-info">${data.total.toLocaleString()} 张 · 服务对象：${data.group}</div>
      </div>
      <div class="adc-footer">
        <span>📍 ${data.address}</span>
        <span class="adc-arrow">查看详情 ›</span>
      </div>
      <div class="adc-share-row" onclick="event.stopPropagation(); showSharePosterFromCard()">
        <span class="adc-share-btn">↗️ 分享海报</span>
      </div>
    </div>`;
  },

  renderActivityForm(config) {
    let html = `<div class="activity-config-form" id="actConfigForm">`;
    html += `<div class="config-header"><span class="config-icon">${config.icon}</span><span class="config-title">⚙️ 活动配置 · ${config.name}</span><span class="config-card-type">${config.cardType}</span></div>`;
    html += `<div class="config-fields">`;
    config.fields.forEach(f => {
      html += `<div class="config-field">`;
      html += `<label class="config-label">${f.label}</label>`;
      if (f.type === 'select' && !f.readonly) {
        html += `<select class="config-input config-select" data-field="${f.id}" onchange="onConfigChange()">`;
        f.options.forEach(opt => {
          html += `<option value="${opt}" ${opt === f.value ? 'selected' : ''}>${opt}</option>`;
        });
        html += `</select>`;
      } else if (f.type === 'number' && !f.readonly) {
        html += `<input type="number" class="config-input config-number" data-field="${f.id}" value="${f.value}" min="1" max="200" oninput="onConfigChange()" onchange="onConfigChange()">`;
      } else {
        html += `<input class="config-input${f.readonly ? ' config-readonly' : ''}" data-field="${f.id}" value="${f.value}" ${f.readonly ? 'readonly' : ''} onchange="onConfigChange()">`;
      }
      html += `</div>`;
    });
    html += `</div>`;
    html += `<div class="config-summary" id="configSummary"></div>`;
    html += `<div class="config-actions">`;
    html += `<button class="btn-primary config-confirm-btn" onclick="confirmActivityConfig()">✅ 确认配置，创建活动</button>`;
    html += `<button class="btn-outline" onclick="resetActivityConfig()">🔄 恢复默认</button>`;
    html += `</div>`;
    html += `</div>`;
    return html;
  },

  addThinking(text) {
    const ws = document.getElementById('chatWelcome');
    const mc = document.getElementById('chatMessages');
    if (ws && !ws.classList.contains('hidden')) { ws.classList.add('hidden'); mc.classList.remove('hidden'); }
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.id = 'thinkingMsg';
    div.innerHTML = `<div class="avatar">${botAvatar}</div><div class="bubble">
      <div class="thinking-indicator"><span class="think-text">🤔 ${text}</span></div>
      <div class="thinking-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>
    </div>`;
    mc.appendChild(div);
    this.scrollToBottom();
  },

  removeThinking() {
    const el = document.getElementById('thinkingMsg');
    if (el) el.remove();
  },

  scrollToBottom() {
    const chatArea = document.getElementById('chatArea');
    setTimeout(() => { chatArea.scrollTop = chatArea.scrollHeight; }, 50);
  },

  showUserActionHint(text, actionType) {
    const mc = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'user-action-hint';
    div.innerHTML = `
      <div class="user-action-btn" onclick="triggerUserAction('${actionType}', this)">
        <span class="user-action-text">${text}</span>
        <span class="user-action-tap">👆 点击触发</span>
      </div>
    `;
    mc.appendChild(div);
    this.scrollToBottom();
  },

  showScreenshotHint() {
    const mc = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'quick-reply-chips';
    div.style.alignSelf = 'flex-end';
    const btn = document.createElement('button');
    btn.className = 'quick-chip';
    btn.innerHTML = '📸 点击发送大众点评截图';
    btn.style.background = 'linear-gradient(135deg, #FF7B7B, #E84142)';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '8px 16px';
    btn.style.fontWeight = '600';
    btn.onclick = () => { div.remove(); this.sendScreenshot(); };
    div.appendChild(btn);
    mc.appendChild(div);
    this.scrollToBottom();
  },

  showChips(chips) {
    if (!chips) return;
    const mc = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'quick-reply-chips';
    div.style.alignSelf = 'flex-end';
    chips.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'quick-chip';
      btn.textContent = c.length > 35 ? c.slice(0, 33) + '...' : c;
      btn.title = c;
      btn.onclick = () => { div.remove(); this.handleQuickReply(c); };
      div.appendChild(btn);
    });
    mc.appendChild(div);
    this.scrollToBottom();
  },

  showCompare(data) {
    if (!data) return;
    const mc = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerHTML = `<div class="avatar">${botAvatar}</div><div class="bubble">
      <div class="compare-inline">
        <div class="compare-row"><div class="compare-label">传统方式</div><div class="compare-bar-wrap"><div class="compare-bar-fill old" style="width:0%"></div></div></div>
        <div class="compare-row"><div class="compare-label">AI 助手</div><div class="compare-bar-wrap"><div class="compare-bar-fill new" style="width:0%"></div></div></div>
        <div class="summary-box">${data.summary}</div>
      </div>
    </div>`;
    mc.appendChild(div);
    this.scrollToBottom();

    // Animate bars
    setTimeout(() => {
      div.querySelector('.compare-bar-fill.old').style.width = data.oldWidth;
      div.querySelector('.compare-bar-fill.old').textContent = data.oldTime;
      div.querySelector('.compare-bar-fill.new').style.width = data.newWidth;
      div.querySelector('.compare-bar-fill.new').textContent = data.newTime;
    }, 300);
  },

  sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || ChatEngine.state.isTyping) return;
    this.addMsg('user', text);
    input.value = '';
    if (ChatEngine.state.currentScenario) ChatEngine.proceedScenario();
  },

  triggerImageUpload() {
    if (ChatEngine.state.currentScenario && ChatEngine.getCurrentStep()?.type === 'wait-screenshot') {
      this.sendScreenshot();
    } else {
      this.addMsg('user', '📸 [大众点评截图]', { screenshot: true });
      if (ChatEngine.state.currentScenario) ChatEngine.proceedScenario();
    }
  },

  sendScreenshot() {
    this.addMsg('user', '📸 发送了一张大众点评截图', { screenshot: true });
    if (ChatEngine.state.currentScenario) ChatEngine.proceedScenario();
  },

  handleQuickReply(text) {
    if (ChatEngine.state.isTyping) return;
    document.getElementById('chatInput').value = text;
    this.sendMessage();
  },

  resetChat() {
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('chatWelcome').classList.remove('hidden');
    document.getElementById('chatMessages').classList.add('hidden');
    ChatEngine.state.currentScenario = null;
    ChatEngine.state.scenarioStep = 0;
    ChatEngine.state.selectedActivity = null;
  }
};

// ========== 全局函数（供 HTML onclick 调用）==========
function selectActivity(scenario) {
  ChatEngine.state.selectedActivity = scenario;
  const names = { lunch: '爱心午餐 · 帮帮卡', elder: '长者暖心宴 · 关爱卡', student: '爱心学生餐 · 帮帮卡' };
  ChatUI.addMsg('user', `我选 "${names[scenario] || '爱心午餐'}"`);
  document.querySelectorAll('.rec-item').forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; });
  if (ChatEngine.state.currentScenario) ChatEngine.proceedScenario();
}

function handleConfirm(yes) {
  ChatUI.addMsg('user', yes ? '✅ 确认，没问题！' : '我想修改一下...');
  document.querySelectorAll('.confirm-buttons').forEach(el => el.remove());
  if (yes && ChatEngine.state.currentScenario) ChatEngine.proceedScenario();
}

function onConfigChange() {
  ChatEngine.updateConfigSummary();
}

function confirmActivityConfig() {
  document.querySelectorAll('#actConfigForm .config-input').forEach(el => {
    el.disabled = true; el.classList.add('config-readonly');
  });
  document.querySelectorAll('#actConfigForm .config-actions button').forEach(el => {
    el.disabled = true; el.style.opacity = '0.5'; el.style.pointerEvents = 'none';
  });
  ChatUI.addMsg('user', '✅ 活动配置确认，开始创建！');
  if (ChatEngine.state.currentScenario) ChatEngine.proceedScenario();
}

function resetActivityConfig() {
  if (!ChatEngine.state.selectedActivity) return;
  const config = ChatEngine.activityConfigs[ChatEngine.state.selectedActivity];
  if (!config) return;
  config.fields.forEach(f => {
    const el = document.querySelector(`#actConfigForm [data-field="${f.id}"]`);
    if (el) el.value = f.value;
  });
  ChatEngine.updateConfigSummary();
}

function triggerUserAction(actionType, btnEl) {
  // 移除提示按钮
  const hintDiv = btnEl.closest('.user-action-hint');
  if (hintDiv) hintDiv.remove();

  if (actionType === 'screenshot') {
    ChatUI.addMsg('user', '📸 发送了一张大众点评截图', { screenshot: true });
  } else if (actionType === 'license') {
    ChatUI.addMsg('user', '📄 拍了一张营业执照', { license: true });
  }

  if (ChatEngine.state.currentScenario) {
    ChatEngine.proceedScenario();
  }
}

function openActivityDetail() {
  // 获取活动数据
  const actType = ChatEngine.state.selectedActivity || 'lunch';
  const config = ChatEngine.activityConfigs[actType];
  const fields = ChatEngine.getFormFieldValues();
  const actName = fields.act_name || config?.name || '爱心午餐 · 暖心行动';
  const summary = config ? config.computeSummary(fields) : { total: 2700, budget: 81000 };
  const group = fields.act_group || '环卫工人、外卖骑手';
  const cardType = config?.cardType || '帮帮卡';
  const merchant = ChatEngine.screenshotData.shopName;
  const address = ChatEngine.screenshotData.address;
  const period = actType === 'lunch' ? `${summary.months || 3}个月 · 每日${summary.daily || 30}份` : `${summary.months || 3}个月`;
  const honorText = `恭喜${merchant}，成为蛇口社区第1家为${group}提供${actName.split('·')[0].trim()}的商家`;

  // 创建活动详情页 overlay
  let overlay = document.getElementById('activityDetailOverlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'activityDetailOverlay';
  overlay.className = 'activity-detail-overlay';
  overlay.innerHTML = `
    <div class="ad-page">
      <div class="ad-nav">
        <button class="ad-back" onclick="closeActivityDetail()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="ad-nav-title">活动详情</span>
        <div class="ad-nav-right">
          <div class="wx-capsule"><span class="wx-dots">•• </span><span class="wx-divider"></span><span class="wx-close">◎</span></div>
        </div>
      </div>

      <div class="ad-scroll">
        <!-- 荣誉封面 -->
        <div class="ad-honor-cover">
          <div class="ad-honor-bg"></div>
          <div class="ad-honor-content">
            <div class="ad-honor-trophy">🏆</div>
            <div class="ad-honor-text">${honorText}</div>
            <div class="ad-honor-org">—— 深圳市南山区蛇口社区基金会</div>
          </div>
        </div>

        <!-- 发起方 -->
        <div class="ad-org-row">
          <div class="ad-org-avatar">🌸</div>
          <span class="ad-org-name">深圳市南山区蛇口社区基金会</span>
        </div>

        <!-- 活动名称 -->
        <div class="ad-title-section">
          <h2 class="ad-title">${actName}</h2>
          <div class="ad-status-row">
            <span class="ad-status-badge">❤️ 进行中</span>
            <span class="ad-date">2026.03.11 - 2026.${String(3 + (summary.months || 3)).padStart(2, '0')}.11</span>
          </div>
        </div>

        <!-- 活动简介 -->
        <div class="ad-section">
          <h3 class="ad-section-title">活动简介</h3>
          <div class="ad-section-body">
            <p>蛇口社区基金会携手<b>${merchant}</b>，为社区<b>${group}</b>提供温暖关爱服务。</p>
            <p>通过数字关爱平台的<b>${cardType}</b>，受助人可在指定时段到店享受优惠服务，让每一份关爱精准送达。</p>
          </div>
        </div>

        <!-- 帮帮卡/关爱卡 -->
        <div class="ad-card-section">
          <div class="ad-card-header">
            <span class="ad-card-badge">❤️ ${cardType}</span>
          </div>
          <div class="ad-card-merchant-row">
            <span class="ad-card-merchant-icon">🏪</span>
            <span>${merchant}</span>
          </div>
          <div class="ad-card-info-box">
            <div class="ad-card-info-title">${actName} · ${period}</div>
            <div class="ad-card-info-sub">服务对象：${group}</div>
          </div>
        </div>

        <!-- 覆盖地域 -->
        <div class="ad-section">
          <h3 class="ad-section-title">覆盖地域</h3>
          <div class="ad-section-body">
            <p>📍 广东省深圳市南山区</p>
            <p style="color:#999;font-size:12px;">${address}</p>
          </div>
        </div>

        <!-- 活动发起方 -->
        <div class="ad-section">
          <h3 class="ad-section-title">活动发起方</h3>
          <div class="ad-org-card">
            <div class="ad-org-avatar-sm">🌸</div>
            <span>深圳市南山区蛇口社区基金会</span>
          </div>
        </div>

        <!-- 活动资助方 -->
        <div class="ad-section">
          <h3 class="ad-section-title">活动资助方</h3>
          <div class="ad-org-card">
            <div class="ad-org-avatar-sm">🏪</div>
            <span>${merchant}</span>
          </div>
        </div>

        <!-- 活动协作方 -->
        <div class="ad-section">
          <h3 class="ad-section-title">活动协作方</h3>
          <div class="ad-section-body">
            <p>• 深圳壹基金公益基金会</p>
          </div>
        </div>

        <!-- 暖心留言 -->
        <div class="ad-section">
          <h3 class="ad-section-title">暖心留言</h3>
          <div class="ad-section-body ad-comments">
            <p style="color:#999;font-size:13px;text-align:center;">仅展示活动参与人的留言</p>
            <div class="ad-comment-input">
              <div class="ad-comment-avatar">👤</div>
              <div class="ad-comment-placeholder">写下您的真实感受</div>
            </div>
          </div>
        </div>

        <div style="height:80px;"></div>
      </div>

      <!-- 底部操作栏 -->
      <div class="ad-bottom-bar">
        <button class="ad-btn-comment">💬 留言</button>
        <button class="ad-btn-share" onclick="showSharePoster()">↗️ 分享海报</button>
      </div>
    </div>
  `;

  // 添加到 phone-frame 中
  const phoneFrame = document.querySelector('.phone-frame');
  phoneFrame.appendChild(overlay);

  // 动画入场
  requestAnimationFrame(() => {
    overlay.classList.add('ad-visible');
  });
}

function closeActivityDetail() {
  const overlay = document.getElementById('activityDetailOverlay');
  if (overlay) {
    overlay.classList.remove('ad-visible');
    setTimeout(() => overlay.remove(), 350);
  }
}

function showSharePoster() {
  const actType = ChatEngine.state.selectedActivity || 'lunch';
  const config = ChatEngine.activityConfigs[actType];
  const fields = ChatEngine.getFormFieldValues();
  const actName = fields.act_name || config?.name || '爱心午餐 · 暖心行动';
  const group = fields.act_group || '环卫工人、外卖骑手';
  const merchant = ChatEngine.screenshotData.shopName;
  const summary = config ? config.computeSummary(fields) : { total: 1800 };

  let posterOverlay = document.getElementById('posterOverlay');
  if (posterOverlay) posterOverlay.remove();

  posterOverlay = document.createElement('div');
  posterOverlay.id = 'posterOverlay';
  posterOverlay.className = 'poster-overlay';
  // 点击海报外区域关闭并返回对话
  posterOverlay.onclick = (e) => {
    if (e.target === posterOverlay || e.target.closest('.poster-actions')) return;
    // 点击非海报卡片区域也关闭
    if (!e.target.closest('.poster-card')) {
      closePoster();
      closeActivityDetail();
    }
  };
  posterOverlay.innerHTML = `
    <div class="poster-card">
      <div class="poster-header-bg">
        <div class="poster-header-pattern"></div>
        <div class="poster-header-content">
          <div class="poster-badge">🏆 爱心先锋</div>
          <div class="poster-merchant-hero">${merchant}</div>
          <div class="poster-honor-line">蛇口社区 <span class="poster-rank-num">第1家</span></div>
          <div class="poster-honor-desc">为${group}提供${actName.split('·')[0].trim()}的商家</div>
        </div>
      </div>
      <div class="poster-body">
        <div class="poster-act-row">
          <span class="poster-act-icon-sm">${config?.icon || '🍲'}</span>
          <div class="poster-act-detail">
            <div class="poster-act-title">${actName}</div>
            <div class="poster-act-stats">共 <b>${summary.total?.toLocaleString() || '1,800'}</b> 张${config?.cardType || '帮帮卡'}</div>
          </div>
        </div>
        <div class="poster-org-line">
          <span>🌸</span> 深圳市南山区蛇口社区基金会
        </div>
      </div>
      <div class="poster-bottom">
        <div class="poster-qr-wrap">
          <svg viewBox="0 0 50 50" width="50" height="50">
            <rect width="50" height="50" rx="4" fill="#F8F8F8" stroke="#eee" stroke-width="0.5"/>
            <rect x="6" y="6" width="15" height="15" rx="2" fill="#333"/>
            <rect x="29" y="6" width="15" height="15" rx="2" fill="#333"/>
            <rect x="6" y="29" width="15" height="15" rx="2" fill="#333"/>
            <rect x="33" y="33" width="8" height="8" rx="1" fill="#333"/>
            <rect x="9" y="9" width="9" height="9" rx="1" fill="#F8F8F8"/>
            <rect x="32" y="9" width="9" height="9" rx="1" fill="#F8F8F8"/>
            <rect x="9" y="32" width="9" height="9" rx="1" fill="#F8F8F8"/>
            <rect x="12" y="12" width="4" height="4" fill="#333"/>
            <rect x="35" y="12" width="4" height="4" fill="#333"/>
            <rect x="12" y="35" width="4" height="4" fill="#333"/>
          </svg>
          <span class="poster-qr-label">扫码查看详情</span>
        </div>
        <div class="poster-platform">数字关爱平台 · 让每份爱心都被看见</div>
      </div>
    </div>
  `;

  const phoneFrame = document.querySelector('.phone-frame');
  phoneFrame.appendChild(posterOverlay);

  requestAnimationFrame(() => {
    posterOverlay.classList.add('poster-visible');
  });
}

function closePoster() {
  const posterOverlay = document.getElementById('posterOverlay');
  if (posterOverlay) {
    posterOverlay.classList.remove('poster-visible');
    setTimeout(() => posterOverlay.remove(), 300);
  }
}

function showSharePosterFromCard() {
  // 从聊天内卡片的分享按钮直接打开海报
  showSharePoster();
  // 修改海报的点击行为：点击外部区域只关闭海报，不关闭详情页
  const posterOverlay = document.getElementById('posterOverlay');
  if (posterOverlay) {
    posterOverlay.onclick = (e) => {
      if (!e.target.closest('.poster-card')) {
        closePoster();
      }
    };
  }
}
