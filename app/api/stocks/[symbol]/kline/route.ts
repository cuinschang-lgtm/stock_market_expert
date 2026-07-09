import { apiError, jsonNoStore } from "@/app/api/_utils";
import { getMarketDataProvider } from "@/server/market-data/provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  try {
    const result = await getMarketDataProvider().getKlineWithMeta(decodeURIComponent(params.symbol));
    return jsonNoStore({ kline: result.data, meta: result.meta });
  } catch (error) {
    return apiError(error, 404);
  }
}
