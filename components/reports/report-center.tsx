"use client";

import { Archive, CheckCircle2, Download, Eye, FileText, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchCloudNotes } from "@/lib/client-api";
import { getStoredNotes } from "@/lib/client-storage";
import { cnDateTime } from "@/lib/formatters";
import { cleanReportFilename, renderNoteMarkdownReport } from "@/lib/report-markdown";
import type { ResearchNote, ResearchNoteStatus } from "@/lib/types";

type StatusFilter = "all" | ResearchNoteStatus;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "跟踪中" },
  { value: "archived", label: "已归档" }
];

function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function reportCompleteness(note: ResearchNote) {
  let score = 1;
  if (note.body) score += 1;
  if (note.thesis) score += 1;
  if (note.report) score += 1;
  return score;
}

export function ReportCenter() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [source, setSource] = useState<"cloud" | "local">("local");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchCloudNotes();
        if (active && result.configured) {
          setNotes(result.notes);
          setSource("cloud");
          return;
        }
      } catch {
        // Fall back to browser storage below.
      }
      if (active) {
        setNotes(getStoredNotes());
        setSource("local");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const tags = useMemo(() => {
    return Array.from(new Set(notes.map((note) => note.tag).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return notes.filter((note) => {
      const noteStatus = note.status ?? "active";
      const statusMatched = statusFilter === "all" || noteStatus === statusFilter;
      const tagMatched = tagFilter === "all" || note.tag === tagFilter;
      const keywordMatched =
        keyword.length === 0 ||
        [note.title, note.excerpt, note.symbol, note.tag, note.body ?? ""]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(keyword));
      return statusMatched && tagMatched && keywordMatched;
    });
  }, [notes, query, statusFilter, tagFilter]);

  const selectedNotes = useMemo(() => {
    const selected = new Set(selectedIds);
    return notes.filter((note) => selected.has(note.id));
  }, [notes, selectedIds]);

  const reportReadyCount = notes.filter((note) => note.report || note.thesis || note.body).length;
  const selectedFilteredCount = filteredNotes.filter((note) => selectedIds.includes(note.id)).length;
  const allFilteredSelected = filteredNotes.length > 0 && selectedFilteredCount === filteredNotes.length;

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredNotes.map((note) => note.id));
      setSelectedIds((current) => current.filter((id) => !filteredIds.has(id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...filteredNotes.map((note) => note.id)])));
  }

  function exportSelected() {
    if (selectedNotes.length === 0) return;
    const markdown = selectedNotes.map(renderNoteMarkdownReport).join("\n\n---\n\n");
    const date = new Date().toISOString().slice(0, 10);
    downloadMarkdown(`research-reports-${date}.md`, markdown);
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
        还没有可汇总的研究笔记。进入 AI Analyst 保存分析后，这里会自动形成报告中心。
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">
              {source === "cloud" ? "Cloud reports" : "Local reports"}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">
              共 {notes.length} 条笔记，{reportReadyCount} 条具备报告素材，已选 {selectedNotes.length} 条
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_130px_130px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、摘要、代码或正文"
                className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm font-medium text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
              aria-label="按状态筛选报告"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
              aria-label="按标签筛选报告"
            >
              <option value="all">全部标签</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={exportSelected}
              disabled={selectedNotes.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <Download className="h-4 w-4" />
              批量导出
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={toggleAllFiltered}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent"
        >
          <span className="grid h-5 w-5 place-items-center rounded border border-line bg-white text-xs">
            {allFilteredSelected ? "✓" : ""}
          </span>
          {allFilteredSelected ? "取消选择当前筛选" : "选择当前筛选结果"}
        </button>
        <div className="text-xs font-semibold text-muted">
          当前筛选 {filteredNotes.length} 条，已选中其中 {selectedFilteredCount} 条
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
          没有匹配当前筛选条件的报告。
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredNotes.map((note) => {
            const selected = selectedIds.includes(note.id);
            const completeness = reportCompleteness(note);

            return (
              <article key={note.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelected(note.id)}
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line bg-white text-xs font-semibold text-accent"
                    aria-label={selected ? `取消选择 ${note.title}` : `选择 ${note.title}`}
                  >
                    {selected ? "✓" : ""}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                        <FileText className="h-4 w-4" />
                        {note.tag}
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-semibold text-muted">
                        {note.status === "archived" ? <Archive className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
                        {note.status === "archived" ? "已归档" : "跟踪中"}
                      </div>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-ink">
                      {source === "cloud" ? (
                        <Link href={`/notes/${note.id}/report`} className="hover:text-accent">
                          {note.title}
                        </Link>
                      ) : (
                        note.title
                      )}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{note.excerpt}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-line p-3">
                    <div className="text-xs font-semibold uppercase text-muted">完整度</div>
                    <div className="mt-1 text-lg font-semibold text-ink">{completeness}/4</div>
                  </div>
                  <div className="rounded-lg border border-line p-3">
                    <div className="text-xs font-semibold uppercase text-muted">标的</div>
                    <div className="mt-1 truncate text-lg font-semibold text-ink">{note.symbol ?? "未关联"}</div>
                  </div>
                  <div className="rounded-lg border border-line p-3">
                    <div className="text-xs font-semibold uppercase text-muted">创建</div>
                    <div className="mt-1 truncate text-sm font-semibold text-ink">{cnDateTime(note.createdAt)}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {source === "cloud" ? (
                    <Link
                      href={`/notes/${note.id}/report`}
                      className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-panel"
                    >
                      <Eye className="h-4 w-4" />
                      预览报告
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => downloadMarkdown(`${cleanReportFilename(note.title)}.md`, renderNoteMarkdownReport(note))}
                    className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-panel"
                  >
                    <Download className="h-4 w-4" />
                    导出 Markdown
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
