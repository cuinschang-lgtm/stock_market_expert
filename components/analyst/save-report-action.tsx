"use client";

import { Check, Save } from "lucide-react";
import { useState } from "react";
import type { AnalystReport } from "@/lib/types";
import { saveReportAsNote } from "@/lib/client-storage";

export function SaveReportAction({ report }: { report: AnalystReport }) {
  const [saved, setSaved] = useState(false);

  function save() {
    saveReportAsNote(report);
    setSaved(true);
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={saved}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-default disabled:bg-accent"
    >
      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      {saved ? "已保存" : "保存笔记"}
    </button>
  );
}
