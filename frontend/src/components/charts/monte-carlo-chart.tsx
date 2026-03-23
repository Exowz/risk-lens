"use client";

/**
 * Monte Carlo simulation trajectories chart.
 *
 * Displays a sample of 100 simulation paths (out of 10k) as a LineChart.
 * Each path shows the simulated portfolio value over the trading horizon.
 *
 * Depends on: recharts
 * Used by: components/risk/monte-carlo-panel.tsx
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AiChartExplanation } from "@/components/shared/ai-chart-explanation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonteCarloChartProps {
  samplePaths: number[][];
  nDays: number;
  /** Callback to trigger AI explanation */
  onAnalyze?: () => void;
  /** AI explanation text (undefined while loading) */
  explanation?: string;
  /** Whether explanation mutation is pending */
  explanationPending?: boolean;
  /** Whether explanation errored */
  explanationError?: boolean;
}

export function MonteCarloChart({
  samplePaths,
  nDays,
  onAnalyze,
  explanation,
  explanationPending,
  explanationError,
}: MonteCarloChartProps) {
  // Build data: [{day: 0, path_0: 1.0, path_1: 1.0, ...}, ...]
  const chartData = Array.from({ length: nDays + 1 }, (_, dayIdx) => {
    const row: Record<string, number> = { day: dayIdx };
    for (let i = 0; i < samplePaths.length; i++) {
      row[`p${i}`] = samplePaths[i][dayIdx];
    }
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Paths (100 of {samplePaths.length > 0 ? "10,000" : "0"})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              label={{
                value: "Trading Days",
                position: "insideBottom",
                offset: -5,
                fontSize: 11,
              }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
              label={{
                value: "Portfolio Value",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
              }}
            />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(4), ""]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <ReferenceLine
              y={1}
              stroke="hsl(0, 0%, 50%)"
              strokeDasharray="5 5"
              label={{ value: "Initial", fontSize: 10 }}
            />
            {samplePaths.map((_, i) => (
              <Line
                key={`p${i}`}
                type="monotone"
                dataKey={`p${i}`}
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={0.5}
                strokeOpacity={0.15}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {onAnalyze && (
          <AiChartExplanation
            onAnalyze={onAnalyze}
            explanation={explanation}
            isPending={explanationPending ?? false}
            isError={explanationError}
          />
        )}
      </CardContent>
    </Card>
  );
}
