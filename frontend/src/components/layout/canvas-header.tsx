"use client";

/**
 * Canvas sub-header — live clock, page title, B/E segmented control.
 *
 * Sits inside the floating canvas at the top. Shows current time,
 * locale-aware page title, and Beginner/Expert toggle.
 *
 * Depends on: ui/segmented-control, lib/store/mode-context, lib/store/locale-store,
 *             next-intl, next/navigation
 * Used by: app/(dashboard)/layout.tsx
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { useMode } from "@/lib/store/mode-context";
import { useLocaleStore } from "@/lib/store/locale-store";

const LOCALE_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
};

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/overview": "nav.overview",
  "/portfolio": "nav.portfolio",
  "/risk": "nav.risk",
  "/markowitz": "nav.markowitz",
  "/stress": "nav.stress",
  "/report": "nav.report",
  "/profile": "nav.profile",
};

function useClock() {
  const { locale } = useLocaleStore();
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(LOCALE_MAP[locale] ?? "fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  return time;
}

export function CanvasHeader() {
  const pathname = usePathname();
  const clock = useClock();
  const { mode, setMode } = useMode();
  const t = useTranslations();

  const titleKey = PAGE_TITLE_KEYS[pathname];
  const title = titleKey ? t(titleKey) : "";

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

      {/* Center — Page title + ⌘K hint */}
      <div className="flex items-center gap-3">
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--layout-text)",
          }}
        >
          {title}
        </span>
        <button
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            );
          }}
          className="text-xs text-[var(--layout-text-faint)] hover:text-[var(--layout-text-muted)] transition-colors px-1.5 py-0.5 rounded border border-[var(--layout-separator)] hover:border-[var(--layout-surface-border)]"
        >
          ⌘K
        </button>
      </div>

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
