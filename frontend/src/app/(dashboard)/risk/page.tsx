"use client";

/**
 * Risk analysis page.
 *
 * Assembles: VaRCards, MonteCarloPanel.
 * Requires an active portfolio selection from Zustand store.
 *
 * Depends on: components/risk/*, lib/store/portfolio-store.ts
 * Used by: /risk route
 */

import Link from "next/link";

import { MonteCarloPanel } from "@/components/risk/monte-carlo-panel";
import { VaRCards } from "@/components/risk/var-card";
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
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export default function RiskPage() {
  const { activePortfolioId } = usePortfolioStore();

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-3">
        <BlurText
          text="Risk Analysis"
          className="text-3xl font-bold tracking-tight"
        />
        <p className="text-muted-foreground">
          Value at Risk, CVaR, and Monte Carlo simulation
        </p>
      </div>

      {!activePortfolioId ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No Portfolio Selected</CardTitle>
            <CardDescription>
              Create or select a portfolio to compute VaR, CVaR, and run Monte
              Carlo simulations on your holdings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>Go to Portfolios</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* VaR & CVaR KPI cards + summary metrics */}
          <VaRCards portfolioId={activePortfolioId} />

          {/* Monte Carlo simulation */}
          <MonteCarloPanel portfolioId={activePortfolioId} />

          <WhyCard>
            <p className="mb-2">
              <strong>Value at Risk (VaR)</strong> quantifie la perte maximale attendue sur un jour
              à un niveau de confiance donné. C'est l'indicateur de risque le plus utilisé par les
              institutions financières pour fixer des limites de trading et calculer les réserves de capital.
            </p>
            <p className="mb-2">
              <strong>CVaR (Expected Shortfall)</strong> va plus loin en mesurant la perte moyenne
              dans les pires scénarios — ceux au-delà de la VaR. C'est une mesure plus conservatrice
              qui capture le risque de queue de distribution.
            </p>
            <p>
              <strong>Monte Carlo</strong> simule des milliers de trajectoires possibles pour votre
              portefeuille afin d'estimer la distribution complète des rendements futurs, pas
              seulement les cas extrêmes.
            </p>
          </WhyCard>
        </>
      )}
    </div>
  );
}
