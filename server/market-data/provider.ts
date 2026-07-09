import type { MarketDataProvider, QuoteSnapshot } from "@/lib/types";
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

// ---------- Mock ----------

const SYMBOL_ALIASES: Record<string, string> = {
  sh300750: "sz300750",
  "300750": "sz300750",
  "00700": "hk00700",
  "0700": "hk00700",
  sh00700: "hk00700",
  sh07000: "hk00700",
};

function normalizeSymbol(symbol: string) {
  const raw = symbol.trim();
  const lower = raw.toLowerCase();
  const canonical = lower.startsWith("us") ? `us${raw.slice(2).toUpperCase()}` : lower;
  return SYMBOL_ALIASES[lower] ?? SYMBOL_ALIASES[canonical] ?? canonical;
}

function unknownSymbolError(symbol: string) {
  const value = symbol.trim() || symbol;
  return new Error(
    `暂未找到或无法获取股票代码「${value}」。请检查代码格式，或先通过搜索选择匹配结果。`
  );
}

function hasUsableQuote(quote: QuoteSnapshot | null | undefined): quote is QuoteSnapshot {
  return Number.isFinite(quote?.price) && Number(quote?.price) > 0;
}

function ensureSymbol(symbol: string) {
  const resolved = normalizeSymbol(symbol);
  if (!quotes[resolved]) throw unknownSymbolError(symbol);
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

// ---------- Timeout wrapper ----------

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

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const resolved = normalizeSymbol(symbol);
    const result = await this.race(
      QUOTE_TIMEOUT,
      () => this.inner.getQuote(resolved),
      null as unknown as QuoteSnapshot,
    );
    if (hasUsableQuote(result)) return result;
    // 回退 mock（含 PE/PB 等估值数据的 5 只预设股票）
    if (quotes[resolved]) return quotes[resolved]!;
    throw unknownSymbolError(symbol);
  }

  async searchSymbols(q: string): Promise<SymbolSearchResult[]> {
    return this.race(DATA_TIMEOUT, () => this.inner.searchSymbols(q), []);
  }
  async getKline(symbol: string): Promise<KlinePoint[]> {
    const resolved = normalizeSymbol(symbol);
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getKline(resolved), [] as KlinePoint[]);
    return r.length > 0 ? r : (klines[resolved] ?? []);
  }
  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    const resolved = normalizeSymbol(symbol);
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getFinancials(resolved), [] as FinancialSnapshot[]);
    return r.length > 0 ? r : (financials[resolved] ?? []);
  }
  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    const resolved = normalizeSymbol(symbol);
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getCompanyEvents(resolved), [] as CompanyEvent[]);
    return r.length > 0 ? r : (events[resolved] ?? []);
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
