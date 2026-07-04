import { NextResponse } from "next/server";
import { generateStockFastReport } from "@/server/analyst/report";

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  const report = await generateStockFastReport(decodeURIComponent(params.symbol));
  return NextResponse.json({ report });
}
