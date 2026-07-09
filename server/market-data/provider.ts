import type { Market, MarketDataProvider, QuoteSnapshot } from "@/lib/types";
import { ChinaDataProvider } from "./qq-provider";

// Mock provider as fallback
import {
  dashboard,
  events,
  financials,
  klines,
  quotes,
  sectors,
  symbols,
} from "./mock-data";
import type {
  CompanyEvent,
  DashboardData,
  FinancialSnapshot,
  KlinePoint,
  SectorOverview,
  SymbolSearchResult,
} from "@/lib/types";

// ---------- 占位行情（用于超时/不可达时的安全兜底）----------

function placeholderQuote(symbol: string): QuoteSnapshot {
  const market = (
    symbol.startsWith("sh") || symbol.startsWith("sz") ? "A股" :
    symbol.startsWith("hk") ? "港股" : "美股"
  ) as Market;
  const currency = market === "港股" ? "HKD" : market === "美股" ? "USD" : "CNY";
  return {
    symbol,
    name: symbol,
    market,
    exchange: "",
    sector: "",
    currency,
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "",
    turnover: "—",
    peTtm: 0,
    pb: 0,
    ps: 0,
    dividendYield: 0,
    weekChangePercent: 0,
    yearHigh: 0,
    yearLow: 0,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

// ---------- Mock ----------

const SYMBOL_ALIASES: Record<string, string> = {
  sh300750: "sz300750",
  sh00700: "hk00700",
  sh0700: "hk00700",
  sh07000: "hk00700",
};

function ensureSymbol(symbol: string) {
  const normalized = symbol.trim();
  const resolved = SYMBOL_ALIASES[normalized] ?? normalized;
  if (!quotes[resolved]) throw new Error(`Unknown symbol: ${symbol}`);
  return resolved;
}

class MockMarketDataProvider implements MarketDataProvider {
  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return symbols;
    return symbols.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        s.market.toLowerCase().includes(q),
    );
  }
  async getQuote(symbol: string)            { return quotes[ensureSymbol(symbol)]; }
  async getKline(symbol: string)            { return klines[ensureSymbol(symbol)]; }
  async getFinancials(symbol: string)       { return financials[ensureSymbol(symbol)]; }
  async getCompanyEvents(symbol: string)    { return events[ensureSymbol(symbol)]; }
  async listSectorOverviews()               { return Object.values(sectors); }
  async getSectorOverview(id: string)       { return sectors[id] ?? sectors.ai!; }
  async getDashboardData()                  { return dashboard; }
}

// ---------- Timeout wrapper (永远不抛，安全兜底) ----------

const IS_VERCEL = !!process.env.VERCEL;
const QUOTE_TIMEOUT = IS_VERCEL ? 4000 : 8000;   // Vercel 美国节点，4s 就够了
const DATA_TIMEOUT  = IS_VERCEL ? 3000 : 6000;

class TimeoutProvider implements MarketDataProvider {
  constructor(private inner: MarketDataProvider) {}

  private race<T>(ms: number, fn: () => Promise<T>, fallback: T): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
    ]).catch(() => fallback);
  }

  // ---- 核心：getQuote 永不抛 ----
  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const result = await this.race(
      QUOTE_TIMEOUT,
      () => this.inner.getQuote(symbol),
      null as unknown as QuoteSnapshot,
    );
    if (result?.price && result.price > 0) return result;
    // 回退 mock（含 PE/PB 等估值数据的 5 只预设股票）
    if (quotes[symbol]) return quotes[symbol]!;
    // 非预设股票：返回占位行情，页面仍可安全渲染
    return placeholderQuote(symbol);
  }

  async searchSymbols(q: string): Promise<SymbolSearchResult[]> {
    return this.race(DATA_TIMEOUT, () => this.inner.searchSymbols(q), []);
  }
  async getKline(symbol: string): Promise<KlinePoint[]> {
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getKline(symbol), [] as KlinePoint[]);
    return r.length > 0 ? r : (klines[symbol] ?? []);
  }
  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getFinancials(symbol), [] as FinancialSnapshot[]);
    return r.length > 0 ? r : (financials[symbol] ?? []);
  }
  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getCompanyEvents(symbol), [] as CompanyEvent[]);
    return r.length > 0 ? r : (events[symbol] ?? []);
  }
  async listSectorOverviews(): Promise<SectorOverview[]> {
    return this.race(DATA_TIMEOUT, () => this.inner.listSectorOverviews(), Object.values(sectors));
  }
  async getSectorOverview(id: string): Promise<SectorOverview> {
    return this.race(DATA_TIMEOUT, () => this.inner.getSectorOverview(id), sectors.ai!);
  }
  async getDashboardData(): Promise<DashboardData> {
    return this.race(DATA_TIMEOUT, () => this.inner.getDashboardData(), dashboard);
  }
}

// ---------- 导出 ----------

let _provider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!_provider) {
    const src = process.env.DATA_SOURCE ?? "qq";
    let inner: MarketDataProvider;
    switch (src) {
      case "mock":
        inner = new MockMarketDataProvider();
        break;
      case "yahoo":
        try {
          const { YahooFinanceProvider } = require("./yahoo-provider");
          inner = new YahooFinanceProvider();
        } catch {
          console.warn("[provider] Yahoo module not available, using qq");
          inner = new ChinaDataProvider();
        }
        break;
      case "qq":
      default:
        inner = new ChinaDataProvider();
    }
    _provider = new TimeoutProvider(inner);
  }
  return _provider!;
}
