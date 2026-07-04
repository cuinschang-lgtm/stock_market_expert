"use client";

import { Check, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { QuoteSnapshot } from "@/lib/types";
import { addStoredWatchlistItem, isStoredWatchlistSymbol } from "@/lib/client-storage";

export function WatchlistAction({ quote }: { quote: QuoteSnapshot }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(isStoredWatchlistSymbol(quote.symbol));
  }, [quote.symbol]);

  function addToWatchlist() {
    addStoredWatchlistItem(quote);
    setAdded(true);
  }

  return (
    <button
      type="button"
      onClick={addToWatchlist}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-accent disabled:cursor-default disabled:border-teal-200 disabled:bg-teal-50 disabled:text-accent"
      disabled={added}
    >
      {added ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />}
      {added ? "已在自选" : "加入自选"}
    </button>
  );
}
