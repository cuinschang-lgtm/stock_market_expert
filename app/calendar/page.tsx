import { AlertTriangle, Building2, CalendarClock, CheckCircle2, ExternalLink, NotebookText } from "lucide-react";
import Link from "next/link";
import type { CalendarEventItem } from "@/server/calendar-data";
import { getCalendarEvents } from "@/server/calendar-data";

export const dynamic = "force-dynamic";

const kindCopy: Record<CalendarEventItem["kind"], string> = {
  review: "复盘",
  company: "公司事件",
  market: "市场事件"
};

const kindIcon = {
  review: NotebookText,
  company: Building2,
  market: CalendarClock
};

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isPast(date: string) {
  return new Date(date).getTime() < todayStart().getTime();
}

function isDue(date: string) {
  return new Date(date).getTime() <= todayStart().getTime();
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).format(new Date(date));
}

export default async function CalendarPage() {
  const { source, items } = await getCalendarEvents();
  const reviewItems = items.filter((item) => item.kind === "review");
  const dueReviews = reviewItems.filter((item) => isDue(item.date));
  const upcomingItems = items.filter((item) => !isPast(item.date));
  const pastItems = items.filter((item) => isPast(item.date)).slice(-8).reverse();
  const highImpact = items.filter((item) => item.impact === "高").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Review Calendar</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">复盘日历</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            汇总投资逻辑复盘日、公司事件和市场事件，用来安排下一次验证节奏。
          </p>
        </div>
        <Link
          href="/theses"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          <NotebookText className="h-4 w-4" />
          投资逻辑
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric title="事件总数" value={items.length} icon={CalendarClock} />
        <Metric title="待复盘" value={dueReviews.length} icon={AlertTriangle} tone="warn" />
        <Metric title="未来事件" value={upcomingItems.length} icon={CheckCircle2} tone="accent" />
        <Metric title="高影响" value={highImpact} icon={AlertTriangle} tone="danger" />
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">数据来源</div>
            <p className="mt-1 text-xs leading-5 text-muted">
              复盘日来自 {source === "cloud" ? "Supabase 云端投资逻辑" : "本地演示数据"}，公司/市场事件来自 mock provider。
            </p>
          </div>
          <div className="text-xs font-semibold text-muted">今天 {dateLabel(new Date().toISOString().slice(0, 10))}</div>
        </div>
      </section>

      <CalendarSection title="待处理" empty="暂无到期复盘。" items={dueReviews} />
      <CalendarSection title="未来节奏" empty="暂无未来事件。" items={upcomingItems} />
      <CalendarSection title="近期已发生" empty="暂无历史事件。" items={pastItems} />
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
  tone = "muted"
}: {
  title: string;
  value: number;
  icon: typeof CalendarClock;
  tone?: "muted" | "accent" | "warn" | "danger";
}) {
  const toneClass = {
    muted: "text-muted",
    accent: "text-accent",
    warn: "text-warn",
    danger: "text-danger"
  }[tone];

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted">
        <Icon className={`h-4 w-4 ${toneClass}`} />
        {title}
      </div>
      <div className="mt-3 text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function CalendarSection({ title, empty, items }: { title: string; empty: string; items: CalendarEventItem[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <span className="text-sm font-semibold text-muted">{items.length} 条</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">{empty}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <CalendarCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function CalendarCard({ item }: { item: CalendarEventItem }) {
  const Icon = kindIcon[item.kind];
  const impactClass = item.impact === "高" ? "text-danger" : item.impact === "中" ? "text-warn" : "text-muted";

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1">
            <Icon className="h-3.5 w-3.5 text-accent" />
            {kindCopy[item.kind]}
          </span>
          <span className={`rounded-md border border-line px-2 py-1 ${impactClass}`}>影响 {item.impact}</span>
        </div>
        <div className="text-sm font-semibold text-ink">{dateLabel(item.date)}</div>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-ink">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
        <span>{item.source}</span>
        {item.symbol ? (
          <Link href={`/stocks/${item.symbol}`} className="inline-flex items-center gap-1 text-accent hover:text-teal-800">
            {item.symbol}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
        {item.noteId ? (
          <Link href={`/notes/${item.noteId}`} className="inline-flex items-center gap-1 text-accent hover:text-teal-800">
            研究笔记
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
