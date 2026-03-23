"use client";

/**
 * "Why does this matter?" section using Aceternity ExpandableCard.
 *
 * In beginner mode: expanded by default.
 * In expert mode: collapsed by default.
 *
 * Depends on: components/ui/expandable-card.tsx, lib/store/mode-context.tsx
 * Used by: risk/page.tsx, markowitz/page.tsx, stress/page.tsx
 */

import { ExpandableCard } from "@/components/ui/expandable-card";
import { useMode } from "@/lib/store/mode-context";

interface WhyCardProps {
  title?: string;
  children: React.ReactNode;
}

export function WhyCard({
  title = "Why does this matter?",
  children,
}: WhyCardProps) {
  const { mode } = useMode();

  return (
    <ExpandableCard
      title={title}
      defaultOpen={mode === "beginner"}
    >
      {children}
    </ExpandableCard>
  );
}
