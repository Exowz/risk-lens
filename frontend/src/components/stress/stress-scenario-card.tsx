"use client";

/**
 * Stress test scenario result card with WobbleCard + CountUp.
 *
 * In beginner mode: shows only total_return and max_drawdown.
 * In expert mode: shows all metrics including recovery days.
 *
 * Depends on: types/stress.ts, Aceternity WobbleCard, ReactBits CountUp
 * Used by: app/(dashboard)/stress/page.tsx
 */

import { CountUp } from "@/components/ui/count-up";
import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { WobbleCard } from "@/components/ui/wobble-card";
import { useMode } from "@/lib/store/mode-context";
import type { ScenarioResult } from "@/types/stress";

interface StressScenarioCardProps {
  scenario: ScenarioResult;
}

export function StressScenarioCard({ scenario }: StressScenarioCardProps) {
  const { mode } = useMode();

  return (
    <WobbleCard containerClassName="bg-card" className="p-4 !py-4">
      <div className="mb-2">
        <p className="text-base font-medium text-foreground">
          {scenario.scenario_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {scenario.start_date} — {scenario.end_date}
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {mode === "beginner" ? "Rendement total" : "Total Return"}
          </span>
          <span
            className={`text-sm font-mono font-semibold ${
              scenario.total_return >= 0
                ? "text-emerald-500"
                : "text-red-500"
            }`}
          >
            <CountUp
              to={scenario.total_return * 100}
              duration={1200}
              suffix="%"
              prefix={scenario.total_return >= 0 ? "+" : ""}
            />
          </span>
        </div>

        <div className="flex items-center justify-between">
          <MetricTooltip metricKey="drawdown" label="Max Drawdown">
            <span className="text-sm font-mono font-semibold text-red-500">
              <CountUp
                to={scenario.max_drawdown * 100}
                duration={1200}
                suffix="%"
              />
            </span>
          </MetricTooltip>
        </div>

        {mode === "expert" && (
          <div className="flex items-center justify-between">
            <MetricTooltip metricKey="recovery" label="Recovery">
              <span className="text-sm font-mono font-semibold">
                {scenario.recovery_days !== null ? (
                  <>
                    <CountUp
                      to={scenario.recovery_days}
                      duration={1200}
                      decimals={0}
                    />{" "}
                    days
                  </>
                ) : (
                  "Not recovered"
                )}
              </span>
            </MetricTooltip>
          </div>
        )}
      </div>
    </WobbleCard>
  );
}
