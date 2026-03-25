"use client";

/**
 * Dashboard overview page.
 *
 * Row 1: 3 equal KPI cards (VaR 95%, Sharpe, Annualized Return)
 * Row 2: 3 equal sections (Volatility, Live Prices, Portfolio Composition)
 */

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { motion } from "motion/react";

import { ChartDescription } from "@/components/shared/chart-description";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
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
  const t = useTranslations();
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
            <CardTitle>{t("dashboard.welcome")}</CardTitle>
            <CardDescription>{t("dashboard.welcome_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>{t("dashboard.create_portfolio")}</Button>
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
    <div className="space-y-4 p-6">
      {/* Row 1: 3 KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* VaR 95% */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.35, ease: "easeOut" }}
        >
          <MagicCard gradientColor="#1a2744" className="h-full rounded-xl bg-card p-4 flex flex-col justify-between">
            <MetricTooltip metricKey="var_95" label={t(`metrics.${mode}.var_95`)}>
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : summary ? (
                <p className="text-2xl font-mono text-red-500">
                  <NumberTicker value={summary.var_95_historical * 100} decimalPlaces={2} className="text-red-500" />%
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
            {summary && mode === "expert" && (
              <span className="text-xs text-muted-foreground mt-2">
                {t("risk.parametric")}:{" "}
                <NumberTicker value={summary.var_95_parametric * 100} decimalPlaces={2} className="text-muted-foreground" />%
              </span>
            )}
          </MagicCard>
        </motion.div>

        {/* Sharpe Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
        >
          <MagicCard gradientColor="#1a2744" className="h-full rounded-xl bg-card p-4 flex flex-col justify-between">
            <MetricTooltip metricKey="sharpe" label={t(`metrics.${mode}.sharpe`)}>
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
                  <NumberTicker value={summary.sharpe_ratio} decimalPlaces={3} />
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
            {summary && mode === "beginner" && (
              <span className="text-xs text-muted-foreground mt-2">
                {summary.sharpe_ratio >= 1
                  ? t("dashboard.sharpe_good")
                  : summary.sharpe_ratio >= 0.5
                    ? t("dashboard.sharpe_acceptable")
                    : t("dashboard.sharpe_below_avg")}
              </span>
            )}
          </MagicCard>
        </motion.div>

        {/* Annualized Return */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35, ease: "easeOut" }}
        >
          <MagicCard gradientColor="#1a2744" className="h-full rounded-xl bg-card p-4 flex flex-col justify-between">
            <MetricTooltip metricKey="return" label={t(`metrics.${mode}.annual_return`)}>
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : summary ? (
                <p
                  className={`text-2xl font-mono ${
                    summary.annualized_return >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {summary.annualized_return >= 0 ? "+" : ""}
                  <NumberTicker value={summary.annualized_return * 100} decimalPlaces={2} />%
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
            {summary && (
              <span className="text-xs text-muted-foreground mt-2">
                {summary.n_observations} {t("dashboard.observations")}
              </span>
            )}
          </MagicCard>
        </motion.div>
      </div>

      {/* Row 2: Volatility + Live Prices + Composition */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Volatility */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.35, ease: "easeOut" }}
        >
          <MagicCard gradientColor="#1a2744" className="h-full rounded-xl bg-card p-4 flex flex-col justify-between">
            <MetricTooltip metricKey="volatility" label={t(`metrics.${mode}.volatility`)}>
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : summary ? (
                <p className="text-2xl font-mono text-foreground">
                  <NumberTicker value={summary.annualized_volatility * 100} decimalPlaces={2} />%
                </p>
              ) : (
                <p className="text-2xl font-mono text-muted-foreground">--</p>
              )}
            </MetricTooltip>
            {summary && mode === "expert" && (
              <span className="text-xs text-muted-foreground mt-2">
                CVaR 95%:{" "}
                <NumberTicker value={summary.cvar_95 * 100} decimalPlaces={2} className="text-muted-foreground" />%
              </span>
            )}
          </MagicCard>
        </motion.div>

        {/* Live Prices */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35, ease: "easeOut" }}
          className="rounded-xl border border-border bg-card p-4 h-full flex flex-col"
        >
          <div className="text-base font-medium flex items-center gap-2 mb-3">
            {t("dashboard.live_prices")}
            <span className="flex items-center gap-1 text-xs text-emerald-500 font-normal">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {t("dashboard.live")}
            </span>
          </div>
          <div className="space-y-2 flex-1">
            {livePrices && livePrices.length > 0 ? (
              livePrices.map((q) => (
                <div key={q.ticker} className="flex items-center justify-between">
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
                          q.change_pct >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {q.change_pct >= 0 ? "+" : ""}
                        {q.change_pct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">--</p>
            )}
          </div>
        </motion.div>

        {/* Portfolio Composition */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35, ease: "easeOut" }}
          className="rounded-xl border border-border bg-card p-4 h-full flex flex-col"
        >
          <span className="text-base font-medium mb-2">{t("dashboard.composition")}</span>
          <ChartDescription
            beginner="Répartition de votre portefeuille entre vos différents actifs."
            expert="Allocation actuelle du portefeuille par actif (pondérations en %)."
          />
          {donutData && donutData.length > 0 ? (
            <>
              <div className="h-32 w-full flex-1 min-h-0">
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
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value}%`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                    <span className="text-xs">
                      {d.name} {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">--</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
