// ========== 对话场景引擎 ==========
// 核心职责：状态管理、场景流程推进、步骤调度
// 不含 UI 渲染代码

const ChatEngine = {
  state: {
    merchants: [],
    activities: [],
    totalCards: 0,
    savedMinutes: 0,
    currentScenario: null,
    scenarioStep: 0,
    isTyping: false,
    selectedActivity: null,
    currentRoleId: null,
    currentFeatureId: null
  },

  // 当前加载的场景脚本（来自 feature 模块）
  scenarios: {},
  activityConfigs: {},
  screenshotData: {},

  init(roleId) {
    this.state.currentRoleId = roleId;
    this.state.currentScenario = null;
    this.state.scenarioStep = 0;
    this.state.selectedActivity = null;
    this.state.isTyping = false;
  },

  loadFeature(featureId) {
    const feature = FEATURES[featureId];
    if (!feature) return;
    this.state.currentFeatureId = featureId;
    this.scenarios = feature.scenarios || {};
    this.activityConfigs = feature.activityConfigs || {};
    this.screenshotData = feature.screenshotData || {};
  },

  getCurrentStep() {
    const script = this.scenarios[this.state.currentScenario];
    if (!script || this.state.scenarioStep >= script.length) return null;
    return script[this.state.scenarioStep];
  },

  startScenario(name, showLabel) {
    this.state.currentScenario = name;
    this.state.scenarioStep = 0;
    this.state.selectedActivity = null;
    if (showLabel !== false) {
      const labels = { screenshot: '📸 发大众点评截图，入驻+配卡一条龙', full: '🚀 完整流程演示', quick: '⚡ 30秒极速体验', 'auto-demo': '' };
      const label = labels[name];
      if (label) ChatUI.addMsg('user', label);
    }
    this.proceedScenario();
  },

  proceedScenario() {
    const script = this.scenarios[this.state.currentScenario];
    if (!script || this.state.scenarioStep >= script.length) { this.state.currentScenario = null; return; }

    const step = script[this.state.scenarioStep];
    this.state.scenarioStep++;

    switch (step.type) {
      case 'agent':
        this.state.isTyping = true;
        ChatUI.addThinking('思考中');
        setTimeout(() => {
          ChatUI.removeThinking();
          this.state.isTyping = false;
          ChatUI.addMsg('bot', step.text, {
            card: step.card, afterContent: step.afterContent,
            extracted: step.extracted, missingInfo: step.missingInfo,
            tools: step.tools, confirm: step.confirm, confirmText: step.confirmText,
            activityRecommend: step.activityRecommend
          });
          if (step.dataUpdates) this.applyData(step.dataUpdates);

          // Look ahead for next step
          const next = script[this.state.scenarioStep];
          if (!next) return;
          this.handleNextStepLookahead(next);
        }, step.delay || 600);
        break;

      case 'thinking':
        this.state.isTyping = true;
        ChatUI.addThinking(step.thinkText);
        setTimeout(() => {
          ChatUI.removeThinking();
          this.state.isTyping = false;
          this.proceedScenario();
        }, step.delay || 1000);
        break;

      case 'wait':
        ChatUI.showChips(step.chips);
        break;

      case 'wait-screenshot':
        ChatUI.showScreenshotHint();
        break;

      case 'wait-user-screenshot':
        // 显示提示按钮，等待用户手动点击发送截图
        ChatUI.showUserActionHint('📸 点击发送大众点评截图', 'screenshot');
        break;

      case 'wait-user-license':
        // 显示提示按钮，等待用户手动点击发送营业执照
        ChatUI.showUserActionHint('📄 点击发送营业执照', 'license');
        break;

      case 'wait-confirm':
        // 当用户点击确认后 handleConfirm() 调用 proceedScenario()，此时直接跳过 proceed 下一步
        this.proceedScenario();
        return;

      case 'wait-activity':
        // 当用户点击后 selectActivity() 调用 proceedScenario()，此时直接跳过 proceed 下一步
        this.proceedScenario();
        return;

      case 'wait-config-confirm':
        // 当用户点击确认后 confirmActivityConfig() 调用 proceedScenario()，此时直接跳过 proceed 下一步
        this.proceedScenario();
        return;

      case 'auto-confirm':
        setTimeout(() => this.proceedScenario(), 800);
        break;

      case 'auto-reply':
        setTimeout(() => {
          ChatUI.addMsg('user', step.text);
          this.proceedScenario();
        }, step.delay || 800);
        break;

      case 'auto-screenshot':
        setTimeout(() => {
          ChatUI.addMsg('user', '📸 发送了一张大众点评截图', { screenshot: true });
          this.proceedScenario();
        }, step.delay || 600);
        break;

      case 'auto-reply-license':
        setTimeout(() => {
          ChatUI.addMsg('user', '📄 拍了一张营业执照', { license: true });
          this.proceedScenario();
        }, step.delay || 800);
        break;

      case 'auto-confirm-submit':
        setTimeout(() => {
          ChatUI.addMsg('user', step.text || '✅ 确认，提交入驻！');
          this.proceedScenario();
        }, step.delay || 800);
        break;

      case 'auto-select-activity':
        setTimeout(() => {
          this.state.selectedActivity = 'lunch';
          ChatUI.addMsg('user', '我选 "爱心午餐 · 帮帮卡"');
          document.querySelectorAll('.rec-item').forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; });
          this.proceedScenario();
        }, step.delay || 1000);
        break;

      case 'activity-config':
        this.showActivityConfigForm(false);
        break;

      case 'activity-config-quick':
        this.showActivityConfigForm(true);
        break;

      case 'activity-create':
        this.createActivityFromConfig();
        break;

      case 'activity-create-warm':
        this.createActivityWarm();
        break;

      case 'final-summary':
        this.showFinalSummary();
        break;
    }
  },

  handleNextStepLookahead(next) {
    const script = this.scenarios[this.state.currentScenario];
    if (next.type === 'thinking') {
      // agent 后面紧跟 thinking，直接推进
      this.state.scenarioStep++;
      this.state.isTyping = true;
      ChatUI.addThinking(next.thinkText);
      setTimeout(() => {
        ChatUI.removeThinking();
        this.state.isTyping = false;
        this.proceedScenario();
      }, next.delay || 1000);
    } else if (next.type === 'auto-confirm') {
      // auto-confirm仍然自动推进（用于其他场景），但wait-confirm不会
      this.state.scenarioStep++;
      setTimeout(() => this.proceedScenario(), 800);
    } else if (next.type === 'wait') {
      ChatUI.showChips(next.chips);
    } else if (next.type === 'wait-screenshot') {
      ChatUI.showScreenshotHint();
    } else if (next.type === 'wait-confirm') {
      // 等待用户手动点击确认按钮，不自动推进
    } else if (next.type === 'wait-user-screenshot') {
      // 等待用户手动点击发送截图，不自动推进
      this.state.scenarioStep++;
      ChatUI.showUserActionHint('📸 点击发送大众点评截图', 'screenshot');
    } else if (next.type === 'wait-user-license') {
      // 等待用户手动点击发送营业执照，不自动推进
      this.state.scenarioStep++;
      ChatUI.showUserActionHint('📄 点击发送营业执照', 'license');
    } else if (next.type === 'wait-activity') {
      // 真正等待用户手动点击活动卡片，不自动推进
    } else if (next.type === 'wait-config-confirm') {
      // 真正等待用户手动确认配置，不自动推进
    } else if (next.type === 'auto-reply') {
      setTimeout(() => {
        this.state.scenarioStep++;
        ChatUI.addMsg('user', next.text);
        this.proceedScenario();
      }, next.delay || 800);
    } else if (next.type === 'auto-screenshot') {
      setTimeout(() => {
        this.state.scenarioStep++;
        ChatUI.addMsg('user', '📸 发送了一张大众点评截图', { screenshot: true });
        this.proceedScenario();
      }, next.delay || 600);
    } else if (next.type === 'auto-reply-license') {
      setTimeout(() => {
        this.state.scenarioStep++;
        ChatUI.addMsg('user', '📄 拍了一张营业执照', { license: true });
        this.proceedScenario();
      }, next.delay || 800);
    } else if (next.type === 'auto-confirm-submit') {
      setTimeout(() => {
        this.state.scenarioStep++;
        ChatUI.addMsg('user', next.text || '✅ 确认，提交入驻！');
        this.proceedScenario();
      }, next.delay || 800);
    } else if (next.type === 'auto-select-activity') {
      setTimeout(() => {
        this.state.scenarioStep++;
        this.state.selectedActivity = 'lunch';
        ChatUI.addMsg('user', '我选 "爱心午餐 · 帮帮卡"');
        document.querySelectorAll('.rec-item').forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; });
        this.proceedScenario();
      }, next.delay || 1000);
    } else if (next.type === 'agent') {
      // 连续 agent 步骤，延迟后自动推进到下一个 agent
      setTimeout(() => {
        this.proceedScenario();
      }, next.delay || 600);
    }
  },

  showActivityConfigForm(autoConfirm) {
    const actType = this.state.selectedActivity || 'lunch';
    const config = this.activityConfigs[actType];
    if (!config) return;

    const formConfig = JSON.parse(JSON.stringify(config));
    formConfig.fields.forEach(f => {
      if (f.id === 'act_merchant') f.value = this.screenshotData.shopName;
      if (f.id === 'act_address') f.value = this.screenshotData.address;
    });

    this.state.isTyping = true;
    setTimeout(() => {
      this.state.isTyping = false;
      const msgText = `好的，我为 <b>${this.screenshotData.shopName}</b> 生成了 <b>${config.name}</b> 的配置方案 🌸\n\n以下参数都可以调整，确认后点击下方按钮创建活动 👇`;
      ChatUI.addMsg('bot', msgText, { activityForm: formConfig });
      setTimeout(() => {
        this.updateConfigSummary();
        ChatUI.scrollToBottom();
      }, 100);
    }, 400);
  },

  getFormFieldValues() {
    const vals = {};
    document.querySelectorAll('#actConfigForm .config-input').forEach(el => {
      vals[el.dataset.field] = el.value;
    });
    return vals;
  },

  updateConfigSummary() {
    const summaryEl = document.getElementById('configSummary');
    if (!summaryEl || !this.state.selectedActivity) return;
    const config = this.activityConfigs[this.state.selectedActivity];
    if (!config) return;
    const fields = this.getFormFieldValues();
    const summary = config.computeSummary(fields);

    let html = '<div class="summary-title">📊 活动预估</div>';
    if (this.state.selectedActivity === 'lunch' || this.state.selectedActivity === 'student') {
      html += `<div class="summary-row"><span>每日发放</span><b>${summary.daily} 份/天</b></div>`;
      html += `<div class="summary-row"><span>活动天数</span><b>${summary.days} 天（${summary.months}个月）</b></div>`;
      html += `<div class="summary-row"><span>关爱卡总量</span><b class="highlight-value">${summary.total.toLocaleString()} 张</b></div>`;
      html += `<div class="summary-row"><span>预估补贴预算</span><b class="highlight-value">¥${summary.budget.toLocaleString()}</b></div>`;
    } else if (this.state.selectedActivity === 'elder') {
      html += `<div class="summary-row"><span>每次名额</span><b>${summary.seats} 人</b></div>`;
      html += `<div class="summary-row"><span>活动频次</span><b>${summary.freqLabel}</b></div>`;
      html += `<div class="summary-row"><span>关爱卡总量</span><b class="highlight-value">${summary.total.toLocaleString()} 张</b></div>`;
      html += `<div class="summary-row"><span>预估补贴预算</span><b class="highlight-value">¥${summary.budget.toLocaleString()}</b></div>`;
    }
    summaryEl.innerHTML = html;
  },

  createActivityWarm() {
    const actType = this.state.selectedActivity || 'lunch';
    const config = this.activityConfigs[actType];
    if (!config) return;

    const fields = this.getFormFieldValues();
    const actName = fields.act_name || config.name;
    const summary = config.computeSummary(fields);
    const group = fields.act_group || config.fields.find(f => f.id === 'act_group')?.value || '环卫工人、外卖骑手';

    this.state.isTyping = true;
    setTimeout(() => {
      this.state.isTyping = false;

      this.applyData({
        activities: [{ name: actName, type: config.cardType, detail: `${this.screenshotData.shopName} · ${summary.total.toLocaleString()}份` }],
        cards: summary.total,
        savedMinutes: 18
      });

      // 温暖的话语 + 活动详情卡片
      ChatUI.addMsg('bot',
        `🎉 太棒了！<b>${actName}</b>已经配置成功啦！\n\n` +
        `${this.screenshotData.shopName} 将为<b>${group}</b>提供温暖的关爱服务 🌸\n\n` +
        `共配发 <b>${summary.total.toLocaleString()} 张${config.cardType}</b>，活动即日起生效。\n\n` +
        `点击下方卡片查看活动详情 👇`,
        {
          activityDetailCard: {
            name: actName,
            merchant: this.screenshotData.shopName,
            cardType: config.cardType,
            group: group,
            total: summary.total,
            budget: summary.budget,
            icon: config.icon,
            status: '进行中',
            period: actType === 'lunch' ? `${summary.months}个月 · 每日${summary.daily}份` :
                    actType === 'elder' ? `${summary.months}个月 · ${summary.freqLabel}·每次${summary.seats}人` :
                    `${summary.months}个月 · 每日${summary.daily}份`,
            address: this.screenshotData.address
          }
        }
      );

      this.state.currentScenario = null;
    }, 600);
  },

  createActivityFromConfig() {
    const actType = this.state.selectedActivity || 'lunch';
    const config = this.activityConfigs[actType];
    if (!config) return;

    const fields = this.getFormFieldValues();
    const actName = fields.act_name || config.name;
    const summary = config.computeSummary(fields);

    this.state.isTyping = true;
    setTimeout(() => {
      this.state.isTyping = false;

      let tools = [];
      if (actType === 'lunch' || actType === 'student') {
        const group = fields.act_group || config.fields.find(f => f.id === 'act_group')?.value || '环卫工人';
        tools = [
          { name: 'create_bangbang_activity', params: `{ name:"${actName}", merchant:"${this.screenshotData.shopName}", service_group:"${group}", daily:${summary.daily}, months:${summary.months} }`, result: `✅ 活动创建成功 ACT-BB-2026-${String(Math.floor(Math.random() * 900) + 100)}` },
          { name: 'configure_bangbang_card', params: `{ activity:"${actName}", card_name:"${actName}卡", per_person:1, total:${summary.total} }`, result: `✅ ${summary.total.toLocaleString()} 张帮帮卡已配置完成` },
          { name: 'distribute_cards_to_community', params: `{ card_name:"${actName}卡", communities:["南山街道","粤海街道","沙河街道"], total:${summary.total} }`, result: `✅ 已分配至3个街道社区，受助人可开始申领` }
        ];
      } else if (actType === 'elder') {
        const group = fields.act_group || '社区孤寡老人（65岁以上）';
        tools = [
          { name: 'create_care_activity', params: `{ name:"${actName}", merchant:"${this.screenshotData.shopName}", service_group:"${group}", seats:${summary.seats}, freq:"${summary.freqLabel}", months:${summary.months} }`, result: `✅ 活动创建成功 ACT-CA-2026-${String(Math.floor(Math.random() * 900) + 100)}` },
          { name: 'configure_care_card', params: `{ activity:"${actName}", card_name:"${actName}卡", total:${summary.total} }`, result: `✅ ${summary.total.toLocaleString()} 张关爱卡已配置完成` },
          { name: 'notify_community_workers', params: `{ activity:"${actName}", communities:["南山街道","粤海街道"], message:"新关爱活动上线" }`, result: `✅ 已通知2个街道的社区工作者，开始组织报名` }
        ];
      }

      ChatUI.addMsg('bot', `正在创建 <b>${actName}</b> 并配发 <b>${config.cardType}</b>...`, { tools });

      this.applyData({
        activities: [{ name: actName, type: config.cardType, detail: `${this.screenshotData.shopName} · ${summary.total.toLocaleString()}份` }],
        cards: summary.total,
        savedMinutes: 18
      });

      const nextStep = this.scenarios[this.state.currentScenario]?.[this.state.scenarioStep];
      if (nextStep && nextStep.type === 'final-summary') {
        setTimeout(() => this.proceedScenario(), 1200);
      }
    }, 600);
  },

  showFinalSummary() {
    const actType = this.state.selectedActivity || 'lunch';
    const config = this.activityConfigs[actType];
    const fields = this.getFormFieldValues();
    const summary = config ? config.computeSummary(fields) : { total: 1800, budget: 54000 };
    const actName = fields.act_name || config?.name || '爱心午餐 · 暖心行动';
    const cardType = config?.cardType || '帮帮卡';
    const group = fields.act_group || '环卫工人、外卖骑手';

    this.state.isTyping = true;
    ChatUI.addThinking('生成总结报告...');
    setTimeout(() => {
      ChatUI.removeThinking();
      this.state.isTyping = false;
      ChatUI.addMsg('bot',
        `🎉🎉 <b>全流程完成！入驻 + 活动配置 + 配卡一条龙 ✅</b>\n\n` +
        `<b>📋 成果总览</b>\n` +
        `━━━━━━━━━━━━━━━\n` +
        `✅ <b>商户入驻</b>：${this.screenshotData.shopName}\n` +
        `✅ <b>关爱活动</b>：${actName}\n` +
        `✅ <b>${cardType}</b>：${summary.total.toLocaleString()} 张已配发\n` +
        `✅ <b>服务人群</b>：${group}\n` +
        `✅ <b>预估预算</b>：¥${summary.budget.toLocaleString()}\n` +
        `✅ <b>社区通知</b>：已发送，受助人可申领\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📊 <b>全流程效率对比</b>`
      );

      ChatUI.showCompare({
        oldTime: '~45分钟', oldWidth: '92%',
        newTime: '~3分钟', newWidth: '8%',
        summary: `
          <b>🚀 提效 93%</b><br>
          • 传统：手填12+字段 + 切换多页面 + 单独配活动 + 配卡 ≈ <b>45分钟</b><br>
          • AI 助手：发2张截图 + 选活动 + 调参数 ≈ <b>3分钟</b><br>
          • 只上传了 <b>2张截图</b>，AI自动提取全部信息<br>
          • 活动配置<b>参数可调</b>，预算<b>实时计算</b>
        `
      });

      this.state.currentScenario = null;
    }, 800);
  },

  applyData(u) {
    if (u.merchants) u.merchants.forEach(m => this.state.merchants.push(m));
    if (u.activities) u.activities.forEach(a => this.state.activities.push(a));
    if (u.cards) this.state.totalCards += u.cards;
    if (u.savedMinutes) this.state.savedMinutes += u.savedMinutes;
  }
};
