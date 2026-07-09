import { apiError, jsonNoStore } from "@/app/api/_utils";
import { getSectorResearchDetail } from "@/server/sector-research";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const sector = await getSectorResearchDetail(decodeURIComponent(params.id));
    return jsonNoStore({ sector });
  } catch (error) {
    return apiError(error);
  }
}
