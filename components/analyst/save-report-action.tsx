"use client";

import { Check, Save } from "lucide-react";
import { useState } from "react";
import type { AnalystReport } from "@/lib/types";
import { saveReportAsNote } from "@/lib/client-storage";
import { saveCloudReportNote } from "@/lib/client-api";

export function SaveReportAction({ report }: { report: AnalystReport }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"local" | "cloud" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    let confirmed = false;
    try {
      const result = await saveCloudReportNote(report);
      if (result.configured) {
        if (!result.note || result.note.report?.id !== report.id) {
          throw new Error("云端保存未确认，请重试");
        }
        setMode("cloud");
        confirmed = true;
      } else {
        saveReportAsNote(report);
        setMode("local");
        confirmed = true;
      }
    } catch {
      try {
        saveReportAsNote(report);
        setMode("local");
        setMessage("云端保存未确认，已保存到本地");
        confirmed = true;
      } catch {
        setMessage("保存失败，请重试");
      }
    } finally {
      if (confirmed) setSaved(true);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <button
        type="button"
        onClick={save}
        disabled={saved || saving}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-default disabled:bg-accent"
      >
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saving ? "保存中" : saved ? (mode === "cloud" ? "已云端保存" : "已保存") : "保存笔记"}
      </button>
      {message ? <span className="text-xs font-semibold text-muted">{message}</span> : null}
    </div>
  );
}
