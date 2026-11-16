import { apiError, jsonNoStore, resolveUserId } from "@/app/api/_utils";
import type { AnalystReport, CreateResearchNoteInput } from "@/lib/types";
import { createResearchNote, insertResearchNote, listResearchNotes } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const userId = await resolveUserId(request);
    return jsonNoStore(await listResearchNotes(userId));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId(request);
    const body = (await request.json()) as { report?: AnalystReport; note?: CreateResearchNoteInput };
    if (body.report) {
      return jsonNoStore(await insertResearchNote(body.report, userId));
    }
    if (body.note) {
      return jsonNoStore(await createResearchNote(body.note, userId));
    }
    return jsonNoStore({ error: "report or note is required" }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
}
