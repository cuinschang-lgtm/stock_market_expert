import { apiError, jsonNoStore } from "@/app/api/_utils";
import { getMarketDataProvider } from "@/server/market-data/provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  try {
    const financials = await getMarketDataProvider().getFinancials(decodeURIComponent(params.symbol));
    return jsonNoStore({ financials });
  } catch (error) {
    return apiError(error, 404);
  }
}
