import type { MarketDataProvider } from "@/lib/types";
import { YahooFinanceProvider } from "./yahoo-provider";

// Mock provider 作为兜底
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

// 常见的用户输入别名 → 真实 symbol
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

let _provider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!_provider) {
    // DATA_SOURCE=yahoo 则用 Yahoo Finance 实时数据，否则用本地 mock
    _provider =
      process.env.DATA_SOURCE === "yahoo"
        ? new YahooFinanceProvider()
        : new MockMarketDataProvider();
  }
  return _provider;
}
