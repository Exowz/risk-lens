"use client";

/**
 * Stress testing page.
 *
 * Displays 3 crisis scenario cards + grouped bar chart comparing
 * current portfolio drawdowns vs Markowitz-optimised.
 *
 * Depends on: components/stress/*, components/charts/stress-bar-chart.tsx,
 *             lib/api/stress.ts, lib/store/portfolio-store.ts
 * Used by: /stress route
 */

import { useCallback, useEffect } from "react";
import Link from "next/link";

import { StressBarChart } from "@/components/charts/stress-bar-chart";
import { WhyCard } from "@/components/shared/why-card";
import { StressScenarioCard } from "@/components/stress/stress-scenario-card";
import { BlurText } from "@/components/ui/blur-text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStressExplanation } from "@/lib/api/explain";
import { useStressTest } from "@/lib/api/stress";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export default function StressPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { mode } = useMode();
  const { mutate, data, isPending, error, reset } = useStressTest();
  const stressExplanation = useStressExplanation();

  const triggerExplanation = useCallback(() => {
    if (!data) return;
    stressExplanation.mutate({
      mode,
      scenarios: data.scenarios.map((s) => ({
        scenario_name: s.scenario_name,
        total_return: s.total_return,
        max_drawdown: s.max_drawdown,
        recovery_days: s.recovery_days,
      })),
    });
  }, [data, mode, stressExplanation]);

  // Reset when portfolio changes
  useEffect(() => {
    if (activePortfolioId) {
      reset();
    }
  }, [activePortfolioId, reset]);

  const handleRun = () => {
    if (!activePortfolioId) return;
    mutate({ portfolio_id: activePortfolioId, period: "max" });
  };

  if (!activePortfolioId) {
    return (
      <div className="space-y-8">
        <div>
          <BlurText text="Stress Testing" className="text-3xl font-bold tracking-tight" />
          <p className="text-muted-foreground">
            Historical crisis scenario analysis
          </p>
        </div>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No Portfolio Selected</CardTitle>
            <CardDescription>
              Create or select a portfolio to simulate how it would have
              performed during the 2008, 2020, and 2022 crises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>Go to Portfolios</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <BlurText text="Stress Testing" className="text-3xl font-bold tracking-tight" />
          <p className="text-muted-foreground">
            {mode === "beginner"
              ? "Comment votre portefeuille aurait survécu aux crises passées"
              : "Historical crisis scenario analysis — 2008, 2020, 2022"}
          </p>
        </div>
        <Button onClick={handleRun} disabled={isPending}>
          {isPending ? "Running..." : "Run Stress Test"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Stress test failed"}
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Scenario cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {data.scenarios.map((scenario) => (
              <StressScenarioCard
                key={scenario.scenario_name}
                scenario={scenario}
              />
            ))}
          </div>

          {/* Drawdown comparison bar chart */}
          <StressBarChart
            comparisons={data.comparisons}
            onAnalyze={triggerExplanation}
            explanation={stressExplanation.data?.explanation}
            explanationPending={stressExplanation.isPending}
            explanationError={stressExplanation.isError}
          />

          <WhyCard
            beginnerContent={
              <>
                <p className="mb-2">
                  Les <strong>stress tests</strong> montrent ce qui serait arrivé à votre portefeuille
                  pendant les grandes crises passées (2008, COVID, hausse des taux 2022).
                </p>
                <p className="mb-2">
                  Le <strong>drawdown</strong> est la pire chute subie. Les <strong>jours de recovery</strong>{" "}
                  indiquent combien de temps il a fallu pour se remettre.
                </p>
                <p>
                  La comparaison avec un portefeuille optimisé montre si une meilleure répartition
                  aurait limité les dégâts.
                </p>
              </>
            }
            expertContent={
              <>
                <p className="mb-2">
                  <strong>Historical stress testing</strong> replays your portfolio through exact crisis
                  date ranges (2008-09 to 2009-03, 2020-02 to 2020-04, 2022-01 to 2022-10) to measure
                  realized drawdowns beyond what parametric models predict.
                </p>
                <p className="mb-2">
                  <strong>Max drawdown</strong> is the largest peak-to-trough decline. <strong>Recovery
                  days</strong> count trading sessions from trough back to pre-crisis peak (null if
                  not recovered within the observation window).
                </p>
                <p>
                  The Max Sharpe comparison quantifies the diversification benefit — how much loss
                  reduction an optimally weighted portfolio would have achieved.
                </p>
              </>
            }
          />

          {data.from_cache && (
            <p className="text-xs text-muted-foreground text-center">
              Results loaded from cache
            </p>
          )}
        </>
      )}
    </div>
  );
}
