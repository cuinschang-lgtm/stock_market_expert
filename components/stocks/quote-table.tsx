import Link from "next/link";
import type { QuoteSnapshot } from "@/lib/types";
import { formatCurrency, formatSignedPercent, trendClass } from "@/lib/formatters";

export function QuoteTable({ quotes }: { quotes: QuoteSnapshot[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-sunken text-left text-xs font-medium text-muted">
            <tr>
              <th className="px-4 py-3">标的</th>
              <th className="px-4 py-3">最新价</th>
              <th className="px-4 py-3">涨跌幅</th>
              <th className="hidden px-4 py-3 sm:table-cell">7日</th>
              <th className="hidden px-4 py-3 sm:table-cell">PE</th>
              <th className="hidden px-4 py-3 md:table-cell">成交额</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {quotes.map((quote) => (
              <tr key={quote.symbol} className="transition hover:bg-hover">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/stocks/${quote.symbol}`} className="font-semibold text-ink hover:text-accent">
                    {quote.name}
                  </Link>
                  <div className="text-xs text-muted">
                    {quote.symbol} · {quote.market}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink" font-mono tabular-nums>
                  {formatCurrency(quote.price, quote.currency)}
                </td>
                <td className={`whitespace-nowrap px-4 py-3 font-semibold ${trendClass(quote.changePercent)}`}>
                  {formatSignedPercent(quote.changePercent)}
                </td>
                <td className={`hidden whitespace-nowrap px-4 py-3 sm:table-cell ${trendClass(quote.weekChangePercent)}`}>
                  {formatSignedPercent(quote.weekChangePercent)}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell">{quote.peTtm > 0 ? quote.peTtm.toFixed(1) : "-"}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell text-muted">{quote.turnover}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
