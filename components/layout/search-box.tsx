"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useState } from "react";

const quickSymbols: Record<string, string> = {
  腾讯: "hk00700",
  腾讯控股: "hk00700",
  茅台: "sh600519",
  贵州茅台: "sh600519",
  英伟达: "usNVDA",
  nvda: "usNVDA",
  宁德: "sz300750",
  宁德时代: "sz300750",
  apple: "usAAPL",
  苹果: "usAAPL"
};

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const target = quickSymbols[normalized.toLowerCase()] ?? quickSymbols[normalized] ?? normalized;
    router.push(`/stocks/${encodeURIComponent(target)}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submitSearch(String(formData.get("query") ?? ""));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitSearch(event.currentTarget.value);
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        name="query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="搜索股票、代码或主题，例如 腾讯 / sh600519 / usNVDA"
        className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-teal-100"
      />
      <button type="submit" className="sr-only">
        搜索
      </button>
    </form>
  );
}
