"use client";

/**
 * Sidebar rail — 56px collapsed, 220px on hover (overlay, no layout shift).
 *
 * Phosphor icons, portfolio selector, segmented Expert/Beginner control,
 * avatar dropdown at bottom.
 *
 * Depends on: @phosphor-icons/react, ui/segmented-control, ui/select,
 *             ui/dropdown-menu, lib/auth/client, lib/api/portfolios,
 *             lib/store/portfolio-store, lib/store/mode-context
 * Used by: app/(dashboard)/layout.tsx
 */

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartLineUp,
  ChartPie,
  FileText,
  HouseLine,
  Lightning,
  ShieldWarning,
  UserCircle,
} from "@phosphor-icons/react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolios } from "@/lib/api/portfolios";
import { clearSessionTokenCache } from "@/lib/api/client";
import { signOut } from "@/lib/auth/client";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

type PhosphorIcon = typeof HouseLine;

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
}

const navItems: NavItem[] = [
  { href: "/overview", label: "Vue d'ensemble", icon: HouseLine },
  { href: "/portfolio", label: "Portefeuille", icon: ChartPie },
  { href: "/risk", label: "Analyse de risque", icon: ShieldWarning },
  { href: "/markowitz", label: "Markowitz", icon: ChartLineUp },
  { href: "/stress", label: "Stress Test", icon: Lightning },
  { href: "/report", label: "Rapport", icon: FileText },
  { href: "/profile", label: "Profil", icon: UserCircle },
];

function getInitials(email: string): string {
  const name = email.split("@")[0];
  if (name.includes(".")) {
    const parts = name.split(".");
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface SidebarRailProps {
  session: {
    user?: {
      email?: string | null;
      name?: string | null;
    } | null;
  };
}

export function SidebarRail({ session }: SidebarRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const enterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
  const { activePortfolioId, setActivePortfolio } = usePortfolioStore();
  const { mode, setMode } = useMode();

  const email = session.user?.email ?? "";
  const name = session.user?.name ?? email.split("@")[0];

  const handleMouseEnter = useCallback(() => {
    enterTimeout.current = setTimeout(() => setIsExpanded(true), 100);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (enterTimeout.current) {
      clearTimeout(enterTimeout.current);
      enterTimeout.current = null;
    }
    setIsExpanded(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    clearSessionTokenCache();
    await signOut();
    router.push("/login");
  }, [router]);

  return (
    <nav
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: isExpanded ? 220 : 56,
        zIndex: 50,
        background: "rgba(17,19,24,0.95)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        transition: "width 200ms ease-out, box-shadow 200ms ease-out",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderTopLeftRadius: "1.5rem",
        borderBottomLeftRadius: "1.5rem",
        boxShadow: isExpanded ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
      }}
    >
      {/* Logo zone */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 12,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "white",
            whiteSpace: "nowrap",
          }}
        >
          {isExpanded ? "RiskLens" : "R"}
        </span>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, paddingTop: 8, overflow: "hidden" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  margin: "0 8px",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 150ms",
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  color: isActive ? "white" : "rgba(255,255,255,0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon
                  size={18}
                  weight={isActive ? "fill" : "regular"}
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    opacity: isExpanded ? 1 : 0,
                    width: isExpanded ? "auto" : 0,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "opacity 150ms ease-out",
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Portfolio selector (visible when expanded) */}
        <div
          style={{
            opacity: isExpanded ? 1 : 0,
            transition: "opacity 150ms ease-out",
            padding: "12px 8px 0",
            pointerEvents: isExpanded ? "auto" : "none",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            Portefeuille
          </p>
          {portfoliosLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : portfolios && portfolios.length > 0 ? (
            <Select
              value={activePortfolioId ?? undefined}
              onValueChange={(val) => setActivePortfolio(val)}
            >
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Link
              href="/portfolio"
              style={{
                fontSize: 12,
                color: "#3b82f6",
              }}
            >
              Créer un portefeuille →
            </Link>
          )}
        </div>

        {/* Segmented control (visible when expanded) */}
        <div
          style={{
            opacity: isExpanded ? 1 : 0,
            transition: "opacity 150ms ease-out",
            padding: "12px 8px 0",
            pointerEvents: isExpanded ? "auto" : "none",
          }}
        >
          <SegmentedControl
            options={[
              { value: "beginner" as const, label: "Débutant" },
              { value: "expert" as const, label: "Expert" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>
      </div>

      {/* Avatar zone */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          paddingRight: 12,
          flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                width: "100%",
                padding: 0,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {getInitials(email)}
              </div>
              <span
                style={{
                  opacity: isExpanded ? 1 : 0,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "opacity 150ms ease-out",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
