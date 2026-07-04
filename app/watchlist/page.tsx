import { Plus, Star } from "lucide-react";
import { QuoteTable } from "@/components/stocks/quote-table";
import { watchlistItems } from "@/server/market-data/mock-data";
import { getMarketDataProvider } from "@/server/market-data/provider";

export default async function WatchlistPage() {
  const provider = getMarketDataProvider();
  const quotes = await Promise.all(watchlistItems.map((item) => provider.getQuote(item.symbol)));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Watchlist</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">自选股</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            MVP 阶段使用 mock 自选股，后续接入用户账户后支持添加、删除、分组和事件提醒。
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          添加标的
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {watchlistItems.map((item) => (
          <div key={item.symbol} className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Star className="h-4 w-4 text-warn" />
              {item.group}
            </div>
            <div className="mt-2 text-sm text-muted">{item.symbol}</div>
            <div className="mt-1 text-xs text-muted">加入于 {item.addedAt}</div>
          </div>
        ))}
      </section>

      <QuoteTable quotes={quotes} />
    </div>
  );
}
