"use client";

/**
 * Mode-aware chart description shown ABOVE a chart.
 *
 * Style: text-sm text-muted-foreground italic mb-4 px-1
 *
 * Depends on: lib/store/mode-context.tsx
 * Used by: charts/*, dashboard/page.tsx, markowitz/page.tsx
 */

import { useMode } from "@/lib/store/mode-context";

interface ChartDescriptionProps {
  beginner: string;
  expert: string;
}

export function ChartDescription({ beginner, expert }: ChartDescriptionProps) {
  const { mode } = useMode();
  return (
    <p className="text-sm text-muted-foreground italic mb-4 px-1">
      {mode === "beginner" ? beginner : expert}
    </p>
  );
}
