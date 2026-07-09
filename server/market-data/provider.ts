import type { MarketDataProvider } from "@/lib/types";
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
  QuoteSnapshot,
  SectorOverview,
  SymbolSearchResult,
} from "@/lib/types";

const SYMBOL_ALIASES: Record<string, string> = {
  sh300750: "sz300750",
  sh00700: "hk00700",
  sh0700: "hk00700",
  sh07000: "hk00700",
};

function ensureSymbol(symbol: string) {
  const normalized = symbol.trim();
  const resolved = SYMBOL_ALIASES[normalized] ?? normalized;
  if (!quotes[resolved]) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }
  return resolved;
}

class MockMarketDataProvider implements MarketDataProvider {
  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return symbols;
    return symbols.filter(
      (item) =>
        item.symbol.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        item.sector.toLowerCase().includes(normalized) ||
        item.market.toLowerCase().includes(normalized)
    );
  }
  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    return quotes[ensureSymbol(symbol)];
  }
  async getKline(symbol: string): Promise<KlinePoint[]> {
    return klines[ensureSymbol(symbol)];
  }
  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    return financials[ensureSymbol(symbol)];
  }
  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    return events[ensureSymbol(symbol)];
  }
  async listSectorOverviews(): Promise<SectorOverview[]> {
    return Object.values(sectors);
  }
  async getSectorOverview(sectorId: string): Promise<SectorOverview> {
    return sectors[sectorId] ?? sectors.ai!;
  }
  async getDashboardData(): Promise<DashboardData> {
    return dashboard;
  }
}

/**
 * 8 秒超时包装器 —— 防止 Vercel Hobby (10s 限制) 卡死
 */
class TimeoutProvider implements MarketDataProvider {
  constructor(private inner: MarketDataProvider, private timeoutMs = 8000) {}

  private async withTimeout<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), this.timeoutMs)
        ),
      ]);
    } catch {
      return fallback;
    }
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    return this.withTimeout(() => this.inner.searchSymbols(query), []);
  }
  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    // 不在 mock 中的股票，用 5s 短超时 + 回退
    const result = await this.withTimeout(() => this.inner.getQuote(symbol), null as unknown as QuoteSnapshot);
    if (result) return result;
    // 回退到 mock
    if (quotes[symbol]) return quotes[symbol];
    throw new Error(`Unknown symbol: ${symbol}`);
  }
  async getKline(symbol: string): Promise<KlinePoint[]> {
    return this.withTimeout(() => this.inner.getKline(symbol), []);
  }
  async getFinancials(symbol: string): Promise<FinancialSnapshot[]> {
    return this.withTimeout(() => this.inner.getFinancials(symbol), []);
  }
  async getCompanyEvents(symbol: string): Promise<CompanyEvent[]> {
    return this.withTimeout(() => this.inner.getCompanyEvents(symbol), []);
  }
  async listSectorOverviews(): Promise<SectorOverview[]> {
    return this.withTimeout(() => this.inner.listSectorOverviews(), Object.values(sectors));
  }
  async getSectorOverview(sectorId: string): Promise<SectorOverview> {
    return this.withTimeout(() => this.inner.getSectorOverview(sectorId), sectors.ai!);
  }
  async getDashboardData(): Promise<DashboardData> {
    return this.withTimeout(() => this.inner.getDashboardData(), dashboard);
  }
}

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
    // 统一包 8s 超时，防止卡 Vercel 10s 限制
    _provider = new TimeoutProvider(inner, 8000);
  }
  return _provider!;
}
