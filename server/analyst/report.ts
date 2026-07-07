import type { AnalystReport, CompanyEvent, FinancialSnapshot, QuoteSnapshot } from "@/lib/types";
import { getMarketDataProvider } from "@/server/market-data/provider";

function latestFinancial(financials: FinancialSnapshot[]) {
  return financials[0];
}

function eventLine(event: CompanyEvent) {
  return `${event.date} ${event.type}：${event.title}，影响标记为${event.impact}。`;
}

export async function generateStockFastReport(symbol: string): Promise<AnalystReport> {
  const provider = getMarketDataProvider();
  const quote: QuoteSnapshot = await provider.getQuote(symbol);
  const financials = await provider.getFinancials(symbol);
  const companyEvents = await provider.getCompanyEvents(symbol);
  const latest = latestFinancial(financials);
  const generatedAt = new Date().toISOString();
  const priceMood = quote.weekChangePercent >= 0 ? "短期表现强于观望线" : "短期仍处在整理阶段";
  const valuation =
    quote.peTtm > 40
      ? "估值对增长兑现要求较高"
      : quote.peTtm < 20
        ? "估值处于相对克制区间"
        : "估值处于中性观察区间";

  return {
    id: `analysis-${quote.symbol}-${Date.now()}`,
    intent: "stock_analysis",
    target: `${quote.name} (${quote.symbol})`,
    generatedAt,
    summary: `${quote.name}当前更适合用“基本面兑现 + 事件催化 + 估值水位”三条线跟踪；${priceMood}，${valuation}。`,
    sections: [
      {
        title: "当前位置",
        points: [
          `最新价 ${quote.currency} ${quote.price.toFixed(2)}，当日涨跌幅 ${quote.changePercent.toFixed(2)}%。`,
          `近 7 日涨跌幅 ${quote.weekChangePercent.toFixed(2)}%，52 周区间为 ${quote.currency} ${quote.yearLow.toFixed(2)} - ${quote.yearHigh.toFixed(2)}。`,
          `成交额 ${quote.turnover}，需要结合后续成交放大或缩量判断趋势质量。`
        ]
      },
      {
        title: "估值水位",
        points: [
          `PE-TTM ${quote.peTtm.toFixed(1)}，PB ${quote.pb.toFixed(1)}，PS ${quote.ps.toFixed(1)}，股息率 ${quote.dividendYield.toFixed(2)}%。`,
          `最近一期 ${latest.period} 收入 ${latest.currency} ${latest.revenue.toFixed(1)} 亿，同比 ${latest.revenueYoY.toFixed(1)}%；净利润 ${latest.currency} ${latest.netIncome.toFixed(1)} 亿，同比 ${latest.netIncomeYoY.toFixed(1)}%。`,
          `毛利率 ${latest.grossMargin.toFixed(1)}%，经营现金流 ${latest.currency} ${latest.operatingCashFlow.toFixed(1)} 亿，现金流质量是后续复核重点。`
        ]
      },
      {
        title: "短期事件",
        points: companyEvents.slice(0, 3).map(eventLine)
      },
      {
        title: "风险提示",
        points: [
          "当前为 mock 数据演示，真实上线前必须替换为可追溯数据源。",
          "不同市场财报口径、货币单位和交易时间不同，跨市场比较需要统一口径。",
          "AI 分析仅整理变量和风险，不构成买卖建议。"
        ]
      }
    ],
    sources: [
      { label: "MockMarketDataProvider: quote", timestamp: quote.updatedAt },
      { label: "MockMarketDataProvider: financials", timestamp: generatedAt },
      { label: "MockMarketDataProvider: company_events", timestamp: generatedAt }
    ],
    disclaimer: "本内容仅为信息整理与分析参考，不构成投资建议，投资有风险，决策需谨慎。"
  };
}

export async function generateSectorFastReport(sectorId: string): Promise<AnalystReport> {
  const provider = getMarketDataProvider();
  const sector = await provider.getSectorOverview(sectorId);
  const leaderQuotes = await Promise.all(sector.leaders.map((leader) => provider.getQuote(leader.symbol)));
  const generatedAt = new Date().toISOString();
  const leaderNames = leaderQuotes.map((quote) => `${quote.name}(${quote.symbol})`).join("、");
  const positiveLeaders = leaderQuotes.filter((quote) => quote.weekChangePercent >= 0).length;

  return {
    id: `sector-${sector.id}-${Date.now()}`,
    intent: "sector_analysis",
    target: sector.name,
    generatedAt,
    summary: `${sector.name}适合用“产业趋势 + 龙头验证 + 风险边界”三层框架跟踪；当前样本龙头中 ${positiveLeaders}/${leaderQuotes.length} 个近 7 日为正收益，仅作为研究线索。`,
    sections: [
      {
        title: "主题定位",
        points: [
          sector.description,
          `代表标的样本：${leaderNames}。样本用于观察产业变量，不代表覆盖完整行业。`,
          "当前页面沿用 MarketDataProvider，后续接入真实数据源时保留同一输出结构。"
        ]
      },
      {
        title: "跟踪变量",
        points: sector.trends
      },
      {
        title: "代表标的观察",
        points: leaderQuotes.map((quote) => {
          return `${quote.name}：最新价 ${quote.currency} ${quote.price.toFixed(2)}，近 7 日 ${quote.weekChangePercent.toFixed(2)}%，PE-TTM ${quote.peTtm.toFixed(1)}。`;
        })
      },
      {
        title: "风险提示",
        points: [
          ...sector.risks,
          "主题热度不等于投资价值，需要回到业绩、估值、现金流和事件验证。",
          "AI 分析仅整理变量和风险，不构成买卖建议。"
        ]
      }
    ],
    sources: [
      { label: "MockMarketDataProvider: sector_overview", timestamp: generatedAt },
      ...leaderQuotes.map((quote) => ({ label: `MockMarketDataProvider: quote:${quote.symbol}`, timestamp: quote.updatedAt }))
    ],
    disclaimer: "本内容仅为信息整理与分析参考，不构成投资建议，投资有风险，决策需谨慎。"
  };
}
