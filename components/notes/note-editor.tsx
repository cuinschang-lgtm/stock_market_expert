"use client";

import { Archive, CheckCircle2, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateCloudNote } from "@/lib/client-api";
import type { ResearchNote, ResearchNoteStatus } from "@/lib/types";

const statusCopy: Record<ResearchNoteStatus, string> = {
  active: "跟踪中",
  archived: "已归档"
};

function clean(value: string) {
  return value.trim();
}

export function NoteEditor({ note }: { note: ResearchNote }) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [tag, setTag] = useState(note.tag);
  const [excerpt, setExcerpt] = useState(note.excerpt);
  const [body, setBody] = useState(note.body ?? "");
  const [status, setStatus] = useState<ResearchNoteStatus>(note.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateCloudNote(note.id, { title, tag, excerpt, body, status });
      if (result.configured) {
        if (!result.note) {
          throw new Error("保存未写入，请重试");
        }
        const saved = result.note;
        const expectedBody = clean(body);
        const bodyMatched = expectedBody.length === 0 ? !saved.body : saved.body === expectedBody;
        if (
          saved.title !== clean(title) ||
          saved.tag !== clean(tag) ||
          saved.excerpt !== clean(excerpt) ||
          saved.status !== status ||
          !bodyMatched
        ) {
          throw new Error("保存未写入，请重试");
        }
      }
      setMessage("已保存");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setTitle(note.title);
    setTag(note.tag);
    setExcerpt(note.excerpt);
    setBody(note.body ?? "");
    setStatus(note.status ?? "active");
    setMessage(null);
  }

  const archived = status === "archived";

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Editor</div>
          <h2 className="mt-1 text-xl font-semibold text-ink">人工复盘</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink">
            {archived ? <Archive className="h-4 w-4 text-muted" /> : <CheckCircle2 className="h-4 w-4 text-accent" />}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ResearchNoteStatus)}
              className="bg-transparent text-sm font-semibold outline-none"
              aria-label="笔记状态"
            >
              <option value="active">跟踪中</option>
              <option value="archived">已归档</option>
            </select>
          </label>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-muted"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中" : "保存"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          标题
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            标签
            <input
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            摘要
            <input
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          复盘正文
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={8}
            placeholder="记录你的判断、证据、待验证问题和后续跟踪点。"
            className="min-h-48 resize-y rounded-lg border border-line px-3 py-2 text-sm font-medium leading-6 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
        <span>当前状态：{statusCopy[status]}</span>
        {message ? <span className={message === "已保存" ? "text-accent" : "text-danger"}>{message}</span> : null}
      </div>
    </section>
  );
}
