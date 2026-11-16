"use client";

import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addStoredWatchlistItem,
  getStoredWatchlist,
  removeStoredWatchlistItem,
  updateStoredWatchlistGroup,
  type StoredWatchlistItem
} from "@/lib/client-storage";
import {
  addCloudWatchlistItem,
  deleteCloudWatchlistItem,
  fetchCloudWatchlist,
  updateCloudWatchlistGroup
} from "@/lib/client-api";
import { formatCurrency, formatSignedPercent, trendClass } from "@/lib/formatters";
import type { QuoteSnapshot, SymbolSearchResult } from "@/lib/types";

type StorageSource = "local" | "cloud";

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "请求失败");
  return data;
}

export function LocalWatchlist() {
  const [items, setItems] = useState<StoredWatchlistItem[]>([]);
  const [source, setSource] = useState<StorageSource>("local");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [group, setGroup] = useState("我的自选");
  const [searching, setSearching] = useState(false);
  const [savingSymbol, setSavingSymbol] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchCloudWatchlist();
        if (active && result.configured) {
          setItems(result.items);
          setSource("cloud");
          return;
        }
      } catch {
        // Browser storage remains available when cloud sync cannot be reached.
      } finally {
        if (active) setLoading(false);
      }
      if (active) {
        setItems(getStoredWatchlist());
        setSource("local");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!dialogOpen || !query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/symbols/search?q=${encodeURIComponent(query.trim())}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const data = await readResponse<{ results: SymbolSearchResult[] }>(response);
        setResults(data.results.slice(0, 8));
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [dialogOpen, query]);

  const groups = useMemo(
    () => Array.from(new Set(["我的自选", ...items.map((item) => item.group).filter(Boolean)])),
    [items]
  );

  async function add(symbol: string) {
    setSavingSymbol(symbol);
    setMessage(null);
    try {
      const cloudResult = await addCloudWatchlistItem(symbol, group);
      if (cloudResult.configured) {
        if (!cloudResult.item) throw new Error("云端保存未确认，请重试");
        setItems((current) => [cloudResult.item!, ...current.filter((item) => item.symbol !== symbol)]);
        setSource("cloud");
      } else {
        const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/quote`, { cache: "no-store" });
        const data = await readResponse<{ quote: QuoteSnapshot }>(response);
        setItems(addStoredWatchlistItem(data.quote, group));
        setSource("local");
      }
      setDialogOpen(false);
      setQuery("");
      setResults([]);
      setMessage(`已加入 ${group.trim() || "我的自选"}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "添加失败，请重试");
    } finally {
      setSavingSymbol(null);
    }
  }

  async function remove(symbol: string) {
    setMessage(null);
    try {
      if (source === "cloud") {
        const result = await deleteCloudWatchlistItem(symbol);
        if (!result.configured || !result.deleted) throw new Error("云端删除未确认，请重试");
        setItems((current) => current.filter((item) => item.symbol !== symbol));
      } else {
        setItems(removeStoredWatchlistItem(symbol));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败，请重试");
    }
  }

  async function changeGroup(symbol: string, nextGroup: string) {
    setMessage(null);
    try {
      if (source === "cloud") {
        const result = await updateCloudWatchlistGroup(symbol, nextGroup);
        if (!result.configured || !result.item) throw new Error("分组保存未确认，请重试");
        setItems((current) => current.map((item) => (item.symbol === symbol ? result.item! : item)));
      } else {
        setItems(updateStoredWatchlistGroup(symbol, nextGroup));
      }
      setMessage("分组已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "分组更新失败");
    }
  }

  function submitDirect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symbol = query.trim();
    if (symbol) void add(symbol);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-medium text-muted">
            {source === "cloud" ? "Cloud watchlist" : "Local watchlist"}
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {loading ? "正在读取自选股" : `${items.length} 个标的 · ${groups.length} 个分组`}
          </div>
          {message ? <div className="mt-1 text-xs font-semibold text-muted">{message}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          添加标的
        </button>
      </div>

      {!loading && items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-panel p-5 text-sm leading-6 text-muted">
          还没有自选股。点击“添加标的”搜索股票，或在个股详情页加入自选。
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="divide-y divide-line">
            {items.map((item) => (
              <div key={item.symbol} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_180px_130px_40px] md:items-center">
                <div className="min-w-0">
                  <Link href={`/stocks/${item.symbol}`} className="font-semibold text-ink hover:text-accent">
                    {item.name}
                  </Link>
                  <div className="mt-1 text-xs text-muted">{item.symbol} · {item.market} · 加入于 {item.addedAt}</div>
                </div>
                <select
                  value={item.group}
                  onChange={(event) => void changeGroup(item.symbol, event.target.value)}
                  className="h-9 rounded-lg border border-line bg-panel px-3 text-sm font-semibold text-ink outline-none focus:border-accent"
                  aria-label={`修改 ${item.name} 的分组`}
                >
                  {groups.map((groupName) => <option key={groupName} value={groupName}>{groupName}</option>)}
                </select>
                <div className="text-left text-sm md:text-right">
                  <div className="font-semibold text-ink">{formatCurrency(item.price, item.currency)}</div>
                  <div className={trendClass(item.changePercent)}>{formatSignedPercent(item.changePercent)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(item.symbol)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-danger hover:text-danger"
                  aria-label={`删除 ${item.name}`}
                  title="删除标的"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="presentation" onMouseDown={() => setDialogOpen(false)}>
          <div className="w-full max-w-xl rounded-lg bg-panel shadow-xl" role="dialog" aria-modal="true" aria-labelledby="watchlist-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 id="watchlist-dialog-title" className="text-lg font-semibold text-ink">添加自选标的</h2>
              <button type="button" onClick={() => setDialogOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-panel" aria-label="关闭" title="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submitDirect} className="space-y-4 p-5">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                股票或代码
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如 贵州茅台 / 600519 / NVIDIA" className="h-11 w-full rounded-lg border border-field bg-sunken pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
                </div>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                分组
                <input value={group} onChange={(event) => setGroup(event.target.value)} list="watchlist-groups" className="h-11 rounded-lg border border-field bg-sunken px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
                <datalist id="watchlist-groups">{groups.map((name) => <option key={name} value={name} />)}</datalist>
              </label>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-line">
                {searching ? <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted"><Loader2 className="h-4 w-4 motion-safe:animate-spin" />搜索中</div> : null}
                {!searching && query.trim() && results.length === 0 ? <div className="p-4 text-center text-sm text-muted">无匹配结果，可按输入代码直接添加</div> : null}
                {results.map((result) => (
                  <button key={result.symbol} type="button" onClick={() => void add(result.symbol)} disabled={Boolean(savingSymbol)} className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-panel disabled:cursor-wait">
                    <span><span className="font-semibold text-ink">{result.name}</span><span className="ml-2 text-xs text-muted">{result.symbol}</span></span>
                    <span className="text-xs text-muted">{savingSymbol === result.symbol ? "添加中" : `${result.market} · ${result.exchange}`}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink">取消</button>
                <button type="submit" disabled={!query.trim() || !group.trim() || Boolean(savingSymbol)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:bg-muted">
                  {savingSymbol ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" /> : <Plus className="h-4 w-4" />}
                  按代码添加
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
