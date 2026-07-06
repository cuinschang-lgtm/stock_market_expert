import { Archive, ArrowLeft, CalendarDays, CheckCircle2, FileText, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/analyst/report-view";
import { NoteEditor } from "@/components/notes/note-editor";
import { ReportExportAction } from "@/components/notes/report-export-action";
import { ThesisTracker } from "@/components/notes/thesis-tracker";
import { cnDateTime } from "@/lib/formatters";
import { getResearchNote } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({ params }: { params: { id: string } }) {
  const result = await getResearchNote(decodeURIComponent(params.id));
  if (!result.configured || !result.note) notFound();

  const note = result.note;
  const archived = note.status === "archived";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/notes" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-teal-800">
          <ArrowLeft className="h-4 w-4" />
          返回研究笔记
        </Link>
        <ReportExportAction note={note} />
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
              <FileText className="h-4 w-4" />
              {note.tag}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted">
              {archived ? <Archive className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-accent" />}
              {archived ? "已归档" : "跟踪中"}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{note.title}</h1>
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
                className="inline-flex items-center gap-2 font-semibold text-accent hover:text-teal-800 md:justify-end"
              >
                <LinkIcon className="h-4 w-4" />
                {note.symbol}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <NoteEditor note={note} />

      <ThesisTracker note={note} />

      {note.report ? (
        <ReportView report={note.report} />
      ) : (
        <section className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
          这条笔记只有摘要内容。后续接入手工编辑器后，可在这里展示完整 Markdown 正文和附件引用。
        </section>
      )}
    </div>
  );
}
