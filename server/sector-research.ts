import type { QuoteSnapshot, SectorOverview } from "@/lib/types";
import { getMarketDataProvider } from "@/server/market-data/provider";

export interface SectorResearchCard {
  sector: SectorOverview;
  leaders: QuoteSnapshot[];
  avgWeekChangePercent: number;
  avgPeTtm: number;
  ideaCount: number;
}

export function sectorMomentumTone(value: number) {
  if (value > 1) return "较强";
  if (value < -1) return "偏弱";
  return "中性";
}

export function buildSectorIdeas(sector: SectorOverview, leaders: QuoteSnapshot[]) {
  return leaders.map((quote) => ({
    id: `${sector.id}-${quote.symbol}`,
    symbol: quote.symbol,
    name: quote.name,
    title: `${sector.name} / ${quote.name}`,
    thesis: `${sector.trends[0]}，可用 ${quote.name} 的收入增速、估值水位和短期事件做交叉验证。`,
    checkpoints: [
      `近 7 日涨跌幅 ${quote.weekChangePercent.toFixed(2)}%，观察动量是否由成交额配合。`,
      `PE-TTM ${quote.peTtm.toFixed(1)}，对照同主题景气预期检查估值弹性。`,
      `下一步进入个股页复核财务摘要、事件时间线和 AI 快速分析。`
    ],
    risk: sector.risks[0] ?? "主题热度变化较快，需要持续验证基本面。"
  }));
}

async function attachLeaderQuotes(sector: SectorOverview): Promise<SectorResearchCard> {
  const provider = getMarketDataProvider();
  const leaders = await Promise.all(sector.leaders.map((leader) => provider.getQuote(leader.symbol)));
  const avgWeekChangePercent =
    leaders.reduce((total, quote) => total + quote.weekChangePercent, 0) / Math.max(leaders.length, 1);
  const avgPeTtm = leaders.reduce((total, quote) => total + quote.peTtm, 0) / Math.max(leaders.length, 1);

  return {
    sector,
    leaders,
    avgWeekChangePercent,
    avgPeTtm,
    ideaCount: buildSectorIdeas(sector, leaders).length
  };
}

export async function getSectorResearchCards() {
  const sectors = await getMarketDataProvider().listSectorOverviews();
  return Promise.all(sectors.map(attachLeaderQuotes));
}

export async function getSectorResearchDetail(sectorId: string) {
  const sector = await getMarketDataProvider().getSectorOverview(sectorId);
  const card = await attachLeaderQuotes(sector);
  return {
    ...card,
    ideas: buildSectorIdeas(sector, card.leaders)
  };
}
