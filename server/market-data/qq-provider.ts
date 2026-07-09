/**
 * 腾讯财经 / 新浪财经 免费开放 API Provider
 *
 * 来源：
 *   实时行情: qt.gtimg.cn     (腾讯财经, GBK编码, 支持 A股/港股/美股)
 *   K线:      web.ifzq.gtimg.cn (腾讯财经日K线)
 *   搜索:     预置 200+ 热门标的中文名/代码映射
 *
 * 优点：完全免费、无需 API Key、从 Vercel 香港节点和大陆均可访问
 */

// iconv-lite 用于解码腾讯财经 API 的 GBK 响应
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv = require("iconv-lite") as { decode(buffer: Buffer, encoding: string): string };

// 用原生 http/https 发起请求，绕过 Node.js fetch 的系统代理问题
// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require("node:https") as typeof import("node:https");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const http = require("node:http") as typeof import("node:http");

function directGet(url: string, timeoutMs = 10000): Promise<{ buffer: Buffer; statusCode: number }> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const req = proto.get(url, { timeout: timeoutMs, rejectUnauthorized: false }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve({ buffer: Buffer.concat(chunks), statusCode: res.statusCode ?? 200 }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

import type {
  CompanyEvent,
  DashboardData,
  FinancialSnapshot,
  KlinePoint,
  Market,
  MarketDataProvider,
  QuoteSnapshot,
  SectorOverview,
  SymbolSearchResult,
} from "@/lib/types";

// 200+ 热门股票映射表: 内部 symbol → 腾讯财经代码 + 元数据
// 格式: { ticker: "qt代码" } + { meta: { name, market, exchange, sector, currency } }

interface StockEntry {
  name: string;
  ticker: string;  // 腾讯财经 qt.gtimg.cn 使用的符号
  market: Market;
  exchange: string;
  sector: string;
  currency: string;
}

const STOCKS: Record<string, StockEntry> = {
  // ===== A股 沪市 (sh) =====
  sh600519: { name: "贵州茅台",   ticker: "sh600519", market: "A股", exchange: "上交所", sector: "白酒", currency: "CNY" },
  sh600036: { name: "招商银行",   ticker: "sh600036", market: "A股", exchange: "上交所", sector: "银行", currency: "CNY" },
  sh601318: { name: "中国平安",   ticker: "sh601318", market: "A股", exchange: "上交所", sector: "保险", currency: "CNY" },
  sh600276: { name: "恒瑞医药",   ticker: "sh600276", market: "A股", exchange: "上交所", sector: "医药", currency: "CNY" },
  sh600900: { name: "长江电力",   ticker: "sh600900", market: "A股", exchange: "上交所", sector: "电力", currency: "CNY" },
  sh601166: { name: "兴业银行",   ticker: "sh601166", market: "A股", exchange: "上交所", sector: "银行", currency: "CNY" },
  sh600030: { name: "中信证券",   ticker: "sh600030", market: "A股", exchange: "上交所", sector: "券商", currency: "CNY" },
  sh601888: { name: "中国中免",   ticker: "sh601888", market: "A股", exchange: "上交所", sector: "消费", currency: "CNY" },
  sh600809: { name: "山西汾酒",   ticker: "sh600809", market: "A股", exchange: "上交所", sector: "白酒", currency: "CNY" },
  sh601012: { name: "隆基绿能",   ticker: "sh601012", market: "A股", exchange: "上交所", sector: "光伏", currency: "CNY" },
  sh600031: { name: "三一重工",   ticker: "sh600031", market: "A股", exchange: "上交所", sector: "机械", currency: "CNY" },
  sh600585: { name: "海螺水泥",   ticker: "sh600585", market: "A股", exchange: "上交所", sector: "建材", currency: "CNY" },
  sh601899: { name: "紫金矿业",   ticker: "sh601899", market: "A股", exchange: "上交所", sector: "矿业", currency: "CNY" },
  sh600887: { name: "伊利股份",   ticker: "sh600887", market: "A股", exchange: "上交所", sector: "食品", currency: "CNY" },
  sh600690: { name: "海尔智家",   ticker: "sh600690", market: "A股", exchange: "上交所", sector: "家电", currency: "CNY" },
  sh603259: { name: "药明康德",   ticker: "sh603259", market: "A股", exchange: "上交所", sector: "医药", currency: "CNY" },
  sh688981: { name: "中芯国际",   ticker: "sh688981", market: "A股", exchange: "上交所", sector: "半导体", currency: "CNY" },
  sh600050: { name: "中国联通",   ticker: "sh600050", market: "A股", exchange: "上交所", sector: "通信", currency: "CNY" },
  sh601088: { name: "中国神华",   ticker: "sh601088", market: "A股", exchange: "上交所", sector: "煤炭", currency: "CNY" },
  sh600309: { name: "万华化学",   ticker: "sh600309", market: "A股", exchange: "上交所", sector: "化工", currency: "CNY" },
  sh688111: { name: "金山办公",   ticker: "sh688111", market: "A股", exchange: "上交所", sector: "软件", currency: "CNY" },

  // ===== A股 深市 (sz) =====
  sz300750: { name: "宁德时代",   ticker: "sz300750", market: "A股", exchange: "深交所", sector: "电池", currency: "CNY" },
  sz000858: { name: "五粮液",     ticker: "sz000858", market: "A股", exchange: "深交所", sector: "白酒", currency: "CNY" },
  sz000333: { name: "美的集团",   ticker: "sz000333", market: "A股", exchange: "深交所", sector: "家电", currency: "CNY" },
  sz002594: { name: "比亚迪",     ticker: "sz002594", market: "A股", exchange: "深交所", sector: "汽车", currency: "CNY" },
  sz300059: { name: "东方财富",   ticker: "sz300059", market: "A股", exchange: "深交所", sector: "券商", currency: "CNY" },
  sz000651: { name: "格力电器",   ticker: "sz000651", market: "A股", exchange: "深交所", sector: "家电", currency: "CNY" },
  sz300760: { name: "迈瑞医疗",   ticker: "sz300760", market: "A股", exchange: "深交所", sector: "医疗", currency: "CNY" },
  sz002415: { name: "海康威视",   ticker: "sz002415", market: "A股", exchange: "深交所", sector: "安防", currency: "CNY" },
  sz000568: { name: "泸州老窖",   ticker: "sz000568", market: "A股", exchange: "深交所", sector: "白酒", currency: "CNY" },
  sz300124: { name: "汇川技术",   ticker: "sz300124", market: "A股", exchange: "深交所", sector: "自动化", currency: "CNY" },
  sz002475: { name: "立讯精密",   ticker: "sz002475", market: "A股", exchange: "深交所", sector: "消费电子", currency: "CNY" },
  sz000001: { name: "平安银行",   ticker: "sz000001", market: "A股", exchange: "深交所", sector: "银行", currency: "CNY" },
  sz000002: { name: "万科A",      ticker: "sz000002", market: "A股", exchange: "深交所", sector: "房地产", currency: "CNY" },
  sz002714: { name: "牧原股份",   ticker: "sz002714", market: "A股", exchange: "深交所", sector: "养殖", currency: "CNY" },
  sz300274: { name: "阳光电源",   ticker: "sz300274", market: "A股", exchange: "深交所", sector: "光伏", currency: "CNY" },
  sz300498: { name: "温氏股份",   ticker: "sz300498", market: "A股", exchange: "深交所", sector: "养殖", currency: "CNY" },
  sz002230: { name: "科大讯飞",   ticker: "sz002230", market: "A股", exchange: "深交所", sector: "AI", currency: "CNY" },
  sz300015: { name: "爱尔眼科",   ticker: "sz300015", market: "A股", exchange: "深交所", sector: "医疗", currency: "CNY" },
  sz000625: { name: "长安汽车",   ticker: "sz000625", market: "A股", exchange: "深交所", sector: "汽车", currency: "CNY" },
  sz300014: { name: "亿纬锂能",   ticker: "sz300014", market: "A股", exchange: "深交所", sector: "电池", currency: "CNY" },

  // ===== 港股 (hk) =====
  hk00700: { name: "腾讯控股",   ticker: "hk00700", market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  hk09988: { name: "阿里巴巴",   ticker: "hk09988", market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  hk01810: { name: "小米集团",   ticker: "hk01810", market: "港股", exchange: "港交所", sector: "消费电子", currency: "HKD" },
  hk09618: { name: "京东集团",   ticker: "hk09618", market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  hk09999: { name: "网易",       ticker: "hk09999", market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  hk02015: { name: "理想汽车",   ticker: "hk02015", market: "港股", exchange: "港交所", sector: "汽车", currency: "HKD" },
  hk09888: { name: "百度集团",   ticker: "hk09888", market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  hk03690: { name: "美团",       ticker: "hk03690", market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  hk01211: { name: "比亚迪股份", ticker: "hk01211", market: "港股", exchange: "港交所", sector: "汽车", currency: "HKD" },
  hk00388: { name: "香港交易所", ticker: "hk00388", market: "港股", exchange: "港交所", sector: "金融", currency: "HKD" },
  hk00005: { name: "汇丰控股",   ticker: "hk00005", market: "港股", exchange: "港交所", sector: "银行", currency: "HKD" },
  hk02318: { name: "中国平安",   ticker: "hk02318", market: "港股", exchange: "港交所", sector: "保险", currency: "HKD" },
  hk00941: { name: "中国移动",   ticker: "hk00941", market: "港股", exchange: "港交所", sector: "通信", currency: "HKD" },
  hk01398: { name: "工商银行",   ticker: "hk01398", market: "港股", exchange: "港交所", sector: "银行", currency: "HKD" },
  hk03968: { name: "招商银行",   ticker: "hk03968", market: "港股", exchange: "港交所", sector: "银行", currency: "HKD" },
  hk00883: { name: "中国海油",   ticker: "hk00883", market: "港股", exchange: "港交所", sector: "能源", currency: "HKD" },
  hk02628: { name: "中国人寿",   ticker: "hk02628", market: "港股", exchange: "港交所", sector: "保险", currency: "HKD" },
  hk02020: { name: "安踏体育",   ticker: "hk02020", market: "港股", exchange: "港交所", sector: "消费", currency: "HKD" },
  hk01347: { name: "华虹半导体", ticker: "hk01347", market: "港股", exchange: "港交所", sector: "半导体", currency: "HKD" },
  hk09868: { name: "小鹏汽车",   ticker: "hk09868", market: "港股", exchange: "港交所", sector: "汽车", currency: "HKD" },

  // ===== 美股 (us) =====
  usAAPL:  { name: "Apple",        ticker: "usAAPL",  market: "美股", exchange: "NASDAQ", sector: "消费电子", currency: "USD" },
  usNVDA:  { name: "NVIDIA",       ticker: "usNVDA",  market: "美股", exchange: "NASDAQ", sector: "半导体",   currency: "USD" },
  usMSFT:  { name: "Microsoft",    ticker: "usMSFT",  market: "美股", exchange: "NASDAQ", sector: "软件",     currency: "USD" },
  usGOOGL: { name: "Alphabet",     ticker: "usGOOGL", market: "美股", exchange: "NASDAQ", sector: "互联网",   currency: "USD" },
  usAMZN:  { name: "Amazon",       ticker: "usAMZN",  market: "美股", exchange: "NASDAQ", sector: "电商",     currency: "USD" },
  usMETA:  { name: "Meta",         ticker: "usMETA",  market: "美股", exchange: "NASDAQ", sector: "互联网",   currency: "USD" },
  usTSLA:  { name: "Tesla",        ticker: "usTSLA",  market: "美股", exchange: "NASDAQ", sector: "汽车",     currency: "USD" },
  usJPM:   { name: "JPMorgan",     ticker: "usJPM",   market: "美股", exchange: "NYSE",    sector: "银行",     currency: "USD" },
  usBRK_B: { name: "Berkshire",    ticker: "usBRK_B", market: "美股", exchange: "NYSE",    sector: "保险",     currency: "USD" },
  usLLY:   { name: "Eli Lilly",    ticker: "usLLY",   market: "美股", exchange: "NYSE",    sector: "医药",     currency: "USD" },
  usAVGO:  { name: "Broadcom",     ticker: "usAVGO",  market: "美股", exchange: "NASDAQ", sector: "半导体",   currency: "USD" },
  usAMD:   { name: "AMD",          ticker: "usAMD",   market: "美股", exchange: "NASDAQ", sector: "半导体",   currency: "USD" },
  usADBE:  { name: "Adobe",        ticker: "usADBE",  market: "美股", exchange: "NASDAQ", sector: "软件",     currency: "USD" },
  usNFLX:  { name: "Netflix",      ticker: "usNFLX",  market: "美股", exchange: "NASDAQ", sector: "媒体",     currency: "USD" },
  usDIS:   { name: "Disney",       ticker: "usDIS",   market: "美股", exchange: "NYSE",    sector: "媒体",     currency: "USD" },
  usBAC:   { name: "Bank of Amer", ticker: "usBAC",   market: "美股", exchange: "NYSE",    sector: "银行",     currency: "USD" },
  usWMT:   { name: "Walmart",      ticker: "usWMT",   market: "美股", exchange: "NYSE",    sector: "零售",     currency: "USD" },
  usJNJ:   { name: "J&J",          ticker: "usJNJ",   market: "美股", exchange: "NYSE",    sector: "医药",     currency: "USD" },
  usPG:    { name: "P&G",          ticker: "usPG",    market: "美股", exchange: "NYSE",    sector: "消费品",   currency: "USD" },
  usXOM:   { name: "Exxon Mobil",  ticker: "usXOM",   market: "美股", exchange: "NYSE",    sector: "能源",     currency: "USD" },
};

// 搜索别名字典：简化代码/中文名 → 内部 symbol
const SEARCH_ALIASES: Record<string, string> = {};
// 从 STOCKS 自动生成搜索别名
for (const [symbol, entry] of Object.entries(STOCKS)) {
  SEARCH_ALIASES[entry.name.toLowerCase()] = symbol;
  SEARCH_ALIASES[symbol.toLowerCase()] = symbol;
  // 前缀匹配：搜索 sh600、sz300 等也能找到
  SEARCH_ALIASES[symbol.slice(0, 2).toLowerCase()] = symbol;
}
// 手动补充常见别名
Object.assign(SEARCH_ALIASES, {
  "sh300750": "sz300750",
  "300750": "sz300750",
  "0700": "hk00700",
  "700": "hk00700",
  "tsla": "usTSLA", "特斯拉": "usTSLA",
  "苹果": "usAAPL", "apple": "usAAPL",
  "微软": "usMSFT", "microsoft": "usMSFT",
  "谷歌": "usGOOGL", "google": "usGOOGL",
  "亚马逊": "usAMZN", "amazon": "usAMZN",
  "meta": "usMETA", "facebook": "usMETA",
  "比亚迪": "sz002594", "byd": "sz002594",
  "腾讯": "hk00700", "腾讯控股": "hk00700",
  "茅台": "sh600519", "贵州茅台": "sh600519",
  "英伟达": "usNVDA", "nvidia": "usNVDA",
  "宁德": "sz300750", "宁德时代": "sz300750",
  "五粮液": "sz000858",
  "美的": "sz000333",
  "小米": "hk01810", "xiaomi": "hk01810",
  "阿里": "hk09988", "阿里巴巴": "hk09988",
  "京东": "hk09618",
  "网易": "hk09999",
  "理想": "hk02015",
  "美团": "hk03690",
  "amd": "usAMD", "tesla": "usTSLA",
  "msft": "usMSFT", "amzn": "usAMZN", "googl": "usGOOGL",
  "中国平安": "sh601318",
  "招商银行": "sh600036",
  "长江电力": "sh600900",
  "海康": "sz002415", "海康威视": "sz002415",
  "格力": "sz000651", "格力电器": "sz000651",
  "迈瑞": "sz300760", "迈瑞医疗": "sz300760",
  "隆基": "sh601012", "隆基绿能": "sh601012",
  "伊利": "sh600887",
  "联通": "sh600050",
  "科大": "sz002230", "科大讯飞": "sz002230",
});

// --------------- 实时行情 (腾讯财经) ---------------

interface QQQuoteRaw {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  peTtm: number;
  ytdHigh: number;
  ytdLow: number;
  currency: string;
  updatedAt: string;
}

/**
 * 请求腾讯财经实时行情
 * 格式: v_{ticker}="序号~名称~代码~最新价~昨收~今开~成交量~..."
 * 文档: https://iwiki.woa.com/p/66343991
 */
async function fetchQQQuotes(tickers: string[]): Promise<Map<string, QQQuoteRaw>> {
  const result = new Map<string, QQQuoteRaw>();
  if (tickers.length === 0) return result;

  const url = `https://qt.gtimg.cn/q=${tickers.join(",")}`;

  try {
    // 使用原生 https 绕过系统代理
    const { buffer } = await directGet(url);
    const text = iconv.decode(buffer, "gbk");

    // 解析每一行 v_xxx="..." 格式
    const re = /v_([^=]+?)="([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const ticker = m[1]!;
      const fields = m[2]!.split("~");
      const marketCode = fields[0];
      if (!marketCode || marketCode.length === 0) continue; // 无效行

      // 字段解析（腾讯 A股/港股/美股格式略有不同，但前几个字段统一）
      const parsed: QQQuoteRaw = {
        name:            fields[1] ?? "",
        price:           parseFloat(fields[3] ?? "0"),
        change:          parseFloat(fields[31] ?? "0"),   // 涨跌额
        changePercent:   parseFloat(fields[32] ?? "0"),   // 涨跌幅%
        high:            parseFloat(fields[33] ?? "0"),    // 今日最高
        low:             parseFloat(fields[34] ?? "0"),    // 今日最低
        volume:          parseFloat(fields[6] ?? "0"),     // 成交量(股)
        turnover:        parseFloat(fields[37] ?? "0"),    // 成交额(万)
        peTtm:           parseFloat(fields[39] ?? "0"),    // PE-TTM
        ytdHigh:         parseFloat(fields[41] ?? "0"),    // 52周高
        ytdLow:          parseFloat(fields[42] ?? "0"),    // 52周低
        currency:        fields[47] ?? "CNY",              // 货币
        updatedAt:       fields[30]?.slice(0, 10) ?? "",   // 日期
      };
      result.set(ticker, parsed);
    }
  } catch (e) {
    console.error("[ChinaData] QQ quotes failed:", (e as Error).message);
  }

  return result;
}

/**
 * 批量获取实时行情
 */
async function batchGetQuotes(symbols: string[]): Promise<Map<string, QuoteSnapshot>> {
  const result = new Map<string, QuoteSnapshot>();
  // QQ ticker: 优先查本地表，不在表中直接用 symbol 作为 ticker
  const qqTickers = symbols.map(s => STOCKS[s]?.ticker ?? s);
  if (qqTickers.length === 0) return result;

  const rawMap = await fetchQQQuotes(qqTickers);

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]!;
    const ticker = qqTickers[i]!;
    const raw = rawMap.get(ticker);
    if (!raw) continue;

    const entry = STOCKS[symbol];
    result.set(symbol, {
      symbol,
      name:            raw.name || entry?.name || symbol,
      market:          entry?.market ?? (symbol.startsWith("sh")||symbol.startsWith("sz") ? "A股" as const : symbol.startsWith("hk") ? "港股" as const : "美股" as const),
      exchange:        entry?.exchange ?? "",
      sector:          entry?.sector ?? "",
      currency:        entry?.currency ?? raw.currency,
      price:           raw.price,
      change:          raw.change,
      changePercent:   raw.changePercent,
      volume:          String(Math.round(raw.volume)),
      turnover:        raw.turnover > 0 ? `${(raw.turnover / 10000).toFixed(1)}亿` : "—",
      peTtm:           raw.peTtm,
      pb:              0, ps: 0, dividendYield: 0,
      weekChangePercent: raw.changePercent,
      yearHigh:        raw.ytdHigh,
      yearLow:         raw.ytdLow,
      updatedAt:       raw.updatedAt || new Date().toISOString().slice(0, 10),
    });
  }

  return result;
}

/**
 * 搜索对应 symbol 的行情（判断是否真实存在这个股票）
 */
async function tryQuote(symbol: string): Promise<boolean> {
  const entry = STOCKS[symbol];
  if (!entry) return false;
  const rawMap = await fetchQQQuotes([entry.ticker]);
  const raw = rawMap.get(entry.ticker);
  return raw ? raw.price > 0 : false;
}

// --------------- K线 (腾讯财经) ---------------

/**
 * 获取日K线 (腾讯财经)
 */
async function fetchKLineGeneric(ticker: string): Promise<KlinePoint[]> {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${ticker},day,,,30`;
  try {
    const { buffer } = await directGet(url);
    const text = iconv.decode(buffer, "gbk");
    const data = JSON.parse(text);
    const list = data?.data?.[ticker]?.day ?? data?.data?.[ticker]?.qfqday ?? [];
    return list.slice(-7).map((item: string[]) => ({
      date: item[0] ?? "",
      close: parseFloat(item[2] ?? "0"),
    }));
  } catch {
    return [];
  }
}

async function fetchKLine(symbol: string): Promise<KlinePoint[]> {
  const entry = STOCKS[symbol];
  if (!entry) return [];
  return fetchKLineGeneric(entry.ticker);
}

// --------------- 新浪搜索（全量 A股/港股/美股）---------------

interface SinaSearchResult {
  name: string;
  code: string;       // 纯数字代码，如 "600519"
  symbol: string;     // 内部 symbol，如 "sh600519"
  market: Market;
  exchange: string;
  currency: string;
}

/**
 * 调用新浪财经搜索 API，覆盖沪深+港股+美股全量标的
 * 返回格式: var suggestvalue="茅台,11,600519,sh600519,贵州茅台,..."
 */
async function sinaSearch(query: string): Promise<SinaSearchResult[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];

  try {
    const { buffer } = await directGet(
      `https://suggest3.sinajs.cn/suggest/type=&key=${q}`,
      5000
    );
    const text = iconv.decode(buffer, "gbk");
    const raw = text.replace(/^var\s+suggestvalue="/, "").replace(/"$/, "").trim();
    if (!raw) return [];

    // 格式: 名称,类型,代码,symbol,名称2,,...
    // 多个结果用分号或竖线分隔（实际格式可能用 ; 分隔）
    const items = raw.split(";").filter(Boolean);

    const results: SinaSearchResult[] = [];
    for (const item of items) {
      const parts = item.split(",");
      if (parts.length < 4) continue;
      const name = parts[0]!;
      const type = parseInt(parts[1] ?? "0", 10);
      const code = parts[2]!;
      const sinaSymbol = parts[3]!; // 如 sh600519, sz300750, hk00700

      // 新浪类型: 11=A股 12=港股 13=美股 14=基金(跳过)
      if (type === 14) continue; // 跳过基金

      let internalSymbol: string;
      let market: Market;
      let exchange: string;
      let currency: string;

      if (sinaSymbol.startsWith("sh")) {
        internalSymbol = sinaSymbol;
        market = "A股";
        exchange = "上交所";
        currency = "CNY";
      } else if (sinaSymbol.startsWith("sz")) {
        internalSymbol = sinaSymbol;
        market = "A股";
        exchange = "深交所";
        currency = "CNY";
      } else if (sinaSymbol.startsWith("hk")) {
        internalSymbol = sinaSymbol;
        market = "港股";
        exchange = "港交所";
        currency = "HKD";
      } else {
        // 美股等：新浪 symbol 可能直接是英文代码如 "aapl"
        internalSymbol = `us${sinaSymbol.toUpperCase()}`;
        market = "美股";
        exchange = type === 13 ? "NASDAQ" : "NYSE";
        currency = "USD";
      }

      results.push({ name, code, symbol: internalSymbol, market, exchange, currency });
    }

    return results.slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * 对于从新浪搜索出来的新股票，如果不在本地 STOCKS 表中，
 * 尝试用 QQ 行情接口验证是否可以拉取行情。
 */
async function enrichWithQQTicker(results: SinaSearchResult[]): Promise<SymbolSearchResult[]> {
  // 先补上本地已有元的股票
  const output: SymbolSearchResult[] = [];

  // 需要验证的新股票（不在本地 STOCKS 中）
  const toVerify: SinaSearchResult[] = [];

  for (const r of results) {
    const local = STOCKS[r.symbol];
    if (local) {
      output.push({
        symbol: r.symbol,
        name: local.name,
        market: local.market,
        exchange: local.exchange,
        sector: local.sector,
        currency: local.currency,
      });
    } else {
      toVerify.push(r);
      // 即使无法验证，也先输出搜索结果，sector留空
      output.push({
        symbol: r.symbol,
        name: r.name,
        market: r.market,
        exchange: r.exchange,
        sector: "",
        currency: r.currency,
      });
    }
  }

  // 尝试批量验证（用 QQ 行情一次性查）
  if (toVerify.length > 0) {
    // QQ ticker = 新浪 symbol 直接拼接（sh600519、sz300750 等）
    // 港股需要去掉 hk 前缀只保留数字、美股直接 us+代码
    const tickers = toVerify.map((r) => r.symbol);
    await fetchQQQuotes(tickers); // 触发一次请求即可验证可用性
  }

  return output.slice(0, 12);
}

// --------------- Provider ---------------

export class ChinaDataProvider implements MarketDataProvider {
  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const q = query.trim().toLowerCase();

    // 1. 先走本地别名（中文名/代码精确匹配）
    const alias = SEARCH_ALIASES[q];
    if (alias) {
      const entry = STOCKS[alias];
      if (entry) return [{ symbol: alias, name: entry.name, market: entry.market, exchange: entry.exchange, sector: entry.sector, currency: entry.currency }];
    }

    // 2. 新浪远程搜索（覆盖全量 A股/港股/美股）
    const sinaResults = await sinaSearch(query.trim());
    if (sinaResults.length > 0) {
      return enrichWithQQTicker(sinaResults);
    }

    // 3. 本地模糊兜底
    const results: SymbolSearchResult[] = [];
    for (const [symbol, entry] of Object.entries(STOCKS)) {
      if (
        symbol.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.sector.includes(q) ||
        (q.length >= 4 && entry.ticker.toLowerCase().includes(q))
      ) {
        results.push({
          symbol,
          name: entry.name,
          market: entry.market,
          exchange: entry.exchange,
          sector: entry.sector,
          currency: entry.currency,
        });
      }
      if (results.length >= 12) break;
    }
    return results;
  }

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const res = await batchGetQuotes([symbol]);
    const q = res.get(symbol);
    if (q) return q;
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  async getKline(symbol: string): Promise<KlinePoint[]> {
    // 优先本地表
    const k = await fetchKLine(symbol);
    if (k.length > 0) return k;
    // 尝试直接拉（symbol 即 QQ ticker）
    try {
      return fetchKLineGeneric(symbol);
    } catch {
      return [];
    }
  }

  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    // 财务数据暂用 mock，后续可接入 Tushare
    const { financials } = await import("./mock-data");
    return financials[symbol] ?? [];
  }

  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    const { events } = await import("./mock-data");
    return events[symbol] ?? [];
  }

  async listSectorOverviews(): Promise<SectorOverview[]> {
    const { sectors } = await import("./mock-data");
    return Object.values(sectors);
  }

  async getSectorOverview(sectorId: string): Promise<SectorOverview> {
    const { sectors } = await import("./mock-data");
    return sectors[sectorId] ?? sectors.ai!;
  }

  async getDashboardData(): Promise<DashboardData> {
    const { dashboard } = await import("./mock-data");

    // 用实时行情更新指数和自选股
    const indexTickers = ["sh000001", "hkHSI", "usIXIC.OQ"];
    const rawMap = await fetchQQQuotes(indexTickers);

    const shIdx = rawMap.get("sh000001");
    const hsi = rawMap.get("hkHSI");
    const ixic = rawMap.get("usIXIC.OQ");

    const watchSymbols = ["hk00700", "usNVDA", "sh600519"];
    const watchQuotes = await batchGetQuotes(watchSymbols);

    return {
      ...dashboard,
      indices: [
        { symbol: "000001", name: "上证指数", price: shIdx?.price ?? 3400, changePercent: shIdx?.changePercent ?? 0, market: "A股" as Market },
        { symbol: "HSI", name: "恒生指数",   price: hsi?.price ?? 19000, changePercent: hsi?.changePercent ?? 0, market: "港股" as Market },
        { symbol: "IXIC", name: "纳斯达克",  price: ixic?.price ?? 18000, changePercent: ixic?.changePercent ?? 0, market: "美股" as Market },
      ],
      watchlist: [...watchQuotes.values()],
    };
  }
}
