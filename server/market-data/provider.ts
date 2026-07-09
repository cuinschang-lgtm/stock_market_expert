import type { MarketDataProvider } from "@/lib/types";
import { ChinaDataProvider } from "./qq-provider";

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
    const src = process.env.DATA_SOURCE ?? "qq";
    switch (src) {
      case "mock":
        _provider = new MockMarketDataProvider();
        break;
      case "yahoo":
        // 尝试加载 Yahoo provider（如未安装则回退 qq）
        try {
          const { YahooFinanceProvider } = require("./yahoo-provider");
          _provider = new YahooFinanceProvider();
        } catch {
          console.warn("[provider] Yahoo module not available, falling back to qq");
          _provider = new ChinaDataProvider();
        }
        break;
      case "qq":
      default:
        _provider = new ChinaDataProvider();
    }
  }
  return _provider!;
}
