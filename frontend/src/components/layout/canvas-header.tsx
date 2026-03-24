"use client";

/**
 * Canvas sub-header — live clock, page title, B/E segmented control.
 *
 * Sits inside the floating canvas at the top. Shows current time,
 * route-based French page title, and Beginner/Expert toggle.
 *
 * Depends on: ui/segmented-control, lib/store/mode-context, next/navigation
 * Used by: app/(dashboard)/layout.tsx
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { useMode } from "@/lib/store/mode-context";

const PAGE_TITLES: Record<string, string> = {
  "/overview": "Vue d'ensemble",
  "/portfolio": "Portefeuille",
  "/risk": "Analyse des risques",
  "/markowitz": "Optimisation Markowitz",
  "/stress": "Stress Test",
  "/report": "Rapport IA",
  "/profile": "Profil",
};

function useClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export function CanvasHeader() {
  const pathname = usePathname();
  const clock = useClock();
  const { mode, setMode } = useMode();

  const title = PAGE_TITLES[pathname] ?? "";

  return (
    <div
      style={{
        height: 52,
        borderBottom: "1px solid var(--layout-separator)",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      {/* Left — Clock */}
      <span
        style={{
          fontSize: 12,
          fontFamily: "var(--font-geist-mono), monospace",
          color: "var(--layout-text-faint)",
          minWidth: 40,
        }}
      >
        {clock}
      </span>

      {/* Center — Page title */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--layout-text)",
        }}
      >
        {title}
      </span>

      {/* Right — B/E Segmented Control */}
      <SegmentedControl
        options={[
          { value: "beginner" as const, label: "B" },
          { value: "expert" as const, label: "E" },
        ]}
        value={mode}
        onChange={setMode}
      />
    </div>
  );
}
