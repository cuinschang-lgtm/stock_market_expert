"use client";

import type { KlinePoint } from "@/lib/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// recharts Tooltip / XAxis 内部会尝试 new Date(label)，因此
// 改用纯数值 x 轴（index），通过 custom tickFormatter 显示日期标签。
// 这样完全绕开所有 Date 解析，不会触发 "Invalid time value"。

type ChartRow = { idx: number; close: number; label: string };

export function KlineChart({ data }: { data: KlinePoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-muted">
        暂无K线数据
      </div>
    );
  }

  const rows: ChartRow[] = data.map((d, i) => ({
    idx: i,
    close: d.close,
    label: d.date.slice(-5), // 提取MM-DD
  }));

  // 单点补点
  if (rows.length === 1) {
    rows.push({ idx: 1, close: rows[0]!.close, label: rows[0]!.label + " " });
  }

  const closes = data.map((d) => d.close);
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const pad = (maxClose - minClose) * 0.05 || maxClose * 0.02;
  const yDomain: [number, number] = [minClose - pad, maxClose + pad];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007a6c" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#007a6c" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#d9e0e7" strokeDasharray="3 3" />
          <XAxis
            dataKey="idx"
            type="number"
            tickFormatter={(idx: number) => rows[idx]?.label ?? ""}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5f6b76", fontSize: 12 }}
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: "#5f6b76", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), "收盘价"]}
            labelFormatter={(idx: number) => rows[idx]?.label ?? String(idx)}
            contentStyle={{
              border: "1px solid #d9e0e7",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(20, 28, 36, 0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#007a6c"
            strokeWidth={2}
            fill="url(#priceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
