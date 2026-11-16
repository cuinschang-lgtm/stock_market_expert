import { LocalWatchlist } from "@/components/stocks/local-watchlist";

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">自选股</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            集中维护跟踪标的和分组；云端可用时自动同步，否则完整保存在当前浏览器。
          </p>
        </div>
      </section>

      <LocalWatchlist />
    </div>
  );
}
