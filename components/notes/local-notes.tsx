"use client";

import { FileText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cnDateTime } from "@/lib/formatters";
import type { ResearchNote } from "@/lib/types";
import { getStoredNotes, removeStoredNote } from "@/lib/client-storage";

export function LocalNotes() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);

  useEffect(() => {
    setNotes(getStoredNotes());
  }, []);

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
        还没有本地保存的笔记。进入 AI Analyst，点击“保存笔记”后会显示在这里。
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {notes.map((note) => (
        <article key={note.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
              <FileText className="h-4 w-4" />
              {note.tag}
            </div>
            <button
              type="button"
              onClick={() => setNotes(removeStoredNote(note.id))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-danger hover:text-danger"
              aria-label={`删除 ${note.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-ink">{note.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{note.excerpt}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted">
            {note.symbol ? <span>关联标的：{note.symbol}</span> : null}
            <span>{cnDateTime(note.createdAt)}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
