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

import { useEffect } from "react";
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
import { useStressTest } from "@/lib/api/stress";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export default function StressPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { mode } = useMode();
  const { mutate, data, isPending, error, reset } = useStressTest();

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
          <StressBarChart comparisons={data.comparisons} />

          <WhyCard>
            <p className="mb-2">
              Les <strong>stress tests</strong> mesurent comment votre portefeuille aurait réagi
              lors de crises financières réelles. C'est une analyse complémentaire à la VaR qui
              capture des événements extrêmes que les modèles statistiques sous-estiment souvent.
            </p>
            <p className="mb-2">
              Le <strong>drawdown maximum</strong> est la chute la plus importante depuis un sommet.
              Les <strong>jours de recovery</strong> indiquent combien de temps il a fallu pour
              retrouver le niveau d'avant la crise.
            </p>
            <p>
              La comparaison avec le portefeuille optimisé (Max Sharpe) montre si une meilleure
              diversification aurait réduit les pertes en période de crise.
            </p>
          </WhyCard>

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
