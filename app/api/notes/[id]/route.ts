import { NextResponse } from "next/server";
import { deleteResearchNote, getResearchNote } from "@/server/supabase/repositories";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await getResearchNote(decodeURIComponent(params.id));
    if (result.configured && !result.note) {
      return NextResponse.json({ configured: true, error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json(await deleteResearchNote(decodeURIComponent(params.id)));
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
