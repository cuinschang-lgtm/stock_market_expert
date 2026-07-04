import { ArrowLeft, CalendarDays, FileText, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/analyst/report-view";
import { cnDateTime } from "@/lib/formatters";
import { getResearchNote } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({ params }: { params: { id: string } }) {
  const result = await getResearchNote(decodeURIComponent(params.id));
  if (!result.configured || !result.note) notFound();

  const note = result.note;

  return (
    <div className="space-y-6">
      <Link href="/notes" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-teal-800">
        <ArrowLeft className="h-4 w-4" />
        返回研究笔记
      </Link>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
              <FileText className="h-4 w-4" />
              {note.tag}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{note.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted">{note.excerpt}</p>
          </div>
          <div className="grid gap-2 text-sm text-muted md:text-right">
            <div className="inline-flex items-center gap-2 md:justify-end">
              <CalendarDays className="h-4 w-4" />
              {cnDateTime(note.createdAt)}
            </div>
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
