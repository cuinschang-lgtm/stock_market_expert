import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/server/market-data/provider";

export async function GET() {
  const dashboard = await getMarketDataProvider().getDashboardData();
  return NextResponse.json({ dashboard });
}
