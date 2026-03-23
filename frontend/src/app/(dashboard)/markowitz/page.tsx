"use client";

/**
 * Markowitz efficient frontier page.
 *
 * Displays D3 scatter plot of the efficient frontier and a table comparing
 * optimal portfolio weights (min variance vs max Sharpe) against current.
 *
 * Depends on: components/charts/efficient-frontier.tsx, lib/api/markowitz.ts,
 *             lib/store/portfolio-store.ts
 * Used by: /markowitz route
 */

import { useEffect } from "react";
import Link from "next/link";

import { EfficientFrontier } from "@/components/charts/efficient-frontier";
import { WhyCard } from "@/components/shared/why-card";
import { BlurText } from "@/components/ui/blur-text";
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
import { useMarkowitz } from "@/lib/api/markowitz";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

function fmt(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export default function MarkowitzPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { mutate, data, isPending, error, reset } = useMarkowitz();

  // Auto-compute when portfolio changes
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
        <div>
          <BlurText
            text="Markowitz Optimization"
            className="text-3xl font-bold tracking-tight"
          />
          <p className="text-muted-foreground">
            Efficient frontier and optimal portfolio allocation
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

  // Gather all tickers from weights data for the table
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
      <div className="flex items-center justify-between">
        <div>
          <BlurText
            text="Markowitz Optimization"
            className="text-3xl font-bold tracking-tight"
          />
          <p className="text-muted-foreground">
            Efficient frontier and optimal portfolio allocation
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
              <CardTitle>Efficient Frontier</CardTitle>
              <CardDescription>
                {data.from_cache ? "Cached result" : "Freshly computed"} —{" "}
                {data.frontier_points.length} frontier points
              </CardDescription>
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

          {/* Summary KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Min Variance</CardDescription>
                <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                  {fmt(data.min_variance.volatility)} vol
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Return: {fmt(data.min_variance.expected_return)} · Sharpe:{" "}
                  {data.min_variance.sharpe_ratio.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Max Sharpe</CardDescription>
                <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                  {data.max_sharpe.sharpe_ratio.toFixed(2)} Sharpe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Return: {fmt(data.max_sharpe.expected_return)} · Vol:{" "}
                  {fmt(data.max_sharpe.volatility)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current Portfolio</CardDescription>
                <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                  {data.current_portfolio.sharpe_ratio.toFixed(2)} Sharpe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Return: {fmt(data.current_portfolio.expected_return)} · Vol:{" "}
                  {fmt(data.current_portfolio.volatility)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weights Comparison Table */}
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
                    <TableHead className="text-right text-green-600 dark:text-green-400">
                      Min Variance
                    </TableHead>
                    <TableHead className="text-right text-blue-600 dark:text-blue-400">
                      Max Sharpe
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTickers.map((ticker) => (
                    <TableRow key={ticker}>
                      <TableCell className="font-medium">{ticker}</TableCell>
                      <TableCell className="text-right">
                        {fmt(data.min_variance.weights[ticker] ?? 0, 1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt(data.max_sharpe.weights[ticker] ?? 0, 1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <WhyCard>
            <p className="mb-2">
              <strong>L'optimisation de Markowitz</strong> trouve les allocations d'actifs offrant le
              meilleur compromis rendement/risque. Le portefeuille &quot;Min Variance&quot; minimise la volatilité
              totale, tandis que le &quot;Max Sharpe&quot; maximise le rendement par unité de risque.
            </p>
            <p className="mb-2">
              La <strong>frontière efficiente</strong> représente l'ensemble des portefeuilles optimaux :
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
