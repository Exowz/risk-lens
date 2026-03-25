"use client";

/**
 * Protected dashboard layout — 3-layer architecture.
 *
 * Layer 1: TopBar (full width, portfolio selector, language, theme)
 * Layer 2: Left column (SidebarRail + AvatarZone) + Floating Canvas (content)
 *
 * Depends on: components/layout/*, lib/auth/client, lib/api/portfolios,
 *             lib/store/portfolio-store
 * Used by: all (dashboard)/* pages
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AvatarZone } from "@/components/layout/avatar-zone";
import { CanvasHeader } from "@/components/layout/canvas-header";
import { SidebarRail } from "@/components/layout/sidebar-rail";
import { TopBar } from "@/components/layout/top-bar";
import { CommandPalette } from "@/components/shared/command-palette";
import { NotificationIsland } from "@/components/shared/notification-island";
import { RiskProfilerModal } from "@/components/shared/risk-profiler-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/lib/api/alerts";
import { usePortfolios } from "@/lib/api/portfolios";
import { usePreferences, useRiskProfile } from "@/lib/api/profile";
import { useSession } from "@/lib/auth/client";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useSidebarStore } from "@/lib/store/sidebar-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data: portfolios, isSuccess: portfoliosLoaded } = usePortfolios();
  const { data: riskProfile, isSuccess: profileLoaded } = useRiskProfile();
  const { data: dbPreferences, isSuccess: prefsLoaded } = usePreferences();
  const { activePortfolioId, setActivePortfolio } = usePortfolioStore();
  const { setMode } = useMode();
  const { data: notifications } = useNotifications();
  const [showProfiler, setShowProfiler] = useState(false);
  const [profilerDismissed, setProfilerDismissed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const { state: sidebarState, toggle: toggleSidebar, setPeeking } = useSidebarStore();
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Cmd+B (sidebar toggle) and Cmd+K (command palette) keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Mouse edge detection for peek mode
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (sidebarState !== "hidden") return;

      const sidebarEl = sidebarRef.current;
      const isOverSidebar = sidebarEl && sidebarEl.contains(e.target as Node);

      if (e.clientX < 8) {
        if (peekTimerRef.current) {
          clearTimeout(peekTimerRef.current);
          peekTimerRef.current = null;
        }
        setPeeking(true);
      } else if (!isOverSidebar && e.clientX > 80) {
        if (!peekTimerRef.current) {
          peekTimerRef.current = setTimeout(() => {
            setPeeking(false);
            peekTimerRef.current = null;
          }, 300);
        }
      }
    },
    [sidebarState, setPeeking],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!activePortfolioId && portfolios && portfolios.length > 0) {
      setActivePortfolio(portfolios[0].id);
    }
  }, [activePortfolioId, portfolios, setActivePortfolio]);

  // Sync mode from DB preferences (DB has priority over localStorage)
  useEffect(() => {
    if (prefsLoaded && dbPreferences) {
      setMode(dbPreferences.mode);
    }
  }, [prefsLoaded, dbPreferences, setMode]);

  // Show Risk Profiler onboarding if user has no portfolios and no existing profile
  useEffect(() => {
    if (
      portfoliosLoaded &&
      profileLoaded &&
      portfolios &&
      portfolios.length === 0 &&
      !riskProfile &&
      !profilerDismissed
    ) {
      setShowProfiler(true);
    }
  }, [portfoliosLoaded, profileLoaded, portfolios, riskProfile, profilerDismissed]);

  if (isPending || !session) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{ height: 56, flexShrink: 0 }} />
        <div style={{ display: "flex", flex: 1, padding: "0 1.25rem 1.25rem 1.25rem", gap: "1rem" }}>
          <div style={{ width: 52, flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              borderRadius: "1rem",
              background: "var(--layout-canvas)",
              border: "1px solid var(--layout-canvas-border)",
              padding: 32,
            }}
          >
            <Skeleton className="mb-4 h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Dynamic Island notifications */}
      <NotificationIsland />

      {/* Risk Profiler Onboarding */}
      <RiskProfilerModal
        open={showProfiler}
        onClose={() => {
          setShowProfiler(false);
          setProfilerDismissed(true);
        }}
      />

      {/* Layer 1 — Top Bar */}
      <TopBar />

      {/* Layer 2 — Middle zone */}
      <div
        style={{
          display: "flex",
          flex: 1,
          padding: "0 1.25rem 1.25rem 1.25rem",
          minHeight: 0,
        }}
      >
        {/* Sidebar spacer — reserves space when pinned, collapses when hidden */}
        <div
          style={{
            width: sidebarState === "pinned" ? 52 : 0,
            marginRight: sidebarState === "pinned" ? "1rem" : 0,
            flexShrink: 0,
            transition: "width 250ms ease-out, margin-right 250ms ease-out",
          }}
        />

        {/* Floating Canvas */}
        <div
          style={{
            flex: 1,
            borderRadius: "1rem",
            background: "var(--layout-canvas)",
            border: "1px solid var(--layout-canvas-border)",
            boxShadow: "var(--layout-canvas-shadow)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sub-header inside canvas */}
          <CanvasHeader />

          {/* Alert banner */}
          {notifications && notifications.length > 0 && (
            <div className="mx-4 mt-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-red-400">
                {notifications[0].message}
              </span>
              <a
                href="/risk"
                className="text-xs text-red-400 hover:text-red-300 underline ml-4 shrink-0"
              >
                Voir l&apos;analyse
              </a>
            </div>
          )}

          {/* Page content */}
          <main style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </div>

      {/* Sidebar + Avatar — fixed position, z-50, above canvas */}
      <div
        ref={sidebarRef}
        style={{
          position: "fixed",
          left: "1.25rem",
          top: 56,
          bottom: "1.25rem",
          width: 52,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          pointerEvents: "none",
        }}
      >
        <div style={{ flex: 1 }} />
        <SidebarRail />
        <div style={{ flex: 1 }} />
        <AvatarZone session={session} />
      </div>
    </div>
  );
}
