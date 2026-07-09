"use client";

import { Bot, Loader2, RotateCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ReportView } from "@/components/analyst/report-view";
import { SaveReportAction } from "@/components/analyst/save-report-action";
import type { AnalystReport } from "@/lib/types";

const QUICK_SYMBOLS = ["hk00700", "sh600519", "usNVDA", "sz300750"];

// Next.js 14 需要将 useSearchParams() 包裹在 Suspense 内
function AnalystContent() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get("symbol") ?? "hk00700";

  const [report, setReport] = useState<AnalystReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    setReport(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s 总超时

    try {
      const res = await fetch(`/api/analysis/stock/${encodeURIComponent(sym)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Server 返回 ${res.status}`);
      }

      const data = await res.json();
      if (!data.report) throw new Error("API 未返回分析结果");
      setReport(data.report);
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("分析请求超时（60秒），请重试");
      } else {
        setError(err instanceof Error ? err.message : "分析请求失败");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis(symbol);
  }, [symbol, fetchAnalysis]);

  const selectSymbol = (sym: string) => {
    router.push(`/analyst?symbol=${sym}`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Bot className="h-4 w-4" />
              AI Analyst
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">结构化投研分析</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              基于 DeepSeek AI 的结构化投研分析：当前位置、估值水位、短期事件和风险提示。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SYMBOLS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectSymbol(item)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  item === symbol
                    ? "border-accent bg-teal-50 text-accent"
                    : "border-line bg-white text-muted hover:border-accent hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 加载中 */}
      {loading && (
        <section className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm font-semibold text-ink">AI 正在分析 {symbol}...</p>
          <p className="mt-2 text-xs text-muted">调用 DeepSeek AI 生成结构化报告，约 5-10 秒</p>
        </section>
      )}

      {/* 错误提示 */}
      {!loading && error && (
        <section className="rounded-lg border border-danger/30 bg-red-50 p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-danger">分析失败</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => fetchAnalysis(symbol)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
          >
            <RotateCw className="h-4 w-4" />
            重试
          </button>
        </section>
      )}

      {/* 分析结果 */}
      {!loading && !error && report && (
        <>
          <ReportView report={report} />

          <section className="rounded-lg border border-line bg-panel p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">保存到研究笔记</div>
                <p className="mt-1 text-sm text-muted">
                  分析结果会优先写入 Supabase 的 research_notes，未配置云端时自动保存到当前浏览器。
                </p>
              </div>
              <SaveReportAction report={report} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function AnalystPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      }
    >
      <AnalystContent />
    </Suspense>
  );
}
