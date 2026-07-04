"use client";

import { Check, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { QuoteSnapshot } from "@/lib/types";
import { addStoredWatchlistItem, isStoredWatchlistSymbol } from "@/lib/client-storage";
import { addCloudWatchlistItem } from "@/lib/client-api";

export function WatchlistAction({ quote }: { quote: QuoteSnapshot }) {
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"local" | "cloud" | null>(null);

  useEffect(() => {
    setAdded(isStoredWatchlistSymbol(quote.symbol));
  }, [quote.symbol]);

  async function addToWatchlist() {
    setSaving(true);
    try {
      const result = await addCloudWatchlistItem(quote.symbol);
      if (result.configured) {
        setMode("cloud");
      } else {
        addStoredWatchlistItem(quote);
        setMode("local");
      }
    } catch {
      addStoredWatchlistItem(quote);
      setMode("local");
    } finally {
      setAdded(true);
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={addToWatchlist}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-accent disabled:cursor-default disabled:border-teal-200 disabled:bg-teal-50 disabled:text-accent"
      disabled={added || saving}
    >
      {added ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />}
      {saving ? "保存中" : added ? (mode === "cloud" ? "已云端保存" : "已在自选") : "加入自选"}
    </button>
  );
}
