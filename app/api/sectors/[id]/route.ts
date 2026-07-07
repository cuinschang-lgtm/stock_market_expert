import { NextResponse } from "next/server";
import { getSectorResearchDetail } from "@/server/sector-research";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const sector = await getSectorResearchDetail(decodeURIComponent(params.id));
  return NextResponse.json({ sector });
}
