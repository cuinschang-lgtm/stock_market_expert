import type {
  AnalystReport,
  CreateResearchNoteInput,
  InvestmentThesis,
  QuoteSnapshot,
  ResearchNote,
  UpdateResearchNoteInput,
  WatchlistItem
} from "@/lib/types";

const WATCHLIST_KEY = "sme.watchlist";
const NOTES_KEY = "sme.notes";

export interface StoredWatchlistItem extends WatchlistItem {
  name: string;
  market: string;
  price: number;
  changePercent: number;
  currency: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredWatchlist() {
  return readJson<StoredWatchlistItem[]>(WATCHLIST_KEY, []);
}

export function isStoredWatchlistSymbol(symbol: string) {
  return getStoredWatchlist().some((item) => item.symbol === symbol);
}

export function addStoredWatchlistItem(quote: QuoteSnapshot, group = "我的自选") {
  const existing = getStoredWatchlist();
  if (existing.some((item) => item.symbol === quote.symbol)) return existing;

  const next = [
    {
      symbol: quote.symbol,
      name: quote.name,
      market: quote.market,
      group,
      price: quote.price,
      changePercent: quote.changePercent,
      currency: quote.currency,
      addedAt: new Date().toISOString().slice(0, 10)
    },
    ...existing
  ];
  writeJson(WATCHLIST_KEY, next);
  return next;
}

export function removeStoredWatchlistItem(symbol: string) {
  const next = getStoredWatchlist().filter((item) => item.symbol !== symbol);
  writeJson(WATCHLIST_KEY, next);
  return next;
}

export function updateStoredWatchlistGroup(symbol: string, group: string) {
  const cleanGroup = group.trim();
  if (!cleanGroup) throw new Error("分组名称不能为空");
  const next = getStoredWatchlist().map((item) =>
    item.symbol === symbol ? { ...item, group: cleanGroup } : item
  );
  writeJson(WATCHLIST_KEY, next);
  return next;
}

export function getStoredNotes() {
  return readJson<ResearchNote[]>(NOTES_KEY, []);
}

export function getStoredNote(id: string) {
  return getStoredNotes().find((note) => note.id === id) ?? null;
}

function cleanList(items: string[] | undefined) {
  return (items ?? []).map((item) => item.trim()).filter(Boolean);
}

function normalizeStoredThesis(thesis: InvestmentThesis): InvestmentThesis {
  return {
    coreHypothesis: thesis.coreHypothesis.trim(),
    keyMetrics: cleanList(thesis.keyMetrics),
    catalysts: cleanList(thesis.catalysts),
    invalidationSignals: cleanList(thesis.invalidationSignals),
    conviction: thesis.conviction,
    nextReviewAt: thesis.nextReviewAt || undefined,
    updatedAt: new Date().toISOString()
  };
}

export function createStoredNote(input: CreateResearchNoteInput) {
  const title = input.title.trim();
  const tag = input.tag.trim();
  const excerpt = input.excerpt.trim();
  if (!title) throw new Error("标题不能为空");
  if (!tag) throw new Error("标签不能为空");
  if (!excerpt) throw new Error("摘要不能为空");

  const now = new Date().toISOString();
  const note: ResearchNote = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    symbol: input.symbol?.trim() || undefined,
    tag,
    excerpt,
    body: input.body?.trim() || null,
    status: input.status ?? "active",
    thesis: input.thesis ? normalizeStoredThesis(input.thesis) : null,
    report: input.report ?? null,
    createdAt: now,
    updatedAt: now
  };
  writeJson(NOTES_KEY, [note, ...getStoredNotes()]);
  return note;
}

export function updateStoredNote(id: string, input: UpdateResearchNoteInput) {
  const current = getStoredNote(id);
  if (!current) throw new Error("笔记不存在或已被删除");

  const nextNote: ResearchNote = {
    ...current,
    ...(typeof input.title === "string" ? { title: input.title.trim() } : {}),
    ...(typeof input.tag === "string" ? { tag: input.tag.trim() } : {}),
    ...(typeof input.excerpt === "string" ? { excerpt: input.excerpt.trim() } : {}),
    ...(typeof input.body === "string" ? { body: input.body.trim() || null } : {}),
    ...(input.body === null ? { body: null } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.thesis ? { thesis: normalizeStoredThesis(input.thesis) } : {}),
    ...(input.thesis === null ? { thesis: null } : {}),
    updatedAt: new Date().toISOString()
  };
  if (!nextNote.title) throw new Error("标题不能为空");
  if (!nextNote.tag) throw new Error("标签不能为空");
  if (!nextNote.excerpt) throw new Error("摘要不能为空");
  if (nextNote.thesis && !nextNote.thesis.coreHypothesis) throw new Error("核心假设不能为空");

  const next = getStoredNotes().map((note) => (note.id === id ? nextNote : note));
  writeJson(NOTES_KEY, next);
  return nextNote;
}

export function saveReportAsNote(report: AnalystReport) {
  return createStoredNote({
    title: `${report.target}：AI 快速分析`,
    symbol: report.target.match(/\(([^)]+)\)/)?.[1],
    tag: "AI 分析",
    excerpt: report.summary,
    body: "",
    status: "active",
    report
  });
}

export function removeStoredNote(id: string) {
  const next = getStoredNotes().filter((note) => note.id !== id);
  writeJson(NOTES_KEY, next);
  return next;
}
