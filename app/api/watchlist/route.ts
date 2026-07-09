import { apiError, jsonNoStore } from "@/app/api/_utils";
import { getMarketDataProvider } from "@/server/market-data/provider";
import { listWatchlistItems, upsertWatchlistItem } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    return jsonNoStore(await listWatchlistItems());
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { symbol?: string };
    if (!body.symbol) {
      return jsonNoStore({ error: "symbol is required" }, { status: 400 });
    }

    const quote = await getMarketDataProvider().getQuote(body.symbol);
    return jsonNoStore(await upsertWatchlistItem(quote));
  } catch (error) {
    return apiError(error, 400);
  }
}
