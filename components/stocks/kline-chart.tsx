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

export function KlineChart({ data }: { data: KlinePoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-muted">
        暂无K线数据
      </div>
    );
  }

  // 单点数据：补充一个相同点避免 recharts dataMin=dataMax 报错
  const chartData = data.length === 1
    ? [{ ...data[0] }, { ...data[0], date: data[0]!.date + " " }]
    : data;

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
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#5f6b76", fontSize: 12 }} />
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
