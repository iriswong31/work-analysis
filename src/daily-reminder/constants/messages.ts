// ==========================================
// 温柔但坚定的提醒文案库
// ==========================================

import { CompoundCategory, ReminderUrgency } from '@/types/reminder';

interface MessagePool {
  [key: string]: string[];
}

/** 按复利分类的文案 */
const categoryMessages: Record<CompoundCategory, string[]> = {
  health: [
    '身体是承载一切梦想的容器，好好对待它。',
    '喝一杯水吧，你的身体一直在默默支持你。',
    '站起来活动一下，让血液重新流动。',
    '深呼吸三次，感受一下自己的存在。',
    '运动不是任务，是你送给自己的礼物。',
    '你的身体记得你对它的每一份善意。',
    '休息不是偷懒，是为了走更远的路。',
  ],
  finance: [
    '看一眼你的账本，了解钱的流向就是掌控生活。',
    '今天的一小步理财，是未来自由的基石。',
    '记账不是限制，是给自己清晰的视野。',
    '投资自己永远是回报率最高的投资。',
    '财务健康和身体健康一样重要。',
  ],
  relation: [
    '联系一个重要的人吧，关系需要浇灌。',
    '一句简单的问候，可能照亮某人的一天。',
    '感谢一个帮助过你的人，感恩让关系更深。',
    '真诚的连接是人生最大的财富。',
    '今天想想，谁让你的生活变得更好了？',
    '分享你的快乐，快乐就会翻倍。',
  ],
  creation: [
    '你说过想留下属于自己的作品，现在就是那个时刻。',
    '每一笔、每一行代码、每一帧都是你的印记。',
    '好作品不需要完美，需要开始。',
    '今天为你的作品推进了多少？哪怕一点点也好。',
    '创作是和未来的自己对话。',
    '把脑海里的灵感变成现实，这就是创造的力量。',
    '好奇心是最好的老师，今天想探索什么？',
  ],
  joy: [
    '今天做了什么让自己开心的事？',
    '取悦自己不是奢侈，是必需。',
    '给自己几分钟，什么都不做，只是存在。',
    '生活不只有KPI，还有让你心动的瞬间。',
    '做点喜欢的事吧，你值得。',
    '安静下来，让思绪沉淀。最好的想法总是在安静中浮现。',
  ],
  skill: [
    '每天进步一点点，一年后你会惊叹自己走了多远。',
    '开始之后就没那么难了，你知道的。',
    '专注的时间是最珍贵的礼物，送给自己吧。',
    '今天学到的东西，会在未来某个意想不到的时刻帮到你。',
    '不要追求完美，追求进步。',
    '你已经比昨天的自己更强了，继续。',
    '把大象切成小块，一块一块来。',
  ],
  custom: [
    '你为自己设定了这个提醒，一定有它的意义。',
    '答应自己的事，要温柔地坚守。',
    '这件事对你很重要，所以你才会在这里。',
    '一步一步来，不急，但不要停。',
  ],
};

/** 按紧急度的前缀 */
const urgencyPrefix: Record<ReminderUrgency, string[]> = {
  gentle: [
    '温柔提醒 💫',
    '轻轻地说 🌿',
    '亲爱的 🌸',
    '嘿 ☀️',
  ],
  firm: [
    '记得你答应过自己的 ✨',
    '是时候了 🎯',
    '该行动了 💪',
    '别忘了 ⏰',
  ],
  urgent: [
    '现在，立刻 🔥',
    '不要再拖了 ⚡',
    '你知道这很重要 🌟',
    '就是现在 💫',
  ],
};

/** 时段问候 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了，';
  if (hour < 9) return '早安，';
  if (hour < 12) return '上午好，';
  if (hour < 14) return '中午好，';
  if (hour < 18) return '下午好，';
  if (hour < 21) return '傍晚好，';
  return '晚上好，';
}

/** 随机选一个 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 生成提醒消息 */
export function generateMessage(
  category: CompoundCategory,
  urgency: ReminderUrgency,
  customMessage?: string,
): string {
  if (customMessage) return customMessage;
  
  const prefix = pickRandom(urgencyPrefix[urgency]);
  const body = pickRandom(categoryMessages[category]);
  return `${prefix}\n${body}`;
}

/** 生成完成鼓励 */
export function generateEncouragement(streak: number): string {
  if (streak <= 1) return '很好，迈出了第一步 ✨';
  if (streak <= 3) return `连续 ${streak} 天了，继续保持 💪`;
  if (streak <= 7) return `连续 ${streak} 天！你比想象中更有毅力 🌟`;
  if (streak <= 14) return `连续 ${streak} 天！这已经开始成为习惯了 🔥`;
  if (streak <= 30) return `连续 ${streak} 天！半个月了，你太棒了 🏆`;
  return `连续 ${streak} 天！你正在创造奇迹 👑`;
}

/** 获取分类显示信息 */
export const categoryInfo: Record<CompoundCategory, { label: string; icon: string; color: string }> = {
  health:    { label: '健康复利', icon: '🌿', color: 'text-green-500' },
  finance:   { label: '财务复利', icon: '💰', color: 'text-yellow-500' },
  relation:  { label: '关系复利', icon: '🤝', color: 'text-red-500' },
  creation:  { label: '作品复利', icon: '🎨', color: 'text-orange-500' },
  joy:       { label: '悦己复利', icon: '🌸', color: 'text-pink-500' },
  skill:     { label: '技能复利', icon: '🎯', color: 'text-blue-500' },
  cognition: { label: '认知复利', icon: '🧠', color: 'text-purple-500' },
  custom:    { label: '其他',     icon: '📌', color: 'text-teal-500' },
};

/** 复利分类对应的叶子颜色（柔和低饱和） */
export const categoryLeafColors: Record<CompoundCategory, { fill: string; stroke: string; fillDim: string; strokeDim: string }> = {
  health:    { fill: '#88B488', stroke: '#689668', fillDim: 'rgba(136,180,136,0.22)', strokeDim: 'rgba(136,180,136,0.30)' },  // 绿
  finance:   { fill: '#D4C462', stroke: '#B8A84A', fillDim: 'rgba(212,196,98,0.22)',  strokeDim: 'rgba(212,196,98,0.30)' },   // 黄
  relation:  { fill: '#C86E6E', stroke: '#A85555', fillDim: 'rgba(200,110,110,0.22)', strokeDim: 'rgba(200,110,110,0.30)' },  // 红
  creation:  { fill: '#D4944C', stroke: '#B87A38', fillDim: 'rgba(212,148,76,0.22)',  strokeDim: 'rgba(212,148,76,0.30)' },   // 橙
  joy:       { fill: '#D4A0B0', stroke: '#B8808F', fillDim: 'rgba(212,160,176,0.22)', strokeDim: 'rgba(212,160,176,0.30)' },  // 粉红
  skill:     { fill: '#7BAFC4', stroke: '#5C90A8', fillDim: 'rgba(123,175,196,0.22)', strokeDim: 'rgba(123,175,196,0.30)' },  // 蓝
  cognition: { fill: '#9B8EC4', stroke: '#7A6DA8', fillDim: 'rgba(155,142,196,0.22)', strokeDim: 'rgba(155,142,196,0.30)' },  // 紫
  custom:    { fill: '#6DB8A8', stroke: '#529888', fillDim: 'rgba(109,184,168,0.22)', strokeDim: 'rgba(109,184,168,0.30)' },  // 青
};
