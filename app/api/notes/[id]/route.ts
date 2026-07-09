import { apiError, jsonNoStore } from "@/app/api/_utils";
import type { UpdateResearchNoteInput } from "@/lib/types";
import { deleteResearchNote, getResearchNote, updateResearchNote } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await getResearchNote(decodeURIComponent(params.id));
    if (result.configured && !result.note) {
      return jsonNoStore({ configured: true, error: "Note not found" }, { status: 404 });
    }
    return jsonNoStore(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    return jsonNoStore(await deleteResearchNote(decodeURIComponent(params.id)));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as UpdateResearchNoteInput;
    const result = await updateResearchNote(decodeURIComponent(params.id), body);
    if (result.configured && !result.note) {
      return jsonNoStore({ configured: true, error: "Note not found" }, { status: 404 });
    }
    return jsonNoStore(result);
  } catch (error) {
    return apiError(error);
  }
}
