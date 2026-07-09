import type {
  MarketDataMeta,
  MarketDataMode,
  MarketDataProvider,
  MarketDataResult,
  MarketDataSource,
  QuoteSnapshot,
} from "@/lib/types";
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

function hasData(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object" && "price" in value) {
    return hasUsableQuote(value as QuoteSnapshot);
  }
  return Boolean(value);
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

  private race<T>(ms: number, fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
    ]);
  }

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const resolved = normalizeSymbol(symbol);
    const result = await this.race(QUOTE_TIMEOUT, () => this.inner.getQuote(resolved));
    if (hasUsableQuote(result)) return result;
    throw unknownSymbolError(symbol);
  }

  async searchSymbols(q: string): Promise<SymbolSearchResult[]> {
    return this.race(DATA_TIMEOUT, () => this.inner.searchSymbols(q)).catch(() => []);
  }
  async getKline(symbol: string): Promise<KlinePoint[]> {
    const resolved = normalizeSymbol(symbol);
    return this.race(DATA_TIMEOUT, () => this.inner.getKline(resolved)).catch(() => []);
  }
  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    const resolved = normalizeSymbol(symbol);
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getFinancials(resolved)).catch(() => []);
    return r.length > 0 ? r : (financials[resolved] ?? []);
  }
  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    const resolved = normalizeSymbol(symbol);
    const r = await this.race(DATA_TIMEOUT, () => this.inner.getCompanyEvents(resolved)).catch(() => []);
    return r.length > 0 ? r : (events[resolved] ?? []);
  }
  async listSectorOverviews(): Promise<SectorOverview[]> {
    return this.race(DATA_TIMEOUT, () => this.inner.listSectorOverviews()).catch(() => Object.values(sectors));
  }
  async getSectorOverview(id: string): Promise<SectorOverview> {
    return this.race(DATA_TIMEOUT, () => this.inner.getSectorOverview(id)).catch(() => sectors.ai!);
  }
  async getDashboardData(): Promise<DashboardData> {
    return this.race(DATA_TIMEOUT, () => this.inner.getDashboardData()).catch(() => dashboard);
  }
}

export interface ObservableMarketDataProvider extends MarketDataProvider {
  getQuoteWithMeta(symbol: string): Promise<MarketDataResult<QuoteSnapshot>>;
  getKlineWithMeta(symbol: string): Promise<MarketDataResult<KlinePoint[]>>;
}

interface ProviderCandidate {
  source: MarketDataSource;
  label: string;
  provider: MarketDataProvider;
}

class ObservableFallbackMarketDataProvider implements ObservableMarketDataProvider {
  constructor(private candidates: ProviderCandidate[]) {}

  private meta<T>(
    source: ProviderCandidate,
    data: T,
    requestedSymbol?: string,
    resolvedSymbol?: string,
    message?: string,
  ): MarketDataResult<T> {
    const mode: MarketDataMode = source.source === "mock" ? "demo" : source === this.candidates[0] ? "live" : "fallback";
    return {
      data,
      meta: {
        source: source.source,
        sourceLabel: source.label,
        mode,
        fallbackUsed: source !== this.candidates[0],
        timestamp: new Date().toISOString(),
        requestedSymbol,
        resolvedSymbol,
        message,
      },
    };
  }

  private async resolve<T>(
    resolveFn: (provider: MarketDataProvider) => Promise<T>,
    isValid: (value: T) => boolean,
    requestedSymbol?: string,
  ): Promise<MarketDataResult<T>> {
    const failures: string[] = [];
    for (const candidate of this.candidates) {
      try {
        const result = await resolveFn(candidate.provider);
        if (isValid(result)) {
          const message = candidate.source === "mock"
            ? "当前使用稳定演示数据；切换 DATA_SOURCE=qq 或 yahoo 后可尝试实时行情。"
            : candidate !== this.candidates[0]
              ? "主数据源暂不可用，已切换到备用数据源。"
              : undefined;
          return this.meta(candidate, result, requestedSymbol, undefined, message);
        }
        failures.push(`${candidate.label}: empty`);
      } catch (error) {
        failures.push(`${candidate.label}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
    throw requestedSymbol ? unknownSymbolError(requestedSymbol) : new Error(failures.join("; ") || "No market data");
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const result = await this.resolve(
      (provider) => provider.searchSymbols(query),
      (items) => items.length > 0,
    ).catch(() => this.meta(this.candidates[this.candidates.length - 1]!, [] as SymbolSearchResult[], undefined, undefined, "未找到匹配股票。"));
    return result.data;
  }

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    return (await this.getQuoteWithMeta(symbol)).data;
  }

  async getQuoteWithMeta(symbol: string): Promise<MarketDataResult<QuoteSnapshot>> {
    const resolved = normalizeSymbol(symbol);
    const result = await this.resolve(
      (provider) => provider.getQuote(resolved),
      (quote) => hasUsableQuote(quote),
      symbol,
    );
    result.meta.resolvedSymbol = result.data.symbol;
    return result;
  }

  async getKline(symbol: string): Promise<KlinePoint[]> {
    return (await this.getKlineWithMeta(symbol)).data;
  }

  async getKlineWithMeta(symbol: string): Promise<MarketDataResult<KlinePoint[]>> {
    const resolved = normalizeSymbol(symbol);
    return this.resolve(
      (provider) => provider.getKline(resolved),
      (items) => items.length > 0,
      symbol,
    );
  }

  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    const resolved = normalizeSymbol(symbol);
    const result = await this.resolve(
      (provider) => provider.getFinancials(resolved),
      (items) => items.length > 0,
      symbol,
    ).catch(() => this.meta(this.candidates[this.candidates.length - 1]!, [] as FinancialSnapshot[], symbol));
    return result.data;
  }

  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    const resolved = normalizeSymbol(symbol);
    const result = await this.resolve(
      (provider) => provider.getCompanyEvents(resolved),
      (items) => items.length > 0,
      symbol,
    ).catch(() => this.meta(this.candidates[this.candidates.length - 1]!, [] as CompanyEvent[], symbol));
    return result.data;
  }

  async listSectorOverviews(): Promise<SectorOverview[]> {
    const result = await this.resolve(
      (provider) => provider.listSectorOverviews(),
      (items) => items.length > 0,
    ).catch(() => this.meta(this.candidates[this.candidates.length - 1]!, Object.values(sectors)));
    return result.data;
  }

  async getSectorOverview(id: string): Promise<SectorOverview> {
    const result = await this.resolve(
      (provider) => provider.getSectorOverview(id),
      hasData,
    ).catch(() => this.meta(this.candidates[this.candidates.length - 1]!, sectors.ai!));
    return result.data;
  }

  async getDashboardData(): Promise<DashboardData> {
    const result = await this.resolve(
      (provider) => provider.getDashboardData(),
      hasData,
    ).catch(() => this.meta(this.candidates[this.candidates.length - 1]!, dashboard));
    return result.data;
  }
}

// ---------- 导出 ----------

let _provider: ObservableMarketDataProvider | null = null;

function createYahooProvider() {
  try {
    const { YahooFinanceProvider } = require("./yahoo-provider");
    return new TimeoutProvider(new YahooFinanceProvider());
  } catch {
    console.warn("[provider] Yahoo module not available");
    return undefined;
  }
}

export function getMarketDataProvider(): ObservableMarketDataProvider {
  if (!_provider) {
    const src = process.env.DATA_SOURCE ?? "qq";
    const mockCandidate: ProviderCandidate = {
      source: "mock",
      label: "演示数据",
      provider: new MockMarketDataProvider(),
    };
    let candidates: ProviderCandidate[];
    switch (src) {
      case "mock":
      case "demo":
        candidates = [mockCandidate];
        break;
      case "yahoo": {
        const yahooFirst = createYahooProvider();
        candidates = [
          yahooFirst && {
            source: "yahoo" as const,
            label: "Yahoo Finance",
            provider: yahooFirst,
          },
          {
            source: "qq" as const,
            label: "腾讯行情",
            provider: new TimeoutProvider(new ChinaDataProvider()),
          },
          mockCandidate,
        ].filter(Boolean) as ProviderCandidate[];
        break;
      }
      case "qq":
      default: {
        const yahooFallback = createYahooProvider();
        candidates = [
          {
            source: "qq",
            label: "腾讯行情",
            provider: new TimeoutProvider(new ChinaDataProvider()),
          },
          yahooFallback && {
            source: "yahoo" as const,
            label: "Yahoo Finance",
            provider: yahooFallback,
          },
          mockCandidate,
        ].filter(Boolean) as ProviderCandidate[];
      }
    }
    _provider = new ObservableFallbackMarketDataProvider(candidates);
  }
  return _provider!;
}
