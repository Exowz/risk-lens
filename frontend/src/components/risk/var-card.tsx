"use client";

/**
 * VaR and CVaR KPI display using KpiExpandableCard.
 *
 * Each metric is a card with always-visible label + value.
 * Clicking triggers Mistral AI explanation.
 *
 * Depends on: lib/api/risk.ts, lib/api/explain.ts, types/risk.ts
 * Used by: app/(dashboard)/risk/page.tsx
 */

import { useCallback, useEffect, useState } from "react";

import { KpiExpandableCard } from "@/components/shared/kpi-expandable-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMetricExplanation } from "@/lib/api/explain";
import { useRiskSummary } from "@/lib/api/risk";
import { useMode } from "@/lib/store/mode-context";
import type { RiskSummary } from "@/types/risk";

interface VaRCardsProps {
  portfolioId: string;
  openCard: string | null;
  onOpenCard: (id: string | null) => void;
}

export function VaRCards({ portfolioId, openCard, onOpenCard }: VaRCardsProps) {
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

  const mkAnalyze = useCallback(
    (metricName: string, metricValue: number, context?: Record<string, number | string | null>) =>
      () =>
        fetchMetricExplanation({
          metric_name: metricName,
          metric_value: metricValue,
          portfolio_id: portfolioId,
          mode,
          context,
        }),
    [portfolioId, mode],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const var95 =
    method === "historical"
      ? data.var_95_historical
      : data.var_95_parametric;
  const var99 =
    method === "historical"
      ? data.var_99_historical
      : data.var_99_parametric;

  const toggle = (key: string) =>
    onOpenCard(openCard === key ? null : key);

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
        {data.from_cache && (
          <span className="text-xs text-muted-foreground">(cached)</span>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiExpandableCard
          label={mode === "beginner" ? "Perte max probable (VaR 95%)" : "VaR 95%"}
          value={var95 * 100}
          valueSuffix="%"
          valueColor="amber"
          metricKey="var95"
          onAnalyze={mkAnalyze("var_95", var95, { method, confidence: 0.95 })}
          isOpen={openCard === "var95"}
          onToggle={() => toggle("var95")}
        />

        {mode === "expert" && (
          <KpiExpandableCard
            label="VaR 99%"
            value={var99 * 100}
            valueSuffix="%"
            valueColor="red"
            metricKey="var99"
            onAnalyze={mkAnalyze("var_99", var99, { method, confidence: 0.99 })}
            isOpen={openCard === "var99"}
            onToggle={() => toggle("var99")}
          />
        )}

        <KpiExpandableCard
          label={mode === "beginner" ? "Perte moyenne extrême (CVaR 95%)" : "CVaR 95%"}
          value={data.cvar_95 * 100}
          valueSuffix="%"
          valueColor="orange"
          metricKey="cvar95"
          onAnalyze={mkAnalyze("cvar_95", data.cvar_95, { var_95: var95 })}
          isOpen={openCard === "cvar95"}
          onToggle={() => toggle("cvar95")}
        />

        {mode === "expert" && (
          <KpiExpandableCard
            label="CVaR 99%"
            value={data.cvar_99 * 100}
            valueSuffix="%"
            valueColor="red"
            metricKey="cvar99"
            onAnalyze={mkAnalyze("cvar_99", data.cvar_99, { var_99: var99 })}
            isOpen={openCard === "cvar99"}
            onToggle={() => toggle("cvar99")}
          />
        )}

        <KpiExpandableCard
          label={mode === "beginner" ? "Rendement annuel" : "Ann. Return"}
          value={data.annualized_return * 100}
          valuePrefix={data.annualized_return >= 0 ? "+" : ""}
          valueSuffix="%"
          valueColor={data.annualized_return >= 0 ? "emerald" : "red"}
          metricKey="ann-return"
          onAnalyze={mkAnalyze("annualized_return", data.annualized_return, {
            volatility: data.annualized_volatility,
            sharpe: data.sharpe_ratio,
          })}
          isOpen={openCard === "ann-return"}
          onToggle={() => toggle("ann-return")}
        />

        <KpiExpandableCard
          label={mode === "beginner" ? "Agitation du portefeuille" : "Ann. Volatility"}
          value={data.annualized_volatility * 100}
          valueSuffix="%"
          valueColor="blue"
          metricKey="ann-vol"
          onAnalyze={mkAnalyze("annualized_volatility", data.annualized_volatility, {
            return_: data.annualized_return,
            sharpe: data.sharpe_ratio,
          })}
          isOpen={openCard === "ann-vol"}
          onToggle={() => toggle("ann-vol")}
        />

        <KpiExpandableCard
          label={mode === "beginner" ? "Score rendement/risque" : "Sharpe Ratio"}
          value={data.sharpe_ratio}
          decimals={3}
          valueColor={data.sharpe_ratio >= 0 ? "emerald" : "red"}
          metricKey="sharpe"
          onAnalyze={mkAnalyze("sharpe_ratio", data.sharpe_ratio, {
            return_: data.annualized_return,
            volatility: data.annualized_volatility,
          })}
          isOpen={openCard === "sharpe"}
          onToggle={() => toggle("sharpe")}
        />

        {mode === "expert" && (
          <KpiExpandableCard
            label="Observations"
            value={data.n_observations}
            decimals={0}
            valueColor="foreground"
            metricKey="observations"
            onAnalyze={mkAnalyze("n_observations", data.n_observations)}
            isOpen={openCard === "observations"}
            onToggle={() => toggle("observations")}
          />
        )}
      </div>

      {riskSummary.isError && (
        <p className="text-sm text-destructive">
          Failed to compute risk metrics. Please try again.
        </p>
      )}
    </div>
  );
}
