"use client";

/**
 * Portfolio selector dropdown.
 *
 * Lists all saved portfolios and allows selection.
 * Syncs with Zustand portfolio-store for active portfolio state.
 *
 * Depends on: lib/api/portfolios.ts, lib/store/portfolio-store.ts, shadcn/ui
 * Used by: app/(dashboard)/portfolio/page.tsx
 */

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeletePortfolio, usePortfolios } from "@/lib/api/portfolios";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export function PortfolioSelector() {
  const { data: portfolios, isLoading, isError } = usePortfolios();
  const { activePortfolioId, setActivePortfolio } = usePortfolioStore();
  const deleteMutation = useDeletePortfolio();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Portfolios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Portfolios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load portfolios.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Portfolios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No portfolios yet. Create one to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  function handleDelete(id: string) {
    if (activePortfolioId === id) {
      setActivePortfolio(null);
    }
    deleteMutation.mutate(id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Portfolios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {portfolios.map((portfolio) => {
          const isActive = activePortfolioId === portfolio.id;
          return (
            <div
              key={portfolio.id}
              className={`flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-muted/50"
              }`}
              onClick={() => setActivePortfolio(portfolio.id)}
            >
              <div>
                <p className="text-sm font-medium">{portfolio.name}</p>
                <p className="text-xs text-muted-foreground">
                  {portfolio.asset_count} asset{portfolio.asset_count !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(portfolio.id);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="size-3 text-muted-foreground" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
