"use client";

import { Loader2, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ReportView } from "@/components/analyst/report-view";
import type { AnalystReport } from "@/lib/types";

interface InlineReportProps {
  /** 个股：/api/analysis/stock/[symbol]；行业：/api/sectors/[id] */
  apiPath: string;
  /** 加载中提示文案 */
  loadingLabel: string;
}

export function InlineReport({ apiPath, loadingLabel }: InlineReportProps) {
  const [report, setReport] = useState<AnalystReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(apiPath, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Server 返回 ${res.status}`);
      const data = await res.json();
      setReport(data.report ?? data.sector?.report ?? null);
    } catch (err: unknown) {
      clearTimeout(timeout);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-sm">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
        <p className="mt-3 text-sm font-semibold text-ink">{loadingLabel}</p>
        <p className="mt-1 text-xs text-muted">调用 DeepSeek AI，约 5-10 秒</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-danger/30 bg-red-50 p-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-danger">AI 分析加载失败</p>
        <p className="mt-1 text-xs text-muted">{error}</p>
        <button
          type="button"
          onClick={fetchReport}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          <RotateCw className="h-3.5 w-3.5" />
          重试
        </button>
      </section>
    );
  }

  if (!report) return null;

  return <ReportView report={report} />;
}
