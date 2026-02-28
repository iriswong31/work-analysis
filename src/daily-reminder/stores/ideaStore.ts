// ==========================================
// 灵感池 Zustand Store
// ==========================================

import { create } from 'zustand';
import { reminderDb } from '../utils/db';
import { Idea, SubTask, CompoundCategory, IdeaStatus } from '@/types/reminder';
import { aiDecomposeIdea } from '../utils/ai';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** AI 拆解 → 本地规则兜底 */
async function smartDecompose(title: string, content: string): Promise<SubTask[]> {
  // 先尝试 AI 拆解
  try {
    const aiSteps = await aiDecomposeIdea(title, content);
    if (aiSteps && aiSteps.length >= 2) {
      return aiSteps.map(step => ({
        id: generateId(),
        title: step,
        done: false,
      }));
    }
  } catch (e) {
    console.warn('[SmartDecompose] AI 拆解失败，使用本地规则:', e);
  }
  // 兜底：本地规则引擎
  return decomposeIdea(title, content);
}

/** AI 拆解灵感为子任务（本地规则引擎，不依赖外部 API） */
function decomposeIdea(title: string, content: string): SubTask[] {
  const text = `${title} ${content}`.trim();
  const tasks: SubTask[] = [];

  // 1. 如果用户已经用换行/序号列出了子项，直接提取
  const lines = content.split(/\n/).map(l => l.trim()).filter(Boolean);
  const numberedLines = lines.filter(l => /^[\d\-•·]+[.、)）\s]/.test(l));

  if (numberedLines.length >= 2) {
    numberedLines.forEach(line => {
      const cleaned = line.replace(/^[\d\-•·]+[.、)）\s]+/, '').trim();
      if (cleaned) {
        tasks.push({ id: generateId(), title: cleaned, done: false });
      }
    });
    return tasks;
  }

  // 2. 从内容中提取具体的行动线索（句号/逗号分隔的语句中寻找动作）
  const extracted = extractActionSteps(title, content);
  if (extracted.length >= 2) {
    // 去重：如果两个步骤语义高度相似（核心动词+宾语相同），只保留一个
    const deduped = deduplicateSteps(extracted);
    deduped.forEach(step => {
      tasks.push({ id: generateId(), title: step, done: false });
    });
    return tasks;
  }

  // 3. 智能拆解：基于关键词生成与标题内容相关的子任务
  const contextualTasks = generateContextualTasks(title, content);
  if (contextualTasks.length > 0) {
    // 如果extractActionSteps提取到了1个，与contextual合并去重
    const merged = extracted.length === 1
      ? deduplicateSteps([...extracted, ...contextualTasks])
      : contextualTasks;
    merged.forEach(step => {
      tasks.push({ id: generateId(), title: step, done: false });
    });
    return tasks;
  }

  // 4. 最终兜底：基于通用模板
  const patterns: { keywords: RegExp; steps: string[] }[] = [
    {
      keywords: /学习|学会|掌握|入门|了解/,
      steps: [`找到学习${title}的教程/资料`, `制定${title}学习计划`, `完成基础知识学习`, `动手实践练习`, `总结复盘学习成果`],
    },
    {
      keywords: /做|开发|搭建|实现|完成|写|上线/,
      steps: [`明确「${title}」的目标和范围`, `拆解具体执行步骤`, `准备所需资源和工具`, `执行核心任务`, `检查和优化成果`],
    },
    {
      keywords: /调研|研究|分析|对比|评估/,
      steps: [`确定${title}的调研维度`, `收集相关资料和数据`, `整理分析关键信息`, `形成结论和建议`, `输出调研报告`],
    },
    {
      keywords: /计划|规划|方案|策略/,
      steps: [`明确${title}的目标和约束`, `梳理可选方案`, `评估各方案优劣`, `确定最终方案`, `制定执行计划和检查节点`],
    },
    {
      keywords: /运动|健身|锻炼|跑步/,
      steps: ['确定运动目标和频次', '制定每周训练计划', '准备装备和场地', '开始执行首周计划', '记录数据并调整'],
    },
    {
      keywords: /读|阅读|看书/,
      steps: ['选定书单/内容', '安排每日阅读时间', '做阅读笔记', '输出读后感或思维导图'],
    },
  ];

  for (const p of patterns) {
    if (p.keywords.test(text)) {
      p.steps.forEach(step => {
        tasks.push({ id: generateId(), title: step, done: false });
      });
      return tasks;
    }
  }

  // 5. 默认拆解
  tasks.push(
    { id: generateId(), title: `明确「${title}」的目标和预期成果`, done: false },
    { id: generateId(), title: '列出需要准备的资源', done: false },
    { id: generateId(), title: '确定第一步行动', done: false },
    { id: generateId(), title: '开始执行', done: false },
    { id: generateId(), title: '复盘总结', done: false },
  );

  return tasks;
}

/** 从用户的自然语言描述中提取具体的行动步骤 */
function extractActionSteps(title: string, content: string): string[] {
  if (!content) return [];
  const steps: string[] = [];

  // 提取"第一步/第二步..."、"首先/然后/接着/最后"等顺序线索
  const orderPatterns = [
    /第一步[是，,：:\s]*(.+?)(?:[。.，,；;]|$)/g,
    /第二步[是，,：:\s]*(.+?)(?:[。.，,；;]|$)/g,
    /第三步[是，,：:\s]*(.+?)(?:[。.，,；;]|$)/g,
    /第四步[是，,：:\s]*(.+?)(?:[。.，,；;]|$)/g,
    /第五步[是，,：:\s]*(.+?)(?:[。.，,；;]|$)/g,
  ];

  for (const pat of orderPatterns) {
    let m;
    while ((m = pat.exec(content)) !== null) {
      const step = m[1].trim();
      if (step && step.length > 2 && step.length < 60) {
        steps.push(step);
      }
    }
  }

  if (steps.length >= 2) return steps;

  // 提取"得先/需要先/先...再...然后..."句式
  const fullText = `${title}。${content}`;
  const sequenceWords = ['得先', '需要先', '先', '首先'];
  const followWords = ['然后', '接着', '再', '之后', '其次', '最后', '还要', '还需要'];

  const sentences = fullText.split(/[。.！!？?\n]+/).map(s => s.trim()).filter(s => s.length > 2);

  for (const sentence of sentences) {
    // 检查是否包含顺序词
    for (const sw of sequenceWords) {
      const idx = sentence.indexOf(sw);
      if (idx >= 0) {
        const afterFirst = sentence.slice(idx + sw.length).trim();
        // 寻找后续步骤
        let remaining = afterFirst;
        const firstStep = extractFirstClause(remaining);
        if (firstStep && firstStep.length > 2) {
          steps.push(firstStep);
          remaining = remaining.slice(firstStep.length);
        }

        for (const fw of followWords) {
          const fIdx = remaining.indexOf(fw);
          if (fIdx >= 0) {
            const afterFollow = remaining.slice(fIdx + fw.length).trim();
            const nextStep = extractFirstClause(afterFollow);
            if (nextStep && nextStep.length > 2) {
              steps.push(nextStep);
              remaining = afterFollow.slice(nextStep.length);
            }
          }
        }
        break;
      }
    }
    if (steps.length >= 2) break;
  }

  // 如果只提取到1个步骤，尝试从内容中找"关键动词+宾语"模式补充
  if (steps.length === 1) {
    const actionVerbs = /(?:注册|申请|下载|安装|配置|搭建|开发|设计|测试|部署|发布|上线|购买|订阅)/g;
    let m;
    while ((m = actionVerbs.exec(content)) !== null) {
      const start = m.index;
      const fragment = content.slice(start, start + 30);
      const clause = extractFirstClause(fragment);
      if (clause && clause.length > 2 && !steps.includes(clause)) {
        steps.push(clause);
      }
    }
  }

  return steps.slice(0, 8);
}

/** 提取第一个短句（到逗号/句号/分号为止） */
function extractFirstClause(text: string): string {
  const match = text.match(/^(.+?)(?:[，,。.；;！!？?\n]|$)/);
  return match ? match[1].trim() : text.trim().slice(0, 40);
}

/** 去重：如果两个步骤的核心动词+宾语高度相似，只保留较完整的那个 */
function deduplicateSteps(steps: string[]): string[] {
  if (steps.length <= 1) return steps;

  // 提取核心关键词（去掉虚词和修饰语）
  function extractCore(s: string): string {
    return s
      .replace(/得先|需要先|先|首先|然后|接着|再|之后|还要|还需要/g, '')
      .replace(/一个|一下|个人|企业|的/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  const result: string[] = [];
  const cores: string[] = [];

  for (const step of steps) {
    const core = extractCore(step);
    // 检查是否与已有步骤的核心词重叠过多
    let isDuplicate = false;
    for (let i = 0; i < cores.length; i++) {
      const existing = cores[i];
      // 如果一个包含另一个的大部分内容，视为重复
      if (
        existing.includes(core) ||
        core.includes(existing) ||
        computeOverlap(core, existing) > 0.6
      ) {
        // 保留较长/更具体的那个
        if (step.length > result[i].length) {
          result[i] = step;
          cores[i] = core;
        }
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      result.push(step);
      cores.push(core);
    }
  }

  return result;
}

/** 计算两个字符串的字符重叠率 */
function computeOverlap(a: string, b: string): number {
  if (!a || !b) return 0;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  let matchCount = 0;
  for (const ch of shorter) {
    if (longer.includes(ch)) matchCount++;
  }
  return matchCount / shorter.length;
}

/** 基于标题和内容生成与上下文相关的任务 */
function generateContextualTasks(title: string, content: string): string[] {
  const text = `${title} ${content}`;

  // 小程序相关
  if (/小程序/.test(text)) {
    const steps: string[] = [];
    if (/注册/.test(text)) steps.push('注册个人/企业小程序账号');
    else steps.push('注册小程序账号');
    steps.push('安装微信开发者工具');
    if (/设计|UI|界面/.test(text)) steps.push('设计小程序界面和功能');
    steps.push('搭建小程序基础框架');
    if (/功能|聚合/.test(text)) steps.push('开发核心功能模块');
    steps.push('本地调试和测试');
    steps.push('提交审核并上线');
    return steps;
  }

  // 网站/应用开发相关
  if (/网站|app|应用|系统/.test(text)) {
    return [
      '确定功能需求和技术选型',
      '设计产品原型和界面',
      '搭建开发环境和基础框架',
      '开发核心功能',
      '测试和修复问题',
      '部署上线',
    ];
  }

  // 副业/赚钱相关
  if (/副业|赚钱|变现|创业/.test(text)) {
    return [
      '明确方向和目标受众',
      '调研市场和竞品',
      '确定最小可行产品(MVP)',
      '搭建基础产品/服务',
      '获取第一批用户/客户',
      '根据反馈迭代优化',
    ];
  }

  return [];
}

interface IdeaState {
  ideas: Idea[];
  isLoading: boolean;

  loadIdeas: () => Promise<void>;
  addIdea: (title: string, content: string, categories: CompoundCategory[]) => Promise<Idea>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;

  // 子任务操作
  toggleSubTask: (ideaId: string, subTaskId: string) => Promise<void>;
  addSubTask: (ideaId: string, title: string) => Promise<void>;
  updateSubTask: (ideaId: string, subTaskId: string, title: string) => Promise<void>;
  deleteSubTask: (ideaId: string, subTaskId: string) => Promise<void>;
  reDecompose: (ideaId: string) => Promise<void>;

  // 转化为提醒
  markSubTaskAsReminder: (ideaId: string, subTaskId: string, reminderId: string) => Promise<void>;
  unmarkSubTaskAsReminder: (ideaId: string, subTaskId: string) => Promise<void>;
  // 编辑灵感本身
  updateIdeaInfo: (ideaId: string, title: string, content: string, categories: CompoundCategory[]) => Promise<void>;
}

export const useIdeaStore = create<IdeaState>((set, get) => ({
  ideas: [],
  isLoading: false,

  loadIdeas: async () => {
    set({ isLoading: true });
    const ideas = await reminderDb.ideas.orderBy('createdAt').reverse().toArray();
    set({ ideas, isLoading: false });
  },

  addIdea: async (title, content, categories) => {
    // 先用本地规则快速创建，再异步 AI 拆解替换
    const localSubTasks = decomposeIdea(title, content);
    const idea: Idea = {
      id: generateId(),
      title,
      content,
      subTasks: localSubTasks,
      status: 'open',
      categories,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await reminderDb.ideas.add(idea);
    set({ ideas: [idea, ...get().ideas] });

    // 异步 AI 拆解（不阻塞创建流程）
    smartDecompose(title, content).then(async (aiSubTasks) => {
      // 只有当 AI 返回的结果跟本地不同时才更新
      const aiTitles = aiSubTasks.map(s => s.title).join('|');
      const localTitles = localSubTasks.map(s => s.title).join('|');
      if (aiTitles !== localTitles) {
        await reminderDb.ideas.update(idea.id, { subTasks: aiSubTasks, updatedAt: new Date() });
        set({
          ideas: get().ideas.map(i =>
            i.id === idea.id ? { ...i, subTasks: aiSubTasks, updatedAt: new Date() } : i
          ),
        });
      }
    }).catch(() => { /* AI 失败时保持本地结果 */ });

    return idea;
  },

  updateIdea: async (id, updates) => {
    const merged = { ...updates, updatedAt: new Date() };
    await reminderDb.ideas.update(id, merged);
    set({
      ideas: get().ideas.map(i => i.id === id ? { ...i, ...merged } : i),
    });
  },

  deleteIdea: async (id) => {
    await reminderDb.ideas.delete(id);
    set({ ideas: get().ideas.filter(i => i.id !== id) });
  },

  toggleSubTask: async (ideaId, subTaskId) => {
    const idea = get().ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const subTasks = idea.subTasks.map(st =>
      st.id === subTaskId ? { ...st, done: !st.done } : st
    );
    const allDone = subTasks.every(st => st.done);
    const anyDone = subTasks.some(st => st.done);
    const status: IdeaStatus = allDone ? 'done' : anyDone ? 'in_progress' : 'open';
    await reminderDb.ideas.update(ideaId, { subTasks, status, updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, subTasks, status, updatedAt: new Date() } : i
      ),
    });
  },

  addSubTask: async (ideaId, title) => {
    const idea = get().ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const subTasks = [...idea.subTasks, { id: generateId(), title, done: false }];
    await reminderDb.ideas.update(ideaId, { subTasks, updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, subTasks, updatedAt: new Date() } : i
      ),
    });
  },

  updateSubTask: async (ideaId, subTaskId, title) => {
    const idea = get().ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const subTasks = idea.subTasks.map(st =>
      st.id === subTaskId ? { ...st, title } : st
    );
    await reminderDb.ideas.update(ideaId, { subTasks, updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, subTasks, updatedAt: new Date() } : i
      ),
    });
  },

  deleteSubTask: async (ideaId, subTaskId) => {
    const idea = get().ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const subTasks = idea.subTasks.filter(st => st.id !== subTaskId);
    await reminderDb.ideas.update(ideaId, { subTasks, updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, subTasks, updatedAt: new Date() } : i
      ),
    });
  },

  reDecompose: async (ideaId) => {
    const idea = get().ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const subTasks = await smartDecompose(idea.title, idea.content);
    await reminderDb.ideas.update(ideaId, { subTasks, status: 'open', updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, subTasks, status: 'open' as IdeaStatus, updatedAt: new Date() } : i
      ),
    });
  },

  markSubTaskAsReminder: async (ideaId, subTaskId, reminderId) => {
    const idea = get().ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const subTasks = idea.subTasks.map(st =>
      st.id === subTaskId ? { ...st, reminderId } : st
    );
    await reminderDb.ideas.update(ideaId, { subTasks, updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, subTasks, updatedAt: new Date() } : i
      ),
    });
  },

  unmarkSubTaskAsReminder: async (ideaId, subTaskId) => {
    const idea = get().ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const subTasks = idea.subTasks.map(st =>
      st.id === subTaskId ? { ...st, reminderId: undefined } : st
    );
    await reminderDb.ideas.update(ideaId, { subTasks, updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, subTasks, updatedAt: new Date() } : i
      ),
    });
  },

  updateIdeaInfo: async (ideaId, title, content, categories) => {
    await reminderDb.ideas.update(ideaId, { title, content, categories, updatedAt: new Date() });
    set({
      ideas: get().ideas.map(i =>
        i.id === ideaId ? { ...i, title, content, categories, updatedAt: new Date() } : i
      ),
    });
  },
}));
