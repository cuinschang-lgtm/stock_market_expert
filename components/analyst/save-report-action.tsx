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

  async function save() {
    setSaving(true);
    try {
      const result = await saveCloudReportNote(report);
      if (result.configured) {
        setMode("cloud");
      } else {
        saveReportAsNote(report);
        setMode("local");
      }
    } catch {
      saveReportAsNote(report);
      setMode("local");
    } finally {
      setSaved(true);
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={saved || saving}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-default disabled:bg-accent"
    >
      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      {saving ? "保存中" : saved ? (mode === "cloud" ? "已云端保存" : "已保存") : "保存笔记"}
    </button>
  );
}
