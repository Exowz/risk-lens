"use client";

/**
 * VaR distribution chart — histogram of Monte Carlo final portfolio values.
 *
 * Can be used standalone (with Card wrapper) or bare (inside ExpandableCard).
 *
 * Depends on: recharts
 * Used by: components/risk/monte-carlo-panel.tsx
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AiChartExplanation } from "@/components/shared/ai-chart-explanation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VaRDistributionProps {
  finalValues: number[];
  var95: number;
  /** Callback to trigger AI explanation */
  onAnalyze?: () => void;
  /** AI explanation text (undefined while loading) */
  explanation?: string;
  /** Whether explanation mutation is pending */
  explanationPending?: boolean;
  /** Whether explanation errored */
  explanationError?: boolean;
  /** If true, render without Card wrapper (for use inside ExpandableCard) */
  bare?: boolean;
}

function buildHistogram(
  values: number[],
  nBins: number,
): { bin: string; count: number; midpoint: number }[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / nBins;

  const bins = Array.from({ length: nBins }, (_, i) => ({
    bin: `${(min + i * binWidth).toFixed(3)}`,
    count: 0,
    midpoint: min + (i + 0.5) * binWidth,
  }));

  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= nBins) idx = nBins - 1;
    bins[idx].count++;
  }

  return bins;
}

function HistogramContent({ finalValues, var95 }: { finalValues: number[]; var95: number }) {
  const histogram = buildHistogram(finalValues, 50);
  const varLine = 1 + var95;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={histogram}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="midpoint"
          tick={{ fontSize: 10 }}
          tickFormatter={(v: number) => v.toFixed(2)}
          label={{
            value: "Final Portfolio Value",
            position: "insideBottom",
            offset: -5,
            fontSize: 11,
          }}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          label={{
            value: "Frequency",
            angle: -90,
            position: "insideLeft",
            fontSize: 11,
          }}
        />
        <Tooltip
          formatter={(value) => [value, "Count"]}
          labelFormatter={(label) => `Value: ${Number(label).toFixed(4)}`}
        />
        <Bar dataKey="count" fill="hsl(221, 83%, 53%)" opacity={0.7} />
        <ReferenceLine
          x={varLine}
          stroke="hsl(0, 84%, 60%)"
          strokeWidth={2}
          strokeDasharray="5 5"
          label={{
            value: `VaR 95%`,
            position: "top",
            fontSize: 11,
            fill: "hsl(0, 84%, 60%)",
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VaRDistribution({
  finalValues,
  var95,
  onAnalyze,
  explanation,
  explanationPending,
  explanationError,
  bare,
}: VaRDistributionProps) {
  if (bare) {
    return <HistogramContent finalValues={finalValues} var95={var95} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final Value Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <HistogramContent finalValues={finalValues} var95={var95} />
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
