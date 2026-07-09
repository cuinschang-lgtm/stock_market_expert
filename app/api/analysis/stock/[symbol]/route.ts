import { apiError, jsonNoStore } from "@/app/api/_utils";
import { generateStockFastReport } from "@/server/analyst/report";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30; // DeepSeek chat 模型 3-8s，留足余量

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  try {
    const report = await generateStockFastReport(decodeURIComponent(params.symbol));
    return jsonNoStore({ report });
  } catch (error) {
    return apiError(error, 404);
  }
}
