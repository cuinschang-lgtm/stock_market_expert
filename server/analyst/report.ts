import OpenAI from "openai";
import type {
  AnalystReport,
  CompanyEvent,
  FinancialSnapshot,
  QuoteSnapshot,
  SectorOverview
} from "@/lib/types";
import { getMarketDataProvider } from "@/server/market-data/provider";

// --------------- DeepSeek 客户端 ---------------

// 绕过系统代理直连 DeepSeek API
// 本地开发环境可能存在 SSL 代理拦截，生产环境（Vercel）无需此配置
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.VERCEL ? undefined : "0";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
  timeout: 120000,
  maxRetries: 1,
});

const REASONER_MODEL = "deepseek-reasoner"; // DeepSeek V4 Thinking (本地用)
const CHAT_MODEL = "deepseek-chat";         // DeepSeek V3 快速模式

// Vercel Hobby 免费计划 Serverless Function 仅 10s 超时，
// deepseek-reasoner 推理耗时 20-40s 会被截断，所以生产环境用 chat 模型。
// 本地 dev 不受此限制，使用 thinking 模型获得更高质量分析。
function pickModel(): string {
  return process.env.VERCEL ? CHAT_MODEL : REASONER_MODEL;
}

function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

// --------------- 辅助函数 ---------------

function formatQuote(quote: QuoteSnapshot): string {
  return [
    `【${quote.name} (${quote.symbol})】`,
    `市场: ${quote.market} · ${quote.exchange}`,
    `行业: ${quote.sector}`,
    `最新价: ${quote.currency} ${quote.price.toFixed(2)}`,
    `当日涨跌: ${quote.changePercent.toFixed(2)}%`,
    `近7日涨跌: ${quote.weekChangePercent.toFixed(2)}%`,
    `52周区间: ${quote.currency} ${quote.yearLow.toFixed(2)} - ${quote.yearHigh.toFixed(2)}`,
    `成交额: ${quote.turnover}`,
    `PE-TTM: ${quote.peTtm.toFixed(1)}`,
    `PB: ${quote.pb.toFixed(1)}`,
    `PS: ${quote.ps.toFixed(1)}`,
    `股息率: ${quote.dividendYield.toFixed(2)}%`,
    `数据更新时间: ${quote.updatedAt}`,
  ].join("\n");
}

function formatFinancials(financials: FinancialSnapshot[]): string {
  if (financials.length === 0) return "暂无可用财务快照。";
  return financials
    .map(
      (f) =>
        `【${f.period}】收入: ${f.currency} ${f.revenue.toFixed(1)}亿 (同比${f.revenueYoY.toFixed(1)}%) · ` +
        `净利润: ${f.currency} ${f.netIncome.toFixed(1)}亿 (同比${f.netIncomeYoY.toFixed(1)}%) · ` +
        `毛利率: ${f.grossMargin.toFixed(1)}% · 经营现金流: ${f.currency} ${f.operatingCashFlow.toFixed(1)}亿`
    )
    .join("\n");
}

function formatEvents(events: CompanyEvent[]): string {
  if (events.length === 0) return "暂无近期公司事件。";
  return events
    .map((e) => `[${e.date}] ${e.type} · ${e.title} · 影响: ${e.impact} · ${e.summary} · 来源: ${e.source}`)
    .join("\n");
}

// --------------- DeepSeek API 调用 ---------------

async function callDeepSeek(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 返回了空响应");
  }
  return content.trim();
}

function parseAnalystReport(rawText: string): {
  summary: string;
  sections: Array<{ title: string; points: string[] }>;
} {
  const sections: Array<{ title: string; points: string[] }> = [];
  const sectionTitles = ["当前位置", "估值水位", "短期事件", "风险提示"];

  let remaining = rawText;
  let summary = "";

  // 尝试提取以 ## 开头的章节
  const headingPattern = /^##\s*(.+)$/gm;
  const headings: Array<{ title: string; index: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(rawText)) !== null) {
    headings.push({ title: match[1].trim(), index: match.index });
  }

  if (headings.length >= 2) {
    // 有 ## 格式的章节标题
    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].index;
      const end = i + 1 < headings.length ? headings[i + 1].index : rawText.length;
      const body = rawText.slice(start, end);

      const title = headings[i].title;
      // 提取该章节下的条目（- 开头或编号列表）
      const points = body
        .split(/\r?\n/)
        .filter((line) => line.trim().startsWith("-") || /^\d+[\.\)]\s/.test(line.trim()))
        .map((line) => line.replace(/^[-‐]\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim())
        .filter(Boolean);

      if (points.length > 0) {
        sections.push({ title, points });
      } else {
        // 如果没有列表项，整个段落作为一个 point
        const bodyText = body.replace(/^##\s*[^\n]*\n?/, "").trim();
        if (bodyText) {
          sections.push({ title, points: [bodyText] });
        }
      }
    }

    // 第一个章节之前的内容作为摘要
    if (headings.length > 0) {
      summary = rawText.slice(0, headings[0].index).trim();
    }
  } else {
    // 没有 ## 格式，按段落智能分块
    const paragraphs = rawText.split(/\r?\n\r?\n/).filter((p) => p.trim().length > 0);

    // 第一段作为摘要
    if (paragraphs.length > 0) {
      summary = paragraphs[0].trim();
    }

    // 剩余段落按关键词匹配到对应模块
    const remainingParagraphs = paragraphs.slice(1).join("\n\n");
    for (const title of sectionTitles) {
      const regex = new RegExp(
        `(?:${title}|${title.slice(0, 2)})\\s*[：:|\\n]([\\s\\S]*?)(?=(?:${sectionTitles.join("|")})\\s*[：:|\\n]|$)`,
        "i"
      );
      const m = remainingParagraphs.match(regex);
      if (m?.[1]) {
        const lines = m[1]
          .split(/\r?\n/)
          .map((l) => l.replace(/^[-‐]\s*/, "").trim())
          .filter(Boolean);
        sections.push({ title, points: lines.length > 0 ? lines : [m[1].trim()] });
      }
    }

    // 如果完全无法解析，回退为单模块
    if (sections.length === 0) {
      sections.push({ title: "分析概要", points: [rawText] });
    }
  }

  return { summary: summary || rawText.slice(0, 200), sections };
}

// --------------- 个股快速分析 ---------------

export async function generateStockFastReport(symbol: string): Promise<AnalystReport> {
  const provider = getMarketDataProvider();
  const quote = await provider.getQuote(symbol);
  const financials = await provider.getFinancials(symbol);
  const companyEvents = await provider.getCompanyEvents(symbol);
  const generatedAt = new Date().toISOString();

  // 尝试调用 DeepSeek
  if (isDeepSeekConfigured()) {
    try {
      const systemPrompt = `你是一个专业的股票投研助手，擅长基于客观数据分析股票的投资逻辑。
你的分析必须严谨、客观、有据可循，禁止：
- 输出"买入""卖出""满仓""清仓"等指令式投资建议
- 承诺收益或预测短期点位
- 使用未公开市场敏感信息
- 把结论包装成确定性判断

你的分析应围绕四模块展开：
1. 当前位置：最新价、近期涨跌、与同行或指数对比
2. 估值水位：PE/PB/PS、历史或同行对比、最近财务摘要
3. 短期事件：最近的公告、财报、回购、行业新闻，其对投资逻辑的潜在影响
4. 风险提示：数据风险、估值风险、基本面风险、事件风险

请用中文输出，每个模块用 ## 模块名 开头，模块下用 - 列出要点。`;

      const userPrompt = `请基于以下数据做结构化分析，所有关键数字必须来自提供的数据，不得编造。

===== 行情数据 =====
${formatQuote(quote)}

===== 财务数据 =====
${formatFinancials(financials)}

===== 公司事件 =====
${formatEvents(companyEvents)}

请按 ## 当前位置 / ## 估值水位 / ## 短期事件 / ## 风险提示 四个模块输出分析。先给一段简短的总体判断（100字以内）。`;

      const rawText = await callDeepSeek(pickModel(), systemPrompt, userPrompt);
      const { summary, sections } = parseAnalystReport(rawText);

      return {
        id: `analysis-${quote.symbol}-${Date.now()}`,
        intent: "stock_analysis",
        target: `${quote.name} (${quote.symbol})`,
        generatedAt,
        summary: summary || `${quote.name} 结构化分析报告`,
        sections:
          sections.length >= 3
            ? sections
            : [
                ...sections,
                { title: "风险提示", points: ["AI 分析仅整理变量和风险，不构成买卖建议。"] },
              ],
        sources: [
          { label: "DeepSeek-R1: stock_analysis", timestamp: generatedAt },
          { label: `MarketDataProvider: quote (${quote.symbol})`, timestamp: quote.updatedAt },
          { label: "MarketDataProvider: financials", timestamp: generatedAt },
          { label: "MarketDataProvider: company_events", timestamp: generatedAt },
        ],
        disclaimer:
          "本内容由 DeepSeek AI 生成，仅为信息整理与分析参考，不构成投资建议，投资有风险，决策需谨慎。",
      };
    } catch (error) {
      console.error("[DeepSeek] 个股分析调用失败，回退模板:", error);
    }
  }

  // ---------- 回退：模板拼接（原逻辑） ----------
  const latest = financials[0];
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
    summary: `${quote.name}当前更适合用"基本面兑现 + 事件催化 + 估值水位"三条线跟踪；${priceMood}，${valuation}。`,
    sections: [
      {
        title: "当前位置",
        points: [
          `最新价 ${quote.currency} ${quote.price.toFixed(2)}，当日涨跌幅 ${quote.changePercent.toFixed(2)}%。`,
          `近 7 日涨跌幅 ${quote.weekChangePercent.toFixed(2)}%，52 周区间为 ${quote.currency} ${quote.yearLow.toFixed(2)} - ${quote.yearHigh.toFixed(2)}。`,
          `成交额 ${quote.turnover}，需要结合后续成交放大或缩量判断趋势质量。`,
        ],
      },
      {
        title: "估值水位",
        points: [
          `PE-TTM ${quote.peTtm.toFixed(1)}，PB ${quote.pb.toFixed(1)}，PS ${quote.ps.toFixed(1)}，股息率 ${quote.dividendYield.toFixed(2)}%。`,
          latest
            ? `最近一期 ${latest.period} 收入 ${latest.currency} ${latest.revenue.toFixed(1)} 亿，同比 ${latest.revenueYoY.toFixed(1)}%；净利润 ${latest.currency} ${latest.netIncome.toFixed(1)} 亿，同比 ${latest.netIncomeYoY.toFixed(1)}%。`
            : "暂无可用财务快照，估值判断需要等待财务数据源补齐后复核。",
          latest
            ? `毛利率 ${latest.grossMargin.toFixed(1)}%，经营现金流 ${latest.currency} ${latest.operatingCashFlow.toFixed(1)} 亿，现金流质量是后续复核重点。`
            : "当前报告仅基于行情和事件数据整理，不应把缺失财务数据视为基本面结论。",
        ],
      },
      {
        title: "短期事件",
        points:
          companyEvents.length > 0
            ? companyEvents.slice(0, 3).map((e) => `${e.date} ${e.type}：${e.title}，影响标记为${e.impact}。`)
            : ["暂无近期事件数据。"],
      },
      {
        title: "风险提示",
        points: [
          isDeepSeekConfigured()
            ? "DeepSeek API 调用失败，已回退到本地模板分析。请检查 API Key 或网络连接。"
            : "当前为本地模板分析，配置 DEEPSEEK_API_KEY 后自动切换为 AI 生成。",
          "不同市场财报口径、货币单位和交易时间不同，跨市场比较需要统一口径。",
          "AI 分析仅整理变量和风险，不构成买卖建议。",
        ],
      },
    ],
    sources: [
      { label: "LocalTemplate: stock_analysis", timestamp: generatedAt },
      { label: `MarketDataProvider: quote (${quote.symbol})`, timestamp: quote.updatedAt },
      { label: "MarketDataProvider: financials", timestamp: generatedAt },
      { label: "MarketDataProvider: company_events", timestamp: generatedAt },
    ],
    disclaimer:
      "本内容仅为信息整理与分析参考，不构成投资建议，投资有风险，决策需谨慎。",
  };
}

// --------------- 行业快速分析 ---------------

export async function generateSectorFastReport(sectorId: string): Promise<AnalystReport> {
  const provider = getMarketDataProvider();
  const sector = await provider.getSectorOverview(sectorId);
  const leaderQuotes = await Promise.all(
    sector.leaders.map((leader) => provider.getQuote(leader.symbol))
  );
  const generatedAt = new Date().toISOString();

  // 尝试调用 DeepSeek
  if (isDeepSeekConfigured()) {
    try {
      const systemPrompt = `你是一个专业的行业研究员，擅长分析行业主题的投资逻辑与风险。
你的分析必须客观、有据可循，禁止输出"买入""卖出"等投资建议。
请用中文输出，模块用 ## 模块名 开头，要点用 - 列出。`;

      const leaderData = leaderQuotes
        .map(
          (q) =>
            `${q.name}(${q.symbol}): 最新价 ${q.currency}${q.price.toFixed(2)}, ` +
            `近7日 ${q.weekChangePercent.toFixed(2)}%, PE-TTM ${q.peTtm.toFixed(1)}`
        )
        .join("\n");

      const userPrompt = `请基于以下行业主题数据做分析：

===== 主题信息 =====
名称: ${sector.name}
描述: ${sector.description}
跟踪变量: ${sector.trends.join("; ")}
风险因素: ${sector.risks.join("; ")}

===== 龙头样本行情 =====
${leaderData}

请按 ## 主题定位 / ## 跟踪变量 / ## 龙头观察 / ## 风险提示 四个模块输出分析。先给一段简短总结（100字以内）。`;

      const rawText = await callDeepSeek(pickModel(), systemPrompt, userPrompt);
      const { summary, sections } = parseAnalystReport(rawText);

      return {
        id: `sector-${sector.id}-${Date.now()}`,
        intent: "sector_analysis",
        target: sector.name,
        generatedAt,
        summary:
          summary || `${sector.name}：用"产业趋势 + 龙头验证 + 风险边界"三层框架跟踪。`,
        sections:
          sections.length >= 3
            ? sections
            : [
                { title: "主题定位", points: [sector.description] },
                { title: "跟踪变量", points: sector.trends },
                { title: "龙头观察", points: leaderQuotes.map((q) => `${q.name} (${q.symbol}) 7日 ${q.weekChangePercent.toFixed(2)}%`) },
                { title: "风险提示", points: [...sector.risks] },
              ],
        sources: [
          { label: "DeepSeek-R1: sector_analysis", timestamp: generatedAt },
          { label: "MarketDataProvider: sector_overview", timestamp: generatedAt },
          ...leaderQuotes.map((quote) => ({
            label: `MarketDataProvider: quote:${quote.symbol}`,
            timestamp: quote.updatedAt,
          })),
        ],
        disclaimer:
          "本内容由 DeepSeek AI 生成，仅为信息整理与分析参考，不构成投资建议，投资有风险，决策需谨慎。",
      };
    } catch (error) {
      console.error("[DeepSeek] 行业分析调用失败，回退模板:", error);
    }
  }

  // ---------- 回退：模板拼接 ----------
  const leaderNames = leaderQuotes
    .map((quote) => `${quote.name}(${quote.symbol})`)
    .join("、");
  const positiveLeaders = leaderQuotes.filter(
    (quote) => quote.weekChangePercent >= 0
  ).length;

  return {
    id: `sector-${sector.id}-${Date.now()}`,
    intent: "sector_analysis",
    target: sector.name,
    generatedAt,
    summary: `${sector.name}适合用"产业趋势 + 龙头验证 + 风险边界"三层框架跟踪；当前样本龙头中 ${positiveLeaders}/${leaderQuotes.length} 个近 7 日为正收益，仅作为研究线索。`,
    sections: [
      {
        title: "主题定位",
        points: [
          sector.description,
          `代表标的样本：${leaderNames}。样本用于观察产业变量，不代表覆盖完整行业。`,
          "当前页面沿用 MarketDataProvider，后续接入真实数据源时保留同一输出结构。",
        ],
      },
      { title: "跟踪变量", points: sector.trends },
      {
        title: "代表标的观察",
        points: leaderQuotes.map(
          (quote) =>
            `${quote.name}：最新价 ${quote.currency} ${quote.price.toFixed(2)}，近 7 日 ${quote.weekChangePercent.toFixed(2)}%，PE-TTM ${quote.peTtm.toFixed(1)}。`
        ),
      },
      {
        title: "风险提示",
        points: [
          ...sector.risks,
          "主题热度不等于投资价值，需要回到业绩、估值、现金流和事件验证。",
          "AI 分析仅整理变量和风险，不构成买卖建议。",
        ],
      },
    ],
    sources: [
      { label: "LocalTemplate: sector_analysis", timestamp: generatedAt },
      { label: "MarketDataProvider: sector_overview", timestamp: generatedAt },
      ...leaderQuotes.map((quote) => ({
        label: `MarketDataProvider: quote:${quote.symbol}`,
        timestamp: quote.updatedAt,
      })),
    ],
    disclaimer:
      "本内容仅为信息整理与分析参考，不构成投资建议，投资有风险，决策需谨慎。",
  };
}
