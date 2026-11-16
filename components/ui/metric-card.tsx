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
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tabular-nums text-ink",
          tone === "up" && "text-danger",
          tone === "down" && "text-ok"
        )}
      >
        {value}
      </div>
      {detail ? <div className="mt-1 text-sm text-muted">{detail}</div> : null}
    </div>
  );
}
