"use client";

/**
 * Risk analysis page.
 *
 * Assembles: VaRCards, MonteCarloPanel, WhyExpandableCard.
 * Single openCard state for one-at-a-time expandable cards.
 *
 * Depends on: components/risk/*, components/shared/why-expandable-card
 * Used by: /risk route
 */

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { MonteCarloPanel } from "@/components/risk/monte-carlo-panel";
import { Simulator } from "@/components/risk/simulator";
import { VaRCards } from "@/components/risk/var-card";
import { WhyExpandableCard } from "@/components/shared/why-expandable-card";
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
  const [openCard, setOpenCard] = useState<string | null>(null);
  const t = useTranslations();

  return (
    <div className="p-6 space-y-6">
      {!activePortfolioId ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t('common.no_portfolio')}</CardTitle>
            <CardDescription>
              {t('common.no_portfolio_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>{t('common.go_to_portfolio')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <VaRCards
            portfolioId={activePortfolioId}
            openCard={openCard}
            onOpenCard={setOpenCard}
          />

          <MonteCarloPanel
            portfolioId={activePortfolioId}
            openCard={openCard}
            onOpenCard={setOpenCard}
          />

          <Simulator portfolioId={activePortfolioId} />

          <WhyExpandableCard
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
