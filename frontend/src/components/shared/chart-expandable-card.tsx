"use client";

/**
 * Chart card with inline expansion for AI explanation.
 *
 * Chart is ALWAYS visible. Click expands to show AI explanation below.
 *
 * Depends on: ui/expandable (Cult UI), ui/skeleton, react-markdown
 * Used by: risk/page.tsx, markowitz/page.tsx, stress/page.tsx
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Expandable,
  ExpandableCard,
  ExpandableTrigger,
  ExpandableContent,
} from "@/components/ui/expandable";
import { Skeleton } from "@/components/ui/skeleton";

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
  const t = useTranslations();
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

  return (
    <Expandable
      expanded={isOpen}
      onToggle={onToggle}
      expandDirection="vertical"
      expandBehavior="push"
    >
      <ExpandableCard
        className="relative rounded-xl transition-colors duration-200"
        style={{
          background: "#161920",
          border: isOpen
            ? "1px solid rgba(59,130,246,0.4)"
            : "1px solid rgba(255,255,255,0.07)",
        }}
        collapsedSize={{}}
        expandedSize={{}}
      >
        <ExpandableTrigger>
          <div className="p-4 cursor-pointer">
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{title}</h3>
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
                      <span className="text-xs text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ExpandableTrigger>

        <ExpandableContent>
          <div className="px-4 pb-4 pt-0">
            <div className="border-t border-border pt-3 space-y-3">
              {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {hasError && !isLoading && (
                <p className="text-sm text-muted-foreground italic">
                  {t('common.unavailable')}
                </p>
              )}
              {explanation && !isLoading && (
                <>
                  <div className="overflow-y-auto max-h-[200px] text-sm text-muted-foreground italic leading-relaxed prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {explanation}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/20">
                      {t('common.analyzed')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh();
                      }}
                      className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      {t('common.refresh')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </ExpandableContent>
      </ExpandableCard>
    </Expandable>
  );
}
