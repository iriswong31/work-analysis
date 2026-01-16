/**
 * Seed Pack 初始化脚本
 * 从 iris-me 的 Seed Pack 数据初始化五层记忆系统
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_ROOT = path.resolve(__dirname, '..');

// Seed Pack 数据结构（从 src/data/seedPack.ts 提取）
interface SeedPackIdentity {
  name: string;
  roles: string[];
  coreValues: string[];
  missionStatement: string;
}

interface BusinessLine {
  id: string;
  name: string;
  description: string;
  priority: number;
  currentStatus: string;
  nextMilestone: string;
  compoundPotential: number;
}

interface Collaborator {
  id: string;
  name: string;
  role: string;
  relationship: string;
  projects: string[];
  notes: string;
}

interface SeedPack {
  identity: SeedPackIdentity;
  businessLines: {
    work: BusinessLine[];
    life: BusinessLine[];
  };
  preferences: {
    workLifeRatio: { work: number; life: number };
    decisionStyle: string;
    outputFormats: string[];
  };
  collaborators: Collaborator[];
  constraints: string[];
}

// 从 seedPack.ts 导入的数据
const irisSeedPack: SeedPack = {
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

function getTimestamp(): string {
  return new Date().toISOString().replace('Z', '+08:00');
}

function generateL4CoreLayer(seedPack: SeedPack): object {
  return {
    last_updated: getTimestamp(),
    updated_by: 'system_init',
    
    identity: {
      name: seedPack.identity.name,
      roles: seedPack.identity.roles,
      mission_statement: seedPack.identity.missionStatement,
    },
    
    core_values: seedPack.identity.coreValues.map((value, index) => ({
      value,
      description: '',
      origin: 'Seed Pack 导入',
      priority: index + 1,
    })),
    
    life_beliefs: [
      { belief: '持续学习是应对不确定性的最好方式', why: '世界变化快，唯有学习能力是永恒的竞争力' },
      { belief: '创造价值是最好的自我实现', why: '通过创造帮助他人，同时实现自我价值' },
      { belief: '家庭和健康是一切的基础', why: '没有健康的身体和和谐的家庭，其他都是空谈' },
    ],
    
    personality_traits: [
      { trait: '内向型', manifestation: '喜欢深度思考，需要独处时间恢复能量' },
      { trait: '分析型', manifestation: '遇事先分析，喜欢用数据和逻辑说话' },
    ],
    
    decision_principles: [
      { principle: '长期主义优先', priority: 1, examples: ['选择能持续积累的事'] },
      { principle: '先人后事', priority: 2, examples: ['家庭和健康是硬约束'] },
      { principle: '低成本验证', priority: 3, examples: ['用最小成本验证假设'] },
      { principle: '用复利视角检验机会', priority: 4, examples: ['不做低回报的忙碌'] },
    ],
    
    constraints: {
      hard_constraints: seedPack.constraints.filter(c => 
        c.includes('硬约束') || c.includes('精力有限')
      ),
      soft_constraints: seedPack.constraints.filter(c => 
        !c.includes('硬约束') && !c.includes('精力有限')
      ),
    },
    
    evolution_history: [
      {
        date: new Date().toISOString().split('T')[0],
        change: '初始化核心层，基于 Seed Pack 导入',
        reason: '建立数字分身记忆系统',
        changed_by: 'system_init',
      },
    ],
  };
}

function generateIntentGoals(seedPack: SeedPack): object {
  const allBusinessLines = [...seedPack.businessLines.work, ...seedPack.businessLines.life];
  
  return {
    last_updated: getTimestamp(),
    
    long_term_goals: allBusinessLines.map(bl => ({
      goal: bl.name,
      category: seedPack.businessLines.work.includes(bl) ? 'work' : 'life',
      description: bl.description,
      target_date: '',
      compound_value: bl.compoundPotential,
      status: 'active',
      current_status: bl.currentStatus,
      milestones: [
        {
          milestone: bl.nextMilestone,
          target_date: '',
          completed: false,
        },
      ],
    })),
    
    current_focus: allBusinessLines
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map(bl => bl.name),
  };
}

function generateIntentPreferences(seedPack: SeedPack): object {
  return {
    last_updated: getTimestamp(),
    
    work_life_ratio: {
      work: seedPack.preferences.workLifeRatio.work,
      life: seedPack.preferences.workLifeRatio.life,
      note: `工作占 ${seedPack.preferences.workLifeRatio.work * 100}%，第二人生探索占 ${seedPack.preferences.workLifeRatio.life * 100}%`,
    },
    
    decision_style: {
      summary: seedPack.preferences.decisionStyle,
      details: seedPack.preferences.decisionStyle.split('；'),
    },
    
    output_formats: {
      preferred: seedPack.preferences.outputFormats,
      avoid: ['冗长的纯文字报告', '没有结构的流水账'],
    },
    
    communication_preferences: {
      response_style: '结构化、分层次、先结论后论据',
      detail_level: '适中，关键信息完整但不冗余',
      tone: '专业但不失温度',
    },
  };
}

function generateIntentConstraints(seedPack: SeedPack): object {
  return {
    last_updated: getTimestamp(),
    
    hard_constraints: seedPack.constraints
      .filter(c => c.includes('硬约束') || c.includes('精力有限'))
      .map(c => ({ constraint: c, impact: '' })),
    
    soft_constraints: seedPack.constraints
      .filter(c => !c.includes('硬约束') && !c.includes('精力有限'))
      .map(c => ({ constraint: c, flexibility: '' })),
    
    time_constraints: {
      available_hours_per_day: 4,
      preferred_work_times: ['09:00-11:00', '14:00-16:00'],
      note: '精力有限，需要高效利用',
    },
  };
}

async function initializeMemorySystem(): Promise<void> {
  console.log('🚀 开始初始化记忆系统...\n');
  
  // 生成各层文件
  const files: { path: string; content: object }[] = [
    {
      path: 'Memory/L4_核心层.yaml',
      content: generateL4CoreLayer(irisSeedPack),
    },
    {
      path: 'Intent/目标与规划.yaml',
      content: generateIntentGoals(irisSeedPack),
    },
    {
      path: 'Intent/偏好与要求.yaml',
      content: generateIntentPreferences(irisSeedPack),
    },
    {
      path: 'Intent/约束与边界.yaml',
      content: generateIntentConstraints(irisSeedPack),
    },
  ];
  
  for (const file of files) {
    const filePath = path.join(MEMORY_ROOT, file.path);
    const yamlContent = YAML.stringify(file.content, { indent: 2 });
    
    // 添加文件头注释
    const header = `# ${path.basename(file.path, '.yaml')}\n# 由 Seed Pack 自动生成\n# 生成时间: ${new Date().toISOString()}\n\n`;
    
    fs.writeFileSync(filePath, header + yamlContent, 'utf-8');
    console.log(`✅ 已生成: ${file.path}`);
  }
  
  console.log('\n🎉 记忆系统初始化完成！');
  console.log('\n目录结构:');
  console.log(`
memory-system/
├── Memory/           # 被动沉淀轨道
│   ├── L0_状态层.yaml
│   ├── L1_情境层.yaml
│   ├── L2_行为层.yaml
│   ├── L3_认知层.yaml
│   └── L4_核心层.yaml  ← 已从 Seed Pack 初始化
├── Intent/           # 主动输入轨道
│   ├── 目标与规划.yaml  ← 已从 Seed Pack 初始化
│   ├── 偏好与要求.yaml  ← 已从 Seed Pack 初始化
│   └── 约束与边界.yaml  ← 已从 Seed Pack 初始化
└── Meta/             # 系统元数据
    ├── 洞察队列.yaml
    ├── 框架演变.yaml
    └── 复盘记录/
  `);
}

// 运行初始化
initializeMemorySystem().catch(console.error);
