"use client";

import { Check, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { QuoteSnapshot } from "@/lib/types";
import { addStoredWatchlistItem, isStoredWatchlistSymbol } from "@/lib/client-storage";
import { addCloudWatchlistItem, fetchCloudWatchlist } from "@/lib/client-api";

export function WatchlistAction({ quote }: { quote: QuoteSnapshot }) {
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"local" | "cloud" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadStatus() {
      setMessage(null);
      try {
        const result = await fetchCloudWatchlist();
        if (active && result.configured) {
          const exists = result.items.some((item) => item.symbol === quote.symbol);
          setAdded(exists);
          setMode(exists ? "cloud" : null);
          return;
        }
      } catch {
        // Fall back to browser storage below.
      }
      if (active) {
        setAdded(isStoredWatchlistSymbol(quote.symbol));
        setMode(isStoredWatchlistSymbol(quote.symbol) ? "local" : null);
      }
    }
    loadStatus();
    return () => {
      active = false;
    };
  }, [quote.symbol]);

  async function addToWatchlist() {
    setSaving(true);
    setMessage(null);
    let saved = false;
    try {
      const result = await addCloudWatchlistItem(quote.symbol);
      if (result.configured) {
        if (!result.item || result.item.symbol !== quote.symbol) {
          throw new Error("云端保存未确认，请重试");
        }
        setMode("cloud");
        saved = true;
      } else {
        addStoredWatchlistItem(quote);
        setMode("local");
        saved = true;
      }
    } catch {
      try {
        addStoredWatchlistItem(quote);
        setMode("local");
        setMessage("云端保存未确认，已保存到本地");
        saved = true;
      } catch {
        setMessage("保存失败，请重试");
      }
    } finally {
      if (saved) setAdded(true);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={addToWatchlist}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-accent disabled:cursor-default disabled:border-teal-200 disabled:bg-teal-50 disabled:text-accent"
        disabled={added || saving}
      >
        {added ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />}
        {saving ? "保存中" : added ? (mode === "cloud" ? "已云端保存" : "已在自选") : "加入自选"}
      </button>
      {message ? <span className="text-xs font-semibold text-muted">{message}</span> : null}
    </div>
  );
}
