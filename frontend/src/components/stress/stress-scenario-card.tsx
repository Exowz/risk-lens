"use client";

/**
 * Stress test scenario result card using KpiExpandableCard per metric.
 *
 * Each metric shows AI explanation via Mistral on click.
 * Wrapped in WobbleCard for visual container.
 *
 * Depends on: types/stress.ts, shared/kpi-expandable-card, ui/wobble-card
 * Used by: app/(dashboard)/stress/page.tsx
 */

import { useCallback } from "react";
import { useTranslations } from "next-intl";

import { KpiExpandableCard } from "@/components/shared/kpi-expandable-card";
import { fetchMetricExplanation } from "@/lib/api/explain";
import { useMode } from "@/lib/store/mode-context";
import type { ScenarioResult } from "@/types/stress";

interface StressScenarioCardProps {
  scenario: ScenarioResult;
  portfolioId: string;
  openCard: string | null;
  onOpenCard: (id: string | null) => void;
}

export function StressScenarioCard({
  scenario,
  portfolioId,
  openCard,
  onOpenCard,
}: StressScenarioCardProps) {
  const { mode } = useMode();
  const t = useTranslations();
  const prefix = scenario.scenario_name.replace(/\s+/g, "-").toLowerCase();

  const mkAnalyze = useCallback(
    (metricName: string, metricValue: number, context?: Record<string, number | string | null>) =>
      () =>
        fetchMetricExplanation({
          metric_name: metricName,
          metric_value: metricValue,
          portfolio_id: portfolioId,
          mode,
          context: { scenario: scenario.scenario_name, ...context },
        }),
    [portfolioId, mode, scenario.scenario_name],
  );

  const toggle = (key: string) =>
    onOpenCard(openCard === key ? null : key);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3">
        <p className="text-base font-medium text-foreground">
          {scenario.scenario_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {scenario.start_date} — {scenario.end_date}
        </p>
      </div>

      <div className="space-y-2">
        <KpiExpandableCard
          label={t(`metrics.${mode}.total_return`)}
          value={scenario.total_return * 100}
          valuePrefix={scenario.total_return >= 0 ? "+" : ""}
          valueSuffix="%"
          valueColor={scenario.total_return >= 0 ? "emerald" : "red"}
          metricKey={`${prefix}-return`}
          onAnalyze={mkAnalyze("total_return", scenario.total_return, {
            max_drawdown: scenario.max_drawdown,
            recovery_days: scenario.recovery_days,
          })}
          isOpen={openCard === `${prefix}-return`}
          onToggle={() => toggle(`${prefix}-return`)}
        />

        <KpiExpandableCard
          label={t(`metrics.${mode}.max_drawdown`)}
          value={scenario.max_drawdown * 100}
          valueSuffix="%"
          valueColor="red"
          metricKey={`${prefix}-drawdown`}
          onAnalyze={mkAnalyze("max_drawdown", scenario.max_drawdown, {
            total_return: scenario.total_return,
            recovery_days: scenario.recovery_days,
          })}
          isOpen={openCard === `${prefix}-drawdown`}
          onToggle={() => toggle(`${prefix}-drawdown`)}
        />

        {(mode === "expert" || scenario.recovery_days !== null) && (
          <KpiExpandableCard
            label={t(`metrics.${mode}.recovery_days`)}
            value={scenario.recovery_days ?? 0}
            decimals={0}
            valueSuffix={scenario.recovery_days !== null
              ? t('stress.days_suffix')
              : undefined}
            valueColor="foreground"
            metricKey={`${prefix}-recovery`}
            onAnalyze={mkAnalyze("recovery_days", scenario.recovery_days ?? -1, {
              max_drawdown: scenario.max_drawdown,
              total_return: scenario.total_return,
            })}
            isOpen={openCard === `${prefix}-recovery`}
            onToggle={() => toggle(`${prefix}-recovery`)}
          />
        )}
      </div>
    </div>
  );
}
