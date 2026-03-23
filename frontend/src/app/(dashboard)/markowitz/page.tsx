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

import { useEffect } from "react";
import Link from "next/link";

import { EfficientFrontier } from "@/components/charts/efficient-frontier";
import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { WhyCard } from "@/components/shared/why-card";
import { BlurText } from "@/components/ui/blur-text";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { WobbleCard } from "@/components/ui/wobble-card";
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
            </CardContent>
          </Card>

          {/* Summary KPIs with WobbleCard */}
          <div className="grid gap-4 sm:grid-cols-3">
            <WobbleCard containerClassName="bg-card" className="p-4 !py-4">
              <p className="text-xs text-muted-foreground mb-1">
                {mode === "beginner" ? "Risque minimum" : "Min Variance"}
              </p>
              <p className="text-2xl font-mono font-bold text-emerald-500">
                <CountUp to={data.min_variance.volatility * 100} duration={1200} suffix="% vol" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Return: <CountUp to={data.min_variance.expected_return * 100} duration={1200} suffix="%" />
                {" · Sharpe: "}
                <CountUp to={data.min_variance.sharpe_ratio} duration={1200} decimals={2} />
              </p>
            </WobbleCard>

            <WobbleCard containerClassName="bg-card" className="p-4 !py-4">
              <MetricTooltip metricKey="sharpe" label={mode === "beginner" ? "Meilleur ratio rendement/risque" : "Max Sharpe"}>
                <p className="text-2xl font-mono font-bold text-blue-400">
                  <CountUp to={data.max_sharpe.sharpe_ratio} duration={1200} decimals={2} suffix=" Sharpe" />
                </p>
              </MetricTooltip>
              <p className="text-xs text-muted-foreground mt-1">
                Return: <CountUp to={data.max_sharpe.expected_return * 100} duration={1200} suffix="%" />
                {" · Vol: "}
                <CountUp to={data.max_sharpe.volatility * 100} duration={1200} suffix="%" />
              </p>
            </WobbleCard>

            <WobbleCard containerClassName="bg-card" className="p-4 !py-4">
              <p className="text-xs text-muted-foreground mb-1">
                {mode === "beginner" ? "Votre portefeuille" : "Current Portfolio"}
              </p>
              <p className="text-2xl font-mono font-bold text-red-500">
                <CountUp to={data.current_portfolio.sharpe_ratio} duration={1200} decimals={2} suffix=" Sharpe" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Return: <CountUp to={data.current_portfolio.expected_return * 100} duration={1200} suffix="%" />
                {" · Vol: "}
                <CountUp to={data.current_portfolio.volatility * 100} duration={1200} suffix="%" />
              </p>
            </WobbleCard>
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

          <WhyCard>
            <p className="mb-2">
              <strong>L&apos;optimisation de Markowitz</strong> trouve les allocations d&apos;actifs offrant le
              meilleur compromis rendement/risque. Le portefeuille &quot;Min Variance&quot; minimise la volatilité
              totale, tandis que le &quot;Max Sharpe&quot; maximise le rendement par unité de risque.
            </p>
            <p className="mb-2">
              La <strong>frontière efficiente</strong> représente l&apos;ensemble des portefeuilles optimaux :
              tout portefeuille en dessous de cette courbe est sous-optimal (on peut obtenir plus de
              rendement pour le même risque, ou moins de risque pour le même rendement).
            </p>
            <p>
              Comparez votre portefeuille actuel aux allocations optimales pour identifier des
              opportunités de rééquilibrage.
            </p>
          </WhyCard>
        </>
      )}
    </div>
  );
}
