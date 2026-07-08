import { NextResponse } from "next/server";
import { deleteWatchlistItem } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function jsonNoStore(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function DELETE(_request: Request, { params }: { params: { symbol: string } }) {
  try {
    return jsonNoStore(await deleteWatchlistItem(decodeURIComponent(params.symbol)));
  } catch (error) {
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
