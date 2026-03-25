"use client";

/**
 * Metric tooltip built on shadcn Tooltip (Radix) primitive.
 *
 * Shows a mode-aware explanation on hover with collision avoidance.
 * Trigger: metric label with dotted underline + cursor-help.
 * Content: max-w-[260px], wrapping text, side="top", sideOffset=8.
 *
 * Depends on: components/ui/tooltip.tsx, lib/store/mode-context.tsx
 * Used by: risk, markowitz, stress, dashboard pages
 */

import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMode } from "@/lib/store/mode-context";

/** Known metric keys that have tooltip translations. */
const KNOWN_METRICS = [
  "var_95", "var_99", "cvar", "sharpe", "drawdown",
  "p_loss", "volatility", "return", "recovery",
] as const;

interface MetricTooltipProps {
  /** Key matching METRIC_EXPLANATIONS (e.g. "var_95", "sharpe") */
  metricKey: string;
  /** Technical/expert label */
  label: string;
  /** The metric value to display */
  children: React.ReactNode;
}

export function MetricTooltip({
  metricKey,
  label,
  children,
}: MetricTooltipProps) {
  const { mode } = useMode();
  const t = useTranslations();
  const hasTooltip = (KNOWN_METRICS as readonly string[]).includes(metricKey);

  const displayLabel = label;
  const tipText = hasTooltip
    ? t(`tooltips.${metricKey}_${mode}`)
    : null;

  if (!tipText) {
    return (
      <div>
        <p className="text-xs text-muted-foreground">{displayLabel}</p>
        {children}
      </div>
    );
  }

  return (
    <div>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="inline-flex cursor-help items-center gap-1 border-b border-dashed border-muted-foreground/40 pb-0.5 text-xs text-muted-foreground">
              {displayLabel}
            </p>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            avoidCollisions
            className="max-w-[260px] whitespace-normal text-sm p-3"
          >
            {tipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {children}
    </div>
  );
}
