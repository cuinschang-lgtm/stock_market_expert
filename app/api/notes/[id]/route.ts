import { NextResponse } from "next/server";
import type { UpdateResearchNoteInput } from "@/lib/types";
import { deleteResearchNote, getResearchNote, updateResearchNote } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function jsonNoStore(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await getResearchNote(decodeURIComponent(params.id));
    if (result.configured && !result.note) {
      return jsonNoStore({ configured: true, error: "Note not found" }, { status: 404 });
    }
    return jsonNoStore(result);
  } catch (error) {
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    return jsonNoStore(await deleteResearchNote(decodeURIComponent(params.id)));
  } catch (error) {
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
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
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
