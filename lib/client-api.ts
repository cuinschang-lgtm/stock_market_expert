import type { AnalystReport, CreateResearchNoteInput, ResearchNote, UpdateResearchNoteInput } from "@/lib/types";
import type { StoredWatchlistItem } from "@/lib/client-storage";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data;
}

/** 已登录时附带 Supabase access token，服务端据此区分用户数据 */
async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {};
  }
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function fetchCloudWatchlist() {
  const response = await fetch("/api/watchlist", {
    cache: "no-store",
    headers: await authHeaders()
  });
  return readJson<{ configured: boolean; items: StoredWatchlistItem[]; error?: string }>(response);
}

export async function addCloudWatchlistItem(symbol: string, group = "我的自选") {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ symbol, group })
  });
  return readJson<{ configured: boolean; item: StoredWatchlistItem | null; error?: string }>(response);
}

export async function updateCloudWatchlistGroup(symbol: string, group: string) {
  const response = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ group })
  });
  return readJson<{ configured: boolean; item: StoredWatchlistItem | null; error?: string }>(response);
}

export async function deleteCloudWatchlistItem(symbol: string) {
  const response = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}`, {
    method: "DELETE",
    headers: await authHeaders()
  });
  return readJson<{ configured: boolean; deleted?: boolean; symbol?: string; error?: string }>(response);
}

export async function fetchCloudNotes() {
  const response = await fetch("/api/notes", {
    cache: "no-store",
    headers: await authHeaders()
  });
  return readJson<{ configured: boolean; notes: ResearchNote[]; error?: string }>(response);
}

export async function fetchCloudNote(id: string) {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: await authHeaders()
  });
  return readJson<{ configured: boolean; note: ResearchNote | null; error?: string }>(response);
}

export async function saveCloudReportNote(report: AnalystReport) {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ report })
  });
  return readJson<{ configured: boolean; note: ResearchNote | null; error?: string }>(response);
}

export async function createCloudNote(note: CreateResearchNoteInput) {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ note })
  });
  return readJson<{ configured: boolean; note: ResearchNote | null; error?: string }>(response);
}

export async function updateCloudNote(id: string, input: UpdateResearchNoteInput) {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input)
  });
  return readJson<{ configured: boolean; note: ResearchNote | null; error?: string }>(response);
}

export async function deleteCloudNote(id: string) {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders()
  });
  return readJson<{ configured: boolean; error?: string }>(response);
}
