"use client";

/**
 * "Et si ?" risk simulator — interactive weight sliders with comparison.
 *
 * Users adjust portfolio weights via sliders and see real-time changes
 * in VaR, Sharpe, volatility, and return vs. the current allocation.
 *
 * Depends on: shadcn Slider/Card/Progress/Button, lib/api/risk.ts,
 *             lib/api/portfolios.ts, types/risk.ts, types/portfolio.ts
 * Used by: app/(dashboard)/risk/page.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Magnet } from "@/components/ui/magnet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { usePortfolio, useCreatePortfolio } from "@/lib/api/portfolios";
import { useRiskSummary, useSimulateRisk } from "@/lib/api/risk";
import type { RiskSummary } from "@/types/risk";

interface SimulatorProps {
  portfolioId: string;
}

interface MetricComparison {
  label: string;
  current: number;
  simulated: number;
  format: (v: number) => string;
  /** true = higher is better (e.g. Sharpe), false = lower is better (e.g. VaR) */
  higherIsBetter: boolean;
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function formatRatio(v: number): string {
  return v.toFixed(4);
}

export function Simulator({ portfolioId }: SimulatorProps) {
  const router = useRouter();
  const { data: portfolio } = usePortfolio(portfolioId);
  const riskSummaryMutation = useRiskSummary();
  const simulateMutation = useSimulateRisk();
  const createPortfolioMutation = useCreatePortfolio();

  const [weights, setWeights] = useState<Record<string, number>>({});
  const [currentSummary, setCurrentSummary] = useState<RiskSummary | null>(
    null,
  );
  const [simulatedSummary, setSimulatedSummary] = useState<RiskSummary | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize weights from portfolio
  useEffect(() => {
    if (portfolio?.assets && Object.keys(weights).length === 0) {
      const initial: Record<string, number> = {};
      for (const asset of portfolio.assets) {
        initial[asset.ticker] = asset.weight;
      }
      setWeights(initial);
    }
  }, [portfolio, weights]);

  // Fetch current risk summary on mount
  useEffect(() => {
    if (portfolioId && !currentSummary && !riskSummaryMutation.isPending) {
      riskSummaryMutation.mutate(
        { portfolio_id: portfolioId },
        { onSuccess: (data) => setCurrentSummary(data) },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId]);

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
  const isValid = Math.abs(totalWeight - 1) < 0.005;
  const tickers = Object.keys(weights);

  const handleSliderChange = useCallback(
    (ticker: string, newValue: number) => {
      setWeights((prev) => {
        const oldValue = prev[ticker] ?? 0;
        const diff = newValue - oldValue;
        const others = tickers.filter((t) => t !== ticker);
        const othersTotal = others.reduce((s, t) => s + (prev[t] ?? 0), 0);

        const updated = { ...prev, [ticker]: newValue };

        // Proportionally adjust other weights
        if (othersTotal > 0 && others.length > 0) {
          for (const t of others) {
            const proportion = (prev[t] ?? 0) / othersTotal;
            const adjusted = Math.max(0, (prev[t] ?? 0) - diff * proportion);
            updated[t] = Math.round(adjusted * 100) / 100;
          }
        }

        return updated;
      });
    },
    [tickers],
  );

  const handleSimulate = useCallback(() => {
    if (!isValid || tickers.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      simulateMutation.mutate(
        {
          tickers,
          weights: tickers.map((t) => weights[t]),
        },
        { onSuccess: (data) => setSimulatedSummary(data) },
      );
    }, 500);
  }, [isValid, tickers, weights, simulateMutation]);

  const handleApply = useCallback(() => {
    if (!portfolio) return;

    const assets = tickers.map((t) => ({ ticker: t, weight: weights[t] }));
    createPortfolioMutation.mutate(
      { name: `${portfolio.name} (Simulé)`, assets },
      { onSuccess: () => router.push("/portfolio") },
    );
  }, [portfolio, tickers, weights, createPortfolioMutation, router]);

  const metrics: MetricComparison[] =
    currentSummary && simulatedSummary
      ? [
          {
            label: "VaR 95%",
            current: currentSummary.var_95_historical,
            simulated: simulatedSummary.var_95_historical,
            format: formatPct,
            higherIsBetter: false,
          },
          {
            label: "Sharpe",
            current: currentSummary.sharpe_ratio,
            simulated: simulatedSummary.sharpe_ratio,
            format: formatRatio,
            higherIsBetter: true,
          },
          {
            label: "Volatilité",
            current: currentSummary.annualized_volatility,
            simulated: simulatedSummary.annualized_volatility,
            format: formatPct,
            higherIsBetter: false,
          },
          {
            label: "Rendement",
            current: currentSummary.annualized_return,
            simulated: simulatedSummary.annualized_return,
            format: formatPct,
            higherIsBetter: true,
          },
        ]
      : [];

  if (!portfolio) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Et si vous rééquilibriez votre portefeuille ?
        </CardTitle>
        <CardDescription>
          Ajustez les pondérations et comparez les métriques de risque
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight sliders */}
        <div className="space-y-4">
          {portfolio.assets.map((asset) => (
            <div key={asset.ticker} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-foreground">
                  {asset.ticker}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  {((weights[asset.ticker] ?? asset.weight) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[Math.round((weights[asset.ticker] ?? asset.weight) * 100)]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) =>
                  handleSliderChange(asset.ticker, v / 100)
                }
              />
              <Progress
                value={(weights[asset.ticker] ?? asset.weight) * 100}
                className="h-1"
              />
            </div>
          ))}
        </div>

        {/* Sum indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Total : {(totalWeight * 100).toFixed(0)}%
          </span>
          {!isValid && (
            <span className="text-xs font-medium text-red-500">
              La somme doit être 100%
            </span>
          )}
        </div>

        {/* Simulate button */}
        <Magnet>
          <Button
            onClick={handleSimulate}
            disabled={!isValid || simulateMutation.isPending}
            className="w-full"
          >
            {simulateMutation.isPending ? "Simulation..." : "Simuler"}
          </Button>
        </Magnet>

        {/* Comparison results */}
        {metrics.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pb-1 border-b border-border">
              <span>Métrique</span>
              <span className="text-center">Actuel</span>
              <span className="text-center">Simulé</span>
            </div>
            {metrics.map((m) => {
              const diff = m.simulated - m.current;
              const improved = m.higherIsBetter ? diff > 0 : diff < 0;
              const diffPct =
                m.current !== 0
                  ? ((diff / Math.abs(m.current)) * 100).toFixed(1)
                  : "—";

              return (
                <div
                  key={m.label}
                  className="grid grid-cols-3 gap-2 items-center"
                >
                  <span className="text-sm text-muted-foreground">
                    {m.label}
                  </span>
                  <span className="font-mono text-sm text-center text-foreground">
                    {m.format(m.current)}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-mono text-sm text-foreground">
                      {m.format(m.simulated)}
                    </span>
                    {diff !== 0 && (
                      <span
                        className={`text-[10px] font-medium ${
                          improved ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {improved ? "↑" : "↓"}{" "}
                        {diffPct !== "—" ? `${Math.abs(parseFloat(diffPct))}%` : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Apply button */}
        {simulatedSummary && (
          <Button
            variant="outline"
            onClick={handleApply}
            disabled={createPortfolioMutation.isPending}
            className="w-full"
          >
            {createPortfolioMutation.isPending
              ? "Création..."
              : "Appliquer cette allocation"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
