import type { AnalystReport, ResearchNote } from "@/lib/types";
import type { StoredWatchlistItem } from "@/lib/client-storage";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data;
}

export async function fetchCloudWatchlist() {
  const response = await fetch("/api/watchlist", { cache: "no-store" });
  return readJson<{ configured: boolean; items: StoredWatchlistItem[]; error?: string }>(response);
}

export async function addCloudWatchlistItem(symbol: string) {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol })
  });
  return readJson<{ configured: boolean; item: StoredWatchlistItem | null; error?: string }>(response);
}

export async function deleteCloudWatchlistItem(symbol: string) {
  const response = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" });
  return readJson<{ configured: boolean; error?: string }>(response);
}

export async function fetchCloudNotes() {
  const response = await fetch("/api/notes", { cache: "no-store" });
  return readJson<{ configured: boolean; notes: ResearchNote[]; error?: string }>(response);
}

export async function fetchCloudNote(id: string) {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, { cache: "no-store" });
  return readJson<{ configured: boolean; note: ResearchNote | null; error?: string }>(response);
}

export async function saveCloudReportNote(report: AnalystReport) {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report })
  });
  return readJson<{ configured: boolean; note: ResearchNote | null; error?: string }>(response);
}

export async function deleteCloudNote(id: string) {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
  return readJson<{ configured: boolean; error?: string }>(response);
}
