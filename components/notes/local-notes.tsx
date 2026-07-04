"use client";

import { Archive, CheckCircle2, FileText, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cnDateTime } from "@/lib/formatters";
import type { ResearchNote, ResearchNoteStatus } from "@/lib/types";
import { getStoredNotes, removeStoredNote } from "@/lib/client-storage";
import { deleteCloudNote, fetchCloudNotes } from "@/lib/client-api";

type StatusFilter = "all" | ResearchNoteStatus;
type GroupMode = "none" | "status" | "tag";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "active", label: "跟踪中" },
  { value: "archived", label: "已归档" }
];

const statusLabels: Record<ResearchNoteStatus, string> = {
  active: "跟踪中",
  archived: "已归档"
};

export function LocalNotes() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [source, setSource] = useState<"local" | "cloud">("local");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [query, setQuery] = useState("");

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

  async function remove(id: string) {
    if (source === "cloud") {
      try {
        await deleteCloudNote(id);
        setNotes((current) => current.filter((note) => note.id !== id));
        return;
      } catch {
        // Fall through to local deletion for resilience.
      }
    }
    setNotes(removeStoredNote(id));
  }

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

  const activeCount = notes.filter((note) => (note.status ?? "active") === "active").length;
  const archivedCount = notes.filter((note) => note.status === "archived").length;

  const groupedNotes = useMemo(() => {
    if (groupMode === "none") {
      return [{ id: "all", label: "全部笔记", notes: filteredNotes }];
    }

    const groups = new Map<string, ResearchNote[]>();
    filteredNotes.forEach((note) => {
      const key = groupMode === "status" ? (note.status ?? "active") : note.tag;
      groups.set(key, [...(groups.get(key) ?? []), note]);
    });

    return Array.from(groups.entries()).map(([key, groupNotes]) => ({
      id: key,
      label: groupMode === "status" ? statusLabels[key as ResearchNoteStatus] : key,
      notes: groupNotes
    }));
  }, [filteredNotes, groupMode]);

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
        还没有{source === "cloud" ? "云端" : "本地"}保存的笔记。进入 AI Analyst，点击“保存笔记”后会显示在这里。
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">
              {source === "cloud" ? "Cloud notes" : "Local notes"}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">
              共 {notes.length} 条，跟踪中 {activeCount} 条，已归档 {archivedCount} 条
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_120px_120px_120px] lg:w-[760px]">
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
              aria-label="按状态筛选"
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
              aria-label="按标签筛选"
            >
              <option value="all">全部标签</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <select
              value={groupMode}
              onChange={(event) => setGroupMode(event.target.value as GroupMode)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
              aria-label="分组方式"
            >
              <option value="none">不分组</option>
              <option value="status">按状态</option>
              <option value="tag">按标签</option>
            </select>
          </div>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
          没有匹配当前筛选条件的笔记。
        </div>
      ) : (
        <div className="space-y-5">
          {groupedNotes.map((group) => (
            <section key={group.id} className="space-y-3">
              {groupMode !== "none" ? (
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h2 className="text-sm font-semibold text-ink">{group.label}</h2>
                  <span className="text-xs font-semibold text-muted">{group.notes.length} 条</span>
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {group.notes.map((note) => (
                  <article key={note.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
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
                      <button
                        type="button"
                        onClick={() => remove(note.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-danger hover:text-danger"
                        aria-label={`删除 ${note.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-ink">
                      {source === "cloud" ? (
                        <Link href={`/notes/${note.id}`} className="hover:text-accent">
                          {note.title}
                        </Link>
                      ) : (
                        note.title
                      )}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{note.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted">
                      {note.symbol ? <span>关联标的：{note.symbol}</span> : null}
                      <span>{cnDateTime(note.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
