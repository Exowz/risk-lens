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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AvatarZone } from "@/components/layout/avatar-zone";
import { CanvasHeader } from "@/components/layout/canvas-header";
import { SidebarRail } from "@/components/layout/sidebar-rail";
import { TopBar } from "@/components/layout/top-bar";
import { RiskProfilerModal } from "@/components/shared/risk-profiler-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolios } from "@/lib/api/portfolios";
import { usePreferences, useRiskProfile } from "@/lib/api/profile";
import { useSession } from "@/lib/auth/client";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

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
  const [showProfiler, setShowProfiler] = useState(false);
  const [profilerDismissed, setProfilerDismissed] = useState(false);

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
          gap: "1rem",
          minHeight: 0,
        }}
      >
        {/* Left column — Sidebar (centered) + Avatar (bottom) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
            width: 52,
            gap: "0.75rem",
          }}
        >
          <div style={{ flex: 1 }} />
          <SidebarRail />
          <div style={{ flex: 1 }} />
          <AvatarZone session={session} />
        </div>

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

          {/* Page content */}
          <main style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
