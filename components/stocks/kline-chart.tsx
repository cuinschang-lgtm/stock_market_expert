"use client";

import type { KlinePoint } from "@/lib/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

/** 将日期字符串统一为简洁显示格式，避免 recharts Date 解析崩溃 */
function normalizeDate(raw: string): string {
  // "2026-07-09" → "07-09"
  // "06-21"     → "06-21"
  const match = raw.match(/(\d{2})-(\d{2})$/);
  return match ? `${match[1]}-${match[2]}` : raw;
}

export function KlineChart({ data }: { data: KlinePoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-muted">
        暂无K线数据
      </div>
    );
  }

  // 格式化 + 单点补点（避免 recharts 报错）
  const chartData = (() => {
    const formatted = data.map((d) => ({ date: normalizeDate(d.date), close: d.close }));
    if (formatted.length === 1) {
      return [formatted[0], { date: formatted[0]!.date + " ", close: formatted[0]!.close }];
    }
    return formatted;
  })();

  const domain = (() => {
    const vals = data.map((d) => d.close);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.05 || max * 0.02;
    return [min - pad, max + pad] as [number, number];
  })();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007a6c" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#007a6c" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#d9e0e7" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5f6b76", fontSize: 12 }}
          />
          <YAxis
            domain={domain}
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: "#5f6b76", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #d9e0e7",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(20, 28, 36, 0.08)"
            }}
          />
          <Area type="monotone" dataKey="close" stroke="#007a6c" strokeWidth={2} fill="url(#priceFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
