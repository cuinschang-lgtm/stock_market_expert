export type Market = "A股" | "港股" | "美股";

export type Trend = "up" | "down" | "flat";

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  market: Market;
  exchange: string;
  sector: string;
  currency: string;
}

export interface QuoteSnapshot extends SymbolSearchResult {
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  turnover: string;
  peTtm: number;
  pb: number;
  ps: number;
  dividendYield: number;
  weekChangePercent: number;
  yearHigh: number;
  yearLow: number;
  updatedAt: string;
}

export interface KlinePoint {
  date: string;
  close: number;
}

export interface FinancialSnapshot {
  period: string;
  revenue: number;
  revenueYoY: number;
  netIncome: number;
  netIncomeYoY: number;
  grossMargin: number;
  operatingCashFlow: number;
  currency: string;
}

export interface CompanyEvent {
  id: string;
  date: string;
  type: "财报" | "公告" | "行业" | "宏观" | "分红" | "回购";
  title: string;
  impact: "利好" | "利空" | "中性";
  summary: string;
  source: string;
}

export interface SectorOverview {
  id: string;
  name: string;
  description: string;
  leaders: SymbolSearchResult[];
  trends: string[];
  risks: string[];
}

export interface WatchlistItem {
  symbol: string;
  group: string;
  addedAt: string;
}

export type ResearchNoteStatus = "active" | "archived";

export type ThesisConviction = "low" | "medium" | "high";

export interface InvestmentThesis {
  coreHypothesis: string;
  keyMetrics: string[];
  catalysts: string[];
  invalidationSignals: string[];
  conviction?: ThesisConviction;
  nextReviewAt?: string;
  updatedAt?: string;
}

export interface ResearchNote {
  id: string;
  title: string;
  symbol?: string;
  tag: string;
  createdAt: string;
  updatedAt?: string;
  excerpt: string;
  body?: string | null;
  status?: ResearchNoteStatus;
  thesis?: InvestmentThesis | null;
  report?: AnalystReport | null;
}

export interface UpdateResearchNoteInput {
  title?: string;
  tag?: string;
  excerpt?: string;
  body?: string | null;
  status?: ResearchNoteStatus;
  thesis?: InvestmentThesis | null;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  price: number;
  changePercent: number;
  market: Market;
}

export interface DashboardEvent {
  time: string;
  title: string;
  scope: string;
  impact: "高" | "中" | "低";
}

export interface DashboardData {
  indices: MarketIndex[];
  hotSectors: Array<{
    name: string;
    changePercent: number;
    reason: string;
  }>;
  watchlist: QuoteSnapshot[];
  events: DashboardEvent[];
  notes: ResearchNote[];
}

export interface AnalystReport {
  id: string;
  intent: "stock_analysis" | "sector_analysis" | "idea_generation";
  target: string;
  generatedAt: string;
  summary: string;
  sections: Array<{
    title: string;
    points: string[];
  }>;
  sources: Array<{
    label: string;
    timestamp: string;
  }>;
  disclaimer: string;
}

export interface MarketDataProvider {
  searchSymbols(query: string): Promise<SymbolSearchResult[]>;
  getQuote(symbol: string): Promise<QuoteSnapshot>;
  getKline(symbol: string): Promise<KlinePoint[]>;
  getFinancials(symbol: string): Promise<FinancialSnapshot[]>;
  getCompanyEvents(symbol: string): Promise<CompanyEvent[]>;
  listSectorOverviews(): Promise<SectorOverview[]>;
  getSectorOverview(sectorId: string): Promise<SectorOverview>;
  getDashboardData(): Promise<DashboardData>;
}
