import type { ResearchNote } from "@/lib/types";

export function cleanReportFilename(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function section(title: string, body?: string | null) {
  if (!body) return "";
  return `\n## ${title}\n\n${body.trim()}\n`;
}

function listSection(title: string, items?: string[]) {
  if (!items || items.length === 0) return "";
  return `\n## ${title}\n\n${items.map((item) => `- ${item}`).join("\n")}\n`;
}

export function renderNoteMarkdownReport(note: ResearchNote) {
  const thesis = note.thesis;
  const report = note.report;
  const lines = [
    `# ${note.title}`,
    "",
    `- 标的：${note.symbol ?? "未关联"}`,
    `- 标签：${note.tag}`,
    `- 状态：${note.status === "archived" ? "已归档" : "跟踪中"}`,
    `- 创建时间：${note.createdAt}`,
    note.updatedAt ? `- 更新时间：${note.updatedAt}` : "",
    "",
    "> 本报告仅用于信息整理与研究辅助，不构成任何买卖建议。",
    "",
    "## 摘要",
    "",
    note.excerpt
  ].filter(Boolean);

  if (note.body) {
    lines.push(section("人工复盘", note.body));
  }

  if (thesis) {
    lines.push("\n## 投资逻辑\n");
    lines.push(`- 确信度：${thesis.conviction ?? "medium"}`);
    if (thesis.nextReviewAt) lines.push(`- 下次复盘日：${thesis.nextReviewAt}`);
    if (thesis.updatedAt) lines.push(`- 逻辑更新时间：${thesis.updatedAt}`);
    lines.push(section("核心假设", thesis.coreHypothesis));
    lines.push(listSection("验证指标", thesis.keyMetrics));
    lines.push(listSection("催化事件", thesis.catalysts));
    lines.push(listSection("失效条件", thesis.invalidationSignals));
  }

  if (report) {
    lines.push("\n## AI 分析报告\n");
    lines.push(`- 生成时间：${report.generatedAt}`);
    lines.push(`- 意图：${report.intent}`);
    lines.push(section("AI 摘要", report.summary));
    report.sections.forEach((item) => {
      lines.push(listSection(item.title, item.points));
    });
    if (report.sources.length > 0) {
      lines.push("\n## 数据来源\n");
      report.sources.forEach((source) => {
        lines.push(`- ${source.label} · ${source.timestamp}`);
      });
    }
    lines.push(section("免责声明", report.disclaimer));
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
