"use client";

/**
 * KPI card with inline expansion for AI explanation.
 *
 * Collapsed: label + big font-mono value + optional description.
 * On click: expands inline to reveal AI explanation below.
 *
 * Depends on: ui/expandable (Cult UI), shared/metric-tooltip,
 *             ui/number-ticker, ui/shine-border, ui/skeleton
 * Used by: risk/page.tsx, markowitz/page.tsx, stress/page.tsx
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { MetricTooltip } from "@/components/shared/metric-tooltip";
import {
  Expandable,
  ExpandableCard,
  ExpandableCardContent,
  ExpandableCardHeader,
  ExpandableTrigger,
  ExpandableContent,
} from "@/components/ui/expandable";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShineBorder } from "@/components/ui/shine-border";
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
  /** Numeric value to animate with NumberTicker */
  value: number;
  /** Prefix before value (e.g. "+" for positive returns) */
  valuePrefix?: string;
  /** Suffix after value (e.g. "%") */
  valueSuffix?: string;
  /** Tailwind color key for the value */
  valueColor?: ValueColor;
  /** Number of decimal places */
  decimals?: number;
  /** Optional description below value */
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

  // Auto-fetch explanation when expanded
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

  const valueElement = (
    <p className={`text-2xl font-bold font-mono ${VALUE_COLORS[valueColor]}`}>
      {valuePrefix}
      <NumberTicker
        value={value}
        decimalPlaces={decimals}
        className={VALUE_COLORS[valueColor]}
      />
      {valueSuffix}
    </p>
  );

  return (
    <Expandable
      expanded={isOpen}
      onToggle={onToggle}
      expandDirection="vertical"
      expandBehavior="push"
    >
      <ExpandableCard
        className="relative overflow-hidden"
        collapsedSize={{ width: undefined as unknown as number, height: undefined as unknown as number }}
        expandedSize={{ width: undefined as unknown as number, height: undefined as unknown as number }}
      >
        {isOpen && (
          <ShineBorder
            shineColor={["#3b82f6", "#10b981"]}
            borderWidth={1}
          />
        )}

        <ExpandableTrigger>
          <ExpandableCardHeader className="p-4 cursor-pointer">
            <div className="w-full">
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
                <div className="mt-1 text-xs text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
          </ExpandableCardHeader>
        </ExpandableTrigger>

        <ExpandableContent>
          <ExpandableCardContent className="px-4 pb-4 pt-0">
            <div className="border-t border-border pt-3 space-y-3">
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
                    <span className="text-[10px] text-white/20">
                      Analysé par IA
                    </span>
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
            </div>
          </ExpandableCardContent>
        </ExpandableContent>
      </ExpandableCard>
    </Expandable>
  );
}
