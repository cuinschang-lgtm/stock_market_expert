export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatSignedPercent(value: number) {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return "0.00%";
}

export function formatCurrency(value: number, currency: string) {
  return `${currency} ${formatNumber(value)}`;
}

export function cnDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function trendClass(value: number) {
  if (value > 0) return "text-red-700";
  if (value < 0) return "text-emerald-700";
  return "text-muted";
}
