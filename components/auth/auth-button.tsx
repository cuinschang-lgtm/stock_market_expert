"use client";

import { Loader2, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface SessionUser {
  email?: string;
}

/**
 * 顶栏注册/登录入口。
 * 未配置 Supabase anon key 时隐藏入口，页面照常使用 localStorage 兜底。
 */
export function AuthButton() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!supabase || !ready) {
    return null;
  }

  async function submit(action: "signin" | "signup") {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (action === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          setOpen(false);
        } else {
          setNotice("注册成功：确认邮件已发送，请先查收邮件再登录。");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setOpen(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setOpen(false);
  }

  if (user) {
    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-ink transition hover:border-accent"
        >
          <UserRound className="h-4 w-4 text-accent" />
          <span className="hidden max-w-28 truncate md:inline">{user.email ?? "已登录"}</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-line bg-panel p-3 shadow-lg">
            <div className="truncate text-xs text-muted">{user.email}</div>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-danger hover:text-danger"
            >
              <LogOut className="h-3.5 w-3.5" />
              退出登录
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setMode("signin");
          setError(null);
          setNotice(null);
          setOpen((value) => !value);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
      >
        <UserRound className="h-4 w-4" />
        登录 / 注册
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-line bg-panel p-4 shadow-lg">
          <div className="mb-3 flex gap-1 rounded-lg bg-panel p-1">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError(null);
                  setNotice(null);
                }}
                className={
                  mode === item
                    ? "flex-1 rounded-md bg-panel px-2 py-1.5 text-sm font-semibold text-ink"
                    : "flex-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink"
                }
              >
                {item === "signin" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(mode);
            }}
            className="space-y-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="邮箱地址"
              className="h-10 w-full rounded-lg border border-field px-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="密码（至少 6 位）"
              className="h-10 w-full rounded-lg border border-field px-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-ink transition hover:bg-accent-hover disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 motion-safe:animate-spin" />}
              {mode === "signin" ? "登录" : "注册"}
            </button>
          </form>

          {error && <p className="mt-2 text-xs leading-5 text-danger">{error}</p>}
          {notice && <p className="mt-2 text-xs leading-5 text-accent">{notice}</p>}
          <p className="mt-3 text-xs leading-5 text-muted">
            登录后自选股与 AI 分析笔记同步到云端；未登录时数据仅保存在当前浏览器。
          </p>
        </div>
      )}
    </div>
  );
}
