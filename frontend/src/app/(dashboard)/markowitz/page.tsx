"use client";

/**
 * Markowitz efficient frontier page.
 *
 * Expert mode: full frontier chart, KPI cards, weights comparison table, WhyCard collapsed.
 * Beginner mode: frontier chart, simplified "recommended allocation" card, WhyCard expanded.
 *
 * Depends on: components/charts/efficient-frontier.tsx, lib/api/markowitz.ts,
 *             lib/store/portfolio-store.ts, lib/store/mode-context.tsx
 * Used by: /markowitz route
 */

import { useCallback, useEffect } from "react";
import Link from "next/link";

import { EfficientFrontier } from "@/components/charts/efficient-frontier";
import { AiChartExplanation } from "@/components/shared/ai-chart-explanation";
import { ExpandableMetric } from "@/components/shared/expandable-metric";
import { WhyCard } from "@/components/shared/why-card";
import { BlurText } from "@/components/ui/blur-text";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
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
import { useMarkowitzExplanation } from "@/lib/api/explain";
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
  const markowitzExplanation = useMarkowitzExplanation();

  const triggerExplanation = useCallback(() => {
    if (!data) return;
    markowitzExplanation.mutate({
      mode,
      current_sharpe: data.current_portfolio.sharpe_ratio,
      current_volatility: data.current_portfolio.volatility,
      current_return: data.current_portfolio.expected_return,
      max_sharpe_ratio: data.max_sharpe.sharpe_ratio,
      max_sharpe_volatility: data.max_sharpe.volatility,
      max_sharpe_return: data.max_sharpe.expected_return,
      min_variance_volatility: data.min_variance.volatility,
    });
  }, [data, mode, markowitzExplanation]);

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
      <div className="space-y-8">
        <div className="border-b border-border pb-3">
          <BlurText
            text="Markowitz Optimization"
            className="text-3xl font-bold tracking-tight"
          />
          <p className="text-muted-foreground">
            {mode === "beginner"
              ? "Trouvez la meilleure répartition pour votre portefeuille"
              : "Efficient frontier and optimal portfolio allocation"}
          </p>
        </div>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No Portfolio Selected</CardTitle>
            <CardDescription>
              Create or select a portfolio to compute the efficient frontier and
              find optimal asset allocations.
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

  const allTickers = data
    ? [
        ...new Set([
          ...Object.keys(data.min_variance.weights),
          ...Object.keys(data.max_sharpe.weights),
        ]),
      ].sort()
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <BlurText
            text="Markowitz Optimization"
            className="text-3xl font-bold tracking-tight"
          />
          <p className="text-muted-foreground">
            {mode === "beginner"
              ? "Trouvez la meilleure répartition pour votre portefeuille"
              : "Efficient frontier and optimal portfolio allocation"}
          </p>
        </div>
        <Button onClick={handleCompute} disabled={isPending}>
          {isPending ? "Computing..." : "Compute Frontier"}
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
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === "beginner"
                  ? "Carte des portefeuilles possibles"
                  : "Efficient Frontier"}
              </CardTitle>
              {mode === "expert" && (
                <CardDescription>
                  {data.from_cache ? "Cached result" : "Freshly computed"} —{" "}
                  {data.frontier_points.length} frontier points
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <EfficientFrontier
                frontierPoints={data.frontier_points}
                minVariance={data.min_variance}
                maxSharpe={data.max_sharpe}
                currentPortfolio={data.current_portfolio}
              />
              <AiChartExplanation
                onAnalyze={triggerExplanation}
                explanation={markowitzExplanation.data?.explanation}
                isPending={markowitzExplanation.isPending}
                isError={markowitzExplanation.isError}
              />
            </CardContent>
          </Card>

          {/* Summary KPIs with ExpandableMetric */}
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === "beginner" ? "Résumé des portefeuilles" : "Portfolio Comparison"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpandableMetric
                labelBeginner="Votre score rendement/risque"
                labelExpert="Current Sharpe"
                value={
                  <span className="font-mono text-red-500">
                    <CountUp to={data.current_portfolio.sharpe_ratio} duration={1200} decimals={2} />
                  </span>
                }
                explanationBeginner="Votre portefeuille actuel obtient ce score rendement/risque. Le portefeuille optimal obtient un meilleur score."
                explanationExpert="Sharpe ratio du portefeuille actuel vs max-Sharpe sur la frontière efficiente."
              />
              <ExpandableMetric
                labelBeginner="Meilleur score possible"
                labelExpert="Max Sharpe"
                value={
                  <span className="font-mono text-blue-400">
                    <CountUp to={data.max_sharpe.sharpe_ratio} duration={1200} decimals={2} />
                  </span>
                }
                explanationBeginner="Le meilleur score rendement/risque atteignable en réorganisant vos actifs."
                explanationExpert="Sharpe ratio du portefeuille tangent (max-Sharpe) sur la frontière efficiente, Rf = 0."
              />
              <ExpandableMetric
                labelBeginner="Risque minimum possible"
                labelExpert="Min Variance Vol"
                value={
                  <span className="font-mono text-emerald-500">
                    <CountUp to={data.min_variance.volatility * 100} duration={1200} suffix="%" />
                  </span>
                }
                explanationBeginner="La volatilité la plus basse possible avec vos actifs. Moins de volatilité = moins de surprise."
                explanationExpert="Volatilité du portefeuille de variance minimale sur la frontière efficiente."
              />
              <ExpandableMetric
                labelBeginner="Votre volatilité actuelle"
                labelExpert="Current Vol"
                value={
                  <span className="font-mono text-foreground">
                    <CountUp to={data.current_portfolio.volatility * 100} duration={1200} suffix="%" />
                  </span>
                }
                explanationBeginner="Mesure l'agitation de votre portefeuille. Plus ce chiffre est haut, plus les variations quotidiennes sont importantes et imprévisibles."
                explanationExpert="Volatilité annualisée = σ_journalière × √252. Écart-type des rendements logarithmiques journaliers."
              />
            </CardContent>
          </Card>

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

          <WhyCard
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
