import { NextResponse } from "next/server";
import { deleteWatchlistItem } from "@/server/supabase/repositories";

export async function DELETE(_request: Request, { params }: { params: { symbol: string } }) {
  try {
    return NextResponse.json(await deleteWatchlistItem(decodeURIComponent(params.symbol)));
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
