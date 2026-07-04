import { NextResponse } from "next/server";
import { deleteResearchNote } from "@/server/supabase/repositories";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json(await deleteResearchNote(decodeURIComponent(params.id)));
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
