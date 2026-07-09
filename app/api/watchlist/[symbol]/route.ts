import { apiError, jsonNoStore } from "@/app/api/_utils";
import { deleteWatchlistItem } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function DELETE(_request: Request, { params }: { params: { symbol: string } }) {
  try {
    return jsonNoStore(await deleteWatchlistItem(decodeURIComponent(params.symbol)));
  } catch (error) {
    return apiError(error);
  }
}
