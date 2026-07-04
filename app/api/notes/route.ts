import { NextResponse } from "next/server";
import type { AnalystReport } from "@/lib/types";
import { insertResearchNote, listResearchNotes } from "@/server/supabase/repositories";

export async function GET() {
  try {
    return NextResponse.json(await listResearchNotes());
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { report?: AnalystReport };
    if (!body.report) {
      return NextResponse.json({ error: "report is required" }, { status: 400 });
    }

    return NextResponse.json(await insertResearchNote(body.report));
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
