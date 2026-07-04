import { Bot, Save } from "lucide-react";
import Link from "next/link";
import { ReportView } from "@/components/analyst/report-view";
import { generateStockFastReport } from "@/server/analyst/report";

export default async function AnalystPage({
  searchParams
}: {
  searchParams: {
    symbol?: string;
  };
}) {
  const symbol = searchParams.symbol ?? "hk00700";
  const report = await generateStockFastReport(symbol);

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
              当前版本先演示个股 fast 分析：当前位置、估值水位、短期事件和风险提示。真实数据源接入后会保留同样输出结构。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["hk00700", "sh600519", "usNVDA", "sz300750"].map((item) => (
              <Link
                key={item}
                href={`/analyst?symbol=${item}`}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  item === symbol
                    ? "border-accent bg-teal-50 text-accent"
                    : "border-line bg-white text-muted hover:border-accent hover:text-ink"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ReportView report={report} />

      <section className="rounded-lg border border-line bg-panel p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">保存到研究笔记</div>
            <p className="mt-1 text-sm text-muted">
              MVP 阶段展示入口；接入数据库后这里会把分析结果写入 `research_notes`。
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
            <Save className="h-4 w-4" />
            保存笔记
          </button>
        </div>
      </section>
    </div>
  );
}
