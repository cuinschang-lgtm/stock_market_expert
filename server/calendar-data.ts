import type { CompanyEvent, DashboardEvent, ResearchNote } from "@/lib/types";
import { dashboard, events } from "@/server/market-data/mock-data";
import { listResearchNotes } from "@/server/supabase/repositories";

export type CalendarEventKind = "review" | "company" | "market";

export interface CalendarEventItem {
  id: string;
  date: string;
  kind: CalendarEventKind;
  title: string;
  summary: string;
  symbol?: string;
  noteId?: string;
  impact: "高" | "中" | "低";
  source: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeImpact(impact: CompanyEvent["impact"] | DashboardEvent["impact"]): CalendarEventItem["impact"] {
  if (impact === "高" || impact === "利好" || impact === "利空") return "高";
  if (impact === "低") return "低";
  return "中";
}

function thesisEvents(notes: ResearchNote[]): CalendarEventItem[] {
  return notes
    .filter((note) => note.thesis?.nextReviewAt)
    .map((note) => ({
      id: `review-${note.id}`,
      date: note.thesis?.nextReviewAt ?? todayIso(),
      kind: "review" as const,
      title: `${note.title}：复盘提醒`,
      summary: note.thesis?.coreHypothesis ?? note.excerpt,
      symbol: note.symbol,
      noteId: note.id,
      impact: note.thesis?.conviction === "high" ? "高" : "中",
      source: "投资逻辑"
    }));
}

function companyEvents(): CalendarEventItem[] {
  return Object.entries(events).flatMap(([symbol, items]) =>
    items.map((event) => ({
      id: event.id,
      date: event.date,
      kind: "company" as const,
      title: event.title,
      summary: event.summary,
      symbol,
      impact: normalizeImpact(event.impact),
      source: event.source
    }))
  );
}

function marketEvents(): CalendarEventItem[] {
  return dashboard.events.map((event, index) => ({
    id: `market-${index}`,
    date: todayIso(),
    kind: "market" as const,
    title: event.title,
    summary: `${event.time} · ${event.scope}`,
    impact: normalizeImpact(event.impact),
    source: "Dashboard 事件"
  }));
}

export async function getCalendarEvents() {
  let notes: ResearchNote[] = [];
  let source: "cloud" | "mock" = "mock";
  try {
    const result = await listResearchNotes();
    if (result.configured) {
      notes = result.notes;
      source = "cloud";
    }
  } catch {
    notes = [];
  }

  const items = [...thesisEvents(notes), ...companyEvents(), ...marketEvents()].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.title.localeCompare(b.title, "zh-CN");
  });

  return { source, items };
}
