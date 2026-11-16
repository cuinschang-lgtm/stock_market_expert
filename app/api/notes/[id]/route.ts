import { apiError, jsonNoStore, resolveUserId } from "@/app/api/_utils";
import type { UpdateResearchNoteInput } from "@/lib/types";
import { deleteResearchNote, getResearchNote, updateResearchNote } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await resolveUserId(request);
    const result = await getResearchNote(decodeURIComponent(params.id), userId);
    if (result.configured && !result.note) {
      return jsonNoStore({ configured: true, error: "Note not found" }, { status: 404 });
    }
    return jsonNoStore(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await resolveUserId(request);
    return jsonNoStore(await deleteResearchNote(decodeURIComponent(params.id), userId));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await resolveUserId(request);
    const body = (await request.json()) as UpdateResearchNoteInput;
    const result = await updateResearchNote(decodeURIComponent(params.id), body, userId);
    if (result.configured && !result.note) {
      return jsonNoStore({ configured: true, error: "Note not found" }, { status: 404 });
    }
    return jsonNoStore(result);
  } catch (error) {
    return apiError(error);
  }
}
