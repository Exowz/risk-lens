"use client";

/**
 * "Why does this matter?" section using ExpandableCard.
 *
 * Accepts separate beginner/expert content and renders the correct one
 * based on the current mode. Falls back to children if mode-specific
 * content is not provided.
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
  /** Content shown in beginner mode. Falls back to children if not set. */
  beginnerContent?: React.ReactNode;
  /** Content shown in expert mode. Falls back to children if not set. */
  expertContent?: React.ReactNode;
  /** Fallback content when mode-specific props are not provided. */
  children?: React.ReactNode;
}

export function WhyCard({
  title = "Pourquoi c'est important ?",
  beginnerContent,
  expertContent,
  children,
}: WhyCardProps) {
  const { mode } = useMode();

  const content =
    mode === "beginner"
      ? beginnerContent ?? children
      : expertContent ?? children;

  return (
    <ExpandableCard
      title={title}
      defaultOpen={false}
    >
      {content}
    </ExpandableCard>
  );
}
