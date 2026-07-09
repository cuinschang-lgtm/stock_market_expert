import { apiError, jsonNoStore } from "@/app/api/_utils";
import { getDashboardViewData } from "@/server/dashboard-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const dashboard = await getDashboardViewData();
    return jsonNoStore({ dashboard });
  } catch (error) {
    return apiError(error);
  }
}
