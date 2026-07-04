import {
  BarChart3,
  Bot,
  CalendarClock,
  FileText,
  LayoutDashboard,
  Search,
  Star
} from "lucide-react";
import Link from "next/link";
import { SearchBox } from "@/components/layout/search-box";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "自选股", icon: Star },
  { href: "/analyst", label: "AI Analyst", icon: Bot },
  { href: "/notes", label: "研究笔记", icon: FileText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-white/90 px-4 py-5 backdrop-blur lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Stock Market Expert</div>
            <div className="text-xs text-muted">投研工作台 MVP</div>
          </div>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-panel hover:text-ink"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-line bg-panel p-3 text-xs leading-5 text-muted">
          <div className="mb-1 flex items-center gap-2 font-semibold text-ink">
            <CalendarClock className="h-4 w-4" />
            风险边界
          </div>
          本工具只做信息整理与研究辅助，不输出买卖指令。
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white/88 px-4 py-3 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-white">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">SME</span>
            </Link>
            <div className="min-w-0 flex-1">
              <SearchBox />
            </div>
            <Link
              href="/analyst"
              className="hidden items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 sm:flex"
            >
              <Search className="h-4 w-4" />
              分析
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
