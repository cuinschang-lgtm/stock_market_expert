import { apiError, jsonNoStore } from "@/app/api/_utils";
import { getSectorResearchCards } from "@/server/sector-research";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const sectors = await getSectorResearchCards();
    return jsonNoStore({ sectors });
  } catch (error) {
    return apiError(error);
  }
}
