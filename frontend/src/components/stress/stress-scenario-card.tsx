"use client";

/**
 * Stress test scenario result card with WobbleCard + ExpandableMetric.
 *
 * Each metric row is expandable with mode-aware explanations.
 *
 * Depends on: types/stress.ts, Aceternity WobbleCard, ReactBits CountUp
 * Used by: app/(dashboard)/stress/page.tsx
 */

import { ExpandableMetric } from "@/components/shared/expandable-metric";
import { CountUp } from "@/components/ui/count-up";
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

      <ExpandableMetric
        labelBeginner="Rendement total"
        labelExpert="Total Return"
        value={
          <span
            className={`font-mono ${
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
        }
        explanationBeginner="Ce que vous auriez gagné ou perdu sur l'ensemble de la période de crise si vous aviez gardé ce portefeuille."
        explanationExpert="Rendement cumulé total sur la fenêtre de stress = (Prix_final / Prix_initial) - 1."
      />

      <ExpandableMetric
        labelBeginner="Pire chute"
        labelExpert="Max Drawdown"
        value={
          <span className="font-mono text-red-500">
            <CountUp
              to={scenario.max_drawdown * 100}
              duration={1200}
              suffix="%"
            />
          </span>
        }
        explanationBeginner="La pire chute subie pendant cette crise, depuis le point le plus haut jusqu'au point le plus bas."
        explanationExpert="Drawdown maximal intra-crise sur la fenêtre temporelle du scénario de stress."
      />

      {(mode === "expert" || scenario.recovery_days !== null) && (
        <ExpandableMetric
          labelBeginner="Temps de récupération"
          labelExpert="Recovery Days"
          value={
            <span className="font-mono text-foreground">
              {scenario.recovery_days !== null ? (
                <>
                  <CountUp
                    to={scenario.recovery_days}
                    duration={1200}
                    decimals={0}
                  />{" "}
                  {mode === "beginner" ? "jours" : "days"}
                </>
              ) : (
                mode === "beginner" ? "Non récupéré" : "Not recovered"
              )}
            </span>
          }
          explanationBeginner="Combien de jours il aurait fallu pour retrouver votre niveau d'avant la crise. 'Non récupéré' signifie que le portefeuille n'a pas retrouvé son niveau sur la période."
          explanationExpert="Nombre de jours de trading entre le creux maximal et le retour au niveau pré-crise. Null si non récupéré dans la fenêtre d'analyse."
        />
      )}
    </WobbleCard>
  );
}
