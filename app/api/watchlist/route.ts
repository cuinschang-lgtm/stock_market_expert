import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/server/market-data/provider";
import { listWatchlistItems, upsertWatchlistItem } from "@/server/supabase/repositories";

export async function GET() {
  try {
    return NextResponse.json(await listWatchlistItems());
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { symbol?: string };
    if (!body.symbol) {
      return NextResponse.json({ error: "symbol is required" }, { status: 400 });
    }

    const quote = await getMarketDataProvider().getQuote(body.symbol);
    return NextResponse.json(await upsertWatchlistItem(quote));
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
