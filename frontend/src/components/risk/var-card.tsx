"use client";

/**
 * VaR and CVaR KPI display with ExpandableMetric rows.
 *
 * Shows VaR 95%, VaR 99%, CVaR 95%, CVaR 99% with method toggle
 * (historical vs parametric). Each metric has an expandable explanation.
 *
 * Depends on: lib/api/risk.ts, types/risk.ts, shadcn/ui
 * Used by: app/(dashboard)/risk/page.tsx
 */

import { useEffect, useState } from "react";

import { ExpandableMetric } from "@/components/shared/expandable-metric";
import { CountUp } from "@/components/ui/count-up";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
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

      <Card>
        <CardContent className="pt-6">
          <ExpandableMetric
            labelBeginner="Perte max probable (VaR 95%)"
            labelExpert="VaR 95%"
            value={
              <span className="font-mono text-amber-500">
                <CountUp to={var95 * 100} duration={1200} suffix="%" />
              </span>
            }
            explanationBeginner="Sur 20 jours de trading, vous perdrez plus que ce montant une seule fois. C'est votre perte journalière maximale probable dans des conditions normales."
            explanationExpert="Value at Risk à 95% de confiance -- quantile empirique de la distribution des rendements historiques journaliers."
          />

          {mode === "expert" && (
            <ExpandableMetric
              labelBeginner="VaR 99%"
              labelExpert="VaR 99%"
              value={
                <span className="font-mono text-red-500">
                  <CountUp to={var99 * 100} duration={1200} suffix="%" />
                </span>
              }
              explanationBeginner="La perte que vous ne dépasserez que 1 jour sur 100."
              explanationExpert="VaR au 99e percentile -- quantile extrême, utilisé pour les stress réglementaires (Bâle)."
            />
          )}

          <ExpandableMetric
            labelBeginner="Perte moyenne extrême (CVaR 95%)"
            labelExpert="CVaR 95%"
            value={
              <span className="font-mono text-orange-500">
                <CountUp to={data.cvar_95 * 100} duration={1200} suffix="%" />
              </span>
            }
            explanationBeginner="Quand les choses tournent vraiment mal (les 5% pires jours), voici la perte moyenne à laquelle vous vous exposez."
            explanationExpert="Expected Shortfall -- moyenne des pertes au-delà du quantile VaR 95%. Mesure cohérente du risque de queue."
          />

          {mode === "expert" && (
            <ExpandableMetric
              labelBeginner="CVaR 99%"
              labelExpert="CVaR 99%"
              value={
                <span className="font-mono text-red-600">
                  <CountUp to={data.cvar_99 * 100} duration={1200} suffix="%" />
                </span>
              }
              explanationBeginner="La perte moyenne lors des 1% pires journées."
              explanationExpert="Expected Shortfall au 99e percentile -- mesure des pertes extrêmes dans la queue gauche."
            />
          )}

          <ExpandableMetric
            labelBeginner="Rendement annuel"
            labelExpert="Ann. Return"
            value={
              <span className={`font-mono ${data.annualized_return >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {data.annualized_return >= 0 ? "+" : ""}
                <CountUp to={data.annualized_return * 100} duration={1200} suffix="%" />
              </span>
            }
            explanationBeginner="Le rendement moyen de votre portefeuille ramené sur une année complète."
            explanationExpert="Rendement annualisé = moyenne géométrique des rendements journaliers × 252 jours."
          />

          <ExpandableMetric
            labelBeginner="Agitation du portefeuille"
            labelExpert="Ann. Volatility"
            value={
              <span className="font-mono text-blue-400">
                <CountUp to={data.annualized_volatility * 100} duration={1200} suffix="%" />
              </span>
            }
            explanationBeginner="Mesure l'agitation de votre portefeuille. Plus ce chiffre est haut, plus les variations quotidiennes sont importantes et imprévisibles."
            explanationExpert="Volatilité annualisée = σ_journalière × √252. Écart-type des rendements logarithmiques journaliers."
          />

          <ExpandableMetric
            labelBeginner="Score rendement/risque"
            labelExpert="Sharpe Ratio"
            value={
              <span className={`font-mono ${data.sharpe_ratio >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                <CountUp to={data.sharpe_ratio} duration={1200} decimals={3} />
              </span>
            }
            explanationBeginner="Ce score mesure si le jeu en vaut la chandelle. En dessous de 1 = risque élevé pour le rendement obtenu. Au-dessus de 1 = bon équilibre."
            explanationExpert="Ratio de Sharpe annualisé = (Rp - Rf) / σp. Rendement excédentaire par unité de volatilité totale."
          />

          {mode === "expert" && (
            <ExpandableMetric
              labelBeginner="Observations"
              labelExpert="Observations"
              value={
                <span className="font-mono text-muted-foreground">
                  <CountUp to={data.n_observations} duration={1200} decimals={0} />
                </span>
              }
              explanationBeginner="Nombre de jours de données utilisés pour le calcul."
              explanationExpert="Nombre d'observations de rendements journaliers dans l'échantillon historique."
            />
          )}
        </CardContent>
      </Card>

      {riskSummary.isError && (
        <p className="text-sm text-destructive">
          Failed to compute risk metrics. Please try again.
        </p>
      )}
    </div>
  );
}
