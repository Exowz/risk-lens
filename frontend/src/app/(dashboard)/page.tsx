"use client";

/**
 * Dashboard overview page with Aceternity BentoGrid + WobbleCard layout.
 *
 * Displays KPI cards for VaR 95%, Sharpe ratio, annualized return,
 * volatility, and a mini donut chart for portfolio composition.
 * All numeric values use CountUp animation. Titles use BlurText.
 *
 * Depends on: lib/api/risk.ts, lib/api/portfolios.ts,
 *             lib/store/portfolio-store.ts, lib/store/mode-context.tsx,
 *             Aceternity BentoGrid + WobbleCard, ReactBits CountUp + BlurText
 * Used by: / route
 */

import { useEffect } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { ChartDescription } from "@/components/shared/chart-description";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { CountUp } from "@/components/ui/count-up";
import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLivePrices,
  usePortfolio,
  usePortfolios,
} from "@/lib/api/portfolios";
import { useRiskSummary } from "@/lib/api/risk";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

const DONUT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function DashboardPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { data: portfolios } = usePortfolios();
  const { data: portfolio } = usePortfolio(activePortfolioId);
  const { data: livePrices } = useLivePrices(activePortfolioId);
  const { mode } = useMode();
  const {
    mutate: fetchSummary,
    data: summary,
    isPending,
  } = useRiskSummary();

  useEffect(() => {
    if (activePortfolioId) {
      fetchSummary({ portfolio_id: activePortfolioId });
    }
  }, [activePortfolioId, fetchSummary]);

  if (!activePortfolioId || !portfolios || portfolios.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Bienvenue sur RiskLens</CardTitle>
            <CardDescription>
              Créez votre premier portefeuille pour accéder aux analyses de risque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>Créer un portefeuille</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const donutData = portfolio?.assets.map((a) => ({
    name: a.ticker,
    value: Math.round(a.weight * 10000) / 100,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* KPI Bento Grid */}
      <BentoGrid className="md:auto-rows-[10rem] md:grid-cols-4">
        {/* VaR 95% — large card spanning 2 cols */}
        <BentoGridItem
          className="md:col-span-2 border-red-500/20"
          title={
            <MetricTooltip metricKey="var_95" label="VaR 95% (1-day)">
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : summary ? (
                <p className="text-2xl font-mono text-red-500">
                  <CountUp
                    to={summary.var_95_historical * 100}
                    duration={1200}
                    suffix="%"
                  />
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
          }
          description={
            summary && mode === "expert" ? (
              <span className="text-xs text-muted-foreground">
                Parametric:{" "}
                <CountUp
                  to={summary.var_95_parametric * 100}
                  duration={1200}
                  suffix="%"
                />
              </span>
            ) : null
          }
        />

        {/* Sharpe Ratio */}
        <BentoGridItem
          title={
            <MetricTooltip metricKey="sharpe" label="Sharpe Ratio">
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : summary ? (
                <p
                  className={`text-2xl font-mono ${
                    summary.sharpe_ratio >= 1
                      ? "text-emerald-500"
                      : summary.sharpe_ratio >= 0
                        ? "text-amber-500"
                        : "text-red-500"
                  }`}
                >
                  <CountUp
                    to={summary.sharpe_ratio}
                    duration={1200}
                    decimals={3}
                  />
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
          }
          description={
            summary && mode === "beginner" ? (
              <span className="text-xs text-muted-foreground">
                {summary.sharpe_ratio >= 1
                  ? "Good risk-adjusted return"
                  : summary.sharpe_ratio >= 0.5
                    ? "Acceptable"
                    : "Below average"}
              </span>
            ) : null
          }
        />

        {/* Annualized Return */}
        <BentoGridItem
          title={
            <MetricTooltip metricKey="return" label="Annualized Return">
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : summary ? (
                <p
                  className={`text-2xl font-mono ${
                    summary.annualized_return >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {summary.annualized_return >= 0 ? "+" : ""}
                  <CountUp
                    to={summary.annualized_return * 100}
                    duration={1200}
                    suffix="%"
                  />
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
          }
          description={
            summary ? (
              <span className="text-xs text-muted-foreground">
                {summary.n_observations} observations
              </span>
            ) : null
          }
        />

        {/* Volatility */}
        <BentoGridItem
          title={
            <MetricTooltip metricKey="volatility" label="Annualized Volatility">
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : summary ? (
                <p className="text-2xl font-mono text-foreground">
                  <CountUp
                    to={summary.annualized_volatility * 100}
                    duration={1200}
                    suffix="%"
                  />
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
          }
          description={
            summary && mode === "expert" ? (
              <span className="text-xs text-muted-foreground">
                CVaR 95%:{" "}
                <CountUp
                  to={summary.cvar_95 * 100}
                  duration={1200}
                  suffix="%"
                />
              </span>
            ) : null
          }
        />

        {/* Live prices — spans 2 cols */}
        {livePrices && livePrices.length > 0 && (
          <BentoGridItem
            className="md:col-span-2"
            title={
              <span className="text-base font-medium flex items-center gap-2">
                Live Prices
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-normal">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live
                </span>
              </span>
            }
            description={
              <div className="space-y-2 mt-1">
                {livePrices.map((q) => (
                  <div
                    key={q.ticker}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{q.ticker}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">
                        {q.price != null
                          ? `${q.currency === "USD" ? "$" : q.currency} ${q.price.toLocaleString()}`
                          : "—"}
                      </span>
                      {q.change_pct != null && (
                        <span
                          className={`font-mono text-xs ${
                            q.change_pct >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {q.change_pct >= 0 ? "+" : ""}
                          {q.change_pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            }
          />
        )}

        {/* Portfolio composition donut — spans 1 col */}
        {donutData && donutData.length > 0 && (
          <BentoGridItem
            className="md:col-span-1"
            title={
              <span className="text-base font-medium">Composition</span>
            }
            header={
              <div>
                <ChartDescription
                  beginner="Répartition de votre portefeuille entre vos différents actifs."
                  expert="Allocation actuelle du portefeuille par actif (pondérations en %)."
                />
                <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      strokeWidth={2}
                    >
                      {donutData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                </div>
              </div>
            }
            description={
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor:
                          DONUT_COLORS[i % DONUT_COLORS.length],
                      }}
                    />
                    <span className="text-xs">
                      {d.name} {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            }
          />
        )}
      </BentoGrid>
    </div>
  );
}
