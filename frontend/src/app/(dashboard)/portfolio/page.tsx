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

import { PerformanceChart } from "@/components/charts/performance-chart";
import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { PortfolioSelector } from "@/components/portfolio/portfolio-selector";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, usePortfolioPrices } from "@/lib/api/portfolios";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export default function PortfolioPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { data: portfolio, isLoading: portfolioLoading } =
    usePortfolio(activePortfolioId);
  const { data: prices, isLoading: pricesLoading } =
    usePortfolioPrices(activePortfolioId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
        <p className="text-muted-foreground">
          Manage your portfolio composition and view historical performance
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main content area */}
        <div className="space-y-6">
          {/* Portfolio details + table */}
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
                <CardTitle>No Portfolio Selected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Select a portfolio from the sidebar or create a new one.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Performance chart */}
          <PerformanceChart data={prices} isLoading={pricesLoading} />
        </div>

        {/* Right sidebar: selector + form */}
        <div className="space-y-6">
          <PortfolioSelector />
          <PortfolioForm />
        </div>
      </div>
    </div>
  );
}
