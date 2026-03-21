"use client";

/**
 * Portfolio assets table displaying tickers and weights.
 *
 * Depends on: shadcn/ui (Table, Badge)
 * Used by: app/(dashboard)/portfolio/page.tsx
 */

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssetResponse } from "@/types/portfolio";

interface PortfolioTableProps {
  assets: AssetResponse[];
}

export function PortfolioTable({ assets }: PortfolioTableProps) {
  if (assets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No assets in this portfolio.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead className="text-right">Weight</TableHead>
          <TableHead className="text-right">Allocation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell>
              <Badge variant="secondary" className="font-mono">
                {asset.ticker}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
              {(asset.weight * 100).toFixed(1)}%
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${asset.weight * 100}%` }}
                  />
                </div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
