"use client";

/**
 * Portfolio comparison mode — side-by-side metrics and performance chart.
 *
 * Compares two portfolios: risk metrics (VaR, CVaR, Sharpe, return, volatility)
 * and overlaid historical performance chart.
 *
 * Depends on: shadcn Select/Card, recharts, lib/api/portfolios.ts,
 *             lib/api/risk.ts, types/portfolio.ts, types/risk.ts
 * Used by: app/(dashboard)/portfolio/page.tsx
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePortfolios,
  usePortfolioPrices,
} from "@/lib/api/portfolios";
import { useRiskSummary } from "@/lib/api/risk";
import type { RiskSummary } from "@/types/risk";
import type { NormalizedPrices } from "@/types/portfolio";

interface MetricRow {
  label: string;
  a: number;
  b: number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}
function formatRatio(v: number): string {
  return v.toFixed(4);
}

function buildOverlayData(
  pricesA: NormalizedPrices | undefined,
  pricesB: NormalizedPrices | undefined,
  nameA: string,
  nameB: string,
) {
  if (!pricesA || !pricesB) return [];

  // Get the "portfolio" line — average of all tickers (already normalized to 100)
  const avgLine = (prices: NormalizedPrices) => {
    const tickers = Object.keys(prices);
    if (tickers.length === 0) return [];
    const base = prices[tickers[0]];
    return base.map((pt, i) => {
      const sum = tickers.reduce(
        (s, t) => s + (prices[t]?.[i]?.value ?? 0),
        0,
      );
      return { date: pt.date, value: sum / tickers.length };
    });
  };

  const lineA = avgLine(pricesA);
  const lineB = avgLine(pricesB);

  // Merge by date
  const mapB = new Map(lineB.map((p) => [p.date, p.value]));
  return lineA
    .filter((p) => mapB.has(p.date))
    .map((p) => ({
      date: p.date,
      [nameA]: p.value,
      [nameB]: mapB.get(p.date)!,
    }));
}

export function PortfolioComparison() {
  const t = useTranslations();
  const { data: portfolios } = usePortfolios();
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);
  const [summaryA, setSummaryA] = useState<RiskSummary | null>(null);
  const [summaryB, setSummaryB] = useState<RiskSummary | null>(null);

  const riskA = useRiskSummary();
  const riskB = useRiskSummary();
  const { data: pricesA, isLoading: pricesALoading } = usePortfolioPrices(idA);
  const { data: pricesB, isLoading: pricesBLoading } = usePortfolioPrices(idB);

  const portfolioA = portfolios?.find((p) => p.id === idA);
  const portfolioB = portfolios?.find((p) => p.id === idB);

  useEffect(() => {
    if (idA) {
      riskA.mutate(
        { portfolio_id: idA },
        { onSuccess: (d) => setSummaryA(d) },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idA]);

  useEffect(() => {
    if (idB) {
      riskB.mutate(
        { portfolio_id: idB },
        { onSuccess: (d) => setSummaryB(d) },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idB]);

  if (!portfolios || portfolios.length < 2) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            {t('portfolio.empty_state_desc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics: MetricRow[] =
    summaryA && summaryB
      ? [
          {
            label: t('metrics.expert.var_95'),
            a: summaryA.var_95_historical,
            b: summaryB.var_95_historical,
            format: formatPct,
            higherIsBetter: false,
          },
          {
            label: t('metrics.expert.cvar_95'),
            a: summaryA.cvar_95,
            b: summaryB.cvar_95,
            format: formatPct,
            higherIsBetter: false,
          },
          {
            label: t('metrics.expert.sharpe'),
            a: summaryA.sharpe_ratio,
            b: summaryB.sharpe_ratio,
            format: formatRatio,
            higherIsBetter: true,
          },
          {
            label: t('metrics.expert.annual_return'),
            a: summaryA.annualized_return,
            b: summaryB.annualized_return,
            format: formatPct,
            higherIsBetter: true,
          },
          {
            label: t('metrics.expert.volatility'),
            a: summaryA.annualized_volatility,
            b: summaryB.annualized_volatility,
            format: formatPct,
            higherIsBetter: false,
          },
        ]
      : [];

  const nameA = portfolioA?.name ?? t('portfolio.portfolio_a');
  const nameB = portfolioB?.name ?? t('portfolio.portfolio_b');
  const chartData = buildOverlayData(pricesA, pricesB, nameA, nameB);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            {t('portfolio.portfolio_a')}
          </label>
          <Select value={idA ?? ""} onValueChange={setIdA}>
            <SelectTrigger>
              <SelectValue placeholder={t('portfolio.select_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id} disabled={p.id === idB}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            {t('portfolio.portfolio_b')}
          </label>
          <Select value={idB ?? ""} onValueChange={setIdB}>
            <SelectTrigger>
              <SelectValue placeholder={t('portfolio.select_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id} disabled={p.id === idA}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics comparison */}
      {(riskA.isPending || riskB.isPending) && idA && idB && (
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      )}

      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {t('nav.risk')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pb-1 border-b border-border">
                <span>{t('portfolio.ticker')}</span>
                <span className="text-center text-blue-400">{nameA}</span>
                <span className="text-center text-amber-400">{nameB}</span>
              </div>
              {metrics.map((m) => {
                const aWins = m.higherIsBetter ? m.a > m.b : m.a < m.b;
                const bWins = m.higherIsBetter ? m.b > m.a : m.b < m.a;

                return (
                  <div
                    key={m.label}
                    className="grid grid-cols-3 gap-2 items-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      {m.label}
                    </span>
                    <span
                      className={`font-mono text-sm text-center ${aWins ? "text-emerald-500" : ""}`}
                    >
                      {m.format(m.a)}
                    </span>
                    <span
                      className={`font-mono text-sm text-center ${bWins ? "text-emerald-500" : ""}`}
                    >
                      {m.format(m.b)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance overlay chart */}
      {(pricesALoading || pricesBLoading) && idA && idB && (
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {t('portfolio.performance_chart')}
            </CardTitle>
            <CardDescription>{t('portfolio.base_100')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip
                  labelFormatter={(label) =>
                    new Date(String(label)).toLocaleDateString()
                  }
                  formatter={(value) => [Number(value).toFixed(2), ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={nameA}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={nameB}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
