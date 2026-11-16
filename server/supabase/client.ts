import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "demo-user";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function isAuthConfigured() {
  return Boolean(supabaseUrl && anonKey);
}

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * 用 anon key 校验前端传来的 Supabase access token，
 * 返回真实用户 ID；未配置或校验失败时返回 null。
 */
export async function verifyAccessToken(token: string): Promise<string | null> {
  if (!supabaseUrl || !anonKey) {
    return null;
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) {
    return null;
  }
  return data.user.id;
}
