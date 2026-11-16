import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/**
 * 浏览器端 Supabase 客户端（anon key + 本地会话持久化）。
 * 未配置 NEXT_PUBLIC_SUPABASE_ANON_KEY 时返回 null，页面继续走 localStorage 兜底。
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) {
    return cached;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || typeof window === "undefined") {
    cached = null;
    return cached;
  }

  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "sme-auth"
    }
  });
  return cached;
}
