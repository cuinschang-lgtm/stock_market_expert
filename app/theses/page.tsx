import { AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, FileText, Target } from "lucide-react";
import Link from "next/link";
import { cnDateTime } from "@/lib/formatters";
import type { ResearchNote, ThesisConviction } from "@/lib/types";
import { listResearchNotes } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";

const convictionCopy: Record<ThesisConviction, string> = {
  high: "高",
  medium: "中",
  low: "低"
};

function isReviewDue(value?: string) {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value).getTime() <= today.getTime();
}

function noteConviction(note: ResearchNote) {
  return note.thesis?.conviction ?? "medium";
}

export default async function ThesesPage() {
  const result = await listResearchNotes();
  const notes = result.notes;
  const thesisNotes = notes.filter((note) => note.thesis);
  const missingNotes = notes.filter((note) => !note.thesis);
  const dueNotes = thesisNotes.filter((note) => isReviewDue(note.thesis?.nextReviewAt));
  const highCount = thesisNotes.filter((note) => noteConviction(note) === "high").length;
  const mediumCount = thesisNotes.filter((note) => noteConviction(note) === "medium").length;
  const lowCount = thesisNotes.filter((note) => noteConviction(note) === "low").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Thesis Center</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">投资逻辑</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            集中跟踪核心假设、验证指标、催化事件和失效条件；所有内容来自云端研究笔记。
          </p>
        </div>
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          <FileText className="h-4 w-4" />
          查看笔记
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Target className="h-4 w-4 text-accent" />
            已建立
          </div>
          <div className="mt-3 text-3xl font-semibold text-ink">{thesisNotes.length}</div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <CalendarClock className="h-4 w-4 text-warn" />
            待复盘
          </div>
          <div className="mt-3 text-3xl font-semibold text-ink">{dueNotes.length}</div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <CircleDashed className="h-4 w-4 text-muted" />
            待补全
          </div>
          <div className="mt-3 text-3xl font-semibold text-ink">{missingNotes.length}</div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-muted">确信度分布</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted">
            <span className="rounded-md border border-line px-2 py-1">高 {highCount}</span>
            <span className="rounded-md border border-line px-2 py-1">中 {mediumCount}</span>
            <span className="rounded-md border border-line px-2 py-1">低 {lowCount}</span>
          </div>
        </div>
      </section>

      {!result.configured ? (
        <section className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
          Supabase 尚未配置，投资逻辑中心需要云端笔记数据。
        </section>
      ) : null}

      {thesisNotes.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">正在跟踪</h2>
            <span className="text-sm font-semibold text-muted">{thesisNotes.length} 条</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {thesisNotes.map((note) => {
              const thesis = note.thesis;
              if (!thesis) return null;
              const due = isReviewDue(thesis.nextReviewAt);
              return (
                <article key={note.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                      <span className="rounded-md border border-line px-2 py-1">确信度 {convictionCopy[thesis.conviction ?? "medium"]}</span>
                      {due ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-warn px-2 py-1 text-warn">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          待复盘
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                          跟踪中
                        </span>
                      )}
                    </div>
                    {note.symbol ? (
                      <Link href={`/stocks/${note.symbol}`} className="text-xs font-semibold text-accent hover:text-teal-800">
                        {note.symbol}
                      </Link>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-ink">
                    <Link href={`/notes/${note.id}`} className="hover:text-accent">
                      {note.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{thesis.coreHypothesis}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <MiniList title="验证指标" items={thesis.keyMetrics} />
                    <MiniList title="催化事件" items={thesis.catalysts} />
                    <MiniList title="失效条件" items={thesis.invalidationSignals} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted">
                    {thesis.nextReviewAt ? <span>下次复盘：{thesis.nextReviewAt}</span> : null}
                    {thesis.updatedAt ? <span>逻辑更新：{cnDateTime(thesis.updatedAt)}</span> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {missingNotes.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">待补全逻辑</h2>
            <span className="text-sm font-semibold text-muted">{missingNotes.length} 条</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {missingNotes.slice(0, 6).map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="rounded-lg border border-dashed border-line bg-white p-4 transition hover:border-accent"
              >
                <div className="text-xs font-semibold text-accent">{note.tag}</div>
                <div className="mt-2 text-sm font-semibold text-ink">{note.title}</div>
                <p className="mt-2 text-xs leading-5 text-muted">{note.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="text-xs font-semibold text-ink">{title}</div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
          {items.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 text-xs text-muted">未填写</div>
      )}
    </div>
  );
}
