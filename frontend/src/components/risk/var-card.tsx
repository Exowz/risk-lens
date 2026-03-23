"use client";

/**
 * VaR and CVaR KPI display cards with WobbleCard + CountUp.
 *
 * Shows VaR 95%, VaR 99%, CVaR 95%, CVaR 99% with method toggle
 * (historical vs parametric). Uses MetricTooltip for explanations.
 *
 * Depends on: lib/api/risk.ts, types/risk.ts, shadcn/ui, Aceternity WobbleCard
 * Used by: app/(dashboard)/risk/page.tsx
 */

import { useEffect, useState } from "react";

import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { CountUp } from "@/components/ui/count-up";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WobbleCard } from "@/components/ui/wobble-card";
import { useRiskSummary } from "@/lib/api/risk";
import { useMode } from "@/lib/store/mode-context";
import type { RiskSummary } from "@/types/risk";

interface VaRCardsProps {
  portfolioId: string;
}

export function VaRCards({ portfolioId }: VaRCardsProps) {
  const [method, setMethod] = useState<"historical" | "parametric">(
    "historical",
  );
  const { mode } = useMode();
  const riskSummary = useRiskSummary();
  const [data, setData] = useState<RiskSummary | null>(null);

  useEffect(() => {
    riskSummary.mutate(
      { portfolio_id: portfolioId },
      { onSuccess: (result) => setData(result) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId]);

  const isLoading = riskSummary.isPending && !data;

  const kpis = data
    ? [
        {
          key: "var_95",
          title: "VaR 95%",
          value:
            method === "historical"
              ? data.var_95_historical
              : data.var_95_parametric,
          color: "text-amber-500",
          bgColor: "bg-card",
          visible: true,
        },
        {
          key: "var_99",
          title: "VaR 99%",
          value:
            method === "historical"
              ? data.var_99_historical
              : data.var_99_parametric,
          color: "text-red-500",
          bgColor: "bg-card",
          visible: mode === "expert",
        },
        {
          key: "cvar",
          title: "CVaR 95%",
          value: data.cvar_95,
          color: "text-orange-500",
          bgColor: "bg-card",
          visible: true,
        },
        {
          key: "cvar",
          title: "CVaR 99%",
          value: data.cvar_99,
          color: "text-red-600",
          bgColor: "bg-card",
          visible: mode === "expert",
        },
      ].filter((k) => k.visible)
    : [];

  const metrics = data
    ? [
        {
          key: "return",
          title: "Ann. Return",
          value: data.annualized_return,
          isPercent: true,
          color:
            data.annualized_return >= 0 ? "text-emerald-500" : "text-red-500",
        },
        {
          key: "volatility",
          title: "Ann. Volatility",
          value: data.annualized_volatility,
          isPercent: true,
          color: "text-blue-400",
        },
        {
          key: "sharpe",
          title: "Sharpe Ratio",
          value: data.sharpe_ratio,
          isPercent: false,
          color:
            data.sharpe_ratio >= 0 ? "text-emerald-500" : "text-red-500",
        },
        ...(mode === "expert"
          ? [
              {
                key: "observations",
                title: "Observations",
                value: data.n_observations,
                isPercent: false,
                color: "text-muted-foreground",
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Method toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Method:</span>
        <div className="flex rounded-md border">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              method === "historical"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setMethod("historical")}
          >
            Historical
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              method === "parametric"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setMethod("parametric")}
          >
            Parametric
          </button>
        </div>
        {data?.from_cache && (
          <span className="text-xs text-muted-foreground">(cached)</span>
        )}
      </div>

      {/* VaR / CVaR KPI cards with WobbleCard */}
      <div className={`grid gap-4 ${kpis.length <= 2 ? "md:grid-cols-2" : "md:grid-cols-4"}`}>
        {isLoading
          ? Array.from({ length: mode === "expert" ? 4 : 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-16" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          : kpis.map((kpi) => (
              <WobbleCard
                key={kpi.title}
                containerClassName={kpi.bgColor}
                className="p-4 !py-4"
              >
                <MetricTooltip metricKey={kpi.key} label={kpi.title}>
                  <p className={`text-2xl font-mono font-bold ${kpi.color}`}>
                    <CountUp
                      to={kpi.value * 100}
                      duration={1200}
                      suffix="%"
                    />
                  </p>
                </MetricTooltip>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily 1-day {method}
                </p>
              </WobbleCard>
            ))}
      </div>

      {/* Extra metrics */}
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.title}>
              <CardHeader className="pb-2">
                <MetricTooltip metricKey={m.key} label={m.title}>
                  <p className={`text-xl font-mono font-bold ${m.color}`}>
                    {m.isPercent ? (
                      <CountUp
                        to={m.value * 100}
                        duration={1200}
                        suffix="%"
                      />
                    ) : (
                      <CountUp
                        to={m.value}
                        duration={1200}
                        decimals={m.key === "sharpe" ? 3 : 0}
                      />
                    )}
                  </p>
                </MetricTooltip>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {riskSummary.isError && (
        <p className="text-sm text-destructive">
          Failed to compute risk metrics. Please try again.
        </p>
      )}
    </div>
  );
}
