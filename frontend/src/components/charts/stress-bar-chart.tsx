"use client";

/**
 * Stress test comparison bar chart.
 *
 * Grouped BarChart showing max drawdown for current portfolio vs
 * Markowitz-optimised (max Sharpe) portfolio per crisis scenario.
 * Can be used standalone (with Card) or bare (inside ExpandableCard).
 *
 * Depends on: recharts, types/stress.ts
 * Used by: app/(dashboard)/stress/page.tsx
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AiChartExplanation } from "@/components/shared/ai-chart-explanation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ScenarioComparison } from "@/types/stress";

interface StressBarChartProps {
  comparisons: ScenarioComparison[];
  /** Callback to trigger AI explanation */
  onAnalyze?: () => void;
  /** AI explanation text (undefined while loading) */
  explanation?: string;
  /** Whether explanation mutation is pending */
  explanationPending?: boolean;
  /** Whether explanation errored */
  explanationError?: boolean;
  /** If true, render without Card wrapper */
  bare?: boolean;
}

function ChartContent({ comparisons }: { comparisons: ScenarioComparison[] }) {
  const chartData = comparisons.map((c) => ({
    name: c.scenario_name,
    current: Math.abs(c.current_drawdown) * 100,
    optimized: Math.abs(c.optimized_drawdown) * 100,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No comparison data to display.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={0}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
          label={{
            value: "Max Drawdown (%)",
            angle: -90,
            position: "insideLeft",
            fontSize: 11,
            offset: 0,
          }}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(2)}%`, ""]}
          labelFormatter={(label) => `${label}`}
        />
        <Legend />
        <Bar
          dataKey="current"
          name="Current Portfolio"
          fill="hsl(0, 84%, 60%)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="optimized"
          name="Max Sharpe Optimised"
          fill="hsl(221, 83%, 53%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StressBarChart({
  comparisons,
  onAnalyze,
  explanation,
  explanationPending,
  explanationError,
  bare,
}: StressBarChartProps) {
  if (bare) {
    return <ChartContent comparisons={comparisons} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drawdown Comparison</CardTitle>
        <CardDescription>
          Current portfolio vs Max Sharpe optimised — max drawdown per scenario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContent comparisons={comparisons} />
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
