import { NextResponse } from "next/server";
import { DEFAULT_USER_ID, verifyAccessToken } from "@/server/supabase/client";

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

/**
 * 从 Authorization: Bearer <token> 解析 Supabase 用户；
 * 未登录 / 未配置 auth / token 失效时回退到 DEFAULT_USER_ID。
 */
export async function resolveUserId(request: Request): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return DEFAULT_USER_ID;
  }
  const token = header.slice(7).trim();
  if (!token) {
    return DEFAULT_USER_ID;
  }
  try {
    const userId = await verifyAccessToken(token);
    return userId ?? DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
  }
}
