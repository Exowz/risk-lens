"use client";

/**
 * Portfolio management page.
 *
 * Assembles: PortfolioForm, PortfolioSelector, PortfolioTable, PerformanceChart.
 * Uses Zustand store for active portfolio selection and TanStack Query for data.
 *
 * Depends on: all portfolio components, lib/api/portfolios.ts, lib/store/portfolio-store.ts
 * Used by: /dashboard/portfolio route
 */

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { PerformanceChart } from "@/components/charts/performance-chart";
import { PortfolioComparison } from "@/components/portfolio/portfolio-comparison";
import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { PortfolioSelector } from "@/components/portfolio/portfolio-selector";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, usePortfolioPrices } from "@/lib/api/portfolios";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export default function PortfolioPage() {
  const { activePortfolioId } = usePortfolioStore();
  const [compareMode, setCompareMode] = useState(false);
  const searchParams = useSearchParams();
  const t = useTranslations();

  // Parse pre-fill params from Risk Profiler redirect
  const prefillData = useMemo(() => {
    if (searchParams.get("prefill") !== "true") return null;

    const name = searchParams.get("name") ?? "";
    const assetsParam = searchParams.get("assets") ?? "";
    const assets = assetsParam
      .split(",")
      .map((a) => {
        const [ticker, weightStr] = a.split(":");
        const weight = parseFloat(weightStr);
        if (!ticker || isNaN(weight)) return null;
        return { ticker, weight };
      })
      .filter(Boolean) as { ticker: string; weight: number }[];

    return assets.length > 0 ? { name, assets } : null;
  }, [searchParams]);
  const { data: portfolio, isLoading: portfolioLoading } =
    usePortfolio(activePortfolioId);
  const { data: prices, isLoading: pricesLoading } =
    usePortfolioPrices(activePortfolioId);

  return (
    <div className="p-6 space-y-6">
      {/* Compare toggle */}
      <div className="flex justify-end">
        <Button
          variant={compareMode ? "default" : "outline"}
          size="sm"
          onClick={() => setCompareMode(!compareMode)}
        >
          {compareMode ? t('portfolio.exit_compare') : t('portfolio.compare')}
        </Button>
      </div>

      {compareMode ? (
        <PortfolioComparison />
      ) : (
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main content area */}
        <div className="space-y-6">
          {activePortfolioId ? (
            portfolioLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ) : portfolio ? (
              <Card>
                <CardHeader>
                  <CardTitle>{portfolio.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PortfolioTable assets={portfolio.assets} />
                </CardContent>
              </Card>
            ) : null
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('common.no_portfolio')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('common.no_portfolio_desc')}
                </p>
              </CardContent>
            </Card>
          )}

          <PerformanceChart data={prices} isLoading={pricesLoading} />
        </div>

        {/* Right sidebar: selector + form */}
        <div className="space-y-6">
          <PortfolioSelector />
          <PortfolioForm
            initialName={prefillData?.name}
            initialAssets={prefillData?.assets}
          />
        </div>
      </div>
      )}
    </div>
  );
}
