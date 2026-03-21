"use client";

/**
 * Portfolio performance chart showing normalized historical prices (base 100).
 *
 * Uses Recharts LineChart with one line per ticker.
 * Handles loading and empty states internally.
 *
 * Depends on: recharts
 * Used by: app/(dashboard)/portfolio/page.tsx
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NormalizedPrices } from "@/types/portfolio";

const COLORS = [
  "hsl(221, 83%, 53%)",  // blue
  "hsl(142, 71%, 45%)",  // green
  "hsl(0, 84%, 60%)",    // red
  "hsl(38, 92%, 50%)",   // amber
  "hsl(262, 83%, 58%)",  // violet
  "hsl(173, 80%, 40%)",  // teal
  "hsl(339, 80%, 55%)",  // pink
  "hsl(25, 95%, 53%)",   // orange
];

interface PerformanceChartProps {
  data: NormalizedPrices | undefined;
  isLoading: boolean;
}

export function PerformanceChart({ data, isLoading }: PerformanceChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-16 text-center text-sm text-muted-foreground">
            Select a portfolio to view performance data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tickers = Object.keys(data);

  // Build unified data array: [{date, AAPL: 105.2, MSFT: 110.3, ...}, ...]
  const firstTicker = tickers[0];
  const chartData = data[firstTicker].map((point, i) => {
    const row: Record<string, string | number> = { date: point.date };
    for (const ticker of tickers) {
      row[ticker] = data[ticker]?.[i]?.value ?? 0;
    }
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Performance (Normalized, Base 100)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              labelFormatter={(label) =>
                new Date(String(label)).toLocaleDateString()
              }
              formatter={(value) => [Number(value).toFixed(2), ""]}
            />
            <Legend />
            {tickers.map((ticker, idx) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={ticker}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
