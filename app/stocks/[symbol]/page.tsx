import { Bot, CalendarDays, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InlineReport } from "@/components/analyst/inline-report";
import { KlineChart } from "@/components/stocks/kline-chart";
import { WatchlistAction } from "@/components/stocks/watchlist-action";
import { MetricCard } from "@/components/ui/metric-card";
import { formatCurrency, formatSignedPercent } from "@/lib/formatters";
import { getMarketDataProvider } from "@/server/market-data/provider";

export default async function StockDetailPage({ params }: { params: { symbol: string } }) {
  const provider = getMarketDataProvider();
  const symbol = decodeURIComponent(params.symbol);
  const data = await Promise.all([
    provider.getQuote(symbol),
    provider.getKline(symbol),
    provider.getFinancials(symbol),
    provider.getCompanyEvents(symbol),
  ]).catch(() => null);

  if (!data) notFound();

  const [quote, kline, financials, events] = data;
  const latest = financials[0];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-accent">
              {quote.market} · {quote.exchange}{quote.sector ? ` · ${quote.sector}` : ""}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              {quote.name} <span className="text-xl text-muted">{quote.symbol}</span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="text-2xl font-semibold text-ink">{formatCurrency(quote.price, quote.currency)}</span>
              <span className={quote.changePercent >= 0 ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                {formatSignedPercent(quote.changePercent)}
              </span>
              <span>成交额 {quote.turnover}</span>
              <span>更新 {quote.updatedAt}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <WatchlistAction quote={quote} />
            <Link
              href={`/analyst?symbol=${quote.symbol}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              <Bot className="h-4 w-4" />
              深入分析
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="PE-TTM" value={quote.peTtm.toFixed(1)} detail="估值倍数" />
        <MetricCard label="PB" value={quote.pb.toFixed(1)} detail="净资产倍数" />
        <MetricCard label="股息率" value={`${quote.dividendYield.toFixed(2)}%`} detail="TTM" />
        <MetricCard
          label="7日涨跌"
          value={formatSignedPercent(quote.weekChangePercent)}
          tone={quote.weekChangePercent >= 0 ? "up" : "down"}
          detail={`${quote.currency} ${quote.yearLow.toFixed(2)} - ${quote.yearHigh.toFixed(2)}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">近 7 日价格</h2>
          <div className="mt-4">
            <KlineChart data={kline} />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-ink">最近财务摘要</h2>
          </div>
          {latest ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-panel p-3">
                <div className="font-semibold text-ink">{latest.period}</div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-muted">
                  <div>收入：{latest.currency} {latest.revenue.toFixed(1)} 亿</div>
                  <div>同比：{formatSignedPercent(latest.revenueYoY)}</div>
                  <div>净利润：{latest.currency} {latest.netIncome.toFixed(1)} 亿</div>
                  <div>同比：{formatSignedPercent(latest.netIncomeYoY)}</div>
                  <div>毛利率：{latest.grossMargin.toFixed(1)}%</div>
                  <div>经营现金流：{latest.currency} {latest.operatingCashFlow.toFixed(1)} 亿</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              暂无财务数据。系统正在对接 Tick Data，后续将自动更新。
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-ink">事件时间线</h2>
        </div>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="grid gap-3 rounded-lg border border-line p-4 md:grid-cols-[120px_1fr_84px]">
              <div className="text-sm font-semibold text-muted">{event.date}</div>
              <div>
                <div className="text-sm font-semibold text-ink">
                  {event.type} · {event.title}
                </div>
                <div className="mt-1 text-sm leading-6 text-muted">{event.summary}</div>
                <div className="mt-2 text-xs text-muted">来源：{event.source}</div>
              </div>
              <div className="text-sm font-semibold text-accent">{event.impact}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI 分析：客户端异步加载，不受 Vercel 10s 限制 */}
      <InlineReport
        apiPath={`/api/analysis/stock/${encodeURIComponent(symbol)}`}
        loadingLabel={`AI 正在分析 ${quote.name}...`}
      />
    </div>
  );
}
