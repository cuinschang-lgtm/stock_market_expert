import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/server/market-data/provider";
import { listWatchlistItems, upsertWatchlistItem } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function jsonNoStore(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function GET() {
  try {
    return jsonNoStore(await listWatchlistItems());
  } catch (error) {
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { symbol?: string };
    if (!body.symbol) {
      return jsonNoStore({ error: "symbol is required" }, { status: 400 });
    }

    const quote = await getMarketDataProvider().getQuote(body.symbol);
    return jsonNoStore(await upsertWatchlistItem(quote));
  } catch (error) {
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
