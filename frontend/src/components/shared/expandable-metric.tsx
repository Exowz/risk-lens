"use client";

/**
 * Expandable metric row with inline explanation toggle.
 *
 * Each metric is a clickable row: label + value on left, toggle button on right.
 * Clicking "?" expands a mode-aware explanation below.
 * Each metric manages its own open/closed state independently.
 *
 * Depends on: lib/store/mode-context.tsx
 * Used by: risk/var-card.tsx, risk/monte-carlo-panel.tsx,
 *          stress/stress-scenario-card.tsx, markowitz/page.tsx
 */

import { useState, type ReactNode } from "react";

import { useMode } from "@/lib/store/mode-context";

interface ExpandableMetricProps {
  /** Label shown in beginner mode */
  labelBeginner: string;
  /** Label shown in expert mode */
  labelExpert: string;
  /** Formatted metric value (ReactNode for CountUp components) */
  value: ReactNode;
  /** Explanation text for beginner mode */
  explanationBeginner: string;
  /** Explanation text for expert mode */
  explanationExpert: string;
}

export function ExpandableMetric({
  labelBeginner,
  labelExpert,
  value,
  explanationBeginner,
  explanationExpert,
}: ExpandableMetricProps) {
  const [open, setOpen] = useState(false);
  const { mode } = useMode();

  return (
    <div>
      <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <div>
          <span className="text-sm text-muted-foreground">
            {mode === "beginner" ? labelBeginner : labelExpert}
          </span>
          <span className="ml-2">{value}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-white/30 hover:text-white/60 transition-colors ml-4"
        >
          {open ? "▲" : "?"}
        </button>
      </div>
      {open && (
        <div className="text-xs text-muted-foreground bg-white/[0.03] rounded-lg p-3 mb-2 border border-white/[0.06]">
          {mode === "beginner" ? explanationBeginner : explanationExpert}
        </div>
      )}
    </div>
  );
}
