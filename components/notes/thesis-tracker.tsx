"use client";

import { CalendarClock, RotateCcw, Save, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateCloudNote } from "@/lib/client-api";
import type { InvestmentThesis, ResearchNote, ThesisConviction } from "@/lib/types";

const convictionOptions: Array<{ value: ThesisConviction; label: string }> = [
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "low", label: "低" }
];

function listToText(items?: string[]) {
  return (items ?? []).join("\n");
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultHypothesis(note: ResearchNote) {
  if (note.thesis?.coreHypothesis) return note.thesis.coreHypothesis;
  return note.excerpt;
}

export function ThesisTracker({ note }: { note: ResearchNote }) {
  const router = useRouter();
  const [coreHypothesis, setCoreHypothesis] = useState(defaultHypothesis(note));
  const [keyMetrics, setKeyMetrics] = useState(listToText(note.thesis?.keyMetrics));
  const [catalysts, setCatalysts] = useState(listToText(note.thesis?.catalysts));
  const [invalidationSignals, setInvalidationSignals] = useState(listToText(note.thesis?.invalidationSignals));
  const [conviction, setConviction] = useState<ThesisConviction>(note.thesis?.conviction ?? "medium");
  const [nextReviewAt, setNextReviewAt] = useState(note.thesis?.nextReviewAt ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const thesis: InvestmentThesis = {
        coreHypothesis,
        keyMetrics: textToList(keyMetrics),
        catalysts: textToList(catalysts),
        invalidationSignals: textToList(invalidationSignals),
        conviction,
        nextReviewAt: nextReviewAt || undefined
      };
      await updateCloudNote(note.id, { thesis });
      setMessage("已保存");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setCoreHypothesis(defaultHypothesis(note));
    setKeyMetrics(listToText(note.thesis?.keyMetrics));
    setCatalysts(listToText(note.thesis?.catalysts));
    setInvalidationSignals(listToText(note.thesis?.invalidationSignals));
    setConviction(note.thesis?.conviction ?? "medium");
    setNextReviewAt(note.thesis?.nextReviewAt ?? "");
    setMessage(null);
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Thesis Tracker</div>
          <h2 className="mt-1 text-xl font-semibold text-ink">投资逻辑追踪器</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink">
            <Target className="h-4 w-4 text-accent" />
            <select
              value={conviction}
              onChange={(event) => setConviction(event.target.value as ThesisConviction)}
              className="bg-transparent text-sm font-semibold outline-none"
              aria-label="确信度"
            >
              {convictionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  确信度 {option.label}
                </option>
              ))}
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
            {saving ? "保存中" : "保存逻辑"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          核心假设
          <textarea
            value={coreHypothesis}
            onChange={(event) => setCoreHypothesis(event.target.value)}
            rows={3}
            className="resize-y rounded-lg border border-line px-3 py-2 text-sm font-medium leading-6 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            验证指标
            <textarea
              value={keyMetrics}
              onChange={(event) => setKeyMetrics(event.target.value)}
              rows={6}
              placeholder="每行一个指标"
              className="resize-y rounded-lg border border-line px-3 py-2 text-sm font-medium leading-6 text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            催化事件
            <textarea
              value={catalysts}
              onChange={(event) => setCatalysts(event.target.value)}
              rows={6}
              placeholder="每行一个事件"
              className="resize-y rounded-lg border border-line px-3 py-2 text-sm font-medium leading-6 text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            失效条件
            <textarea
              value={invalidationSignals}
              onChange={(event) => setInvalidationSignals(event.target.value)}
              rows={6}
              placeholder="每行一个条件"
              className="resize-y rounded-lg border border-line px-3 py-2 text-sm font-medium leading-6 text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>

        <label className="grid max-w-xs gap-2 text-sm font-semibold text-ink">
          下次复盘日
          <span className="relative">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="date"
              value={nextReviewAt}
              onChange={(event) => setNextReviewAt(event.target.value)}
              className="h-10 w-full rounded-lg border border-line pl-9 pr-3 text-sm font-medium text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
            />
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
        {note.thesis?.updatedAt ? <span>上次更新：{new Date(note.thesis.updatedAt).toLocaleDateString("zh-CN")}</span> : <span>尚未保存投资逻辑</span>}
        {message ? <span className={message === "已保存" ? "text-accent" : "text-danger"}>{message}</span> : null}
      </div>
    </section>
  );
}
