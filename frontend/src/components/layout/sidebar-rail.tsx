"use client";

/**
 * Sidebar rail — 52px fixed, icons only with tooltips.
 *
 * Standalone component outside the canvas. Phosphor icons with
 * shadcn Tooltip on each for page name.
 *
 * Depends on: @phosphor-icons/react, ui/tooltip
 * Used by: app/(dashboard)/layout.tsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineUp,
  ChartPie,
  FileText,
  HouseLine,
  Lightning,
  ShieldWarning,
} from "@phosphor-icons/react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PhosphorIcon = typeof HouseLine;

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
}

const navItems: NavItem[] = [
  { href: "/overview", label: "Vue d'ensemble", icon: HouseLine },
  { href: "/portfolio", label: "Portefeuille", icon: ChartPie },
  { href: "/risk", label: "Analyse des risques", icon: ShieldWarning },
  { href: "/markowitz", label: "Markowitz", icon: ChartLineUp },
  { href: "/stress", label: "Stress Test", icon: Lightning },
  { href: "/report", label: "Rapport IA", icon: FileText },
];

export function SidebarRail() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        width: 52,
        flexShrink: 0,
        background: "var(--layout-surface)",
        border: "1px solid var(--layout-surface-border)",
        borderRadius: "1rem",
        padding: "0.5rem 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link href={item.href}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: "0.6rem",
                    cursor: "pointer",
                    transition: "all 150ms",
                    background: isActive
                      ? "var(--layout-active)"
                      : "transparent",
                    color: isActive ? "var(--layout-active-text)" : "var(--layout-text-faint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--layout-text)";
                      e.currentTarget.style.background = "var(--layout-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--layout-text-faint)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon
                    size={20}
                    weight={isActive ? "fill" : "regular"}
                  />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
