/**
 * AIGP 物理实验室 — 知识百科页面 v2
 * 增强公式渲染 + 生活实例 + 关联实验跳转 + 搜索高亮 + 掌握度标签
 */

import { masteryColor } from '../js/utils.js';
import { getAllMastery } from '../js/storage.js';

/* 生活实例数据库 */
const LIFE_EXAMPLES = {
  'ch14-s1-what-is-electricity': [
    { icon: '🧥', text: '冬天脱毛衣时噼啪作响 — 摩擦起电，衣物间电子转移产生静电' },
    { icon: '⚡', text: '门把手电到手 — 身体带电荷，接触金属导体时瞬间放电' },
    { icon: '🎈', text: '气球摩擦头发后贴在墙上 — 气球带负电荷，吸引墙面正电荷' }
  ],
  'ch14-s2-light-the-bulb': [
    { icon: '🔦', text: '手电筒：电池+开关+灯泡+导线 = 最简单的完整电路' },
    { icon: '💡', text: '房间开灯：按下开关→闭合通路→电流流过→灯丝发光' },
    { icon: '⚠️', text: '不要用铁丝连接电池两极 — 这就是短路，会烧手！' }
  ],
  'ch14-s3-series-parallel': [
    { icon: '🎄', text: '老式串灯：一个灯泡坏了全串都灭 — 典型串联' },
    { icon: '🏠', text: '家里各房间灯独立控制 — 典型并联电路' },
    { icon: '🔋', text: '遥控器里两节电池头尾相连 — 电池串联，电压叠加' }
  ],
  'ch14-s4-series-parallel-current': [
    { icon: '🚿', text: '一条水管分两个喷头 — 总水流=两个喷头水流之和（并联电流）' },
    { icon: '🏞️', text: '河流不会越流越少 — 串联电路电流处处相等的生活类比' },
    { icon: '🔌', text: '用万用表测量串联灯泡：每个位置电流读数相同' }
  ],
  'ch14-s5-measure-voltage': [
    { icon: '🔋', text: '干电池1.5V、手机锂电池3.7V、家庭电压220V — 常见电压值' },
    { icon: '📏', text: '电压表必须并联：就像量一段水管两头的水压差' },
    { icon: '⚡', text: '人体安全电压≤36V，大于36V就可能致命' }
  ],
  'ch15-s1-resistance-rheostat': [
    { icon: '🎚️', text: '调光台灯的旋钮 — 就是一个变阻器，改变电阻丝的有效长度' },
    { icon: '🎸', text: '吉他调音：按住不同品位改变弦的振动长度 — 类似变阻器原理' },
    { icon: '🔥', text: '铜导线比铁丝导电好 — 材料不同，电阻率不同' }
  ],
  'ch15-s2-ohm-law': [
    { icon: '🚰', text: '水压越大，水管不变时水流越大 — I=U/R 的生活类比' },
    { icon: '🏔️', text: '同样的坡度，路越窄（R大）车流越小（I小）' },
    { icon: '📱', text: '充电器输出5V/2A → 手机内部等效电阻 R=5/2=2.5Ω' }
  ],
  'ch15-s3-va-method': [
    { icon: '🔬', text: '物理课必做实验：用电压表和电流表测定值电阻' },
    { icon: '📊', text: '多次测量取平均值 — 减小误差的基本方法' },
    { icon: '🛡️', text: '实验前变阻器调到最大 — 保护电路的"安全第一"操作' }
  ],
  'ch15-s4-series-parallel-resistance': [
    { icon: '🚗', text: '串联≈堵车的路：越多红绿灯（电阻）总通行时间越长' },
    { icon: '🛣️', text: '并联≈多条车道：车道越多，总通行阻力越小' },
    { icon: '💡', text: '两个100Ω并联=50Ω，比任何一个都小！' }
  ],
  'ch15-s5-home-electricity': [
    { icon: '🏠', text: '家里各电器互不影响 — 家庭电路是并联的' },
    { icon: '🔌', text: '插线板别插太多大功率电器 — 总电流过大会跳闸' },
    { icon: '🧯', text: '湿手不要碰开关 — 水能导电，降低人体电阻很危险' }
  ],
  'ch16-s1-electric-work': [
    { icon: '📱', text: '给手机充电1小时用了多少电？P×t = 5W×1h = 5W·h' },
    { icon: '💰', text: '电费按"度"算：1度=1kW·h=3.6×10⁶J' },
    { icon: '🔢', text: '电表读数12345.6，下月12456.8 → 用了111.2度电' }
  ],
  'ch16-s2-electric-power-rate': [
    { icon: '💡', text: '60W灯泡比40W亮 — 功率越大，消耗电能越快' },
    { icon: '🍳', text: '电磁炉2000W、手机充电5W — 功率差400倍！' },
    { icon: '⚡', text: '灯泡标"220V 60W"表示在220V下正常工作功率60W' }
  ],
  'ch16-s3-measure-power': [
    { icon: '🔬', text: '海南中考必考实验！测量小灯泡在不同电压下的功率' },
    { icon: '📐', text: 'P=UI，分别读出电压表和电流表数值再相乘' },
    { icon: '💡', text: '灯泡变暗→实际电压低于额定电压→实际功率<额定功率' }
  ],
  'ch16-s4-joule-law': [
    { icon: '🔥', text: '电暖器发热 — 电流通过电热丝，Q=I²Rt 产生热量' },
    { icon: '🍞', text: '烤面包机：高阻值电热丝串联，电阻大的地方更热' },
    { icon: '💥', text: '电线过热起火 — 电流太大，I²Rt产热超过散热能力' }
  ],
  'ch17-s1-what-is-magnetism': [
    { icon: '🧭', text: '指南针N极指北 — 地磁场中磁力线从南极到北极（地球内部）' },
    { icon: '🧲', text: '冰箱贴 — 永磁体吸在铁质冰箱门上' },
    { icon: '🗑️', text: '磁铁不能吸铝罐 — 铝是非磁性材料' }
  ],
  'ch17-s2-magnetic-field-of-current': [
    { icon: '📱', text: '手机扬声器 — 通电线圈在磁场中振动发声' },
    { icon: '🔔', text: '电铃：通电时电磁铁吸引铁片，断电弹回，反复振动发声' },
    { icon: '🏭', text: '废钢铁厂用电磁起重机 — 通电有磁性，断电释放' }
  ],
  'ch17-s3-motor': [
    { icon: '🚇', text: '电动地铁、电动汽车 — 电动机是动力核心' },
    { icon: '🌀', text: '电风扇：通电→线圈在磁场中受力→旋转→产生风' },
    { icon: '🧲', text: '换向器让线圈持续单方向转动，否则会来回摆动' }
  ],
  'ch18-s1-electricity-generation': [
    { icon: '💨', text: '海南风力发电：风→叶片转→发电机转→产生电能' },
    { icon: '☀️', text: '太阳能板：光能直接转化为电能，海南日照充足' },
    { icon: '🌊', text: '三峡水电站：水的势能→动能→电能' }
  ],
  'ch18-s2-electromagnetic-induction': [
    { icon: '🎸', text: '电吉他拾音器：弦振动切割磁力线→产生微弱电流→声音信号' },
    { icon: '🚲', text: '自行车车灯发电机：轮子带动线圈在磁场中转→发电' },
    { icon: '🔋', text: '手摇充电器：摇动手柄→转子切割磁力线→给手机充电' }
  ],
  'ch18-s3-power-transmission': [
    { icon: '🏗️', text: '高压电塔上写"35kV/110kV/220kV" — 变压器升高电压远距离输电' },
    { icon: '📦', text: '小区变压器把10kV降到220V — 降压变压器' },
    { icon: '💡', text: '为什么用高压？I小了→I²R线路损耗就小了→省电' }
  ]
};

export class WikiPage {
  constructor(app) {
    this.app = app;
    this.currentKnowledgeId = null;
    this.searchQuery = '';
    this.masteryMap = new Map();
  }
  
  async init() {
    const mastery = await getAllMastery();
    this.masteryMap = new Map(mastery.map(m => [m.knowledgeId, m.score]));
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
      { id: 14, name: '第14章 了解电路', emoji: '⚡', color: '#4a9eff' },
      { id: 15, name: '第15章 探究电路', emoji: '🔍', color: '#a855f7' },
      { id: 16, name: '第16章 电流做功与电功率', emoji: '💡', color: '#ff8c00' },
      { id: 17, name: '第17章 从指南针到磁悬浮列车', emoji: '🧲', color: '#ff6b9d' },
      { id: 18, name: '第18章 电能从哪里来', emoji: '🔋', color: '#00ff88' }
    ];
    
    sidebar.innerHTML = `
      <div class="wiki-search-wrap">
        <input type="text" class="wiki-search" placeholder="🔍 搜索知识点、公式、关键词..." id="wiki-search">
        <div class="wiki-search-hint" id="wiki-search-hint" style="display:none"></div>
      </div>
      <div class="wiki-overview-card">
        <div class="wiki-ov-title">📘 沪科版 · 电学（5章20节）</div>
        <div class="wiki-ov-stats">
          <span>已学 <b style="color:var(--accent-yellow)">${Array.from(this.masteryMap.values()).filter(v => v > 0).length}</b></span>
          <span>已掌握 <b style="color:var(--accent-green)">${Array.from(this.masteryMap.values()).filter(v => v >= 80).length}</b></span>
        </div>
      </div>
      ${chapters.map(ch => {
        const sections = tree.filter(n => n.chapter === ch.id);
        const chMastery = sections.length > 0 
          ? Math.round(sections.reduce((s, sec) => s + (this.masteryMap.get(sec.id) || 0), 0) / sections.length) 
          : 0;
        return `
          <div class="wiki-chapter">
            <div class="wiki-chapter-title" data-chapter="${ch.id}">
              <span style="color:${ch.color}">${ch.emoji}</span>
              <span>${ch.name}</span>
              <span class="wiki-ch-mastery" style="color:${masteryColor(chMastery)}">${chMastery}%</span>
            </div>
            <div class="wiki-section-list" id="wiki-ch-${ch.id}">
              ${sections.map(sec => {
                const score = this.masteryMap.get(sec.id) || 0;
                return `
                  <button class="wiki-section-item" data-id="${sec.id}">
                    <span class="wiki-sec-dot" style="background:${masteryColor(score)}"></span>
                    <span class="wiki-sec-name">§${sec.section} ${sec.name}</span>
                    ${sec.examWeight >= 8 ? '<span class="wiki-sec-badge">🔥</span>' : ''}
                    <span class="wiki-sec-score" style="color:${masteryColor(score)}">${score}%</span>
                  </button>
                `;
              }).join('')}
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
          sectionEl.classList.toggle('wiki-ch-collapsed');
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
    const searchInput = document.getElementById('wiki-search');
    const searchHint = document.getElementById('wiki-search-hint');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      const tree2 = this.app.data.knowledgeTree || [];
      let matchCount = 0;
      
      sidebar.querySelectorAll('.wiki-section-item').forEach(btn => {
        const id = btn.dataset.id;
        const node = tree2.find(n => n.id === id);
        let match = !this.searchQuery;
        if (this.searchQuery && node) {
          const text = [node.name, node.description, ...(node.formulas || []), ...(node.keyPoints || [])].join(' ').toLowerCase();
          match = text.includes(this.searchQuery);
        }
        btn.style.display = match ? '' : 'none';
        if (match && this.searchQuery) matchCount++;
      });
      
      // 展开有匹配的章节
      if (this.searchQuery) {
        sidebar.querySelectorAll('.wiki-section-list').forEach(list => {
          const hasVisible = Array.from(list.querySelectorAll('.wiki-section-item')).some(el => el.style.display !== 'none');
          list.classList.toggle('wiki-ch-collapsed', !hasVisible);
        });
        if (searchHint) {
          searchHint.style.display = 'block';
          searchHint.textContent = `找到 ${matchCount} 个知识点`;
        }
      } else {
        sidebar.querySelectorAll('.wiki-section-list').forEach(list => list.classList.remove('wiki-ch-collapsed'));
        if (searchHint) searchHint.style.display = 'none';
      }
    });
  }
  
  showKnowledge(knowledgeId) {
    this.currentKnowledgeId = knowledgeId;
    const tree = this.app.data.knowledgeTree || [];
    const node = tree.find(n => n.id === knowledgeId);
    if (!node) return;
    
    const content = document.querySelector('.wiki-content');
    if (!content) return;
    
    const score = this.masteryMap.get(knowledgeId) || 0;
    const mColor = masteryColor(score);
    
    const chapterMeta = {
      14: { name: '了解电路', color: '#4a9eff', emoji: '⚡' },
      15: { name: '探究电路', color: '#a855f7', emoji: '🔍' },
      16: { name: '电流做功与电功率', color: '#ff8c00', emoji: '💡' },
      17: { name: '从指南针到磁悬浮列车', color: '#ff6b9d', emoji: '🧲' },
      18: { name: '电能从哪里来', color: '#00ff88', emoji: '🔋' }
    };
    const ch = chapterMeta[node.chapter] || {};
    
    const prevNode = this._getAdjacentNode(node, -1);
    const nextNode = this._getAdjacentNode(node, 1);
    const lifeExamples = LIFE_EXAMPLES[knowledgeId] || [];
    
    // 获取相关题目
    const relatedQuestions = (this.app.data.questions || []).filter(q => q.knowledgeId === knowledgeId);
    
    // 获取前置知识
    const prereqNodes = (node.prerequisites || []).map(pid => tree.find(n => n.id === pid)).filter(Boolean);
    // 获取后续知识
    const nextNodes = tree.filter(n => (n.prerequisites || []).includes(knowledgeId));
    
    const highlight = (text) => {
      if (!this.searchQuery) return text;
      const re = new RegExp(`(${this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(re, '<mark class="wiki-highlight">$1</mark>');
    };
    
    content.innerHTML = `
      <div class="knowledge-detail-v2">
        <!-- 头部 -->
        <div class="kd-header">
          <div class="kd-breadcrumb">
            <span style="color:${ch.color}">${ch.emoji} 第${node.chapter}章 ${ch.name}</span>
            <span style="color:var(--text-muted)">›</span>
            <span>第${node.section}节</span>
          </div>
          <h2 class="kd-title">${highlight(node.name)}</h2>
          <div class="kd-meta-row">
            <span class="kd-mastery-badge" style="background:${mColor}20;color:${mColor};border:1px solid ${mColor}40">
              掌握度 ${score}%
            </span>
            <span class="kd-diff-badge">
              ${'🔥'.repeat(node.difficulty || 1)} 难度${node.difficulty}
            </span>
            <span class="kd-exam-badge" style="${node.examWeight >= 8 ? 'background:rgba(255,140,0,0.15);color:#ff8c00' : ''}">
              ⭐ 中考权重 ${node.examWeight}/10
              ${node.examWeight >= 8 ? ' · 高频考点' : ''}
            </span>
          </div>
          <!-- 掌握度进度条 -->
          <div class="kd-mastery-bar">
            <div class="kd-mastery-fill" style="width:${score}%;background:linear-gradient(90deg,${mColor}88,${mColor})"></div>
          </div>
        </div>
        
        <!-- 知识概要 -->
        <div class="kd-section">
          <h3>📖 知识概要</h3>
          <p class="kd-desc">${highlight(node.description)}</p>
        </div>
        
        <!-- 核心公式 -->
        ${node.formulas && node.formulas.length > 0 ? `
          <div class="kd-section">
            <h3>📐 核心公式</h3>
            <div class="kd-formula-grid">
              ${node.formulas.map(f => `
                <div class="kd-formula-card">
                  <div class="kd-formula-text">${highlight(f)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- 要点精析 -->
        ${node.keyPoints && node.keyPoints.length > 0 ? `
          <div class="kd-section">
            <h3>🎯 要点精析</h3>
            <div class="kd-points">
              ${node.keyPoints.map((p, i) => `
                <div class="kd-point-item">
                  <span class="kd-point-num">${i + 1}</span>
                  <span>${highlight(p)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- 易错提醒 -->
        ${node.commonMistakes && node.commonMistakes.length > 0 ? `
          <div class="kd-section kd-section-warn">
            <h3>⚠️ 易错提醒</h3>
            <div class="kd-mistakes">
              ${node.commonMistakes.map(m => `
                <div class="kd-mistake-item">
                  <span class="kd-mistake-icon">✗</span>
                  <span>${highlight(m)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- 生活实例 -->
        ${lifeExamples.length > 0 ? `
          <div class="kd-section kd-section-life">
            <h3>🌍 生活中的物理</h3>
            <div class="kd-life-examples">
              ${lifeExamples.map(ex => `
                <div class="kd-life-item">
                  <span class="kd-life-icon">${ex.icon}</span>
                  <span class="kd-life-text">${highlight(ex.text)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- 知识网络 -->
        ${(prereqNodes.length > 0 || nextNodes.length > 0) ? `
          <div class="kd-section">
            <h3>🔗 知识网络</h3>
            <div class="kd-network">
              ${prereqNodes.length > 0 ? `
                <div class="kd-net-group">
                  <span class="kd-net-label">前置知识</span>
                  <div class="kd-net-items">
                    ${prereqNodes.map(pn => {
                      const ps = this.masteryMap.get(pn.id) || 0;
                      return `<button class="kd-net-link" data-kid="${pn.id}" style="border-color:${masteryColor(ps)}40">
                        <span style="color:${masteryColor(ps)}">§${pn.section}</span> ${pn.name}
                        <span class="kd-net-score" style="color:${masteryColor(ps)}">${ps}%</span>
                      </button>`;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
              ${nextNodes.length > 0 ? `
                <div class="kd-net-group">
                  <span class="kd-net-label">后续知识</span>
                  <div class="kd-net-items">
                    ${nextNodes.map(nn => {
                      const ns = this.masteryMap.get(nn.id) || 0;
                      return `<button class="kd-net-link" data-kid="${nn.id}" style="border-color:${masteryColor(ns)}40">
                        <span style="color:${masteryColor(ns)}">§${nn.section}</span> ${nn.name}
                        <span class="kd-net-score" style="color:${masteryColor(ns)}">${ns}%</span>
                      </button>`;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <!-- 关联题目 -->
        ${relatedQuestions.length > 0 ? `
          <div class="kd-section">
            <h3>📝 练练手（${relatedQuestions.length}道题）</h3>
            <div class="kd-quiz-preview">
              ${relatedQuestions.slice(0, 2).map((q, i) => `
                <div class="kd-quiz-item">
                  <span class="kd-quiz-num">${i + 1}</span>
                  <span class="kd-quiz-text">${q.question.slice(0, 50)}${q.question.length > 50 ? '...' : ''}</span>
                  <span class="kd-quiz-diff">${'🔥'.repeat(q.difficulty)}</span>
                </div>
              `).join('')}
              <button class="btn-sm kd-go-practice" id="wiki-go-practice" style="margin-top:8px;width:100%">
                📝 开始练习（${relatedQuestions.length}道）
              </button>
            </div>
          </div>
        ` : ''}
        
        <!-- 操作按钮 -->
        <div class="kd-actions">
          ${node.experimentIds && node.experimentIds.length > 0 ? `
            <button class="btn-sm primary kd-action-btn" id="wiki-go-exp" data-exp="${node.experimentIds[0]}">
              🔬 进入仿真实验
            </button>
          ` : ''}
          <button class="btn-sm kd-action-btn" id="wiki-go-assess">
            📊 查看评估报告
          </button>
          <button class="btn-sm kd-action-btn" id="wiki-go-map">
            🗺️ 在知识图谱中查看
          </button>
        </div>
        
        <!-- 前后导航 -->
        <div class="wiki-nav-v2">
          <button class="wiki-nav-btn" ${prevNode ? `id="wiki-prev" data-id="${prevNode.id}"` : 'disabled'}>
            ${prevNode ? `<span class="wiki-nav-dir">← 上一节</span><span class="wiki-nav-name">${prevNode.name}</span>` : '<span class="wiki-nav-dir">已是第一节</span>'}
          </button>
          <button class="wiki-nav-btn" ${nextNode ? `id="wiki-next" data-id="${nextNode.id}"` : 'disabled'}>
            ${nextNode ? `<span class="wiki-nav-dir">下一节 →</span><span class="wiki-nav-name">${nextNode.name}</span>` : '<span class="wiki-nav-dir">已是最后一节</span>'}
          </button>
        </div>
      </div>
    `;
    
    // 绑定事件
    document.getElementById('wiki-go-exp')?.addEventListener('click', (e) => {
      this.app.goToExperiment(e.currentTarget.dataset.exp);
    });
    document.getElementById('wiki-prev')?.addEventListener('click', (e) => {
      this.showKnowledge(e.currentTarget.dataset.id);
    });
    document.getElementById('wiki-next')?.addEventListener('click', (e) => {
      this.showKnowledge(e.currentTarget.dataset.id);
    });
    document.getElementById('wiki-go-assess')?.addEventListener('click', () => {
      this.app._switchPage('assess');
    });
    document.getElementById('wiki-go-map')?.addEventListener('click', () => {
      this.app._switchPage('map');
    });
    document.getElementById('wiki-go-practice')?.addEventListener('click', () => {
      this.app._switchPage('assess');
      setTimeout(() => {
        if (this.app.pages.assess?.startQuiz) {
          this.app.pages.assess.startQuiz([knowledgeId]);
        }
      }, 200);
    });
    
    // 知识网络链接
    content.querySelectorAll('.kd-net-link').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showKnowledge(btn.dataset.kid);
      });
    });
    
    // 高亮侧边栏
    document.querySelectorAll('.wiki-section-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === knowledgeId);
    });
    
    // 滚到顶部
    content.scrollTop = 0;
  }
  
  _getAdjacentNode(current, offset) {
    const tree = this.app.data.knowledgeTree || [];
    const idx = tree.findIndex(n => n.id === current.id);
    const targetIdx = idx + offset;
    return targetIdx >= 0 && targetIdx < tree.length ? tree[targetIdx] : null;
  }
}
