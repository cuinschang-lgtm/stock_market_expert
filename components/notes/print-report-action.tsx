"use client";

import { Printer } from "lucide-react";

export function PrintReportAction() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
    >
      <Printer className="h-4 w-4" />
      打印 / 保存 PDF
    </button>
  );
}
