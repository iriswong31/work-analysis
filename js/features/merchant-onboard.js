// ========== 商家入驻 + 配券一条龙 功能模块 ==========
// 标准功能模块接口：{ id, name, icon, description, scenarios, ... }

const MerchantOnboard = {
  // 商户截图数据
  screenshotData: {
    shopName: '状元甲·宴(深圳湾店)',
    category: '特色菜 · 粤菜',
    rating: '4.9',
    ratingDetail: '口味4.9 / 环境4.9 / 服务4.9',
    reviewCount: '2305条评价',
    avgPrice: '¥175/人',
    address: '南山区创业路1777号海信南方大厦1楼底商',
    metro: '距地铁13号线人才公园站C口步行340m',
    hours: '11:00-14:00, 17:00-21:30',
    facilities: '有停车场、有包间、7-10人桌、有宴会厅',
    rank: '南山区特色菜口味榜 · 第1名',
    photos: '已从截图获取门脸照',
  },

  mockScreenshotSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="280" viewBox="0 0 160 280">
      <rect width="160" height="280" rx="12" fill="#FFF"/>
      <rect y="0" width="160" height="60" fill="#f8e8e0"/>
      <rect x="10" y="8" width="60" height="44" rx="4" fill="#ddd"/>
      <rect x="76" y="8" width="60" height="44" rx="4" fill="#ddd"/>
      <text x="14" y="36" font-size="8" fill="#999">📸 门脸照片</text>
      <rect x="10" y="66" width="140" height="18" rx="2" fill="none"/>
      <text x="10" y="80" font-size="11" font-weight="bold" fill="#333">状元甲·宴(深圳湾店)</text>
      <text x="10" y="96" font-size="8" fill="#FF8C00">★★★★★ 4.9</text>
      <text x="60" y="96" font-size="8" fill="#999">2305条</text>
      <text x="110" y="96" font-size="8" fill="#333">¥175/人</text>
      <text x="10" y="112" font-size="7" fill="#999">口味4.9  环境4.9  服务4.9</text>
      <text x="100" y="112" font-size="7" fill="#666">特色菜</text>
      <rect x="10" y="120" width="60" height="14" rx="7" fill="#FFF3E0"/>
      <text x="14" y="130" font-size="7" fill="#E65100">南山区口味榜·第1名</text>
      <line x1="10" y1="140" x2="150" y2="140" stroke="#eee"/>
      <text x="10" y="155" font-size="8" fill="#4CAF50">营业中</text>
      <text x="32" y="155" font-size="7" fill="#666">11:00-14:00, 17:00-21:30</text>
      <rect x="10" y="162" width="36" height="12" rx="6" fill="#F5F5F5"/>
      <text x="14" y="171" font-size="6" fill="#999">停车场</text>
      <rect x="50" y="162" width="30" height="12" rx="6" fill="#F5F5F5"/>
      <text x="54" y="171" font-size="6" fill="#999">包间</text>
      <rect x="84" y="162" width="42" height="12" rx="6" fill="#F5F5F5"/>
      <text x="88" y="171" font-size="6" fill="#999">7-10人桌</text>
      <line x1="10" y1="182" x2="150" y2="182" stroke="#eee"/>
      <text x="10" y="197" font-size="7" fill="#333">南山区创业路1777号</text>
      <text x="10" y="209" font-size="7" fill="#333">海信南方大厦1楼底商</text>
      <text x="10" y="224" font-size="6" fill="#999">距地铁13号线人才公园站C口340m</text>
      <line x1="10" y1="236" x2="150" y2="236" stroke="#eee"/>
      <rect x="10" y="244" width="40" height="24" rx="4" fill="#FFF3E0"/>
      <text x="18" y="259" font-size="8" fill="#E65100">优惠</text>
      <rect x="56" y="244" width="40" height="24" rx="4" fill="#F5F5F5"/>
      <text x="60" y="259" font-size="8" fill="#666">推荐菜</text>
      <rect x="102" y="244" width="48" height="24" rx="4" fill="#F5F5F5"/>
      <text x="106" y="259" font-size="8" fill="#666">评价2305</text>
    </svg>`;
  }
};

// ===== 活动配置模板 =====
const merchantOnboardActivityConfigs = {
  lunch: {
    icon: '🍲',
    name: '爱心午餐 · 暖心行动',
    cardType: '帮帮卡',
    fields: [
      { id: 'act_name', label: '活动名称', value: '爱心午餐 · 暖心行动', type: 'text' },
      { id: 'act_merchant', label: '合作商户', value: null, type: 'text', readonly: true },
      { id: 'act_group', label: '服务人群', value: '环卫工人、外卖骑手', type: 'select', options: ['环卫工人、外卖骑手', '社区低保户', '残疾人士', '高龄独居老人', '环卫工人、外卖骑手、社区低保户'] },
      { id: 'act_content', label: '资助内容', value: '特价午餐套餐（关爱价30元/份）', type: 'text' },
      { id: 'act_daily', label: '每日限量', value: '20', type: 'number' },
      { id: 'act_months', label: '活动时长', value: '3个月', type: 'select', options: ['1个月', '2个月', '3个月', '6个月', '12个月'] },
      { id: 'act_period', label: '活动时段', value: '11:00-14:00（午餐时段）', type: 'select', options: ['11:00-14:00（午餐时段）', '11:00-14:00 & 17:00-21:00（午晚餐）', '全天营业时段'] },
      { id: 'act_address', label: '核销地点', value: null, type: 'text', readonly: true },
    ],
    computeSummary: (fields) => {
      const daily = parseInt(fields.act_daily) || 20;
      const monthsStr = fields.act_months || '3个月';
      const months = parseInt(monthsStr) || 3;
      const days = months * 30;
      const total = daily * days;
      const budget = total * 30;
      return { total, budget, days, daily, months };
    }
  },
  elder: {
    icon: '🎂',
    name: '长者暖心宴 · 关爱行动',
    cardType: '关爱卡',
    fields: [
      { id: 'act_name', label: '活动名称', value: '长者暖心宴 · 关爱行动', type: 'text' },
      { id: 'act_merchant', label: '合作商户', value: null, type: 'text', readonly: true },
      { id: 'act_group', label: '服务人群', value: '社区孤寡老人（65岁以上）', type: 'select', options: ['社区孤寡老人（65岁以上）', '社区孤寡老人（70岁以上）', '社区高龄独居老人', '低保老人'] },
      { id: 'act_content', label: '资助内容', value: '每月一次免费聚餐（含粤式点心+暖汤）', type: 'text' },
      { id: 'act_seats', label: '每次名额', value: '30', type: 'select', options: ['15', '20', '30', '50'] },
      { id: 'act_freq', label: '活动频次', value: '每月1次', type: 'select', options: ['每月1次', '每月2次', '每两周1次', '每周1次'] },
      { id: 'act_months', label: '持续时长', value: '6个月', type: 'select', options: ['3个月', '6个月', '12个月'] },
      { id: 'act_address', label: '活动地点', value: null, type: 'text', readonly: true },
    ],
    computeSummary: (fields) => {
      const seats = parseInt(fields.act_seats) || 30;
      const monthsStr = fields.act_months || '6个月';
      const months = parseInt(monthsStr) || 6;
      const freqStr = fields.act_freq || '每月1次';
      const freqMap = { '每月1次': 1, '每月2次': 2, '每两周1次': 2, '每周1次': 4 };
      const freq = freqMap[freqStr] || 1;
      const total = seats * freq * months;
      const budget = total * 175;
      return { total, budget, seats, months, freq, freqLabel: freqStr };
    }
  },
  student: {
    icon: '🎒',
    name: '爱心学生餐 · 帮帮行动',
    cardType: '帮帮卡',
    fields: [
      { id: 'act_name', label: '活动名称', value: '爱心学生餐 · 帮帮行动', type: 'text' },
      { id: 'act_merchant', label: '合作商户', value: null, type: 'text', readonly: true },
      { id: 'act_group', label: '服务人群', value: '困难家庭中小学生', type: 'select', options: ['困难家庭中小学生', '低保家庭学生', '留守儿童', '困难家庭中小学生+留守儿童'] },
      { id: 'act_content', label: '资助内容', value: '放学后营养加餐（每份补贴50元）', type: 'text' },
      { id: 'act_daily', label: '每日名额', value: '15', type: 'select', options: ['10', '15', '20', '30'] },
      { id: 'act_months', label: '活动时长', value: '3个月', type: 'select', options: ['1个月', '2个月', '3个月', '6个月', '12个月（一学年）'] },
      { id: 'act_period', label: '供餐时段', value: '16:30-18:00（放学后）', type: 'select', options: ['16:30-18:00（放学后）', '11:30-13:00（午餐）', '16:30-18:00 & 11:30-13:00'] },
      { id: 'act_address', label: '核销地点', value: null, type: 'text', readonly: true },
    ],
    computeSummary: (fields) => {
      const daily = parseInt(fields.act_daily) || 15;
      const monthsStr = fields.act_months || '3个月';
      const months = parseInt(monthsStr) || 3;
      const days = months * 22;
      const total = daily * days;
      const budget = total * 50;
      return { total, budget, days, daily, months };
    }
  }
};

// ===== 场景脚本 =====
const sd = MerchantOnboard.screenshotData;

const merchantOnboardScenarios = {
  // 全自动 Demo 流程
  'auto-demo': [
    // Step 1: 用户手动触发发送大众点评截图
    { type: 'wait-user-screenshot' },
    { type: 'thinking', delay: 800, thinkText: '📸 正在用 AI 视觉识别截图...' },
    { type: 'thinking', delay: 1200, thinkText: '🔍 提取商户名称、地址、评分等信息...' },
    {
      type: 'agent', delay: 400, text: '🎉 <b>截图识别完成！</b>从大众点评页面提取到以下信息：',
      extracted: {
        title: '✅ AI 视觉识别结果（7项信息）',
        items: [
          { s: '✅', label: '店铺名称', value: sd.shopName },
          { s: '✅', label: '经营类目', value: sd.category },
          { s: '✅', label: '门店地址', value: sd.address },
          { s: '✅', label: '营业时间', value: sd.hours },
          { s: '✅', label: '评分评价', value: `${sd.rating}分（${sd.reviewCount}）` },
          { s: '✅', label: '门店排名', value: sd.rank },
          { s: '✅', label: '交通位置', value: sd.metro },
        ]
      },
      afterContent: '\n\n只差 <b>3项</b> 平台必填信息就可以入驻了 👇\n\n💡 你可以直接告诉我，也可以<b>拍一张营业执照</b>，我帮你自动提取 📄',
      missingInfo: {
        title: '⚠️ 仅需补充以下信息',
        items: [
          { s: '❓', label: '店主/法人姓名', value: '（大众点评不显示）' },
          { s: '❓', label: '店主联系手机', value: '（用于商户登录）' },
          { s: '❓', label: '统一社会信用代码', value: '（营业执照上的18位编码）' },
        ]
      }
    },
    // Step 2: 用户手动触发发送营业执照截图
    { type: 'wait-user-license' },
    { type: 'thinking', delay: 800, thinkText: '📄 AI 识别营业执照中...' },
    { type: 'thinking', delay: 1000, thinkText: '🔍 提取法人信息、社会信用代码...' },
    {
      type: 'agent', delay: 400, text: '📄 <b>营业执照识别完成！</b>补充信息已提取：',
      extracted: {
        title: '✅ 营业执照 OCR 识别结果',
        items: [
          { s: '✅', label: '法人代表', value: '张伟' },
          { s: '✅', label: '联系手机', value: '138-0000-8888' },
          { s: '✅', label: '统一社会信用代码', value: '91440300MA5G8B2C1X' },
          { s: '✅', label: '注册资本', value: '500万人民币' },
          { s: '✅', label: '成立日期', value: '2018-06-15' },
          { s: '✅', label: '经营范围', value: '餐饮服务、食品经营' },
        ]
      },
      afterContent: '\n\n太好了！所有入驻信息已补齐 ✅ 请确认：\n<b>只上传了2张截图，AI自动提取了全部信息</b>',
      card: {
        rows: [
          { label: '🏪 店铺', value: sd.shopName },
          { label: '🍽️ 类目', value: sd.category },
          { label: '📍 地址', value: sd.address },
          { label: '⏰ 营业', value: sd.hours },
          { label: '⭐ 评分', value: `${sd.rating}分 · ${sd.rank}` },
          { label: '👤 法人', value: '张伟 / 138-0000-8888' },
          { label: '📄 信用代码', value: '91440300MA5G8B2C1X' },
        ]
      },
      confirm: true, confirmText: '✅ 确认提交入驻'
    },
    // Step 3: 等待用户手动点击确认按钮
    { type: 'wait-confirm' },
    // Step 4: 提交审核 + 办事员审批（后台静默处理，不展示工具调用）
    { type: 'thinking', delay: 1500, thinkText: '📋 正在提交入驻审核申请...' },
    { type: 'thinking', delay: 2500, thinkText: '⏳ 办事员正在后台审核商户资质...' },
    {
      type: 'agent', delay: 400,
      text: `🎉 好消息！<b>${sd.shopName}</b> 的入驻申请已经通过审核啦！\n\n✅ 审核结果：<b>通过</b>\n👤 审核人：办事员 李明\n📝 意见：资质齐全，大众点评高评分商户\n\n接下来，我根据这家店的特点，为你挑选了几个适合参与的关爱活动 🌸\n\n👇 <b>选择一个你想参与的活动</b>：`,
      dataUpdates: { merchants: [{ name: sd.shopName, type: '特色菜/粤菜', detail: '张伟 · 南山区创业路1777号' }], savedMinutes: 14 },
      activityRecommend: {
        title: '💡 智能推荐 · 适合这家店的关爱活动',
        items: [
          { icon: '🍲', name: '爱心午餐 · 帮帮卡', desc: '为环卫工人、外卖骑手提供工作日特价午餐，每天限量20份', tag: '推荐指数 ⭐⭐⭐⭐⭐', scenario: 'lunch' },
          { icon: '🎂', name: '长者暖心宴 · 关爱卡', desc: '为社区孤寡老人提供每月一次免费聚餐，含粤式点心和热汤', tag: '适合高端餐饮 · 有宴会厅', scenario: 'elder' },
          { icon: '🎒', name: '爱心学生餐 · 帮帮卡', desc: '为困难家庭学生提供放学后营养加餐，每份补贴50元', tag: '公益影响力大', scenario: 'student' },
        ]
      }
    },
    // Step 5: 等待用户手动点击选择活动（暂停，由用户点击卡片继续）
    { type: 'wait-activity' },
    { type: 'thinking', delay: 600, thinkText: '🎯 根据店铺特点生成活动配置方案...' },
    // Step 6: 活动配置表单（手动模式，用户自己修改每日限量，手动点确认）
    { type: 'activity-config' },
    { type: 'wait-config-confirm' },
    { type: 'thinking', delay: 800, thinkText: '🌸 正在为你配置关爱活动...' },
    // Step 7: 创建活动（静默完成）+ 展示活动详情卡片
    { type: 'activity-create-warm' },
    // 完成（不需要 final-summary）
  ],

  // 保留原来的场景供需要时使用
  screenshot: [
    { type: 'agent', delay: 400, text: '好的！请发一张商家的<b>大众点评截图</b>给我 📸\n\n在大众点评 App 打开店铺页 → 截图 → 发给我就行' },
    { type: 'wait-screenshot' },
    { type: 'thinking', delay: 800, thinkText: '📸 正在用 AI 视觉识别截图...' },
    { type: 'thinking', delay: 1200, thinkText: '🔍 提取商户名称、地址、电话...' },
    {
      type: 'agent', delay: 400, text: '🎉 <b>截图识别完成！</b>从大众点评页面提取到以下信息：',
      extracted: {
        title: '✅ AI 视觉识别结果（7项信息）',
        items: [
          { s: '✅', label: '店铺名称', value: sd.shopName },
          { s: '✅', label: '经营类目', value: sd.category },
          { s: '✅', label: '门店地址', value: sd.address },
          { s: '✅', label: '营业时间', value: sd.hours },
          { s: '✅', label: '评分评价', value: `${sd.rating}分（${sd.reviewCount}）` },
          { s: '✅', label: '门店排名', value: sd.rank },
          { s: '✅', label: '交通位置', value: sd.metro },
        ]
      },
      afterContent: '\n\n只差 <b>3项</b> 平台必填信息就可以入驻了 👇\n\n💡 你可以直接告诉我，也可以<b>拍一张营业执照</b>，我帮你自动提取 📄',
      missingInfo: {
        title: '⚠️ 仅需补充以下信息',
        items: [
          { s: '❓', label: '店主/法人姓名', value: '（大众点评不显示）' },
          { s: '❓', label: '店主联系手机', value: '（用于商户登录）' },
          { s: '❓', label: '统一社会信用代码', value: '（营业执照上的18位编码）' },
        ]
      }
    },
    { type: 'wait', chips: ['📄 拍营业执照自动识别', '法人张伟，手机138-0000-8888，信用代码91440300MA5G8B2C1X'] },
    {
      type: 'agent', delay: 500, text: '太好了！所有入驻信息已补齐 ✅ 请确认：',
      card: {
        rows: [
          { label: '🏪 店铺', value: sd.shopName },
          { label: '🍽️ 类目', value: sd.category },
          { label: '📍 地址', value: sd.address },
          { label: '⏰ 营业', value: sd.hours },
          { label: '⭐ 评分', value: `${sd.rating}分 · ${sd.rank}` },
          { label: '👤 法人', value: '张伟 / 138-0000-8888' },
          { label: '📄 信用代码', value: '91440300MA5G8B2C1X' },
        ]
      },
      afterContent: '\n<b>只上传了2张截图，AI自动提取了全部信息</b>',
      confirm: true, confirmText: '✅ 确认提交入驻'
    },
    { type: 'auto-confirm' },
    {
      type: 'agent', delay: 300, text: '正在提交入驻申请...', tools: [
        { name: 'submit_merchant_application', params: `{ merchant_name:"${sd.shopName}", industry:"特色菜/粤菜", address:"${sd.address}", applicant:"张伟", source:"大众点评截图识别" }`, result: '✅ 入驻申请已提交，申请号: SH-2026-0310-001' },
        { name: 'review_merchant_application', params: '{ id:"SH-2026-0310-001", action:"approve" }', result: '✅ 审核通过，商户已激活' },
      ],
      dataUpdates: { merchants: [{ name: sd.shopName, type: '特色菜/粤菜', detail: '张伟 · 南山区创业路1777号' }], savedMinutes: 14 }
    },
    {
      type: 'agent', delay: 600, text: `🎉 <b>${sd.shopName} 入驻成功！</b>\n\n接下来帮您配置关爱活动。根据这家店的特点：\n\n• <b>经营类型</b>：特色菜/粤菜（高端餐饮）\n• <b>人均消费</b>：¥175（适合补贴型活动）\n• <b>营业时段</b>：午餐+晚餐（可覆盖多时段）\n• <b>设施</b>：有包间、宴会厅（适合团体活动）\n\nAI 为您推荐以下 <b>3种关爱活动方案</b>：`,
      activityRecommend: {
        title: '💡 智能推荐 · 适合这家店的关爱活动',
        items: [
          { icon: '🍲', name: '爱心午餐 · 帮帮卡', desc: '为环卫工人、外卖骑手提供工作日特价午餐，每天限量20份', tag: '推荐指数 ⭐⭐⭐⭐⭐', scenario: 'lunch' },
          { icon: '🎂', name: '长者暖心宴 · 关爱卡', desc: '为社区孤寡老人提供每月一次免费聚餐，含粤式点心和热汤', tag: '适合高端餐饮 · 有宴会厅', scenario: 'elder' },
          { icon: '🎒', name: '爱心学生餐 · 帮帮卡', desc: '为困难家庭学生提供放学后营养加餐，每份补贴50元', tag: '公益影响力大', scenario: 'student' },
        ]
      },
      afterContent: '\n👆 <b>选择一个活动方案，我帮您配置详细参数</b>'
    },
    { type: 'wait-activity' },
    { type: 'thinking', delay: 600, thinkText: '🎯 根据店铺特点生成活动配置方案...' },
    { type: 'activity-config' },
    { type: 'wait-config-confirm' },
    { type: 'thinking', delay: 800, thinkText: '📋 正在创建活动和配置关爱卡...' },
    { type: 'activity-create' },
    { type: 'final-summary' }
  ]
};

// ===== 注册功能模块 =====
registerFeature({
  id: 'merchant-onboard',
  name: '商家入驻+配券一条龙',
  icon: '📸',
  description: '发送大众点评截图，AI自动识别入驻+智能推荐关爱活动+配卡',
  greeting: '你好！我是关爱龙虾 🌸\n\n我来帮你完成<b>商家入驻 + 关爱活动配置</b> ✨\n\n请按提示<b>点击触发</b>每个操作步骤 👇',
  autoStartScenario: 'auto-demo',
  scenarioList: [],
  scenarios: merchantOnboardScenarios,
  activityConfigs: merchantOnboardActivityConfigs,
  screenshotData: MerchantOnboard.screenshotData
});
