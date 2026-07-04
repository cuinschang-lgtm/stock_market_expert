import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/server/market-data/provider";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const results = await getMarketDataProvider().searchSymbols(query);
  return NextResponse.json({ results });
}
