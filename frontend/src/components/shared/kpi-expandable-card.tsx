"use client";

/**
 * KPI card matching dashboard BentoGridItem style.
 *
 * Collapsed: bg-card border rounded-lg card with MetricTooltip label
 * on top, big text-2xl font-mono CountUp value, optional description.
 * Looks identical to dashboard KPI cards.
 *
 * On click: opens the Aceternity ExpandableCard overlay showing the
 * KPI value at the top + AI explanation below (auto-fetched on open).
 *
 * Depends on: ui/expandable-card, shared/metric-tooltip, ui/count-up, ui/skeleton
 * Used by: risk/page.tsx, markowitz/page.tsx, stress/page.tsx
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { CountUp } from "@/components/ui/count-up";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { Skeleton } from "@/components/ui/skeleton";

const VALUE_COLORS = {
  red: "text-red-500",
  emerald: "text-emerald-500",
  blue: "text-blue-400",
  amber: "text-amber-500",
  orange: "text-orange-500",
  foreground: "text-foreground",
} as const;

type ValueColor = keyof typeof VALUE_COLORS;

interface KpiExpandableCardProps {
  /** Metric label (expert mode) */
  label: string;
  /** MetricTooltip key for hover explanation (e.g. "var_95", "sharpe") */
  tooltipKey?: string;
  /** Numeric value to animate with CountUp */
  value: number;
  /** Prefix before value (e.g. "+" for positive returns) */
  valuePrefix?: string;
  /** Suffix after value (e.g. "%") */
  valueSuffix?: string;
  /** Tailwind color key for the value */
  valueColor?: ValueColor;
  /** Number of decimal places for CountUp */
  decimals?: number;
  /** Optional description below value (like dashboard) */
  description?: ReactNode;
  /** Machine-readable metric key for one-at-a-time control */
  metricKey: string;
  /** Async function that calls Mistral and returns explanation text */
  onAnalyze: () => Promise<string>;
  /** Controlled open state */
  isOpen: boolean;
  /** Toggle callback for one-at-a-time control */
  onToggle: () => void;
}

export function KpiExpandableCard({
  label,
  tooltipKey,
  value,
  valuePrefix,
  valueSuffix,
  valueColor = "foreground",
  decimals = 2,
  description,
  onAnalyze,
  isOpen,
  onToggle,
}: KpiExpandableCardProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const analyzeRef = useRef(onAnalyze);
  analyzeRef.current = onAnalyze;

  // Auto-fetch explanation when overlay opens
  useEffect(() => {
    if (isOpen && !explanation && !isLoading) {
      setIsLoading(true);
      setHasError(false);
      analyzeRef
        .current()
        .then((text) => {
          setExplanation(text);
          setIsLoading(false);
        })
        .catch(() => {
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isOpen, explanation, isLoading]);

  const handleRefresh = useCallback(() => {
    setExplanation(null);
    setIsLoading(true);
    setHasError(false);
    analyzeRef
      .current()
      .then((text) => {
        setExplanation(text);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  }, []);

  // Value element reused in both collapsed and expanded views
  const valueElement = (
    <p className={`text-2xl font-bold font-mono ${VALUE_COLORS[valueColor]}`}>
      {valuePrefix}
      <CountUp to={value} duration={1200} decimals={decimals} suffix={valueSuffix} />
    </p>
  );

  // Collapsed header: matches dashboard BentoGridItem style
  const collapsedHeader = (
    <div>
      {tooltipKey ? (
        <MetricTooltip metricKey={tooltipKey} label={label}>
          {valueElement}
        </MetricTooltip>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{label}</p>
          {valueElement}
        </>
      )}
      {description && (
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );

  return (
    <ExpandableCard
      title={label}
      header={collapsedHeader}
      open={isOpen}
      onOpenChange={(v) => {
        if (v !== isOpen) onToggle();
      }}
      className="border-solid"
    >
      {/* Expanded overlay: AI explanation first, then value below */}
      <div className="space-y-4">
        {/* AI explanation */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {hasError && !isLoading && (
          <p className="text-sm text-muted-foreground italic">
            Analyse temporairement indisponible.
          </p>
        )}
        {explanation && !isLoading && (
          <>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              {explanation}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/20">Analysé par IA</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Rafraîchir
              </button>
            </div>
          </>
        )}

        {/* Value below the explanation */}
        <div className="border-t border-border pt-3 text-center">
          {valueElement}
        </div>
      </div>
    </ExpandableCard>
  );
}
