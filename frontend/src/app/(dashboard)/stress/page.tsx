"use client";

/**
 * Stress testing page.
 *
 * Scenario cards with KpiExpandableCard metrics,
 * drawdown comparison in ChartExpandableCard,
 * WhyExpandableCard for educational content.
 *
 * Depends on: components/stress/*, components/charts/stress-bar-chart.tsx,
 *             lib/api/stress.ts, lib/store/portfolio-store.ts
 * Used by: /stress route
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { StressBarChart } from "@/components/charts/stress-bar-chart";
import { ChartExpandableCard } from "@/components/shared/chart-expandable-card";
import { WhyExpandableCard } from "@/components/shared/why-expandable-card";
import { StressScenarioCard } from "@/components/stress/stress-scenario-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchStressExplanation } from "@/lib/api/explain";
import { useStressTest } from "@/lib/api/stress";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export default function StressPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { mode } = useMode();
  const { mutate, data, isPending, error, reset } = useStressTest();
  const [openCard, setOpenCard] = useState<string | null>(null);

  const mkStressChartAnalyze = useCallback(() => {
    if (!data) return Promise.resolve("Analyse temporairement indisponible.");
    return fetchStressExplanation({
      mode,
      scenarios: data.scenarios.map((s) => ({
        scenario_name: s.scenario_name,
        total_return: s.total_return,
        max_drawdown: s.max_drawdown,
        recovery_days: s.recovery_days,
      })),
    }).then((res) => res.explanation);
  }, [data, mode]);

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
      <div className="p-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Aucun portefeuille sélectionné</CardTitle>
            <CardDescription>
              Créez ou sélectionnez un portefeuille pour simuler son comportement
              lors des crises de 2008, 2020 et 2022.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>Voir les portefeuilles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleRun} disabled={isPending}>
          {isPending ? "Exécution..." : "Lancer le stress test"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Échec du stress test"}
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
                portfolioId={activePortfolioId}
                openCard={openCard}
                onOpenCard={setOpenCard}
              />
            ))}
          </div>

          {/* Drawdown comparison chart */}
          <ChartExpandableCard
            title={mode === "beginner" ? "Comparaison des chutes" : "Comparaison des drawdowns"}
            legend={[
              { color: "hsl(0, 84%, 60%)", label: "Portefeuille actuel" },
              { color: "hsl(221, 83%, 53%)", label: "Optimisé Max Sharpe" },
            ]}
            onAnalyze={mkStressChartAnalyze}
            isOpen={openCard === "stress-chart"}
            onToggle={() => setOpenCard(openCard === "stress-chart" ? null : "stress-chart")}
          >
            <StressBarChart comparisons={data.comparisons} bare />
          </ChartExpandableCard>

          <WhyExpandableCard
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
              Résultats chargés depuis le cache
            </p>
          )}
        </>
      )}
    </div>
  );
}
