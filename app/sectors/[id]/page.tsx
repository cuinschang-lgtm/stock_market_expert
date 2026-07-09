import { ArrowRight, Bot, CheckCircle2, Lightbulb, Network, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { InlineReport } from "@/components/analyst/inline-report";
import { QuoteTable } from "@/components/stocks/quote-table";
import { MetricCard } from "@/components/ui/metric-card";
import { formatSignedPercent } from "@/lib/formatters";
import { getSectorResearchDetail, sectorMomentumTone } from "@/server/sector-research";

export const dynamic = "force-dynamic";

export default async function SectorDetailPage({ params }: { params: { id: string } }) {
  const sectorId = decodeURIComponent(params.id);
  const detail = await getSectorResearchDetail(sectorId);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Network className="h-4 w-4" />
              行业主题
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{detail.sector.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{detail.sector.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sectors"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-ink"
            >
              返回主题
            </Link>
            <Link
              href={`/analyst?symbol=${detail.leaders[0]?.symbol ?? "hk00700"}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              <Bot className="h-4 w-4" />
              分析龙头
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="代表标的" value={String(detail.leaders.length)} detail="样本观察池" />
        <MetricCard
          label="样本 7 日"
          value={formatSignedPercent(detail.avgWeekChangePercent)}
          detail={sectorMomentumTone(detail.avgWeekChangePercent)}
          tone={detail.avgWeekChangePercent >= 0 ? "up" : "down"}
        />
        <MetricCard label="平均 PE-TTM" value={detail.avgPeTtm.toFixed(1)} detail="样本均值" />
        <MetricCard label="研究线索" value={String(detail.ideas.length)} detail="非买卖建议" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">代表标的观察</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            这些标的用于验证主题变量。真实数据接入后，建议按市值、流动性、产业链位置和财报期筛选样本。
          </p>
          <div className="mt-4">
            <QuoteTable quotes={detail.leaders} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-ink">跟踪变量</h2>
            </div>
            <div className="space-y-2">
              {detail.sector.trends.map((trend) => (
                <div key={trend} className="rounded-lg bg-panel p-3 text-sm leading-6 text-muted">
                  {trend}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warn" />
              <h2 className="text-lg font-semibold text-ink">风险边界</h2>
            </div>
            <div className="space-y-2">
              {detail.sector.risks.map((risk) => (
                <div key={risk} className="rounded-lg border border-line p-3 text-sm leading-6 text-muted">
                  {risk}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warn" />
          <h2 className="text-lg font-semibold text-ink">选股研究线索</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {detail.ideas.map((idea) => (
            <article key={idea.id} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-ink">{idea.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{idea.thesis}</p>
                </div>
                <Link
                  href={`/stocks/${idea.symbol}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  个股页
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                {idea.checkpoints.map((checkpoint) => (
                  <li key={checkpoint} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{checkpoint}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-lg border border-line bg-white p-3 text-xs leading-5 text-muted">
                风险复核：{idea.risk}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* AI 专题分析：客户端异步加载 */}
      <InlineReport
        apiPath={`/api/sectors/${encodeURIComponent(sectorId)}`}
        loadingLabel={`AI 正在生成 ${detail.sector.name} 专题分析...`}
      />
    </div>
  );
}
