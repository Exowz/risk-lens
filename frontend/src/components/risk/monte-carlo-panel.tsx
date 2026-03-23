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

import { useCallback, useState } from "react";

import { MonteCarloChart } from "@/components/charts/monte-carlo-chart";
import { VaRDistribution } from "@/components/charts/var-distribution";
import { ExpandableMetric } from "@/components/shared/expandable-metric";
import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { CountUp } from "@/components/ui/count-up";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDistributionExplanation,
  useMonteCarloExplanation,
} from "@/lib/api/explain";
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
  const mcExplanation = useMonteCarloExplanation();
  const distExplanation = useDistributionExplanation();

  const triggerMcExplanation = useCallback(() => {
    if (!result) return;
    mcExplanation.mutate({
      mode,
      mean_final_value: result.mean_final_value,
      var_95: result.var_95,
      probability_of_loss: result.probability_of_loss,
      n_simulations: result.n_simulations,
      n_days: result.n_days,
    });
  }, [result, mode, mcExplanation]);

  const triggerDistExplanation = useCallback(() => {
    if (!result) return;
    distExplanation.mutate({
      mode,
      var_95: result.var_95,
      mean_final_value: result.mean_final_value,
      std_final_value: result.std_final_value,
      percentile_5: result.percentile_5,
      percentile_95: result.percentile_95,
    });
  }, [result, mode, distExplanation]);

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
          <Card>
            <CardContent className="pt-6">
              <ExpandableMetric
                labelBeginner="Valeur finale moyenne"
                labelExpert="Mean Final Value"
                value={
                  <span className="font-mono text-foreground">
                    <CountUp to={result.mean_final_value} duration={1200} decimals={4} />
                  </span>
                }
                explanationBeginner="Après 10 000 simulations d'une année, voici la valeur moyenne à laquelle votre portefeuille arrive. 1.0 = la valeur de départ."
                explanationExpert="Espérance de la valeur finale du portefeuille sous GBM. 1.0 = valeur initiale normalisée."
              />
              <ExpandableMetric
                labelBeginner="Perte max probable (VaR 95%)"
                labelExpert="VaR 95% (Sim)"
                value={
                  <span className="font-mono text-red-500">
                    <CountUp to={result.var_95 * 100} duration={1200} suffix="%" />
                  </span>
                }
                explanationBeginner="Sur 20 jours de trading, vous perdrez plus que ce montant une seule fois. C'est votre perte journalière maximale probable dans des conditions normales."
                explanationExpert="Value at Risk à 95% de confiance -- quantile empirique de la distribution des rendements historiques journaliers."
              />
              <ExpandableMetric
                labelBeginner="Probabilité de perte"
                labelExpert="P(Loss)"
                value={
                  <span className="font-mono text-amber-500">
                    <CountUp to={result.probability_of_loss * 100} duration={1200} suffix="%" />
                  </span>
                }
                explanationBeginner="Sur 10 000 simulations d'une année complète, voici le pourcentage qui se terminent en perte."
                explanationExpert="Probabilité empirique P(Rp < 0) estimée par simulation Monte Carlo GBM sur 10 000 trajectoires."
              />
              {mode === "expert" && (
                <ExpandableMetric
                  labelBeginner="Fourchette 5%–95%"
                  labelExpert="5th–95th Range"
                  value={
                    <span className="font-mono text-foreground">
                      <CountUp to={result.percentile_5} duration={1200} decimals={3} />
                      {" – "}
                      <CountUp to={result.percentile_95} duration={1200} decimals={3} />
                    </span>
                  }
                  explanationBeginner="La fourchette dans laquelle 90% des scénarios se terminent."
                  explanationExpert="Intervalle inter-décile [P5, P95] de la distribution des valeurs finales simulées."
                />
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <MonteCarloChart
              samplePaths={result.sample_paths}
              nDays={result.n_days}
              onAnalyze={triggerMcExplanation}
              explanation={mcExplanation.data?.explanation}
              explanationPending={mcExplanation.isPending}
              explanationError={mcExplanation.isError}
            />
            <VaRDistribution
              finalValues={result.final_values}
              var95={result.var_95}
              onAnalyze={triggerDistExplanation}
              explanation={distExplanation.data?.explanation}
              explanationPending={distExplanation.isPending}
              explanationError={distExplanation.isError}
            />
          </div>
        </>
      )}
    </div>
  );
}
