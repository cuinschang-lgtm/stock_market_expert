import type { AnalystReport, ResearchNote, QuoteSnapshot } from "@/lib/types";
import { DEFAULT_USER_ID, getSupabaseAdmin, isSupabaseConfigured } from "./client";

export interface WatchlistRecord {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  market: string;
  group_name: string;
  price: number;
  change_percent: number;
  currency: string;
  added_at: string;
  created_at: string;
}

export interface NoteRecord {
  id: string;
  user_id: string;
  title: string;
  symbol: string | null;
  tag: string;
  excerpt: string;
  report: AnalystReport | null;
  created_at: string;
}

export function mapWatchlistRecord(record: WatchlistRecord) {
  return {
    id: record.id,
    symbol: record.symbol,
    name: record.name,
    market: record.market,
    group: record.group_name,
    price: Number(record.price),
    changePercent: Number(record.change_percent),
    currency: record.currency,
    addedAt: record.added_at
  };
}

export function mapNoteRecord(record: NoteRecord): ResearchNote {
  return {
    id: record.id,
    title: record.title,
    symbol: record.symbol ?? undefined,
    tag: record.tag,
    excerpt: record.excerpt,
    createdAt: record.created_at,
    report: record.report
  };
}

export async function listWatchlistItems(userId = DEFAULT_USER_ID) {
  if (!isSupabaseConfigured()) return { configured: false, items: [] };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false, items: [] };

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { configured: true, items: (data as WatchlistRecord[]).map(mapWatchlistRecord) };
}

export async function upsertWatchlistItem(quote: QuoteSnapshot, userId = DEFAULT_USER_ID) {
  if (!isSupabaseConfigured()) return { configured: false, item: null };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false, item: null };

  const { data, error } = await supabase
    .from("watchlist_items")
    .upsert(
      {
        user_id: userId,
        symbol: quote.symbol,
        name: quote.name,
        market: quote.market,
        group_name: "我的自选",
        price: quote.price,
        change_percent: quote.changePercent,
        currency: quote.currency,
        added_at: new Date().toISOString().slice(0, 10)
      },
      { onConflict: "user_id,symbol" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return { configured: true, item: mapWatchlistRecord(data as WatchlistRecord) };
}

export async function deleteWatchlistItem(symbol: string, userId = DEFAULT_USER_ID) {
  if (!isSupabaseConfigured()) return { configured: false };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false };

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", symbol);

  if (error) throw error;
  return { configured: true };
}

export async function listResearchNotes(userId = DEFAULT_USER_ID) {
  if (!isSupabaseConfigured()) return { configured: false, notes: [] };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false, notes: [] };

  const { data, error } = await supabase
    .from("research_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { configured: true, notes: (data as NoteRecord[]).map(mapNoteRecord) };
}

export async function getResearchNote(id: string, userId = DEFAULT_USER_ID) {
  if (!isSupabaseConfigured()) return { configured: false, note: null };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false, note: null };

  const { data, error } = await supabase
    .from("research_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return { configured: true, note: data ? mapNoteRecord(data as NoteRecord) : null };
}

export async function insertResearchNote(report: AnalystReport, userId = DEFAULT_USER_ID) {
  if (!isSupabaseConfigured()) return { configured: false, note: null };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false, note: null };

  const { data, error } = await supabase
    .from("research_notes")
    .insert({
      user_id: userId,
      title: `${report.target}：AI 快速分析`,
      symbol: report.target.match(/\(([^)]+)\)/)?.[1] ?? null,
      tag: "AI 分析",
      excerpt: report.summary,
      report
    })
    .select("*")
    .single();

  if (error) throw error;
  return { configured: true, note: mapNoteRecord(data as NoteRecord) };
}

export async function deleteResearchNote(id: string, userId = DEFAULT_USER_ID) {
  if (!isSupabaseConfigured()) return { configured: false };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false };

  const { error } = await supabase
    .from("research_notes")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;
  return { configured: true };
}
