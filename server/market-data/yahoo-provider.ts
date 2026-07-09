import yahooFinance from "yahoo-finance2";
import type {
  CompanyEvent,
  DashboardData,
  FinancialSnapshot,
  KlinePoint,
  Market,
  MarketDataProvider,
  MarketIndex,
  QuoteSnapshot,
  SectorOverview,
  SymbolSearchResult,
} from "@/lib/types";
import {
  dashboard as mockDashboard,
  events as mockEvents,
  financials as mockFinancials,
  klines as mockKlines,
  sectors as mockSectors,
  symbols as mockSymbols,
  quotes as mockQuotes,
} from "./mock-data";

// -------- 内部 symbol → Yahoo Finance symbol --------
const TO_YAHOO: Record<string, string> = {
  sh600519: "600519.SS",
  sz300750: "300750.SZ",
  hk00700: "0700.HK",
  usNVDA: "NVDA",
  usAAPL: "AAPL",
  // 更多热门标的（可以直接输入代码搜索）
  sz000858: "000858.SZ",
  sz002594: "002594.SZ",
  usMSFT: "MSFT",
  usGOOGL: "GOOGL",
  usAMZN: "AMZN",
  usMETA: "META",
  usTSLA: "TSLA",
  hk09988: "9988.HK",
  hk01810: "1810.HK",
};

// 反向映射
const FROM_YAHOO: Record<string, string> = {};
for (const [internal, yahoo] of Object.entries(TO_YAHOO)) {
  FROM_YAHOO[yahoo.toUpperCase()] = internal;
}

interface StockMeta {
  market: Market;
  exchange: string;
  sector: string;
  currency: string;
}

const META: Record<string, StockMeta> = {
  sh600519: { market: "A股", exchange: "上交所", sector: "白酒", currency: "CNY" },
  sz300750: { market: "A股", exchange: "深交所", sector: "新能源", currency: "CNY" },
  hk00700: { market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  usNVDA: { market: "美股", exchange: "NASDAQ", sector: "半导体", currency: "USD" },
  usAAPL: { market: "美股", exchange: "NASDAQ", sector: "消费电子", currency: "USD" },
  sz000858: { market: "A股", exchange: "深交所", sector: "白酒", currency: "CNY" },
  sz002594: { market: "A股", exchange: "深交所", sector: "汽车", currency: "CNY" },
  usMSFT: { market: "美股", exchange: "NASDAQ", sector: "软件", currency: "USD" },
  usGOOGL: { market: "美股", exchange: "NASDAQ", sector: "互联网", currency: "USD" },
  usAMZN: { market: "美股", exchange: "NASDAQ", sector: "电商", currency: "USD" },
  usMETA: { market: "美股", exchange: "NASDAQ", sector: "互联网", currency: "USD" },
  usTSLA: { market: "美股", exchange: "NASDAQ", sector: "汽车", currency: "USD" },
  hk09988: { market: "港股", exchange: "港交所", sector: "互联网", currency: "HKD" },
  hk01810: { market: "港股", exchange: "港交所", sector: "消费电子", currency: "HKD" },
};

const ALL_INTERNAL = Object.keys(TO_YAHOO);

// -------- 工具函数 --------

function toInternal(yahooSymbol: string): string {
  const raw = yahooSymbol.trim();
  const upper = raw.toUpperCase();
  if (FROM_YAHOO[upper]) return FROM_YAHOO[upper]!;
  if (/^\d{6}\.SS$/.test(upper)) return `sh${upper.slice(0, 6)}`;
  if (/^\d{6}\.SZ$/.test(upper)) return `sz${upper.slice(0, 6)}`;
  if (/^\d{1,5}\.HK$/.test(upper)) return `hk${upper.replace(".HK", "").padStart(5, "0")}`;
  if (/^[A-Z][A-Z0-9.-]*$/.test(upper)) return `us${upper.replace("-", "_")}`;
  return raw;
}

function toYahoo(internalSymbol: string): string {
  const raw = internalSymbol.trim();
  const normalized = raw.startsWith("us") ? `us${raw.slice(2).toUpperCase()}` : raw.toLowerCase();
  if (TO_YAHOO[normalized]) return TO_YAHOO[normalized]!;
  if (/^sh\d{6}$/.test(normalized)) return `${normalized.slice(2)}.SS`;
  if (/^sz\d{6}$/.test(normalized)) return `${normalized.slice(2)}.SZ`;
  if (/^hk\d{5}$/.test(normalized)) return `${normalized.slice(2).slice(-4)}.HK`;
  if (/^us[A-Z0-9_.-]+$/.test(normalized)) return normalized.slice(2).replace("_", "-");
  if (/^[A-Za-z][A-Za-z0-9_.-]*$/.test(raw)) return raw.toUpperCase().replace("_", "-");
  return raw;
}

function getMeta(internal: string): StockMeta {
  if (META[internal]) return META[internal]!;
  if (internal.startsWith("sh")) {
    return { market: "A股", exchange: "上交所", sector: "—", currency: "CNY" };
  }
  if (internal.startsWith("sz")) {
    return { market: "A股", exchange: "深交所", sector: "—", currency: "CNY" };
  }
  if (internal.startsWith("hk")) {
    return { market: "港股", exchange: "港交所", sector: "—", currency: "HKD" };
  }
  return { market: "美股" as Market, exchange: "—", sector: "—", currency: "USD" };
}

/** eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuote(yahooSymbol: string, q: Record<string, any>): QuoteSnapshot {
  const internal = toInternal(yahooSymbol);
  const m = getMeta(internal);
  let name: string = internal;
  if (typeof q.shortName === "string") name = q.shortName;
  else if (typeof q.longName === "string") name = q.longName;
  return {
    symbol: internal,
    name,
    market: m.market,
    exchange: m.exchange,
    sector: m.sector,
    currency: m.currency,
    price: Number(q.regularMarketPrice ?? 0),
    change: Number(q.regularMarketChange ?? 0),
    changePercent: Number(q.regularMarketChangePercent ?? 0),
    volume: String(q.regularMarketVolume ?? 0),
    turnover: q.regularMarketPrice && q.regularMarketVolume
      ? `${((Number(q.regularMarketPrice) * Number(q.regularMarketVolume)) / 1e8).toFixed(1)}亿`
      : "—",
    peTtm: Number(q.trailingPE ?? 0),
    pb: Number(q.priceToBook ?? 0),
    ps: Number(q.priceToSalesTrailing12Months ?? 0),
    dividendYield: q.dividendYield ? Number(q.dividendYield) * 100 : 0,
    weekChangePercent: q["52WeekChange"] ? Number(q["52WeekChange"]) * 100 : 0,
    yearHigh: Number(q.fiftyTwoWeekHigh ?? 0),
    yearLow: Number(q.fiftyTwoWeekLow ?? 0),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapKline(raw: any): KlinePoint[] {
  const r = raw?.chart?.result?.[0];
  if (!r?.timestamp) return [];
  const timestamps: number[] = r.timestamp;
  const close: Array<number | null> = r.indicators?.quote?.[0]?.close ?? [];
  const points: KlinePoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = close[i];
    if (typeof c !== "number") continue;
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
    points.push({ date, close: c });
  }
  return points.slice(-7);
}

// 搜索别名
const SEARCH_ALIASES: Record<string, string> = {
  sh300750: "sz300750",
  sh00700: "hk00700",
  "300750": "sz300750",
  "00700": "hk00700",
  "0700": "hk00700",
  // 常见中文名 → symbol
  "腾讯": "hk00700", "腾讯控股": "hk00700",
  "茅台": "sh600519", "贵州茅台": "sh600519",
  "英伟达": "usNVDA", "nvidia": "usNVDA",
  "宁德": "sz300750", "宁德时代": "sz300750",
  "苹果": "usAAPL", "apple": "usAAPL",
  "五粮液": "sz000858",
  "比亚迪": "sz002594", "byd": "sz002594",
  "微软": "usMSFT", "microsoft": "usMSFT",
  "谷歌": "usGOOGL", "google": "usGOOGL",
  "亚马逊": "usAMZN", "amazon": "usAMZN",
  "meta": "usMETA", "facebook": "usMETA",
  "特斯拉": "usTSLA", "tesla": "usTSLA",
  "阿里": "hk09988", "阿里巴巴": "hk09988",
  "小米": "hk01810", "xiaomi": "hk01810",
  "tsla": "usTSLA", "msft": "usMSFT", "amzn": "usAMZN", "googl": "usGOOGL",
};

function guessMarket(exchange: string): Market {
  if (exchange?.includes("HK")) return "港股";
  if (exchange?.includes("SS") || exchange?.includes("SZ")) return "A股";
  return "美股";
}

// -------- Provider --------

export class YahooFinanceProvider implements MarketDataProvider {
  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return ALL_INTERNAL.map((s) => {
        const m = getMeta(s);
        return { symbol: s, name: s, market: m.market, exchange: m.exchange, sector: m.sector, currency: m.currency };
      });
    }

    const alias = SEARCH_ALIASES[q] ?? SEARCH_ALIASES[query.trim()];
    if (alias) {
      const m = getMeta(alias);
      const name = await this.resolveName(alias);
      return [{ symbol: alias, name, market: m.market, exchange: m.exchange, sector: m.sector, currency: m.currency }];
    }

    try {
      // Yahoo search 在某些地区（如中国大陆）可能不可用，直接走 mock 搜索 + 反向匹配
      const result: any = await yahooFinance.search(q, { quotesCount: 8 });
      const items: any[] = (result.quotes ?? []).filter(
        (item: any) => item.quoteType === "EQUITY" && item.symbol
      );
      if (items.length > 0) {
        return items.map((item: any) => ({
          symbol: toInternal(item.symbol!),
          name: item.shortname ?? item.longname ?? item.symbol!,
          market: guessMarket(item.exchange ?? ""),
          exchange: item.exchange ?? "",
          sector: item.sector ?? "",
          currency: item.currency ?? "USD",
        }));
      }
      // Yahoo 返回空结果 → 兜底
      throw new Error("Empty search result");
    } catch {
      // 兜底：已知 symbol 匹配 + mock 模糊搜索
      const fromMock = mockSymbols.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      );
      if (fromMock.length > 0) return fromMock;

      // 尝试把搜索词当作代码直接查一下行情，验证是否存在
      const possibleYahoo = toYahoo(query.trim());
      if (possibleYahoo !== query.trim() || /^[a-zA-Z0-9.]+$/.test(query.trim())) {
        try {
          const testQuote: any = await yahooFinance.quote(possibleYahoo);
          if (testQuote?.regularMarketPrice) {
            const internal = toInternal(possibleYahoo);
            const m = getMeta(internal);
            return [{
              symbol: internal,
              name: (testQuote.shortName ?? testQuote.longName ?? query.trim()) as string,
              market: guessMarket(testQuote.exchange ?? "") || m.market,
              exchange: (testQuote.exchange ?? m.exchange) as string,
              sector: (testQuote.sector ?? m.sector) as string,
              currency: (testQuote.currency ?? m.currency) as string,
            }];
          }
        } catch { /* 也查不到就算了 */ }
      }
      return [];
    }
  }

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const yahoo = toYahoo(symbol);
    try {
      const q: any = await yahooFinance.quote(yahoo);
      const quote = mapQuote(yahoo, q);
      if (quote.price > 0) return quote;
      throw new Error(`Empty quote: ${symbol}`);
    } catch (error) {
      if (mockQuotes[symbol]) {
        throw new Error(`Yahoo quote unavailable for ${symbol}: ${error instanceof Error ? error.message : "failed"}`);
      }
      throw new Error(`Unknown symbol: ${symbol}`);
    }
  }

  async getKline(symbol: string): Promise<KlinePoint[]> {
    const yahoo = toYahoo(symbol);
    try {
      const raw: any = await yahooFinance.chart(yahoo, {
        period1: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        interval: "1d",
      });
      return mapKline(raw);
    } catch {
      return [];
    }
  }

  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    try {
      const yahoo = toYahoo(symbol);
      const modules: any = await yahooFinance.quoteSummary(yahoo, {
        modules: ["financialData", "incomeStatementHistory"],
      });
      const fd = modules.financialData;
      const m = getMeta(symbol);
      const rows: FinancialSnapshot[] = [];

      if (fd) {
        rows.push({
          period: "TTM",
          revenue: (Number(fd.totalRevenue ?? 0)) / 1e8,
          revenueYoY: fd.revenueGrowth ? Number(fd.revenueGrowth) * 100 : 0,
          netIncome: (Number(fd.netIncomeToCommon ?? 0)) / 1e8,
          netIncomeYoY: 0,
          grossMargin: fd.grossMargins ? Number(fd.grossMargins) * 100 : 0,
          operatingCashFlow: (Number(fd.totalCashFromOperatingActivities ?? 0)) / 1e8,
          currency: m.currency,
        });
      }

      const incomeHistory: any[] = modules.incomeStatementHistory?.incomeStatementHistory ?? [];
      for (const ih of incomeHistory.slice(0, 2)) {
        const rev = (Number(ih.totalRevenue ?? 0)) / 1e8;
        const ni = (Number(ih.netIncome ?? 0)) / 1e8;
        rows.push({
          period: ih.endDate ? String(ih.endDate.getFullYear?.() ?? "") : "",
          revenue: rev,
          revenueYoY: 0,
          netIncome: ni,
          netIncomeYoY: 0,
          grossMargin: Number(ih.totalRevenue) ? (Number(ih.grossProfit ?? 0) / Number(ih.totalRevenue)) * 100 : 0,
          operatingCashFlow: 0,
          currency: m.currency,
        });
      }
      return rows.length > 0 ? rows : (mockFinancials[symbol] ?? []);
    } catch {
      return mockFinancials[symbol] ?? [];
    }
  }

  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    return mockEvents[symbol] ?? [];
  }

  async listSectorOverviews(): Promise<SectorOverview[]> {
    return Object.values(mockSectors);
  }

  async getSectorOverview(sectorId: string): Promise<SectorOverview> {
    return mockSectors[sectorId] ?? mockSectors.ai!;
  }

  async getDashboardData(): Promise<DashboardData> {
    try {
      const indexSymbols = ["000001.SS", "^HSI", "^IXIC"];
      const indexResults = await Promise.allSettled(
        indexSymbols.map((s) => yahooFinance.quote(s))
      );
      const liveIndices: MarketIndex[] = [
        {
          symbol: "000001.SS", name: "上证指数",
          price: indexResults[0].status === "fulfilled" ? (indexResults[0].value as any).regularMarketPrice ?? 0 : 0,
          changePercent: indexResults[0].status === "fulfilled" ? (indexResults[0].value as any).regularMarketChangePercent ?? 0 : 0,
          market: "A股" as Market,
        },
        {
          symbol: "^HSI", name: "恒生指数",
          price: indexResults[1].status === "fulfilled" ? (indexResults[1].value as any).regularMarketPrice ?? 0 : 0,
          changePercent: indexResults[1].status === "fulfilled" ? (indexResults[1].value as any).regularMarketChangePercent ?? 0 : 0,
          market: "港股" as Market,
        },
        {
          symbol: "^IXIC", name: "纳斯达克",
          price: indexResults[2].status === "fulfilled" ? (indexResults[2].value as any).regularMarketPrice ?? 0 : 0,
          changePercent: indexResults[2].status === "fulfilled" ? (indexResults[2].value as any).regularMarketChangePercent ?? 0 : 0,
          market: "美股" as Market,
        },
      ];

      const wlSymbols = ["hk00700", "usNVDA"];
      const wlResults = await Promise.allSettled(
        wlSymbols.map((s) => yahooFinance.quote(TO_YAHOO[s]!))
      );
      const liveWatchlist: QuoteSnapshot[] = wlSymbols.map((s, i) => {
        const r = wlResults[i];
        if (r.status === "fulfilled") return mapQuote(TO_YAHOO[s]!, r.value);
        const m = getMeta(s);
        return {
          symbol: s, name: s, market: m.market, exchange: m.exchange, sector: m.sector, currency: m.currency,
          price: 0, change: 0, changePercent: 0, volume: "", turnover: "",
          peTtm: 0, pb: 0, ps: 0, dividendYield: 0, weekChangePercent: 0, yearHigh: 0, yearLow: 0, updatedAt: "",
        };
      });

      return { ...mockDashboard, indices: liveIndices, watchlist: liveWatchlist };
    } catch {
      return mockDashboard;
    }
  }

  private async resolveName(symbol: string): Promise<string> {
    const mockEntry = mockSymbols.find((s) => s.symbol === symbol);
    if (mockEntry) return mockEntry.name;
    try {
      const q: any = await yahooFinance.quote(toYahoo(symbol));
      return (q.shortName ?? q.longName ?? symbol) as string;
    } catch {
      return symbol;
    }
  }
}
