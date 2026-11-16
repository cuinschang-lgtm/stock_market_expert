import { apiError, jsonNoStore, resolveUserId } from "@/app/api/_utils";
import { deleteWatchlistItem, updateWatchlistItemGroup } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function DELETE(request: Request, { params }: { params: { symbol: string } }) {
  try {
    const userId = await resolveUserId(request);
    return jsonNoStore(await deleteWatchlistItem(decodeURIComponent(params.symbol), userId));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { symbol: string } }) {
  try {
    const userId = await resolveUserId(request);
    const body = (await request.json()) as { group?: string };
    if (!body.group?.trim()) {
      return jsonNoStore({ error: "group is required" }, { status: 400 });
    }
    const result = await updateWatchlistItemGroup(decodeURIComponent(params.symbol), body.group, userId);
    if (result.configured && !result.item) {
      return jsonNoStore({ configured: true, error: "Watchlist item not found" }, { status: 404 });
    }
    return jsonNoStore(result);
  } catch (error) {
    return apiError(error, 400);
  }
}
