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
  const date = new Date(value);
  // 避免 RangeError: Invalid time value（例如 value 不是可解析日期）
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function trendClass(value: number) {
  if (value > 0) return "text-red-700";
  if (value < 0) return "text-emerald-700";
  return "text-muted";
}
