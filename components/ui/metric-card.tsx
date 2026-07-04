import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div
        className={cn(
          "mt-2 text-2xl font-semibold text-ink",
          tone === "up" && "text-red-700",
          tone === "down" && "text-emerald-700"
        )}
      >
        {value}
      </div>
      {detail ? <div className="mt-1 text-sm text-muted">{detail}</div> : null}
    </div>
  );
}
