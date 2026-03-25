/**
 * AIGP 物理实验室 — 引导对话引擎
 */

export class DialogEngine {
  constructor() {
    this.tree = null;
    this.currentNodeId = null;
    this.history = [];
    this.variables = {};
    this.onMessage = null;    // callback: (message, type) => void
    this.onComplete = null;   // callback: () => void
    this.onAction = null;     // callback: (action) => void
  }
  
  loadTree(tree) {
    this.tree = tree;
    this.currentNodeId = tree.startNode || 'start';
    this.history = [];
    this.variables = {};
  }
  
  start() {
    if (!this.tree) return;
    this._processNode(this.currentNodeId);
  }
  
  // 处理用户回答
  answer(text) {
    if (!this.tree || !this.currentNodeId) return;
    
    const node = this.tree.nodes[this.currentNodeId];
    if (!node) return;
    
    // 记录学生回答
    this.history.push({ role: 'student', text, nodeId: this.currentNodeId });
    if (this.onMessage) this.onMessage(text, 'student');
    
    // 根据回答找到下一个节点
    if (node.type === 'question') {
      const option = node.options?.find(opt => opt.text === text || opt.id === text);
      if (option) {
        this.variables[`answer_${this.currentNodeId}`] = option.id || text;
        const nextNode = option.correct ? (node.correctNext || node.next) : (node.wrongNext || node.next);
        if (nextNode) {
          setTimeout(() => this._processNode(nextNode), 500);
        }
      } else {
        // 默认跳到 next
        if (node.next) {
          setTimeout(() => this._processNode(node.next), 500);
        }
      }
    } else if (node.next) {
      setTimeout(() => this._processNode(node.next), 500);
    }
  }
  
  // 外部触发检查（比如电路操作后检查状态）
  check(conditionId, value) {
    this.variables[conditionId] = value;
    
    // 如果当前节点是 check 类型，评估条件
    const node = this.tree?.nodes[this.currentNodeId];
    if (node?.type === 'check') {
      const condition = node.condition;
      if (condition && this.variables[condition.key] === condition.value) {
        if (node.passNext) {
          this._processNode(node.passNext);
        }
      } else if (node.failNext) {
        this._processNode(node.failNext);
      }
    }
  }
  
  _processNode(nodeId) {
    const node = this.tree?.nodes[nodeId];
    if (!node) return;
    
    this.currentNodeId = nodeId;
    
    switch (node.type) {
      case 'message':
        this._handleMessage(node);
        break;
      case 'question':
        this._handleQuestion(node);
        break;
      case 'check':
        this._handleCheck(node);
        break;
      case 'action':
        this._handleAction(node);
        break;
      case 'end':
        this._handleEnd(node);
        break;
      default:
        this._handleMessage(node);
    }
  }
  
  _handleMessage(node) {
    this.history.push({ role: 'teacher', text: node.text, nodeId: node.id || this.currentNodeId });
    if (this.onMessage) this.onMessage(node.text, 'teacher');
    
    // 自动跳到下一个节点
    if (node.next) {
      const delay = node.delay || 1500;
      setTimeout(() => this._processNode(node.next), delay);
    }
  }
  
  _handleQuestion(node) {
    this.history.push({ role: 'teacher', text: node.text, nodeId: node.id || this.currentNodeId, isQuestion: true });
    if (this.onMessage) {
      this.onMessage(node.text, 'teacher', node.options);
    }
    // 等待 answer() 调用
  }
  
  _handleCheck(node) {
    // 检查条件
    const condition = node.condition;
    if (!condition) {
      if (node.next) this._processNode(node.next);
      return;
    }
    
    if (node.waitText) {
      this.history.push({ role: 'teacher', text: node.waitText, nodeId: node.id || this.currentNodeId });
      if (this.onMessage) this.onMessage(node.waitText, 'teacher');
    }
    
    // 如果条件已满足
    if (this.variables[condition.key] === condition.value) {
      if (node.passNext) this._processNode(node.passNext);
    }
    // 否则等待 check() 调用
  }
  
  _handleAction(node) {
    if (this.onAction) this.onAction(node.action);
    if (node.text) {
      this.history.push({ role: 'teacher', text: node.text, nodeId: node.id || this.currentNodeId });
      if (this.onMessage) this.onMessage(node.text, 'teacher');
    }
    if (node.next) {
      setTimeout(() => this._processNode(node.next), 800);
    }
  }
  
  _handleEnd(node) {
    if (node.text) {
      this.history.push({ role: 'teacher', text: node.text, nodeId: node.id || this.currentNodeId });
      if (this.onMessage) this.onMessage(node.text, 'teacher');
    }
    if (this.onComplete) this.onComplete();
  }
}

// === 内置对话树 ===

export const DIALOG_TREES = {
  'simple-circuit': {
    id: 'simple-circuit',
    name: '简单电路',
    startNode: 'welcome',
    nodes: {
      'welcome': {
        type: 'message',
        text: '🔬 今天我们来搭建一个最简单的电路！\n\n你面前有一个电池、一个开关和一个灯泡。',
        next: 'q1'
      },
      'q1': {
        type: 'question',
        text: '要让灯泡亮起来，我们需要什么条件？',
        options: [
          { id: 'closed', text: '电路必须是通路（闭合回路）', correct: true },
          { id: 'open', text: '只要有电池就行', correct: false }
        ],
        correctNext: 'explain-correct',
        wrongNext: 'explain-wrong'
      },
      'explain-correct': {
        type: 'message',
        text: '✅ 完全正确！电路必须是一个闭合的回路，电流才能流动。\n\n现在试试点击开关，让它闭合。',
        next: 'check-switch'
      },
      'explain-wrong': {
        type: 'message',
        text: '🤔 不完全对哦。光有电池还不够——电流需要一条完整的回路才能流动。\n\n这就像水管必须连成环路，水才能循环流动一样。\n\n试试点击开关闭合它，看看会发生什么？',
        next: 'check-switch'
      },
      'check-switch': {
        type: 'check',
        condition: { key: 'switch_on', value: true },
        waitText: '👆 点击电路中的开关，把它闭合。',
        passNext: 'switch-on-response'
      },
      'switch-on-response': {
        type: 'message',
        text: '💡 灯泡亮了！看到电子（黄色小点）在电路中流动了吗？\n\n电流从电池正极出发，经过导线→开关→灯泡，最后回到电池负极。这就是一个完整的回路！',
        next: 'q2'
      },
      'q2': {
        type: 'question',
        text: '在这个电路中，电流的方向是怎样的？',
        options: [
          { id: 'pos-to-neg', text: '从正极出发，经过用电器，回到负极', correct: true },
          { id: 'neg-to-pos', text: '从负极出发，经过用电器，回到正极', correct: false }
        ],
        correctNext: 'end-correct',
        wrongNext: 'end-detail'
      },
      'end-detail': {
        type: 'message',
        text: '💡 注意区分"电流方向"和"电子移动方向"哦！\n\n• 电子确实从负极流向正极\n• 但物理上规定的"电流方向"与电子移动方向相反\n• 所以电流方向是：正极→导线→用电器→负极',
        next: 'end-correct'
      },
      'end-correct': {
        type: 'end',
        text: '🎉 太棒了！你已经掌握了简单电路的基本知识：\n\n1. 电路必须是闭合回路\n2. 电流方向：正极→用电器→负极\n3. 开关控制电路的通断\n\n继续下一个实验吧！'
      }
    }
  },
  
  'series-circuit': {
    id: 'series-circuit',
    name: '串联电路',
    startNode: 'welcome',
    nodes: {
      'welcome': {
        type: 'message',
        text: '🔬 这个实验我们来探究串联电路！\n\n注意看：两个灯泡和电流表是依次连接的——这就是串联。',
        next: 'prompt-switch'
      },
      'prompt-switch': {
        type: 'message',
        text: '先闭合开关，观察两个灯泡的亮度有什么不同。',
        next: 'check-switch'
      },
      'check-switch': {
        type: 'check',
        condition: { key: 'switch_on', value: true },
        waitText: '👆 点击开关闭合电路。',
        passNext: 'observe'
      },
      'observe': {
        type: 'question',
        text: '观察两个灯泡的亮度，它们一样亮吗？',
        options: [
          { id: 'different', text: '不一样亮，电阻大的更暗', correct: true },
          { id: 'same', text: '一样亮', correct: false }
        ],
        correctNext: 'explain-brightness',
        wrongNext: 'explain-brightness-wrong'
      },
      'explain-brightness-wrong': {
        type: 'message',
        text: '🔍 仔细观察灯泡的发光效果——L₁ 和 L₂ 的亮度是不同的。\n\n这是因为它们的电阻不同（L₁=10Ω，L₂=15Ω），在串联电路中，电阻大的灯泡分到更多的电压，但功率不一定更大……让我们来分析。',
        next: 'explain-brightness'
      },
      'explain-brightness': {
        type: 'message',
        text: '📊 串联电路的关键特点：\n\n1. 电流处处相等：I = I₁ = I₂\n2. 总电压等于各部分电压之和：U = U₁ + U₂\n3. 电阻越大，分到的电压越多\n\n看看电流表的读数——这个电流在电路中每个位置都一样大！',
        next: 'q-current'
      },
      'q-current': {
        type: 'question',
        text: '如果把电流表移到两个灯泡之间，读数会变化吗？',
        options: [
          { id: 'no-change', text: '不会变化，串联电路中电流处处相等', correct: true },
          { id: 'change', text: '会变小，因为经过灯泡消耗了', correct: false }
        ],
        correctNext: 'end-success',
        wrongNext: 'explain-current'
      },
      'explain-current': {
        type: 'message',
        text: '💡 这是一个常见的错误认知！电流不会被"消耗"。\n\n想象一下水管中的水流——水流过水轮机时，水轮机转动做功，但水本身并没有减少，只是压力降低了。\n\n同样，电流经过灯泡时，电能转化为光和热，但电流大小不变！',
        next: 'end-success'
      },
      'end-success': {
        type: 'end',
        text: '🎉 串联电路实验完成！核心知识点：\n\n• 串联电路只有一条电流路径\n• 电流处处相等：I = I₁ = I₂\n• 总电压 = 各部分电压之和\n• 电阻越大，分到的电压越多\n• 任一开关断开，整个电路断路'
      }
    }
  },
  
  'parallel-circuit': {
    id: 'parallel-circuit',
    name: '并联电路',
    startNode: 'welcome',
    nodes: {
      'welcome': {
        type: 'message',
        text: '🔬 现在来探究并联电路！\n\n注意看：两个灯泡不是排队连接，而是各自独立连接在电源两端——这就是并联。',
        next: 'prompt-switch'
      },
      'prompt-switch': {
        type: 'message',
        text: '闭合开关，观察两个灯泡。',
        next: 'check-switch'
      },
      'check-switch': {
        type: 'check',
        condition: { key: 'switch_on', value: true },
        waitText: '👆 点击开关闭合电路。',
        passNext: 'observe'
      },
      'observe': {
        type: 'question',
        text: '并联电路中，每个灯泡两端的电压是怎样的？',
        options: [
          { id: 'same', text: '相等，都等于电源电压', correct: true },
          { id: 'divided', text: '电压被平分', correct: false }
        ],
        correctNext: 'explain-parallel',
        wrongNext: 'explain-parallel-wrong'
      },
      'explain-parallel-wrong': {
        type: 'message',
        text: '🤔 并联不是"平分电压"哦！\n\n并联电路中，每个支路直接连接在电源两端，所以每个支路的电压都等于电源电压。',
        next: 'explain-parallel'
      },
      'explain-parallel': {
        type: 'message',
        text: '📊 并联电路的关键特点：\n\n1. 各支路电压相等：U = U₁ = U₂\n2. 总电流等于各支路电流之和：I = I₁ + I₂\n3. 电阻越小的支路，电流越大\n4. 各支路互不影响',
        next: 'end-success'
      },
      'end-success': {
        type: 'end',
        text: '🎉 并联电路实验完成！核心知识点：\n\n• 并联电路有多条电流路径\n• 各支路电压相等\n• 总电流 = 各支路电流之和\n• 各支路独立工作，互不影响'
      }
    }
  },
  
  'ohm-law': {
    id: 'ohm-law',
    name: '欧姆定律',
    startNode: 'welcome',
    nodes: {
      'welcome': {
        type: 'message',
        text: '🔬 这个实验我们来验证欧姆定律！\n\n电路中有一个定值电阻和一个滑动变阻器，通过调节变阻器来改变电路中的电流。',
        next: 'prompt-switch'
      },
      'prompt-switch': {
        type: 'message',
        text: '先闭合开关，然后试着调节滑动变阻器（点击变阻器），观察电流表的变化。',
        next: 'check-switch'
      },
      'check-switch': {
        type: 'check',
        condition: { key: 'switch_on', value: true },
        waitText: '👆 点击开关闭合电路。',
        passNext: 'observe'
      },
      'observe': {
        type: 'message',
        text: '💡 注意观察：当你调节变阻器时，电路的总电阻在变化，电流也随之变化。\n\n这就是欧姆定律的核心：I = U/R\n\n电压不变时，电阻增大→电流减小！',
        next: 'q-formula'
      },
      'q-formula': {
        type: 'question',
        text: '欧姆定律的公式是？',
        options: [
          { id: 'correct', text: 'I = U/R（电流=电压÷电阻）', correct: true },
          { id: 'wrong1', text: 'U = I/R', correct: false },
          { id: 'wrong2', text: 'R = U × I', correct: false }
        ],
        correctNext: 'end-success',
        wrongNext: 'explain-formula'
      },
      'explain-formula': {
        type: 'message',
        text: '📝 欧姆定律：I = U/R\n\n三种变形：\n• I = U/R  →  已知电压和电阻，求电流\n• U = IR  →  已知电流和电阻，求电压\n• R = U/I  →  已知电压和电流，求电阻\n\n这是整个电学最重要的公式！',
        next: 'end-success'
      },
      'end-success': {
        type: 'end',
        text: '🎉 欧姆定律实验完成！\n\n核心公式：I = U/R\n\n记住：电压是"推力"，电阻是"阻力"，电流是"结果"。推力越大、阻力越小，电流就越大！'
      }
    }
  },
  
  'measure-power': {
    id: 'measure-power',
    name: '测量电功率',
    startNode: 'welcome',
    nodes: {
      'welcome': {
        type: 'message',
        text: '🔬 这个实验我们来测量小灯泡的电功率！\n\n电功率 = 电压 × 电流（P = UI）\n\n通过调节变阻器，我们可以改变灯泡两端的电压，观察功率变化。',
        next: 'prompt-switch'
      },
      'prompt-switch': {
        type: 'message',
        text: '闭合开关后，观察灯泡的亮度变化。',
        next: 'check-switch'
      },
      'check-switch': {
        type: 'check',
        condition: { key: 'switch_on', value: true },
        waitText: '👆 点击开关闭合电路。',
        passNext: 'observe'
      },
      'observe': {
        type: 'message',
        text: '💡 观察灯泡亮度：\n\n• 变阻器阻值大 → 灯泡暗（功率小）\n• 变阻器阻值小 → 灯泡亮（功率大）\n• 调到额定电压时 → 正常亮度（额定功率）\n\n功率越大，灯泡越亮！',
        next: 'end-success'
      },
      'end-success': {
        type: 'end',
        text: '🎉 电功率实验完成！\n\n• P = UI = I²R = U²/R\n• 额定功率：灯泡正常工作时的功率\n• 实际功率随电压变化\n• 灯泡亮度取决于实际功率'
      }
    }
  },
  
  'joule-law': {
    id: 'joule-law',
    name: '焦耳定律',
    startNode: 'welcome',
    nodes: {
      'welcome': {
        type: 'message',
        text: '🔬 焦耳定律实验！\n\n两个不同阻值的电阻串联，通过相同的电流。哪个电阻产热更多？',
        next: 'prompt-switch'
      },
      'prompt-switch': {
        type: 'message',
        text: '闭合开关，观察两个电阻的发热情况。',
        next: 'check-switch'
      },
      'check-switch': {
        type: 'check',
        condition: { key: 'switch_on', value: true },
        waitText: '👆 点击开关闭合电路。',
        passNext: 'q-heat'
      },
      'q-heat': {
        type: 'question',
        text: '串联电路中，R₁=5Ω 和 R₂=10Ω，哪个产热更多？',
        options: [
          { id: 'r2', text: 'R₂更多，因为Q=I²Rt，电阻大产热多', correct: true },
          { id: 'r1', text: 'R₁更多', correct: false },
          { id: 'same', text: '一样多', correct: false }
        ],
        correctNext: 'end-success',
        wrongNext: 'explain-heat'
      },
      'explain-heat': {
        type: 'message',
        text: '💡 焦耳定律：Q = I²Rt\n\n串联电路中电流 I 处处相等，时间 t 也相同。\n所以 Q₁/Q₂ = R₁/R₂\n\n电阻大的，产热更多！这就是为什么电热丝要用高电阻材料。',
        next: 'end-success'
      },
      'end-success': {
        type: 'end',
        text: '🎉 焦耳定律实验完成！\n\n• Q = I²Rt\n• 串联时，电阻大的产热更多\n• 并联时，电阻小的产热更多（因为电流大）\n• 应用：电热水壶、电暖器都利用焦耳定律'
      }
    }
  }
};

export function getDialogTree(id) {
  return DIALOG_TREES[id] || null;
}
