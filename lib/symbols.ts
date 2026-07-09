export function normalizeStockSymbolCandidate(symbol: string) {
  const raw = symbol.trim();
  if (/^\d{6}$/.test(raw)) return raw.startsWith("6") ? `sh${raw}` : `sz${raw}`;
  if (/^\d{4,5}$/.test(raw)) return `hk${raw.padStart(5, "0")}`;
  return /^us/i.test(raw) ? `us${raw.slice(2).toUpperCase()}` : raw.toLowerCase();
}

export function isSupportedStockSymbol(symbol: string) {
  const normalized = normalizeStockSymbolCandidate(symbol);
  return (
    /^sh\d{6}$/.test(normalized) ||
    /^sz\d{6}$/.test(normalized) ||
    /^hk\d{5}$/.test(normalized) ||
    /^us[A-Z][A-Z0-9_.-]{0,9}$/.test(normalized)
  );
}

export function invalidStockSymbolMessage(symbol: string) {
  return `暂未找到或无法获取股票代码「${symbol.trim() || symbol}」。请检查代码格式，或先通过搜索选择匹配结果。`;
}
