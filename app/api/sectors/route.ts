import { NextResponse } from "next/server";
import { getSectorResearchCards } from "@/server/sector-research";

export async function GET() {
  const sectors = await getSectorResearchCards();
  return NextResponse.json({ sectors });
}
