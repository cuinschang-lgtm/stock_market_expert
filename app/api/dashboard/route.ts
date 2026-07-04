import { NextResponse } from "next/server";
import { getDashboardViewData } from "@/server/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const dashboard = await getDashboardViewData();
  return NextResponse.json({ dashboard });
}
