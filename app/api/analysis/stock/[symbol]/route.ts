import { apiError, jsonNoStore } from "@/app/api/_utils";
import { generateStockFastReport } from "@/server/analyst/report";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30; // DeepSeek chat 模型 3-8s，留足余量

function normalizeCandidate(symbol: string) {
  const raw = symbol.trim();
  if (/^\d{6}$/.test(raw)) return raw.startsWith("6") ? `sh${raw}` : `sz${raw}`;
  if (/^\d{4,5}$/.test(raw)) return `hk${raw.padStart(5, "0")}`;
  return raw.startsWith("us") ? `us${raw.slice(2).toUpperCase()}` : raw.toLowerCase();
}

function assertSupportedSymbolShape(symbol: string) {
  const normalized = normalizeCandidate(symbol);
  if (
    /^sh\d{6}$/.test(normalized) ||
    /^sz\d{6}$/.test(normalized) ||
    /^hk\d{5}$/.test(normalized) ||
    /^us[A-Z][A-Z0-9_.-]{0,9}$/.test(normalized)
  ) {
    return normalized;
  }
  throw new Error(`暂未找到或无法获取股票代码「${symbol.trim() || symbol}」。请检查代码格式，或先通过搜索选择匹配结果。`);
}

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  try {
    const symbol = assertSupportedSymbolShape(decodeURIComponent(params.symbol));
    const report = await generateStockFastReport(symbol);
    return jsonNoStore({ report });
  } catch (error) {
    return apiError(error, 404);
  }
}
