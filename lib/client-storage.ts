import type { AnalystReport, QuoteSnapshot, ResearchNote, WatchlistItem } from "@/lib/types";

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

export function getStoredNotes() {
  return readJson<ResearchNote[]>(NOTES_KEY, []);
}

export function saveReportAsNote(report: AnalystReport) {
  const existing = getStoredNotes();
  const nextNote: ResearchNote = {
    id: `local-${Date.now()}`,
    title: `${report.target}：AI 快速分析`,
    symbol: report.target.match(/\(([^)]+)\)/)?.[1],
    tag: "AI 分析",
    createdAt: new Date().toISOString(),
    excerpt: report.summary,
    report
  };
  const next = [nextNote, ...existing];
  writeJson(NOTES_KEY, next);
  return nextNote;
}

export function removeStoredNote(id: string) {
  const next = getStoredNotes().filter((note) => note.id !== id);
  writeJson(NOTES_KEY, next);
  return next;
}
