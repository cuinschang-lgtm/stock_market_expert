"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, formatSignedPercent, trendClass } from "@/lib/formatters";
import { getStoredWatchlist, removeStoredWatchlistItem, type StoredWatchlistItem } from "@/lib/client-storage";
import { deleteCloudWatchlistItem, fetchCloudWatchlist } from "@/lib/client-api";

export function LocalWatchlist() {
  const [items, setItems] = useState<StoredWatchlistItem[]>([]);
  const [source, setSource] = useState<"local" | "cloud">("local");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setMessage(null);
      try {
        const result = await fetchCloudWatchlist();
        if (active && result.configured) {
          setItems(result.items);
          setSource("cloud");
          return;
        }
      } catch {
        // Fall back to browser storage below.
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

  async function remove(symbol: string) {
    setMessage(null);
    if (source === "cloud") {
      try {
        const result = await deleteCloudWatchlistItem(symbol);
        if (result.configured && !result.deleted) {
          setMessage("云端删除未确认，请刷新后重试");
          return;
        }
        setItems((current) => current.filter((item) => item.symbol !== symbol));
        return;
      } catch {
        // Fall through to local deletion for resilience.
      }
    }
    setItems(removeStoredWatchlistItem(symbol));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
        还没有{source === "cloud" ? "云端" : "本地"}自选股。打开任一个股详情页，点击“加入自选”后会显示在这里。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="border-b border-line bg-panel px-4 py-3 text-sm font-semibold text-ink">
        <div>{source === "cloud" ? "我的云端自选" : "我的本地自选"}</div>
        {message ? <div className="mt-1 text-xs text-danger">{message}</div> : null}
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div key={item.symbol} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Link href={`/stocks/${item.symbol}`} className="font-semibold text-ink hover:text-accent">
                {item.name}
              </Link>
              <div className="mt-1 text-xs text-muted">
                {item.symbol} · {item.market} · {item.group} · {item.addedAt}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="font-semibold text-ink">{formatCurrency(item.price, item.currency)}</div>
                <div className={trendClass(item.changePercent)}>{formatSignedPercent(item.changePercent)}</div>
              </div>
              <button
                type="button"
                onClick={() => remove(item.symbol)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-danger hover:text-danger"
                aria-label={`删除 ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
