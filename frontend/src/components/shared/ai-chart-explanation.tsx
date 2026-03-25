"use client";

/**
 * AI-generated chart explanation box — triggered on click, not on load.
 *
 * Initial state: button "✨ Analyser avec l'IA"
 * Loading state: Skeleton
 * Loaded state: explanation box with "🔄 Rafraîchir" link
 * Caches result in local state. Auto re-fetches on mode change
 * if explanation was already loaded.
 *
 * Depends on: lib/store/mode-context.tsx
 * Used by: charts/monte-carlo-chart.tsx, charts/var-distribution.tsx,
 *          markowitz/page.tsx, stress/page.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { useMode } from "@/lib/store/mode-context";

interface AiChartExplanationProps {
  /** Callback to trigger the AI explanation mutation */
  onAnalyze: () => void;
  /** The AI explanation text from the mutation result */
  explanation: string | undefined;
  /** Whether the mutation is currently pending */
  isPending: boolean;
  /** Whether the mutation errored */
  isError?: boolean;
}

export function AiChartExplanation({
  onAnalyze,
  explanation,
  isPending,
  isError,
}: AiChartExplanationProps) {
  const { mode } = useMode();
  const t = useTranslations();
  const [cachedText, setCachedText] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const prevModeRef = useRef(mode);

  // Cache successful result
  useEffect(() => {
    if (explanation) {
      setCachedText(explanation);
    }
  }, [explanation]);

  // Auto re-fetch on mode change if already loaded
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      if (hasRequested) {
        setCachedText(null);
        onAnalyze();
      }
    }
  }, [mode, hasRequested, onAnalyze]);

  const handleClick = useCallback(() => {
    setHasRequested(true);
    setCachedText(null);
    onAnalyze();
  }, [onAnalyze]);

  // Loading state
  if (isPending && !cachedText) {
    return (
      <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  // Loaded state — show cached result
  if (cachedText) {
    return (
      <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          {cachedText}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">
            {t('common.analyzed')}
          </span>
          <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {isPending ? "..." : t('common.refresh')}
          </button>
        </div>
      </div>
    );
  }

  // Error after request — show nothing special, just the button again
  // Initial state — show trigger button
  return (
    <div className="mb-4 flex justify-start">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-3 py-1.5 hover:border-muted-foreground transition-all"
      >
        {isError ? t('common.retry') : t('common.analyze')}
      </button>
    </div>
  );
}
