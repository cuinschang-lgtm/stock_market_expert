import { FileText } from "lucide-react";
import { ReportCenter } from "@/components/reports/report-center";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-accent">Report Center</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">报告中心</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          集中管理可导出的研究笔记，筛选后可进入报告视图、单篇导出 Markdown，或勾选多篇合并导出。
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
            <FileText className="h-4 w-4" />
            Workflow
          </div>
          <div className="mt-2 text-lg font-semibold text-ink">分析 → 笔记 → 报告</div>
          <p className="mt-2 text-sm leading-6 text-muted">报告中心复用研究笔记、投资逻辑和 AI 分析结果，不引入额外数据孤岛。</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-muted">Export</div>
          <div className="mt-2 text-lg font-semibold text-ink">Markdown First</div>
          <p className="mt-2 text-sm leading-6 text-muted">先支持低成本、可编辑、可迁移的 Markdown，PDF 通过报告视图打印保存。</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-muted">Boundary</div>
          <div className="mt-2 text-lg font-semibold text-ink">研究辅助</div>
          <p className="mt-2 text-sm leading-6 text-muted">所有导出保留风险边界，不生成指令式买卖建议。</p>
        </div>
      </div>

      <ReportCenter />
    </div>
  );
}
