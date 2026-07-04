import type {
  CompanyEvent,
  DashboardData,
  FinancialSnapshot,
  KlinePoint,
  QuoteSnapshot,
  ResearchNote,
  SectorOverview,
  SymbolSearchResult,
  WatchlistItem
} from "@/lib/types";

export const symbols: SymbolSearchResult[] = [
  {
    symbol: "sh600519",
    name: "贵州茅台",
    market: "A股",
    exchange: "上交所",
    sector: "白酒",
    currency: "CNY"
  },
  {
    symbol: "hk00700",
    name: "腾讯控股",
    market: "港股",
    exchange: "港交所",
    sector: "互联网",
    currency: "HKD"
  },
  {
    symbol: "usNVDA",
    name: "NVIDIA",
    market: "美股",
    exchange: "NASDAQ",
    sector: "半导体",
    currency: "USD"
  },
  {
    symbol: "sz300750",
    name: "宁德时代",
    market: "A股",
    exchange: "深交所",
    sector: "新能源",
    currency: "CNY"
  },
  {
    symbol: "usAAPL",
    name: "Apple",
    market: "美股",
    exchange: "NASDAQ",
    sector: "消费电子",
    currency: "USD"
  }
];

export const quotes: Record<string, QuoteSnapshot> = {
  sh600519: {
    ...symbols[0],
    price: 1476.8,
    change: 12.6,
    changePercent: 0.86,
    volume: "2.18万手",
    turnover: "32.1亿元",
    peTtm: 23.8,
    pb: 8.9,
    ps: 11.2,
    dividendYield: 2.1,
    weekChangePercent: 1.34,
    yearHigh: 1822.0,
    yearLow: 1321.3,
    updatedAt: "2026-07-04T15:00:00+08:00"
  },
  hk00700: {
    ...symbols[1],
    price: 398.4,
    change: -3.2,
    changePercent: -0.8,
    volume: "1880万股",
    turnover: "74.8亿港元",
    peTtm: 18.5,
    pb: 3.4,
    ps: 5.8,
    dividendYield: 1.0,
    weekChangePercent: -2.6,
    yearHigh: 463.2,
    yearLow: 312.4,
    updatedAt: "2026-07-04T16:10:00+08:00"
  },
  usNVDA: {
    ...symbols[2],
    price: 156.72,
    change: 2.91,
    changePercent: 1.89,
    volume: "2.4亿股",
    turnover: "376亿美元",
    peTtm: 44.7,
    pb: 31.2,
    ps: 24.8,
    dividendYield: 0.03,
    weekChangePercent: 6.42,
    yearHigh: 164.3,
    yearLow: 91.1,
    updatedAt: "2026-07-04T04:00:00+08:00"
  },
  sz300750: {
    ...symbols[3],
    price: 214.36,
    change: -1.44,
    changePercent: -0.67,
    volume: "15.6万手",
    turnover: "33.4亿元",
    peTtm: 21.4,
    pb: 4.6,
    ps: 3.1,
    dividendYield: 1.7,
    weekChangePercent: -1.18,
    yearHigh: 268.5,
    yearLow: 171.2,
    updatedAt: "2026-07-04T15:00:00+08:00"
  },
  usAAPL: {
    ...symbols[4],
    price: 218.35,
    change: -0.9,
    changePercent: -0.41,
    volume: "4780万股",
    turnover: "104亿美元",
    peTtm: 31.9,
    pb: 45.8,
    ps: 8.2,
    dividendYield: 0.45,
    weekChangePercent: 2.13,
    yearHigh: 237.1,
    yearLow: 164.6,
    updatedAt: "2026-07-04T04:00:00+08:00"
  }
};

export const klines: Record<string, KlinePoint[]> = {
  sh600519: [
    { date: "06-21", close: 1438 },
    { date: "06-24", close: 1451 },
    { date: "06-25", close: 1460 },
    { date: "06-26", close: 1447 },
    { date: "06-27", close: 1455 },
    { date: "06-28", close: 1464 },
    { date: "07-01", close: 1476.8 }
  ],
  hk00700: [
    { date: "06-21", close: 410.2 },
    { date: "06-24", close: 406.8 },
    { date: "06-25", close: 401.2 },
    { date: "06-26", close: 404.0 },
    { date: "06-27", close: 400.6 },
    { date: "06-28", close: 401.6 },
    { date: "07-01", close: 398.4 }
  ],
  usNVDA: [
    { date: "06-21", close: 146.2 },
    { date: "06-24", close: 149.6 },
    { date: "06-25", close: 151.4 },
    { date: "06-26", close: 152.7 },
    { date: "06-27", close: 153.1 },
    { date: "06-28", close: 155.2 },
    { date: "07-01", close: 156.72 }
  ],
  sz300750: [
    { date: "06-21", close: 218.2 },
    { date: "06-24", close: 216.4 },
    { date: "06-25", close: 214.1 },
    { date: "06-26", close: 213.6 },
    { date: "06-27", close: 215.0 },
    { date: "06-28", close: 215.8 },
    { date: "07-01", close: 214.36 }
  ],
  usAAPL: [
    { date: "06-21", close: 213.6 },
    { date: "06-24", close: 215.4 },
    { date: "06-25", close: 216.2 },
    { date: "06-26", close: 219.1 },
    { date: "06-27", close: 220.2 },
    { date: "06-28", close: 219.0 },
    { date: "07-01", close: 218.35 }
  ]
};

export const financials: Record<string, FinancialSnapshot[]> = {
  sh600519: [
    {
      period: "2026 Q1",
      revenue: 464.8,
      revenueYoY: 14.2,
      netIncome: 247.1,
      netIncomeYoY: 15.4,
      grossMargin: 91.8,
      operatingCashFlow: 226.5,
      currency: "CNY"
    },
    {
      period: "2025 FY",
      revenue: 1741.2,
      revenueYoY: 15.0,
      netIncome: 862.3,
      netIncomeYoY: 14.8,
      grossMargin: 91.5,
      operatingCashFlow: 901.4,
      currency: "CNY"
    }
  ],
  hk00700: [
    {
      period: "2026 Q1",
      revenue: 1678.0,
      revenueYoY: 8.4,
      netIncome: 513.0,
      netIncomeYoY: 18.7,
      grossMargin: 52.4,
      operatingCashFlow: 689.0,
      currency: "HKD"
    },
    {
      period: "2025 FY",
      revenue: 6724.0,
      revenueYoY: 9.8,
      netIncome: 1972.0,
      netIncomeYoY: 21.2,
      grossMargin: 51.2,
      operatingCashFlow: 2658.0,
      currency: "HKD"
    }
  ],
  usNVDA: [
    {
      period: "FY2027 Q1",
      revenue: 441.0,
      revenueYoY: 69.2,
      netIncome: 205.0,
      netIncomeYoY: 77.1,
      grossMargin: 72.3,
      operatingCashFlow: 238.0,
      currency: "USD"
    },
    {
      period: "FY2026",
      revenue: 1305.0,
      revenueYoY: 114.0,
      netIncome: 728.0,
      netIncomeYoY: 145.0,
      grossMargin: 73.8,
      operatingCashFlow: 761.0,
      currency: "USD"
    }
  ],
  sz300750: [
    {
      period: "2026 Q1",
      revenue: 921.0,
      revenueYoY: 5.3,
      netIncome: 118.2,
      netIncomeYoY: 9.6,
      grossMargin: 25.4,
      operatingCashFlow: 101.0,
      currency: "CNY"
    },
    {
      period: "2025 FY",
      revenue: 4215.0,
      revenueYoY: 8.8,
      netIncome: 527.4,
      netIncomeYoY: 12.7,
      grossMargin: 25.1,
      operatingCashFlow: 602.4,
      currency: "CNY"
    }
  ],
  usAAPL: [
    {
      period: "FY2026 Q2",
      revenue: 953.0,
      revenueYoY: 4.4,
      netIncome: 247.0,
      netIncomeYoY: 5.1,
      grossMargin: 46.8,
      operatingCashFlow: 286.0,
      currency: "USD"
    },
    {
      period: "FY2025",
      revenue: 4012.0,
      revenueYoY: 3.7,
      netIncome: 1016.0,
      netIncomeYoY: 4.0,
      grossMargin: 46.1,
      operatingCashFlow: 1192.0,
      currency: "USD"
    }
  ]
};

export const events: Record<string, CompanyEvent[]> = {
  sh600519: [
    {
      id: "evt-moutai-1",
      date: "2026-07-01",
      type: "公告",
      title: "渠道库存去化延续，批价环比企稳",
      impact: "中性",
      summary: "渠道反馈显示高端白酒需求恢复仍偏温和，但核心单品批价波动收窄。",
      source: "Mock 行业跟踪"
    },
    {
      id: "evt-moutai-2",
      date: "2026-06-27",
      type: "分红",
      title: "年度分红实施进度更新",
      impact: "利好",
      summary: "现金分红保持较高水平，股息率对长期资金有一定吸引力。",
      source: "Mock 公司公告"
    }
  ],
  hk00700: [
    {
      id: "evt-tencent-1",
      date: "2026-07-02",
      type: "回购",
      title: "连续回购延续，资本回报预期稳定",
      impact: "利好",
      summary: "公司延续日常回购，对每股收益和市场信心形成支撑。",
      source: "Mock 港交所公告"
    },
    {
      id: "evt-tencent-2",
      date: "2026-06-25",
      type: "行业",
      title: "游戏版号节奏平稳，广告需求小幅改善",
      impact: "中性",
      summary: "行业供给端稳定，但宏观消费修复仍是广告业务的关键变量。",
      source: "Mock 行业资讯"
    }
  ],
  usNVDA: [
    {
      id: "evt-nvda-1",
      date: "2026-07-03",
      type: "行业",
      title: "云厂商 AI 资本开支预期继续上修",
      impact: "利好",
      summary: "算力需求仍是短期收入能见度的主要支撑，但估值对增速变化敏感。",
      source: "Mock 行业资讯"
    },
    {
      id: "evt-nvda-2",
      date: "2026-06-26",
      type: "宏观",
      title: "高估值科技股对利率预期变化敏感",
      impact: "中性",
      summary: "长端利率波动可能影响成长股估值折现率。",
      source: "Mock 宏观观察"
    }
  ],
  sz300750: [
    {
      id: "evt-catl-1",
      date: "2026-06-30",
      type: "行业",
      title: "动力电池排产环比改善",
      impact: "利好",
      summary: "下游新能源车需求改善对龙头排产形成边际支撑。",
      source: "Mock 产业链跟踪"
    },
    {
      id: "evt-catl-2",
      date: "2026-06-24",
      type: "公告",
      title: "海外产能推进仍需观察政策风险",
      impact: "中性",
      summary: "海外业务增长空间较大，但监管和贸易政策仍是风险项。",
      source: "Mock 公司公告"
    }
  ],
  usAAPL: [
    {
      id: "evt-apple-1",
      date: "2026-07-01",
      type: "行业",
      title: "端侧 AI 功能成为换机周期观察点",
      impact: "中性",
      summary: "市场关注端侧 AI 能否带动硬件升级，但短期销量验证仍不足。",
      source: "Mock 行业资讯"
    },
    {
      id: "evt-apple-2",
      date: "2026-06-28",
      type: "财报",
      title: "服务业务收入占比继续提升",
      impact: "利好",
      summary: "高毛利服务业务有助于缓冲硬件周期波动。",
      source: "Mock 财报摘要"
    }
  ]
};

export const sectors: Record<string, SectorOverview> = {
  ai: {
    id: "ai",
    name: "AI 算力",
    description: "围绕数据中心 GPU、光模块、服务器和云资本开支的高景气主题。",
    leaders: [symbols[2]],
    trends: ["云厂商资本开支延续上修", "推理需求从模型训练扩散到应用层", "产业链估值分化加大"],
    risks: ["高估值对业绩兑现要求很高", "供应链扩产后可能出现价格压力", "出口管制和地缘政策风险"]
  },
  consumer: {
    id: "consumer",
    name: "消费龙头",
    description: "覆盖白酒、互联网消费、消费电子等现金流稳定资产。",
    leaders: [symbols[0], symbols[1], symbols[4]],
    trends: ["股东回报成为估值锚", "消费复苏节奏仍偏温和", "高端品牌更看重价格体系稳定"],
    risks: ["宏观消费疲弱", "渠道库存扰动", "估值修复缺少明确催化"]
  }
};

export const watchlistItems: WatchlistItem[] = [
  { symbol: "sh600519", group: "核心观察", addedAt: "2026-07-01" },
  { symbol: "hk00700", group: "核心观察", addedAt: "2026-07-01" },
  { symbol: "usNVDA", group: "AI", addedAt: "2026-07-02" },
  { symbol: "sz300750", group: "新能源", addedAt: "2026-07-02" }
];

export const notes: ResearchNote[] = [
  {
    id: "note-1",
    title: "腾讯：回购是估值底的支撑，不是收入增长答案",
    symbol: "hk00700",
    tag: "个股复盘",
    createdAt: "2026-07-03T21:10:00+08:00",
    excerpt: "核心仍看游戏、广告和视频号商业化的增长质量，回购提升下行保护。"
  },
  {
    id: "note-2",
    title: "AI 算力链条需要区分景气和估值",
    symbol: "usNVDA",
    tag: "主题研究",
    createdAt: "2026-07-02T18:45:00+08:00",
    excerpt: "需求仍强，但市场已经对持续高增长给了较高估值，需要关注订单和毛利率。"
  }
];

export const dashboard: DashboardData = {
  indices: [
    { name: "上证指数", symbol: "sh000001", price: 3184.2, changePercent: 0.42, market: "A股" },
    { name: "恒生指数", symbol: "hkHSI", price: 18472.5, changePercent: -0.31, market: "港股" },
    { name: "纳斯达克", symbol: "us.IXIC", price: 19722.4, changePercent: 1.08, market: "美股" }
  ],
  hotSectors: [
    { name: "AI 算力", changePercent: 2.8, reason: "云资本开支预期上修" },
    { name: "创新药", changePercent: 1.7, reason: "海外授权交易活跃" },
    { name: "白酒", changePercent: 0.6, reason: "批价企稳预期" },
    { name: "新能源车", changePercent: -0.5, reason: "价格竞争担忧" }
  ],
  watchlist: [quotes.sh600519, quotes.hk00700, quotes.usNVDA, quotes.sz300750],
  events: [
    { time: "今日 21:30", title: "美国非农就业数据", scope: "宏观", impact: "高" },
    { time: "明日 09:30", title: "中国 CPI/PPI 数据", scope: "宏观", impact: "中" },
    { time: "本周", title: "港股互联网公司回购观察", scope: "港股互联网", impact: "中" }
  ],
  notes
};
