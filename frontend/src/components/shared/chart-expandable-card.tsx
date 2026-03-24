"use client";

/**
 * Chart card that opens an ExpandableCard overlay for AI explanation.
 *
 * Collapsed: chart always visible with title and legend.
 * On click: opens Aceternity overlay showing AI explanation.
 * Chart is ALWAYS visible in collapsed state.
 *
 * Depends on: ui/expandable-card, ui/skeleton
 * Used by: risk/page.tsx, markowitz/page.tsx, stress/page.tsx
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ExpandableCard } from "@/components/ui/expandable-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFocusStore } from "@/lib/store/focus-store";
import { useSidebarStore } from "@/lib/store/sidebar-store";

interface LegendItem {
  color: string;
  label: string;
}

interface ChartExpandableCardProps {
  /** Section title */
  title: string;
  /** The chart component */
  children: ReactNode;
  /** Colored legend items */
  legend?: LegendItem[];
  /** Async function that calls Mistral and returns explanation text */
  onAnalyze: () => Promise<string>;
  /** Controlled open state */
  isOpen: boolean;
  /** Toggle callback for one-at-a-time control */
  onToggle: () => void;
}

export function ChartExpandableCard({
  title,
  children,
  legend,
  onAnalyze,
  isOpen,
  onToggle,
}: ChartExpandableCardProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const analyzeRef = useRef(onAnalyze);
  analyzeRef.current = onAnalyze;

  const { isFocused, enter: enterFocus, exit: exitFocus } = useFocusStore();
  const sidebarState = useSidebarStore((s) => s.state);
  const setSidebarState = useSidebarStore((s) => s.setState);

  const handleDoubleClick = useCallback(() => {
    if (isFocused) return;
    enterFocus(sidebarState);
    setSidebarState("hidden");
  }, [isFocused, sidebarState, enterFocus, setSidebarState]);

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

  const handleExitFocus = useCallback(() => {
    const prev = useFocusStore.getState().previousSidebarState;
    exitFocus();
    if (prev) setSidebarState(prev);
  }, [exitFocus, setSidebarState]);

  // Escape key exits focus mode
  useEffect(() => {
    if (!isFocused) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleExitFocus();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFocused, handleExitFocus]);

  const collapsedHeader = (
    <div onDoubleClick={handleDoubleClick}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-foreground">{title}</h3>
        {isFocused && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">
              Focus
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExitFocus();
              }}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              ✕ Quitter
            </button>
          </div>
        )}
      </div>
      {children}
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <ExpandableCard
      title={title}
      header={collapsedHeader}
      open={isOpen}
      onOpenChange={(v) => {
        if (v !== isOpen) onToggle();
      }}
      className="border-solid"
    >
      {/* Overlay content: AI explanation first, then chart below */}
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
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
                Rafraîchir l&apos;analyse
              </button>
            </div>
          </>
        )}

        {/* Chart below the explanation */}
        <div className="border-t border-border pt-3">
          {children}
          {legend && legend.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
              {legend.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ExpandableCard>
  );
}
