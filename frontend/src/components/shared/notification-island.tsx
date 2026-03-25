"use client";

/**
 * Dynamic Island notification overlay for heavy calculation completions.
 *
 * Shows a compact → large animation when Monte Carlo, Stress, or Report
 * completes. Auto-dismisses after 6 seconds.
 *
 * Depends on: lib/store/notification-island-store, motion/react
 * Used by: app/(dashboard)/layout.tsx
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lightning, ChartBar, ChartPie, FileText } from "@phosphor-icons/react";

import {
  useNotificationIsland,
  type IslandNotification,
  type IslandNotificationType,
} from "@/lib/store/notification-island-store";

const ICONS: Record<IslandNotificationType, typeof ChartBar> = {
  montecarlo: ChartBar,
  stress: Lightning,
  report: FileText,
  allocation: ChartPie,
};

export function NotificationIsland() {
  const { notification, dismiss } = useNotificationIsland();
  const [phase, setPhase] = useState<"compact" | "large" | null>(null);

  useEffect(() => {
    if (!notification) {
      setPhase(null);
      return;
    }

    // Compact phase
    setPhase("compact");
    const expandTimer = setTimeout(() => setPhase("large"), 500);
    const dismissTimer = setTimeout(() => dismiss(), 6000);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification, dismiss]);

  return (
    <AnimatePresence>
      {notification && phase && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] cursor-pointer"
          onClick={dismiss}
        >
          {phase === "compact" ? (
            <motion.div
              layoutId="island"
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "var(--layout-canvas)",
                border: "1px solid var(--layout-surface-border)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <span className="animate-pulse text-[var(--layout-text-muted)] text-sm">
                ⚡ Calcul en cours...
              </span>
            </motion.div>
          ) : (
            <CompactIsland notification={notification} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CompactIsland({
  notification,
}: {
  notification: IslandNotification;
}) {
  const Icon = ICONS[notification.type];

  return (
    <motion.div
      layoutId="island"
      initial={{ width: 200 }}
      animate={{ width: 380 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--layout-canvas)",
        border: "1px solid var(--layout-surface-border)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            notification.positive ? "bg-emerald-500/20" : "bg-red-500/20"
          }`}
        >
          <Icon
            size={18}
            className={
              notification.positive ? "text-emerald-400" : "text-red-400"
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-foreground truncate"
          >
            {notification.title}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-muted-foreground font-mono truncate"
          >
            {notification.subtitle}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
