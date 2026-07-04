import type {
  CompanyEvent,
  DashboardData,
  FinancialSnapshot,
  KlinePoint,
  MarketDataProvider,
  QuoteSnapshot,
  SectorOverview,
  SymbolSearchResult
} from "@/lib/types";
import { dashboard, events, financials, klines, quotes, sectors, symbols } from "./mock-data";

function ensureSymbol(symbol: string) {
  const normalized = symbol.trim();
  if (!quotes[normalized]) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }
  return normalized;
}

class MockMarketDataProvider implements MarketDataProvider {
  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return symbols;

    return symbols.filter((item) => {
      return (
        item.symbol.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        item.sector.toLowerCase().includes(normalized) ||
        item.market.toLowerCase().includes(normalized)
      );
    });
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

  async getSectorOverview(sectorId: string): Promise<SectorOverview> {
    const sector = sectors[sectorId] ?? sectors.ai;
    return sector;
  }

  async getDashboardData(): Promise<DashboardData> {
    return dashboard;
  }
}

export function getMarketDataProvider(): MarketDataProvider {
  return new MockMarketDataProvider();
}
