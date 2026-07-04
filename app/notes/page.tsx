import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { cnDateTime } from "@/lib/formatters";
import { notes } from "@/server/market-data/mock-data";

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Research Notes</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">研究笔记</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            用来保存 AI 分析、人工复盘和投资逻辑。MVP 先展示 mock 笔记，后续接数据库。
          </p>
        </div>
        <Link
          href="/analyst"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          从分析生成
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {notes.map((note) => (
          <article key={note.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                <FileText className="h-4 w-4" />
                {note.tag}
              </div>
              <div className="whitespace-nowrap text-xs text-muted">{cnDateTime(note.createdAt)}</div>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-ink">{note.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{note.excerpt}</p>
            {note.symbol ? <div className="mt-4 text-xs font-semibold text-muted">关联标的：{note.symbol}</div> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
