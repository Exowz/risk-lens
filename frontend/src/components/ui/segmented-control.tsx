"use client";

/**
 * Animated segmented control with Framer Motion pill.
 *
 * Depends on: motion/react
 * Used by: components/shared/sidebar-rail.tsx
 */

import { motion } from "motion/react";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--layout-surface)",
        border: "1px solid var(--layout-surface-border)",
        borderRadius: 9999,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              position: "relative",
              padding: "4px 14px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              zIndex: 1,
              transition: "color 200ms",
              color: isActive ? "var(--layout-active-text)" : "var(--layout-text-faint)",
              border: "none",
              background: "transparent",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-pill"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 9999,
                  background: "var(--layout-active)",
                  border: "1px solid var(--layout-surface-border)",
                  backdropFilter: "blur(8px)",
                  zIndex: 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
