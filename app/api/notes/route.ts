import { NextResponse } from "next/server";
import type { AnalystReport } from "@/lib/types";
import { insertResearchNote, listResearchNotes } from "@/server/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function jsonNoStore(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function GET() {
  try {
    return jsonNoStore(await listResearchNotes());
  } catch (error) {
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
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
    return jsonNoStore({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
