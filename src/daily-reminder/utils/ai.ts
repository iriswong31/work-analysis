// ==========================================
// AI 智能拆解灵感为子任务
// 基于火山方舟 API（文生文 skill）
// ==========================================

import { reminderDb } from './db';

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
}

// 火山方舟默认配置（从环境变量读取）
const ENV_CONFIG: AIConfig = {
  apiKey: import.meta.env.VITE_ARK_API_KEY || '',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  model: import.meta.env.VITE_ARK_TEXT_MODEL || 'ep-20260226111445-6bhjn',
  enabled: true,
};

const DEFAULT_CONFIG: AIConfig = {
  apiKey: '',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  model: 'ep-20260226111445-6bhjn',
  enabled: false,
};

/** 从 IndexedDB 读取 AI 配置，环境变量作为兜底 */
export async function getAIConfig(): Promise<AIConfig> {
  const stored = await reminderDb.userSettings.get('aiConfig');
  if (stored?.value) {
    try {
      const userConfig = JSON.parse(stored.value) as Partial<AIConfig>;
      // 如果用户手动配置了 apiKey，用用户的；否则用环境变量
      if (userConfig.apiKey) {
        return { ...DEFAULT_CONFIG, ...userConfig };
      }
    } catch { /* ignore */ }
  }
  // 用环境变量配置（火山方舟）
  if (ENV_CONFIG.apiKey) {
    return ENV_CONFIG;
  }
  return DEFAULT_CONFIG;
}

/** 保存 AI 配置到 IndexedDB */
export async function saveAIConfig(config: Partial<AIConfig>): Promise<void> {
  const current = await getAIConfig();
  const merged = { ...current, ...config };
  await reminderDb.userSettings.put({
    key: 'aiConfig',
    value: JSON.stringify(merged),
  });
}

/** 通用 AI 请求 */
async function aiRequest(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000,
): Promise<string | null> {
  const config = await getAIConfig();
  if (!config.enabled || !config.apiKey) return null;

  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const apiUrl = baseUrl.includes('/api/v3') || baseUrl.includes('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      console.error('[AI] API 请求失败:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[AI] 请求失败:', error);
    return null;
  }
}

/** 调用 AI 拆解灵感为子任务 */
export async function aiDecomposeIdea(
  title: string,
  content: string,
): Promise<string[] | null> {
  const prompt = `你是一个任务拆解专家。用户有一个灵感/想法，请帮他拆解成3-7个具体的、可执行的子任务步骤。

要求：
1. 每个步骤的格式必须是："概括词：具体描述"，概括词3-5个字
   例如："准备材料：糯米粉、白糖、酵母、温水等"
   例如："蒸米糕：将蒸盘放入蒸锅，大火蒸20-25分钟"
   例如："找教程：在B站搜索Blender入门教学视频"
2. 每个步骤要具体、可操作，不要太抽象笼统
3. 步骤之间有逻辑顺序
4. 结合灵感的标题和描述内容，给出针对性的拆解
5. 如果描述不够清晰，根据标题合理推断意图
6. 只返回JSON数组格式，不要多余解释

灵感标题：${title}
${content ? `灵感描述：${content}` : '（无详细描述）'}

请直接返回JSON数组，格式如：["准备材料：糯米粉、白糖、酵母等","和面发酵：将材料混合搅拌均匀静置发酵1小时","蒸米糕：蒸盘放入蒸锅大火蒸20-25分钟"]`;

  const text = await aiRequest(
    '你是一个任务拆解专家，擅长将模糊的想法变成清晰可执行的步骤。只返回JSON数组格式的结果。',
    prompt,
  );
  return text ? parseAIResponse(text) : null;
}

/** AI 预填提醒建议（时间 + 复利分类 + 重复规则） */
export interface ReminderSuggestion {
  time: string;       // HH:mm
  endTime?: string;   // HH:mm，可选
  category: string;   // CompoundCategory 值
  repeat: string;     // RepeatType 值
  reason: string;     // 简短解释
}

export async function aiSuggestReminder(title: string): Promise<ReminderSuggestion | null> {
  if (!title.trim() || title.trim().length < 2) return null;

  const prompt = `用户要创建一个每日提醒，名称是："${title}"

请根据这个提醒名称，智能推荐：
1. time：最适合做这件事的开始时间（HH:mm 格式，24小时制）
2. endTime：结束时间（HH:mm 格式，如果是持续性活动则给出，瞬时动作则不给）
3. category：最匹配的复利分类，只能从以下选一个：
   - health（健康复利：运动、饮食、睡眠、身体相关）
   - finance（财务复利：理财、记账、投资、赚钱相关）
   - relation（关系复利：社交、家人、朋友、沟通相关）
   - creation（作品复利：创作、写作、设计、产出相关）
   - joy（悦己复利：兴趣、娱乐、放松、自我奖励相关）
   - skill（技能复利：学习、练习、提升、技术相关）
   - cognition（认知复利：阅读、思考、复盘、认知升级相关）
   - custom（以上都不匹配时选这个）
4. repeat：最合理的重复规则，只能从以下选一个：
   - daily（每天都要做）
   - weekdays（工作日做）
   - weekends（周末做）
   - weekly_times（每周做几次，不固定哪天）
   - once（只做一次）
5. reason：一句话解释你的推荐理由（不超过20字）

只返回JSON对象，格式如：
{"time":"07:00","endTime":"07:30","category":"health","repeat":"daily","reason":"晨起运动最佳时段"}

如果是瞬时动作（如喝水），不要返回 endTime 字段。`;

  const text = await aiRequest(
    '你是一个生活规划专家，擅长根据习惯名称推荐最佳执行时间和分类。只返回JSON格式。',
    prompt,
    300,
  );

  if (!text) return null;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const obj = JSON.parse(jsonMatch[0]);

    // 校验必要字段
    const validCategories = ['health', 'finance', 'relation', 'creation', 'joy', 'skill', 'cognition', 'custom'];
    const validRepeats = ['daily', 'weekdays', 'weekends', 'weekly', 'weekly_times', 'monthly', 'once'];

    if (!obj.time || !/^\d{2}:\d{2}$/.test(obj.time)) return null;
    if (!validCategories.includes(obj.category)) obj.category = 'custom';
    if (!validRepeats.includes(obj.repeat)) obj.repeat = 'daily';

    return {
      time: obj.time,
      endTime: obj.endTime && /^\d{2}:\d{2}$/.test(obj.endTime) ? obj.endTime : undefined,
      category: obj.category,
      repeat: obj.repeat,
      reason: obj.reason || '',
    };
  } catch {
    return null;
  }
}

/** AI 推荐灵感归属分类 */
export async function aiSuggestIdeaCategory(title: string): Promise<string[] | null> {
  if (!title.trim() || title.trim().length < 2) return null;

  const prompt = `用户记录了一个灵感/想法，标题是："${title}"

请根据标题推荐最匹配的1-2个复利分类。只能从以下分类中选：
- health（健康复利：运动、饮食、睡眠、身体相关）
- finance（财务复利：理财、记账、投资、赚钱相关）
- relation（关系复利：社交、家人、朋友、沟通相关）
- creation（作品复利：创作、写作、设计、产出相关）
- joy（悦己复利：兴趣、娱乐、放松、自我奖励相关）
- skill（技能复利：学习、练习、提升、技术相关）
- cognition（认知复利：阅读、思考、复盘、认知升级相关）
- custom（以上都不匹配时选这个）

只返回JSON数组，格式如：["skill","creation"]`;

  const text = await aiRequest(
    '你是一个分类专家，擅长根据灵感标题判断所属的复利分类。只返回JSON数组格式。',
    prompt,
    100,
  );

  if (!text) return null;

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const arr = JSON.parse(jsonMatch[0]);
    const validCategories = ['health', 'finance', 'relation', 'creation', 'joy', 'skill', 'cognition', 'custom'];
    if (Array.isArray(arr) && arr.length > 0) {
      const filtered = arr.filter((s: string) => validCategories.includes(s));
      return filtered.length > 0 ? filtered : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** 解析 AI 返回的 JSON 数组 */
function parseAIResponse(text: string): string[] | null {
  try {
    // 尝试直接解析 JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr) && arr.length >= 2 && arr.every((s: any) => typeof s === 'string')) {
        return arr.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
    }

    // 如果JSON解析失败，尝试按行提取
    const lines = text
      .split('\n')
      .map((l: string) => l.replace(/^[\d\-•·"]+[.、)）\s"]*/, '').trim())
      .filter((l: string) => l.length > 2 && l.length < 100);
    
    if (lines.length >= 2) return lines;

    return null;
  } catch {
    return null;
  }
}

/** 测试 AI 连接 */
export async function testAIConnection(config: AIConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const testUrl = baseUrl.includes('/api/v3') || baseUrl.includes('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'user', content: '请回复"连接成功"四个字' },
        ],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { success: false, error: `HTTP ${response.status}: ${errText.slice(0, 100)}` };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (reply) {
      return { success: true };
    }
    return { success: false, error: '返回格式异常' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
