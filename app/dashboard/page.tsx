import { Activity, ArrowRight, Flame, Newspaper } from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/metric-card";
import { QuoteTable } from "@/components/stocks/quote-table";
import { formatSignedPercent, trendClass } from "@/lib/formatters";
import { getMarketDataProvider } from "@/server/market-data/provider";

export default async function DashboardPage() {
  const data = await getMarketDataProvider().getDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Market Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">今日投研仪表盘</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            用 mock 数据先跑通市场概览、自选股异动、事件提醒和研究笔记闭环；后续通过 provider 接入真实数据。
          </p>
        </div>
        <Link
          href="/analyst"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          生成分析
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {data.indices.map((index) => (
          <MetricCard
            key={index.symbol}
            label={`${index.name} · ${index.market}`}
            value={index.price.toFixed(2)}
            detail={formatSignedPercent(index.changePercent)}
            tone={index.changePercent > 0 ? "up" : index.changePercent < 0 ? "down" : "neutral"}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-ink">自选股异动</h2>
            </div>
            <Link href="/watchlist" className="text-sm font-semibold text-accent hover:text-teal-800">
              查看自选
            </Link>
          </div>
          <QuoteTable quotes={data.watchlist} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-danger" />
            <h2 className="text-lg font-semibold text-ink">热门板块</h2>
          </div>
          <div className="space-y-3">
            {data.hotSectors.map((sector) => (
              <div key={sector.name} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{sector.name}</div>
                    <div className="mt-1 text-sm text-muted">{sector.reason}</div>
                  </div>
                  <div className={`font-semibold ${trendClass(sector.changePercent)}`}>
                    {formatSignedPercent(sector.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-ink">今日事件</h2>
          </div>
          <div className="space-y-3">
            {data.events.map((event) => (
              <div key={`${event.time}-${event.title}`} className="flex gap-3 rounded-lg bg-panel p-3">
                <div className="w-20 shrink-0 text-xs font-semibold text-muted">{event.time}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{event.title}</div>
                  <div className="mt-1 text-xs text-muted">
                    {event.scope} · 影响 {event.impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">最近研究笔记</h2>
            <Link href="/notes" className="text-sm font-semibold text-accent hover:text-teal-800">
              全部
            </Link>
          </div>
          <div className="space-y-3">
            {data.notes.map((note) => (
              <Link
                key={note.id}
                href="/notes"
                className="block rounded-lg border border-line p-3 transition hover:border-accent hover:bg-panel"
              >
                <div className="text-sm font-semibold text-ink">{note.title}</div>
                <div className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{note.excerpt}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
