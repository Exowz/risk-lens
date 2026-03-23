"use client";

/**
 * Markowitz efficient frontier page.
 *
 * KPI metrics in KpiExpandableCard, frontier in ChartExpandableCard,
 * WhyExpandableCard for educational content.
 *
 * Depends on: components/charts/efficient-frontier.tsx, lib/api/markowitz.ts,
 *             lib/store/portfolio-store.ts, lib/store/mode-context.tsx
 * Used by: /markowitz route
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { EfficientFrontier } from "@/components/charts/efficient-frontier";
import { ChartExpandableCard } from "@/components/shared/chart-expandable-card";
import { KpiExpandableCard } from "@/components/shared/kpi-expandable-card";
import { WhyExpandableCard } from "@/components/shared/why-expandable-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchMarkowitzExplanation, fetchMetricExplanation } from "@/lib/api/explain";
import { useMarkowitz } from "@/lib/api/markowitz";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

function fmt(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export default function MarkowitzPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { mutate, data, isPending, error, reset } = useMarkowitz();
  const { mode } = useMode();
  const [openCard, setOpenCard] = useState<string | null>(null);

  const mkAnalyze = useCallback(
    (metricName: string, metricValue: number, context?: Record<string, number | string | null>) =>
      () =>
        fetchMetricExplanation({
          metric_name: metricName,
          metric_value: metricValue,
          portfolio_id: activePortfolioId ?? "",
          mode,
          context,
        }),
    [activePortfolioId, mode],
  );

  const mkFrontierAnalyze = useCallback(() => {
    if (!data) return Promise.resolve("Analyse temporairement indisponible.");
    return fetchMarkowitzExplanation({
      mode,
      current_sharpe: data.current_portfolio.sharpe_ratio,
      current_volatility: data.current_portfolio.volatility,
      current_return: data.current_portfolio.expected_return,
      max_sharpe_ratio: data.max_sharpe.sharpe_ratio,
      max_sharpe_volatility: data.max_sharpe.volatility,
      max_sharpe_return: data.max_sharpe.expected_return,
      min_variance_volatility: data.min_variance.volatility,
    }).then((res) => res.explanation);
  }, [data, mode]);

  useEffect(() => {
    if (activePortfolioId) {
      reset();
    }
  }, [activePortfolioId, reset]);

  const handleCompute = () => {
    if (!activePortfolioId) return;
    mutate({ portfolio_id: activePortfolioId, n_points: 100, period: "2y" });
  };

  if (!activePortfolioId) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Aucun portefeuille sélectionné</CardTitle>
            <CardDescription>
              Créez ou sélectionnez un portefeuille pour calculer la frontière
              efficiente et trouver les allocations optimales.
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

  const allTickers = data
    ? [
        ...new Set([
          ...Object.keys(data.min_variance.weights),
          ...Object.keys(data.max_sharpe.weights),
        ]),
      ].sort()
    : [];

  const toggle = (key: string) =>
    setOpenCard(openCard === key ? null : key);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCompute} disabled={isPending}>
          {isPending ? "Calcul..." : "Calculer la frontière"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Computation failed"}
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Efficient Frontier Chart */}
          <ChartExpandableCard
            title={mode === "beginner" ? "Carte des portefeuilles possibles" : "Efficient Frontier"}
            legend={[
              { color: "#10b981", label: "Min Variance" },
              { color: "#3b82f6", label: "Max Sharpe" },
              { color: "#ef4444", label: mode === "beginner" ? "Votre portefeuille" : "Current" },
            ]}
            onAnalyze={mkFrontierAnalyze}
            isOpen={openCard === "frontier-chart"}
            onToggle={() => toggle("frontier-chart")}
          >
            <EfficientFrontier
              frontierPoints={data.frontier_points}
              minVariance={data.min_variance}
              maxSharpe={data.max_sharpe}
              currentPortfolio={data.current_portfolio}
            />
          </ChartExpandableCard>

          {/* Summary KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiExpandableCard
              label={mode === "beginner" ? "Votre score rendement/risque" : "Current Sharpe"}
              value={data.current_portfolio.sharpe_ratio}
              decimals={2}
              valueColor="red"
              metricKey="mk-current-sharpe"
              onAnalyze={mkAnalyze("current_sharpe", data.current_portfolio.sharpe_ratio, {
                max_sharpe: data.max_sharpe.sharpe_ratio,
                current_volatility: data.current_portfolio.volatility,
              })}
              isOpen={openCard === "mk-current-sharpe"}
              onToggle={() => toggle("mk-current-sharpe")}
            />

            <KpiExpandableCard
              label={mode === "beginner" ? "Meilleur score possible" : "Max Sharpe"}
              value={data.max_sharpe.sharpe_ratio}
              decimals={2}
              valueColor="blue"
              metricKey="mk-max-sharpe"
              onAnalyze={mkAnalyze("max_sharpe_ratio", data.max_sharpe.sharpe_ratio, {
                current_sharpe: data.current_portfolio.sharpe_ratio,
                max_sharpe_volatility: data.max_sharpe.volatility,
              })}
              isOpen={openCard === "mk-max-sharpe"}
              onToggle={() => toggle("mk-max-sharpe")}
            />

            <KpiExpandableCard
              label={mode === "beginner" ? "Risque minimum possible" : "Min Variance Vol"}
              value={data.min_variance.volatility * 100}
              valueSuffix="%"
              valueColor="emerald"
              metricKey="mk-min-var"
              onAnalyze={mkAnalyze("min_variance_volatility", data.min_variance.volatility, {
                current_volatility: data.current_portfolio.volatility,
              })}
              isOpen={openCard === "mk-min-var"}
              onToggle={() => toggle("mk-min-var")}
            />

            <KpiExpandableCard
              label={mode === "beginner" ? "Votre volatilité actuelle" : "Current Vol"}
              value={data.current_portfolio.volatility * 100}
              valueSuffix="%"
              valueColor="foreground"
              metricKey="mk-current-vol"
              onAnalyze={mkAnalyze("current_volatility", data.current_portfolio.volatility, {
                min_variance_volatility: data.min_variance.volatility,
                current_return: data.current_portfolio.expected_return,
              })}
              isOpen={openCard === "mk-current-vol"}
              onToggle={() => toggle("mk-current-vol")}
            />

            <KpiExpandableCard
              label={mode === "beginner" ? "Rendement attendu actuel" : "Current Return"}
              value={data.current_portfolio.expected_return * 100}
              valuePrefix={data.current_portfolio.expected_return >= 0 ? "+" : ""}
              valueSuffix="%"
              valueColor={data.current_portfolio.expected_return >= 0 ? "emerald" : "red"}
              metricKey="mk-current-return"
              onAnalyze={mkAnalyze("current_expected_return", data.current_portfolio.expected_return, {
                max_sharpe_return: data.max_sharpe.expected_return,
                current_volatility: data.current_portfolio.volatility,
              })}
              isOpen={openCard === "mk-current-return"}
              onToggle={() => toggle("mk-current-return")}
            />
          </div>

          {/* Beginner: simplified recommended allocation card */}
          {mode === "beginner" && (
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-blue-400">
                  Allocation recommandée
                </CardTitle>
                <CardDescription>
                  Répartition optimale selon le ratio de Sharpe maximum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(data.max_sharpe.weights)
                    .sort(([, a], [, b]) => b - a)
                    .map(([ticker, weight]) => (
                      <div
                        key={ticker}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <span className="font-medium">{ticker}</span>
                        <span className="font-mono text-blue-400">
                          {fmt(weight, 1)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expert: full weights comparison table */}
          {mode === "expert" && (
            <Card>
              <CardHeader>
                <CardTitle>Optimal Weights Comparison</CardTitle>
                <CardDescription>
                  Suggested allocations vs your current portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead className="text-right text-emerald-500">
                        Min Variance
                      </TableHead>
                      <TableHead className="text-right text-blue-400">
                        Max Sharpe
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTickers.map((ticker) => (
                      <TableRow key={ticker}>
                        <TableCell className="font-medium">{ticker}</TableCell>
                        <TableCell className="text-right font-mono">
                          {fmt(data.min_variance.weights[ticker] ?? 0, 1)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {fmt(data.max_sharpe.weights[ticker] ?? 0, 1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Link to stress test */}
          <div className="flex justify-end">
            <Link href="/stress">
              <Button variant="outline" size="sm">
                {mode === "beginner"
                  ? "Tester cette allocation en période de crise →"
                  : "Stress tester cette allocation →"}
              </Button>
            </Link>
          </div>

          <WhyExpandableCard
            beginnerContent={
              <>
                <p className="mb-2">
                  L&apos;optimisation de Markowitz cherche la <strong>meilleure répartition</strong> de
                  vos actifs : celle qui donne le plus de rendement pour un niveau de risque donné.
                </p>
                <p className="mb-2">
                  La <strong>courbe bleue</strong> montre tous les portefeuilles optimaux possibles.
                  Si votre point rouge est en dessous, vous pouvez faire mieux sans prendre plus de risque.
                </p>
                <p>
                  Regardez l&apos;&quot;allocation recommandée&quot; pour voir comment rééquilibrer vos actifs.
                </p>
              </>
            }
            expertContent={
              <>
                <p className="mb-2">
                  <strong>Markowitz Mean-Variance Optimization</strong> computes the efficient frontier
                  — the set of portfolios maximizing expected return for each volatility level using
                  PyPortfolioOpt.
                </p>
                <p className="mb-2">
                  The <strong>Min Variance</strong> portfolio minimizes total volatility. The{" "}
                  <strong>Max Sharpe</strong> portfolio maximizes excess return per unit of risk
                  (Sharpe ratio with Rf = 0).
                </p>
                <p>
                  Compare your current allocation against optimal weights to identify rebalancing
                  opportunities and quantify the efficiency gap.
                </p>
              </>
            }
          />
        </>
      )}
    </div>
  );
}
