import { SeedPack, LongTermGoal, ShortTermTask } from '@/types/memory';
import { WorkProject, LifeProject, AnimationAgent } from '@/types/engine';

// Iris 的 Seed Pack 初始数据
export const irisSeedPack: Omit<SeedPack, 'importedAt'> = {
  identity: {
    name: 'Iris',
    roles: [
      '连接者 (Connector)',
      '系统落地者 (Builder/PM)',
      '表达者 (Narrator)',
      '战略型产品人',
    ],
    coreValues: [
      '长期主义与复利偏好',
      '理性、证据、边界感',
      '系统化思维',
      '高标准的专业感与审美感',
      '松弛与创造并存',
    ],
    missionStatement: '用 AI 把自己擅长的"连接+落地+表达"做成可复利的事业系统，在工作与第二人生之间找到平衡。',
  },
  businessLines: {
    work: [
      {
        id: 'shanzhi_mei',
        name: '善治美公益组件',
        description: '参考微信支付"爱心餐"模式，打造面向乡村公益的"认证与交付操作系统/组件工具箱"',
        priority: 1,
        currentStatus: '概念设计完成，待 MVP 试点',
        nextMilestone: '完成爱心小卖部物资券试点方案',
        compoundPotential: 85,
      },
      {
        id: 'nongshi_yujing',
        name: '农事预警系统',
        description: '成都郫都区小麦农事预警 Demo，把气象数据转化为可执行的农事提醒',
        priority: 2,
        currentStatus: '数据解译完成，阈值表待规则化',
        nextMilestone: '完成最小可用字段集定义',
        compoundPotential: 70,
      },
    ],
    life: [
      {
        id: 'animation_ai',
        name: '动画电影 AI 制片系统',
        description: '用 AI 重构动画电影前期创作流程，让好创意能快速产出定调 Demo',
        priority: 1,
        currentStatus: '调研规划阶段',
        nextMilestone: '完成前期创作流程可 Agent 化环节分析',
        compoundPotential: 95,
      },
      {
        id: 'finance_coach',
        name: '财商教练/AI陪练',
        description: '把生活经验产品化，做"财商教练/花钱搭子"',
        priority: 2,
        currentStatus: '概念探索中',
        nextMilestone: '完成产品定位与核心功能设计',
        compoundPotential: 75,
      },
      {
        id: 'second_life',
        name: '第二人生探索',
        description: '构建 AI Agent 军团 + 五层记忆系统 + 复利表达路径',
        priority: 3,
        currentStatus: '系统搭建中',
        nextMilestone: '完成数字分身 MVP 并开始日常运行',
        compoundPotential: 90,
      },
    ],
  },
  preferences: {
    workLifeRatio: { work: 0.6, life: 0.4 },
    decisionStyle: '先给全景地图，再给第一步；小步快跑，10-20分钟颗粒度；产出必须可复用',
    outputFormats: ['复盘日记', '公众号文章', 'SOP/模板', '可视化页面'],
  },
  collaborators: [
    {
      id: 'liu_fuyuan',
      name: '刘富源',
      role: '动画导演',
      relationship: '熊出没最初的动画导演，曾合作五年',
      projects: ['animation_ai'],
      notes: '目前赋闲在家思考未来，是动画 AI 制片系统的核心合作伙伴',
    },
  ],
  constraints: [
    '育儿与健康调理阶段，精力有限',
    '倾向低成本验证、外包协作、减少固定团队负担',
    '不做低回报的忙碌，用复利视角检验机会',
    '家庭与身体是硬约束',
  ],
};

// 初始长期目标
export const initialGoals: Omit<LongTermGoal, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: '善治美公益组件 MVP 上线',
    description: '完成乡村公益认证与交付系统的最小可用版本，在一个试点村完成验证',
    category: 'work',
    targetDate: new Date('2026-03-31'),
    milestones: [
      { id: 'm1', title: '完成爱心小卖部方案设计', targetDate: new Date('2026-01-15'), completed: false },
      { id: 'm2', title: '完成技术方案评审', targetDate: new Date('2026-01-31'), completed: false },
      { id: 'm3', title: '试点村上线运行', targetDate: new Date('2026-03-15'), completed: false },
    ],
    compoundValue: 85,
    status: 'active',
  },
  {
    title: '动画 AI 制片系统 Demo',
    description: '搭建前期创作 Agent 协作网络，产出第一个可演示的定调 Demo',
    category: 'life',
    targetDate: new Date('2026-06-30'),
    milestones: [
      { id: 'm1', title: '完成前期创作流程调研', targetDate: new Date('2026-01-31'), completed: false },
      { id: 'm2', title: '设计 Agent 协作架构', targetDate: new Date('2026-02-28'), completed: false },
      { id: 'm3', title: '与刘导完成导演定调访谈', targetDate: new Date('2026-03-15'), completed: false },
      { id: 'm4', title: '产出第一个 Mood Trailer', targetDate: new Date('2026-05-31'), completed: false },
    ],
    compoundValue: 95,
    status: 'active',
  },
  {
    title: '数字分身系统稳定运行',
    description: '完成五层记忆架构和双引擎任务系统的搭建，实现每日自动产出',
    category: 'life',
    targetDate: new Date('2026-02-28'),
    milestones: [
      { id: 'm1', title: 'MVP 上线运行', targetDate: new Date('2026-01-10'), completed: false },
      { id: 'm2', title: '完成 Seed Pack 导入', targetDate: new Date('2026-01-15'), completed: false },
      { id: 'm3', title: '连续运行 30 天', targetDate: new Date('2026-02-15'), completed: false },
    ],
    compoundValue: 90,
    status: 'active',
  },
];

// 初始任务
export const initialTasks: Omit<ShortTermTask, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Work 任务
  {
    title: '善治美：定义最小可用字段集',
    description: '为每类提醒列出触发所需字段、解释所需字段、替代字段/缺省策略',
    engine: 'work',
    priority: 80,
    compoundValue: 75,
    urgency: 60,
    goalAlignment: 85,
    estimatedHours: 2,
    status: 'pending',
    tags: ['善治美', '公益', '规范'],
    deliverables: [],
  },
  {
    title: '农事预警：阈值表规则化',
    description: '将阈值表拆成触发条件、提醒文案模板、展示绑定三部分',
    engine: 'work',
    priority: 70,
    compoundValue: 70,
    urgency: 50,
    goalAlignment: 75,
    estimatedHours: 3,
    status: 'pending',
    tags: ['农事预警', '规则', '数据'],
    deliverables: [],
  },
  // Life 任务
  {
    title: '动画 AI 制片：前期创作流程调研',
    description: '分析剧本、分镜、概念设计等环节，识别可 Agent 化的工作内容',
    engine: 'life',
    priority: 90,
    compoundValue: 95,
    urgency: 40,
    goalAlignment: 95,
    estimatedHours: 4,
    status: 'pending',
    tags: ['动画', 'AI制片', '调研', '系统设计'],
    deliverables: [],
  },
  {
    title: '设计 Agent 协作网络架构',
    description: '规划故事创意Agent、视觉参考Agent、拉片总结Agent等角色及其交互方式',
    engine: 'life',
    priority: 85,
    compoundValue: 90,
    urgency: 30,
    goalAlignment: 90,
    estimatedHours: 3,
    status: 'pending',
    tags: ['动画', 'Agent', '架构设计'],
    deliverables: [],
  },
  {
    title: '准备导演定调访谈提纲',
    description: '为与刘富源导演的60-90分钟定调访谈准备结构化问题清单',
    engine: 'life',
    priority: 75,
    compoundValue: 80,
    urgency: 50,
    goalAlignment: 85,
    estimatedHours: 2,
    status: 'pending',
    tags: ['动画', '访谈', '刘富源'],
    deliverables: [],
  },
];

// 动画 AI 制片系统的 Agent 规划
export const animationAgents: AnimationAgent[] = [
  {
    id: 'story_agent',
    name: '故事创意整理 Agent',
    role: '故事架构师',
    description: '负责整理、结构化导演和编剧的创意想法，生成故事大纲和场景列表',
    capabilities: [
      '故事结构分析',
      '场景拆解',
      '角色关系图谱',
      '情感节奏标注',
    ],
    inputs: ['导演口述', '剧本草稿', '参考影片'],
    outputs: ['结构化故事大纲', '场景列表', '角色卡片'],
    automationLevel: 'semi_auto',
    status: 'planned',
  },
  {
    id: 'visual_agent',
    name: '视觉参考分析 Agent',
    role: '视觉研究员',
    description: '收集、分析视觉参考，提取风格特征，生成风格指南',
    capabilities: [
      '图像风格分析',
      '色彩提取',
      '构图模式识别',
      '风格一致性检查',
    ],
    inputs: ['参考图片', '导演偏好描述', '目标受众'],
    outputs: ['风格圣经', '色彩方案', '视觉关键帧'],
    automationLevel: 'semi_auto',
    status: 'planned',
  },
  {
    id: 'film_analysis_agent',
    name: '参考片拉片总结 Agent',
    role: '影片分析师',
    description: '分析参考影片的镜头语言、节奏、叙事手法，提炼可借鉴的模式',
    capabilities: [
      '镜头语言分析',
      '节奏曲线绘制',
      '叙事结构拆解',
      '情绪地图生成',
    ],
    inputs: ['参考影片', '分析维度', '关注重点'],
    outputs: ['拉片报告', '镜头资产库', '节奏参考'],
    automationLevel: 'semi_auto',
    status: 'planned',
  },
  {
    id: 'storyboard_agent',
    name: '分镜生成 Agent',
    role: '分镜师',
    description: '基于故事大纲和视觉风格，生成分镜草图',
    capabilities: [
      '镜头设计',
      '构图生成',
      '动态预览',
      '镜头衔接优化',
    ],
    inputs: ['场景描述', '视觉风格', '情绪要求'],
    outputs: ['分镜草图', '镜头列表', '动态预览'],
    automationLevel: 'semi_auto',
    status: 'planned',
  },
  {
    id: 'demo_generator_agent',
    name: 'Demo 生成 Agent',
    role: '预览制作',
    description: '整合各 Agent 产出，生成可演示的定调 Demo',
    capabilities: [
      '素材整合',
      '时间线编排',
      '音乐匹配',
      '导出渲染',
    ],
    inputs: ['分镜', '视觉素材', '音乐参考'],
    outputs: ['Mood Trailer', 'Proof Scene', 'Pitch Package'],
    automationLevel: 'semi_auto',
    status: 'planned',
  },
];

// Work 项目初始数据
export const initialWorkProjects: Omit<WorkProject, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '善治美公益组件',
    description: '乡村公益认证与交付操作系统',
    status: 'active',
    tasks: [],
  },
  {
    name: '农事预警系统',
    description: '成都郫都区小麦农事预警 Demo',
    status: 'active',
    tasks: [],
  },
];

// Life 项目初始数据
export const initialLifeProjects: Omit<LifeProject, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '动画电影 AI 制片系统',
    description: '用 AI 重构动画电影前期创作流程',
    category: 'animation',
    collaborators: ['liu_fuyuan'],
    agentPipeline: {
      id: 'animation_pipeline',
      name: '前期创作 Agent 管道',
      description: '从导演意图到定调 Demo 的自动化流程',
      agents: animationAgents,
      workflows: [],
      status: 'design',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    status: 'research',
    tasks: [],
  },
  {
    name: '财商教练产品',
    description: '财商教练/花钱搭子 AI 陪练产品',
    category: 'finance',
    collaborators: [],
    status: 'research',
    tasks: [],
  },
];
