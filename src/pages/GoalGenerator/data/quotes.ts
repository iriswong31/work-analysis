// 原文金句库 - 每次生成时随机选取不重复的金句
export const quotes = [
  {
    en: "You don't rise to the level of your goals, you fall to the level of your systems.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "Small daily actions compound into life-changing results.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "30 days to become the boss of your own life.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "2026, become who you want to be.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "Write down your dreams, then work to make them real.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "If you want specific outcomes in your life, you have to live a lifestyle that creates them long before you get there.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "Reflecting on your anti-vision is always a wise move — it can help you move toward a brighter future.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "What conditions need to be true one year from now that prove you've broken the pattern?",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "What do I need to learn? What skills do I need to develop? What can I build?",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "These are the things that the person you're becoming would naturally do.",
    source: "How to fix your entire life in 1 day"
  },
  {
    en: "What core values will I not compromise on to achieve my vision?",
    source: "How to fix your entire life in 1 day"
  }
];

// Fisher-Yates 洗牌算法
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 获取不重复的随机金句（用于5张卡片）
export function getRandomQuotes(count: number = 5): typeof quotes {
  const shuffled = shuffleArray(quotes);
  return shuffled.slice(0, count);
}
