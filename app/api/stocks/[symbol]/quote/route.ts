import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/server/market-data/provider";

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  const quote = await getMarketDataProvider().getQuote(decodeURIComponent(params.symbol));
  return NextResponse.json({ quote });
}
