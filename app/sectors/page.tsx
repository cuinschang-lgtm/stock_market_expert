import { ArrowRight, Lightbulb, Network, ShieldAlert, TrendingUp } from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/metric-card";
import { formatSignedPercent, trendClass } from "@/lib/formatters";
import { getSectorResearchCards, sectorMomentumTone } from "@/server/sector-research";

export const dynamic = "force-dynamic";

export default async function SectorsPage() {
  const cards = await getSectorResearchCards();
  const totalLeaders = cards.reduce((total, card) => total + card.leaders.length, 0);
  const totalIdeas = cards.reduce((total, card) => total + card.ideaCount, 0);
  const strongest = [...cards].sort((a, b) => b.avgWeekChangePercent - a.avgWeekChangePercent)[0];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Network className="h-4 w-4" />
            Sector Research
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">行业主题研究</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            把热门板块拆成可复核的主题、龙头样本、跟踪变量和风险边界；当前使用 mock provider，后续可替换为真实行业数据源。
          </p>
        </div>
        <Link
          href="/analyst"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          AI 分析台
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="主题数量" value={String(cards.length)} detail="provider 统一输出" />
        <MetricCard label="代表标的" value={String(totalLeaders)} detail="用于观察，不代表推荐" />
        <MetricCard label="研究线索" value={String(totalIdeas)} detail="可保存为笔记" />
        <MetricCard
          label="最强主题"
          value={strongest?.sector.name ?? "-"}
          detail={strongest ? formatSignedPercent(strongest.avgWeekChangePercent) : "暂无数据"}
          tone={(strongest?.avgWeekChangePercent ?? 0) >= 0 ? "up" : "down"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => (
          <article key={card.sector.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-ink">{card.sector.name}</h2>
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-accent">
                    {sectorMomentumTone(card.avgWeekChangePercent)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{card.sector.description}</p>
              </div>
              <div className="shrink-0 text-left md:text-right">
                <div className={`text-lg font-semibold ${trendClass(card.avgWeekChangePercent)}`}>
                  {formatSignedPercent(card.avgWeekChangePercent)}
                </div>
                <div className="text-xs text-muted">样本 7 日均值</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-panel p-3">
                <div className="text-xs font-semibold text-muted">龙头样本</div>
                <div className="mt-1 text-lg font-semibold text-ink">{card.leaders.length}</div>
              </div>
              <div className="rounded-lg bg-panel p-3">
                <div className="text-xs font-semibold text-muted">平均 PE</div>
                <div className="mt-1 text-lg font-semibold text-ink">{card.avgPeTtm.toFixed(1)}</div>
              </div>
              <div className="rounded-lg bg-panel p-3">
                <div className="text-xs font-semibold text-muted">线索数</div>
                <div className="mt-1 text-lg font-semibold text-ink">{card.ideaCount}</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  跟踪变量
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.sector.trends.slice(0, 3).map((trend) => (
                    <span key={trend} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-muted">
                      {trend}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <Lightbulb className="h-4 w-4 text-warn" />
                  代表标的
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.leaders.map((quote) => (
                    <Link
                      key={quote.symbol}
                      href={`/stocks/${quote.symbol}`}
                      className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
                    >
                      {quote.name} · {formatSignedPercent(quote.weekChangePercent)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-xs leading-5 text-muted">
                <ShieldAlert className="h-4 w-4 shrink-0 text-warn" />
                主题热度仅作研究入口，不构成买卖建议。
              </div>
              <Link
                href={`/sectors/${card.sector.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                打开主题
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
