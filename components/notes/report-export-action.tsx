"use client";

import { Download } from "lucide-react";
import type { ResearchNote } from "@/lib/types";
import { cleanReportFilename, renderNoteMarkdownReport } from "@/lib/report-markdown";

export function ReportExportAction({ note }: { note: ResearchNote }) {
  function download() {
    const markdown = renderNoteMarkdownReport(note);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${cleanReportFilename(note.title)}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
    >
      <Download className="h-4 w-4" />
      导出 Markdown
    </button>
  );
}
