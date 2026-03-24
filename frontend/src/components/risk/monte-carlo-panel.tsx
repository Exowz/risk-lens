"use client";

/**
 * Monte Carlo simulation panel with controls and results.
 *
 * Metrics in KpiExpandableCard, charts in ChartExpandableCard.
 * All AI explanations via Mistral — no static fallbacks.
 *
 * Depends on: lib/api/risk.ts, lib/api/explain.ts, charts/*
 * Used by: app/(dashboard)/risk/page.tsx
 */

import { useCallback, useState } from "react";

import { MonteCarloChart } from "@/components/charts/monte-carlo-chart";
import { VaRDistribution } from "@/components/charts/var-distribution";
import { ChartExpandableCard } from "@/components/shared/chart-expandable-card";
import { KpiExpandableCard } from "@/components/shared/kpi-expandable-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchMonteCarloExplanation,
  fetchDistributionExplanation,
  fetchMetricExplanation,
} from "@/lib/api/explain";
import { useMonteCarlo } from "@/lib/api/risk";
import { useMode } from "@/lib/store/mode-context";
import { useNotificationIsland } from "@/lib/store/notification-island-store";
import type { MonteCarloResult } from "@/types/risk";

interface MonteCarloProps {
  portfolioId: string;
  openCard: string | null;
  onOpenCard: (id: string | null) => void;
}

export function MonteCarloPanel({ portfolioId, openCard, onOpenCard }: MonteCarloProps) {
  const [nSimulations, setNSimulations] = useState(10_000);
  const [nDays, setNDays] = useState(252);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const { mode } = useMode();
  const showIsland = useNotificationIsland((s) => s.show);

  const monteCarlo = useMonteCarlo();

  const mkAnalyze = useCallback(
    (metricName: string, metricValue: number, context?: Record<string, number | string | null>) =>
      () =>
        fetchMetricExplanation({
          metric_name: metricName,
          metric_value: metricValue,
          portfolio_id: portfolioId,
          mode,
          context,
        }),
    [portfolioId, mode],
  );

  const mkMcChartAnalyze = useCallback(() => {
    if (!result) return Promise.resolve("Analyse temporairement indisponible.");
    return fetchMonteCarloExplanation({
      mode,
      mean_final_value: result.mean_final_value,
      var_95: result.var_95,
      probability_of_loss: result.probability_of_loss,
      n_simulations: result.n_simulations,
      n_days: result.n_days,
    }).then((res) => res.explanation);
  }, [result, mode]);

  const mkDistChartAnalyze = useCallback(() => {
    if (!result) return Promise.resolve("Analyse temporairement indisponible.");
    return fetchDistributionExplanation({
      mode,
      var_95: result.var_95,
      mean_final_value: result.mean_final_value,
      std_final_value: result.std_final_value,
      percentile_5: result.percentile_5,
      percentile_95: result.percentile_95,
    }).then((res) => res.explanation);
  }, [result, mode]);

  function handleRun() {
    monteCarlo.mutate(
      {
        portfolio_id: portfolioId,
        n_simulations: nSimulations,
        n_days: nDays,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          showIsland({
            type: "montecarlo",
            title: "Simulation terminée",
            subtitle: `VaR 95% : ${(data.var_95 * 100).toFixed(2)}% · P(perte) : ${(data.probability_of_loss * 100).toFixed(0)}%`,
            positive: data.probability_of_loss < 0.5,
          });
        },
      },
    );
  }

  const toggle = (key: string) =>
    onOpenCard(openCard === key ? null : key);

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
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary metric cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiExpandableCard
              label={mode === "beginner" ? "Valeur finale moyenne" : "Mean Final Value"}
              value={result.mean_final_value}
              decimals={4}
              valueColor="foreground"
              metricKey="mc-mean"
              onAnalyze={mkAnalyze("mean_final_value", result.mean_final_value, {
                n_simulations: result.n_simulations,
                n_days: result.n_days,
              })}
              isOpen={openCard === "mc-mean"}
              onToggle={() => toggle("mc-mean")}
            />

            <KpiExpandableCard
              label={mode === "beginner" ? "Perte max probable (VaR 95%)" : "VaR 95% (Sim)"}
              value={result.var_95 * 100}
              valueSuffix="%"
              valueColor="red"
              metricKey="mc-var95"
              onAnalyze={mkAnalyze("var_95_simulation", result.var_95, {
                mean_final_value: result.mean_final_value,
                probability_of_loss: result.probability_of_loss,
              })}
              isOpen={openCard === "mc-var95"}
              onToggle={() => toggle("mc-var95")}
            />

            <KpiExpandableCard
              label={mode === "beginner" ? "Probabilité de perte" : "P(Loss)"}
              value={result.probability_of_loss * 100}
              valueSuffix="%"
              valueColor="amber"
              metricKey="mc-ploss"
              onAnalyze={mkAnalyze("probability_of_loss", result.probability_of_loss, {
                mean_final_value: result.mean_final_value,
                var_95: result.var_95,
              })}
              isOpen={openCard === "mc-ploss"}
              onToggle={() => toggle("mc-ploss")}
            />

            {mode === "expert" && (
              <KpiExpandableCard
                label="5th–95th Range"
                value={result.percentile_5}
                decimals={3}
                valueSuffix={` – ${result.percentile_95.toFixed(3)}`}
                valueColor="foreground"
                metricKey="mc-range"
                onAnalyze={mkAnalyze("percentile_range", result.percentile_5, {
                  percentile_95: result.percentile_95,
                  mean_final_value: result.mean_final_value,
                })}
                isOpen={openCard === "mc-range"}
                onToggle={() => toggle("mc-range")}
              />
            )}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartExpandableCard
              title={mode === "beginner" ? "Trajectoires simulées" : "Simulation Paths"}
              legend={[
                { color: "hsl(221, 83%, 53%)", label: mode === "beginner" ? "Scénarios" : "Paths" },
                { color: "hsl(0, 0%, 50%)", label: "Initial" },
              ]}
              onAnalyze={mkMcChartAnalyze}
              isOpen={openCard === "mc-chart"}
              onToggle={() => toggle("mc-chart")}
            >
              <MonteCarloChart
                samplePaths={result.sample_paths}
                nDays={result.n_days}
                bare
              />
            </ChartExpandableCard>

            <ChartExpandableCard
              title={mode === "beginner" ? "Distribution des résultats" : "Final Value Distribution"}
              legend={[
                { color: "hsl(221, 83%, 53%)", label: mode === "beginner" ? "Résultats" : "Frequency" },
                { color: "hsl(0, 84%, 60%)", label: "VaR 95%" },
              ]}
              onAnalyze={mkDistChartAnalyze}
              isOpen={openCard === "dist-chart"}
              onToggle={() => toggle("dist-chart")}
            >
              <VaRDistribution
                finalValues={result.final_values}
                var95={result.var_95}
                bare
              />
            </ChartExpandableCard>
          </div>
        </>
      )}
    </div>
  );
}
