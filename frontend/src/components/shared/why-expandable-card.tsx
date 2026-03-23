"use client";

/**
 * "Why does this matter?" expandable card with static content.
 *
 * Uses the Aceternity ExpandableCard overlay animation.
 * No AI generation — static beginner/expert content only.
 * defaultOpen is always false.
 *
 * Depends on: components/ui/expandable-card.tsx, lib/store/mode-context.tsx
 * Used by: risk/page.tsx, markowitz/page.tsx, stress/page.tsx
 */

import { ExpandableCard } from "@/components/ui/expandable-card";
import { useMode } from "@/lib/store/mode-context";

interface WhyExpandableCardProps {
  /** Content shown in beginner mode */
  beginnerContent: React.ReactNode;
  /** Content shown in expert mode */
  expertContent: React.ReactNode;
}

export function WhyExpandableCard({
  beginnerContent,
  expertContent,
}: WhyExpandableCardProps) {
  const { mode } = useMode();

  return (
    <ExpandableCard title="Why does this matter?" defaultOpen={false}>
      {mode === "beginner" ? beginnerContent : expertContent}
    </ExpandableCard>
  );
}
