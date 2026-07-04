import type { AnalystReport } from "@/lib/types";
import { cnDateTime } from "@/lib/formatters";

export function ReportView({ report }: { report: AnalystReport }) {
  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-line pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">{report.intent}</div>
          <h2 className="mt-1 text-xl font-semibold text-ink">{report.target}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{report.summary}</p>
        </div>
        <div className="whitespace-nowrap text-xs text-muted">{cnDateTime(report.generatedAt)}</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {report.sections.map((section) => (
          <section key={section.title} className="rounded-lg border border-line bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              {section.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-line p-4">
        <div className="text-sm font-semibold text-ink">数据来源</div>
        <div className="mt-2 space-y-1 text-xs text-muted">
          {report.sources.map((source) => (
            <div key={`${source.label}-${source.timestamp}`}>
              {source.label} · {cnDateTime(source.timestamp)}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">{report.disclaimer}</p>
    </article>
  );
}
