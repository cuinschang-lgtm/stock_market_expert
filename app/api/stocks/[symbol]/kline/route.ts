import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/server/market-data/provider";

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  const kline = await getMarketDataProvider().getKline(decodeURIComponent(params.symbol));
  return NextResponse.json({ kline });
}
