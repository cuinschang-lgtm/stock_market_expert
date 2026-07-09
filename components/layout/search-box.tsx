"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { SymbolSearchResult } from "@/lib/types";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef(0); // race-condition guard

  // 异步调用 /api/symbols/search
  const doSearch = useCallback(async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) { setResults([]); return; }
      setLoading(true);
      const version = ++fetchRef.current;
      try {
        const res = await fetch(
          `/api/symbols/search?q=${encodeURIComponent(trimmed)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        // 只保留最新一次请求的结果
        if (version === fetchRef.current) {
          setResults((data.results ?? []).slice(0, 8));
        }
      } catch {
        if (version === fetchRef.current) setResults([]);
      } finally {
        if (version === fetchRef.current) setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function submitSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFocused(false);
    router.push(`/stocks/${encodeURIComponent(trimmed)}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submitSearch(String(formData.get("query") ?? ""));
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={onSubmit}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          name="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="搜索股票、代码或主题，例如 腾讯 / NVIDIA / 300750"
          className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-teal-100"
        />
        <button type="submit" className="sr-only">搜索</button>
      </form>

      {/* 下拉建议 */}
      {focused && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-line bg-white shadow-lg">
          {loading && results.length === 0 && (
            <div className="px-3 py-3 text-center text-xs text-muted">搜索中…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-3 text-center text-xs text-muted">暂无匹配结果</div>
          )}
          <ul>
            {results.map((item) => (
              <li key={item.symbol}>
                <Link
                  href={`/stocks/${encodeURIComponent(item.symbol)}`}
                  onClick={() => setFocused(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm transition hover:bg-teal-50"
                >
                  <span>
                    <span className="font-semibold text-ink">{item.name}</span>
                    <span className="ml-2 text-xs text-muted">{item.symbol}</span>
                  </span>
                  <span className="text-xs text-muted">{item.market} · {item.exchange}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
