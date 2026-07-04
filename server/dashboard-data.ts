import type { DashboardData, MarketDataProvider, QuoteSnapshot, ResearchNote } from "@/lib/types";
import { getMarketDataProvider } from "@/server/market-data/provider";
import { listResearchNotes, listWatchlistItems } from "@/server/supabase/repositories";

type DashboardSource = "cloud" | "mock";

interface CloudWatchlistItem {
  symbol: string;
  name: string;
  market: string;
  group: string;
  price: number;
  changePercent: number;
  currency: string;
  addedAt: string;
}

export interface DashboardViewData extends DashboardData {
  sources: {
    watchlist: DashboardSource;
    notes: DashboardSource;
  };
}

function normalizeMarket(market: string): QuoteSnapshot["market"] {
  if (market === "港股" || market === "美股") return market;
  return "A股";
}

function fallbackQuoteFromWatchlist(item: CloudWatchlistItem): QuoteSnapshot {
  return {
    symbol: item.symbol,
    name: item.name,
    market: normalizeMarket(item.market),
    exchange: item.market,
    sector: item.group,
    currency: item.currency,
    price: item.price,
    change: 0,
    changePercent: item.changePercent,
    volume: "-",
    turnover: "-",
    peTtm: 0,
    pb: 0,
    ps: 0,
    dividendYield: 0,
    weekChangePercent: item.changePercent,
    yearHigh: item.price,
    yearLow: item.price,
    updatedAt: item.addedAt
  };
}

async function resolveWatchlistQuote(provider: MarketDataProvider, item: CloudWatchlistItem) {
  try {
    return await provider.getQuote(item.symbol);
  } catch {
    return fallbackQuoteFromWatchlist(item);
  }
}

async function loadCloudWatchlist(provider: MarketDataProvider): Promise<QuoteSnapshot[] | null> {
  try {
    const result = await listWatchlistItems();
    if (!result.configured || result.items.length === 0) return null;
    return Promise.all(result.items.map((item) => resolveWatchlistQuote(provider, item)));
  } catch {
    return null;
  }
}

async function loadCloudNotes(): Promise<ResearchNote[] | null> {
  try {
    const result = await listResearchNotes();
    if (!result.configured || result.notes.length === 0) return null;
    return result.notes.slice(0, 4);
  } catch {
    return null;
  }
}

export async function getDashboardViewData(): Promise<DashboardViewData> {
  const provider = getMarketDataProvider();
  const base = await provider.getDashboardData();
  const [cloudWatchlist, cloudNotes] = await Promise.all([loadCloudWatchlist(provider), loadCloudNotes()]);

  return {
    ...base,
    watchlist: cloudWatchlist ?? base.watchlist,
    notes: cloudNotes ?? base.notes,
    sources: {
      watchlist: cloudWatchlist ? "cloud" : "mock",
      notes: cloudNotes ? "cloud" : "mock"
    }
  };
}
