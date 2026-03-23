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

          <WhyCard
            beginnerContent={
              <>
                <p className="mb-2">
                  La <strong>VaR</strong> vous dit combien vous pourriez perdre en un jour dans le pire
                  des cas « normal ». C&apos;est comme une limite de vitesse pour votre risque.
                </p>
                <p className="mb-2">
                  Le <strong>CVaR</strong> regarde ce qui se passe quand les choses tournent vraiment
                  mal — la perte moyenne dans les pires scénarios.
                </p>
                <p>
                  <strong>Monte Carlo</strong> simule des milliers de futurs possibles pour voir
                  comment votre portefeuille pourrait évoluer sur un an.
                </p>
              </>
            }
            expertContent={
              <>
                <p className="mb-2">
                  <strong>Value at Risk (VaR)</strong> quantifies the maximum expected loss at a given
                  confidence level. It is the standard risk measure used by financial institutions for
                  trading limits and capital reserve calculations.
                </p>
                <p className="mb-2">
                  <strong>CVaR (Expected Shortfall)</strong> measures the mean loss beyond the VaR
                  threshold — a coherent risk measure that captures tail risk better than VaR alone.
                </p>
                <p>
                  <strong>Monte Carlo (GBM)</strong> simulates thousands of portfolio trajectories
                  using Geometric Brownian Motion to estimate the full return distribution, not just
                  tail percentiles.
                </p>
              </>
            }
          />
        </>
      )}
    </div>
  );
}
