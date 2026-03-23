"use client";

/**
 * Monte Carlo simulation panel with controls and results.
 *
 * Uses CountUp for animated stats, MetricTooltip for explanations,
 * and mode-aware display (hides exact sim count in beginner mode).
 *
 * Depends on: lib/api/risk.ts, charts/monte-carlo-chart.tsx, charts/var-distribution.tsx
 * Used by: app/(dashboard)/risk/page.tsx
 */

import { useState } from "react";

import { MonteCarloChart } from "@/components/charts/monte-carlo-chart";
import { VaRDistribution } from "@/components/charts/var-distribution";
import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { CountUp } from "@/components/ui/count-up";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonteCarlo } from "@/lib/api/risk";
import { useMode } from "@/lib/store/mode-context";
import type { MonteCarloResult } from "@/types/risk";

interface MonteCarloProps {
  portfolioId: string;
}

export function MonteCarloPanel({ portfolioId }: MonteCarloProps) {
  const [nSimulations, setNSimulations] = useState(10_000);
  const [nDays, setNDays] = useState(252);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const { mode } = useMode();

  const monteCarlo = useMonteCarlo();

  function handleRun() {
    monteCarlo.mutate(
      {
        portfolio_id: portfolioId,
        n_simulations: nSimulations,
        n_days: nDays,
      },
      { onSuccess: (data) => setResult(data) },
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "beginner"
              ? "Simulation de scénarios futurs"
              : "Monte Carlo Simulation (GBM)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {mode === "expert" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="n_simulations" className="text-xs">
                    Simulations
                  </Label>
                  <Input
                    id="n_simulations"
                    type="number"
                    min={100}
                    max={50000}
                    step={1000}
                    value={nSimulations}
                    onChange={(e) => setNSimulations(Number(e.target.value))}
                    className="w-28"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="n_days" className="text-xs">
                    Trading Days
                  </Label>
                  <Input
                    id="n_days"
                    type="number"
                    min={21}
                    max={504}
                    step={21}
                    value={nDays}
                    onChange={(e) => setNDays(Number(e.target.value))}
                    className="w-28"
                  />
                </div>
              </>
            )}
            <Button onClick={handleRun} disabled={monteCarlo.isPending}>
              {monteCarlo.isPending ? "Simulating..." : "Run Simulation"}
            </Button>
          </div>
          {monteCarlo.isError && (
            <p className="mt-2 text-sm text-destructive">
              Simulation failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {monteCarlo.isPending && !result && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {mode === "beginner"
                    ? "Valeur finale moyenne"
                    : "Mean Final Value"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-mono font-bold">
                  <CountUp to={result.mean_final_value} duration={1200} decimals={4} />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <MetricTooltip metricKey="var_95" label="VaR 95% (Sim)">
                  <p className="text-xl font-mono font-bold text-red-500">
                    <CountUp
                      to={result.var_95 * 100}
                      duration={1200}
                      suffix="%"
                    />
                  </p>
                </MetricTooltip>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <MetricTooltip metricKey="p_loss" label="P(Loss)">
                  <p className="text-xl font-mono font-bold text-amber-500">
                    <CountUp
                      to={result.probability_of_loss * 100}
                      duration={1200}
                      suffix="%"
                    />
                  </p>
                </MetricTooltip>
              </CardHeader>
            </Card>
            {mode === "expert" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    5th–95th Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-mono font-bold">
                    <CountUp to={result.percentile_5} duration={1200} decimals={3} />
                    {" – "}
                    <CountUp to={result.percentile_95} duration={1200} decimals={3} />
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <MonteCarloChart
              samplePaths={result.sample_paths}
              nDays={result.n_days}
            />
            <VaRDistribution
              finalValues={result.final_values}
              var95={result.var_95}
            />
          </div>
        </>
      )}
    </div>
  );
}
