import { apiError, jsonNoStore } from "@/app/api/_utils";
import type { AnalystReport } from "@/lib/types";
import { insertResearchNote, listResearchNotes } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    return jsonNoStore(await listResearchNotes());
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { report?: AnalystReport };
    if (!body.report) {
      return jsonNoStore({ error: "report is required" }, { status: 400 });
    }

    return jsonNoStore(await insertResearchNote(body.report));
  } catch (error) {
    return apiError(error);
  }
}
