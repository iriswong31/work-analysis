// 每步的灵感提示
export const inspirations = {
  antiVision: [
    "被工作压得喘不过气，没有自己的时间",
    "身体越来越差，总是疲惫不堪",
    "困在不喜欢的城市和圈子里",
    "存款没增加，焦虑却越来越多"
  ],
  vision: [
    "有足够的被动收入，可以选择自己想做的事",
    "身体健康有活力，每天精神饱满",
    "住在喜欢的城市，身边是志同道合的朋友",
    "内心平静，对生活充满热爱"
  ],
  yearGoals: [
    "完成一个能带来持续收入的副业项目",
    "体重回到理想状态，养成运动习惯",
    "学会一项新技能并达到可变现水平",
    "存下第一个10万（或50万）"
  ],
  monthProjects: [
    "本月上线MVP版本并获得第一个付费用户",
    "坚持每周跑步3次，单次5公里",
    "完成XX课程并输出学习笔记",
    "本月减少非必要支出，存款增加20%"
  ],
  dailyActions: [
    "早起1小时做副业项目",
    "每天运动30分钟",
    "每天阅读30分钟",
    "记录每一笔支出"
  ],
  principles: [
    "不熬夜：23点前必须睡觉",
    "不内耗：做完决定不后悔",
    "不将就：宁缺毋滥",
    "不拖延：今日事今日毕"
  ]
};

export const stepInfo = [
  {
    key: 'antiVision',
    title: '反愿景',
    subtitle: '你最不想要的生活是什么样？',
    description: '想象一下，如果2026年什么都不改变，你最害怕变成什么样？',
    placeholder: '描述你最不想要的生活状态...',
    required: false,
    quote: '反思自己厌恶的生活状态始终是明智之举——这能助你迈向更美好的未来。'
  },
  {
    key: 'vision',
    title: '愿景',
    subtitle: '你理想中的自己是什么样？',
    description: '闭上眼睛，想象2026年底最好的自己，在过着什么样的生活？',
    placeholder: '描述你理想中的生活状态...',
    required: true,
    quote: '若想在人生中获得特定结果，你必须在抵达目标很早之前，就过上能创造该结果的生活方式。'
  },
  {
    key: 'yearGoals',
    title: '年度目标',
    subtitle: '为了实现愿景，今年要达成哪些里程碑？',
    description: '选择1-3个最重要的年度目标，让它们成为你通往愿景的桥梁',
    placeholder: '你的年度目标（建议1-3个，换行分隔）...',
    required: true,
    multiline: true,
    quote: '一年后需要实现什么条件，才能证明你已打破旧有模式？'
  },
  {
    key: 'monthProjects',
    title: '月度项目',
    subtitle: '这个月专注做什么？',
    description: '把年度目标拆解成一个个月度小项目，每月只专注1-2件事',
    placeholder: '这个月要完成的项目...',
    required: false,
    quote: '我需要学习什么？需要掌握哪些技能？能构建什么来推动我接近年度目标？'
  },
  {
    key: 'dailyActions',
    title: '每日行动',
    subtitle: '每天重复的小习惯',
    description: '哪些简单的行动，只要每天坚持，就能让你越来越接近目标？',
    placeholder: '你的每日习惯（换行分隔）...',
    required: true,
    multiline: true,
    quote: '明日可预留时段完成的2-3项行动？这些正是你正在成为的那个自己会自然而然去做的事。'
  },
  {
    key: 'principles',
    title: '底线原则',
    subtitle: '绝对不做的事',
    description: '给自己划几条红线，这些是你无论如何都不会妥协的原则',
    placeholder: '你的底线原则（换行分隔）...',
    required: false,
    multiline: true,
    quote: '为实现愿景，哪些核心价值我绝不妥协？'
  }
];
