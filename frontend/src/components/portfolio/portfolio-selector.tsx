"use client";

/**
 * Portfolio selector with Focus Card effect.
 *
 * Lists all saved portfolios. On hover, non-hovered cards blur.
 * Syncs with Zustand portfolio-store for active portfolio state.
 *
 * Depends on: lib/api/portfolios.ts, lib/store/portfolio-store.ts, shadcn/ui
 * Used by: app/(dashboard)/portfolio/page.tsx
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDeletePortfolio, usePortfolios } from "@/lib/api/portfolios";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export function PortfolioSelector() {
  const { data: portfolios, isLoading, isError } = usePortfolios();
  const { activePortfolioId, setActivePortfolio } = usePortfolioStore();
  const deleteMutation = useDeletePortfolio();
  const [hovered, setHovered] = useState<string | null>(null);

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
              onMouseEnter={() => setHovered(portfolio.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all duration-300 ease-out",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-white/20",
                hovered !== null &&
                  hovered !== portfolio.id &&
                  "blur-[1px] scale-[0.98] opacity-60",
              )}
              onClick={() => setActivePortfolio(portfolio.id)}
            >
              <div>
                <p className="text-sm font-medium">{portfolio.name}</p>
                <p className="text-xs text-muted-foreground">
                  {portfolio.asset_count} actif{portfolio.asset_count !== 1 ? "s" : ""}
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
