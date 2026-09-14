"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";

export interface RevenuePoint {
  month: string;
  total: number;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-500">
        Aucun encaissement pour l&apos;instant — vos factures payées apparaîtront ici.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6e2430" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#6e2430" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e3ddc9" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#78766c", fontSize: 12 }}
          dy={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#78766c", fontSize: 12 }}
          tickFormatter={(v) => formatCurrency(v).replace(",00", "")}
          width={72}
        />
        <Tooltip
          cursor={{ stroke: "#cfc7ac", strokeWidth: 1 }}
          formatter={(value) => [formatCurrency(Number(value) || 0), "Encaissé"]}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e3ddc9",
            background: "#ffffff",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#6e2430"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
