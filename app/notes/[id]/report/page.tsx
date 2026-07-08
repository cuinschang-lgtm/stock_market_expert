import { ArrowLeft, CalendarDays, FileText, Link as LinkIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintReportAction } from "@/components/notes/print-report-action";
import { ReportExportAction } from "@/components/notes/report-export-action";
import { cnDateTime } from "@/lib/formatters";
import type { InvestmentThesis, ResearchNote } from "@/lib/types";
import { getResearchNote } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const convictionCopy: Record<NonNullable<InvestmentThesis["conviction"]>, string> = {
  low: "低",
  medium: "中",
  high: "高"
};

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-muted">暂无记录</p>;

  return (
    <ul className="space-y-2 text-sm leading-6 text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent print:bg-zinc-900" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-lg border border-line bg-white p-5 shadow-sm print:border-zinc-300 print:shadow-none">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ThesisBlock({ note }: { note: ResearchNote }) {
  const thesis = note.thesis;
  if (!thesis) {
    return (
      <ReportSection title="投资逻辑">
        <p className="text-sm leading-6 text-muted">尚未保存投资逻辑。建议补充核心假设、验证指标、催化事件和失效条件。</p>
      </ReportSection>
    );
  }

  return (
    <ReportSection title="投资逻辑">
      <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3 print:border-zinc-300">
          <div className="text-xs font-semibold uppercase text-muted">Conviction</div>
          <div className="mt-1 text-lg font-semibold text-ink">{convictionCopy[thesis.conviction ?? "medium"]}</div>
        </div>
        <div className="rounded-lg border border-line p-3 print:border-zinc-300">
          <div className="text-xs font-semibold uppercase text-muted">Next Review</div>
          <div className="mt-1 text-lg font-semibold text-ink">{thesis.nextReviewAt ?? "未设置"}</div>
        </div>
        <div className="rounded-lg border border-line p-3 print:border-zinc-300">
          <div className="text-xs font-semibold uppercase text-muted">Updated</div>
          <div className="mt-1 text-lg font-semibold text-ink">{thesis.updatedAt ? cnDateTime(thesis.updatedAt) : "未记录"}</div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">核心假设</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{thesis.coreHypothesis}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">验证指标</h3>
            <BulletList items={thesis.keyMetrics} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">催化事件</h3>
            <BulletList items={thesis.catalysts} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">失效条件</h3>
            <BulletList items={thesis.invalidationSignals} />
          </div>
        </div>
      </div>
    </ReportSection>
  );
}

function AiReportBlock({ note }: { note: ResearchNote }) {
  const report = note.report;
  if (!report) {
    return (
      <ReportSection title="AI 分析报告">
        <p className="text-sm leading-6 text-muted">这条笔记暂未关联 AI 分析报告。</p>
      </ReportSection>
    );
  }

  return (
    <ReportSection title="AI 分析报告">
      <div className="flex flex-col gap-2 border-b border-line pb-4 md:flex-row md:items-start md:justify-between print:border-zinc-300">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-accent print:text-zinc-700">{report.intent}</div>
          <h3 className="mt-1 text-xl font-semibold text-ink">{report.target}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{report.summary}</p>
        </div>
        <div className="whitespace-nowrap text-xs text-muted">{cnDateTime(report.generatedAt)}</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {report.sections.map((section) => (
          <section key={section.title} className="break-inside-avoid rounded-lg border border-line bg-panel p-4 print:border-zinc-300 print:bg-white">
            <h4 className="text-sm font-semibold text-ink">{section.title}</h4>
            <div className="mt-3">
              <BulletList items={section.points} />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-line p-4 print:border-zinc-300">
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
    </ReportSection>
  );
}

export default async function NoteReportPage({ params }: { params: { id: string } }) {
  const result = await getResearchNote(decodeURIComponent(params.id));
  if (!result.configured || !result.note) notFound();

  const note = result.note;

  return (
    <div className="mx-auto max-w-5xl space-y-6 print:max-w-none print:space-y-5">
      <div className="print-hidden flex flex-col gap-3 rounded-lg border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/notes/${note.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-teal-800">
          <ArrowLeft className="h-4 w-4" />
          返回笔记详情
        </Link>
        <div className="flex flex-wrap gap-2">
          <PrintReportAction />
          <ReportExportAction note={note} />
        </div>
      </div>

      <article className="rounded-lg border border-line bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-start md:justify-between print:border-zinc-300">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent print:text-zinc-700">
              <FileText className="h-4 w-4" />
              {note.tag}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink print:text-2xl">{note.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted">{note.excerpt}</p>
          </div>
          <div className="grid gap-2 text-sm text-muted md:text-right">
            <div className="inline-flex items-center gap-2 md:justify-end">
              <CalendarDays className="h-4 w-4" />
              {cnDateTime(note.createdAt)}
            </div>
            {note.updatedAt ? <div>更新 {cnDateTime(note.updatedAt)}</div> : null}
            {note.symbol ? (
              <Link
                href={`/stocks/${note.symbol}`}
                className="inline-flex items-center gap-2 font-semibold text-accent hover:text-teal-800 md:justify-end print:text-zinc-900"
              >
                <LinkIcon className="h-4 w-4" />
                {note.symbol}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line p-4 print:border-zinc-300">
            <div className="text-xs font-semibold uppercase text-muted">Status</div>
            <div className="mt-1 text-lg font-semibold text-ink">{note.status === "archived" ? "已归档" : "跟踪中"}</div>
          </div>
          <div className="rounded-lg border border-line p-4 print:border-zinc-300">
            <div className="text-xs font-semibold uppercase text-muted">Symbol</div>
            <div className="mt-1 text-lg font-semibold text-ink">{note.symbol ?? "未关联"}</div>
          </div>
          <div className="rounded-lg border border-line p-4 print:border-zinc-300">
            <div className="text-xs font-semibold uppercase text-muted">Format</div>
            <div className="mt-1 text-lg font-semibold text-ink">Research Report</div>
          </div>
        </div>
      </article>

      {note.body ? (
        <ReportSection title="人工复盘">
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted">{note.body}</p>
        </ReportSection>
      ) : null}

      <ThesisBlock note={note} />

      <AiReportBlock note={note} />

      <section className="break-inside-avoid rounded-lg border border-line bg-white p-5 text-xs leading-5 text-muted shadow-sm print:border-zinc-300 print:shadow-none">
        <div className="mb-2 flex items-center gap-2 font-semibold text-ink">
          <ShieldCheck className="h-4 w-4" />
          风险边界
        </div>
        本报告仅用于信息整理与研究辅助，不构成任何买卖建议。使用者需要自行核验数据来源、时间戳、财务口径和市场风险。
      </section>
    </div>
  );
}
