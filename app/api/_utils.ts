import { NextResponse } from "next/server";

export function jsonNoStore(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export function apiError(error: unknown, status = 500) {
  return jsonNoStore(
    {
      error: error instanceof Error ? error.message : "Unknown error"
    },
    { status }
  );
}
