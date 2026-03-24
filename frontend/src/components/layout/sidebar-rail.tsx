"use client";

/**
 * Sidebar rail — icons-only, 52px fixed width, 3-state visibility.
 *
 * Pinned: 52px, icons visible, always on screen.
 * Hidden: 0px, off-screen. Canvas takes full width.
 * Peek: when hidden, mouse near left edge triggers overlay at 52px.
 *
 * NEVER shows text labels. Tooltips on every icon (side="right").
 *
 * Depends on: @phosphor-icons/react, ui/tooltip, lib/store/sidebar-store
 * Used by: app/(dashboard)/layout.tsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  ChartLineUp,
  ChartPie,
  FileText,
  HouseLine,
  Lightning,
  PushPin,
  ShieldWarning,
} from "@phosphor-icons/react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarStore } from "@/lib/store/sidebar-store";

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
  const { state, isPeeking, toggle } = useSidebarStore();

  const isVisible = state === "pinned" || isPeeking;
  const isOverlay = isPeeking && state === "hidden";

  return (
    <motion.nav
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        x: isVisible ? 0 : -60,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        width: 52,
        flexShrink: 0,
        background: "var(--layout-surface)",
        border: "1px solid var(--layout-surface-border)",
        borderRadius: "1rem",
        padding: "0.75rem 0.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        overflow: "hidden",
        ...(isOverlay
          ? {
              position: "absolute" as const,
              left: "1.25rem",
              top: 0,
              bottom: 0,
              zIndex: 50,
              boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
            }
          : {}),
      }}
    >
      {/* Logo — icon only */}
      <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0 mb-2">
        <span className="text-lg font-bold text-white">R</span>
      </div>

      {/* Nav items — icons only with tooltips */}
      <div className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <div
                    className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon size={20} weight={isActive ? "fill" : "regular"} />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Pin/Unpin button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggle}
            className="flex items-center justify-center py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150 w-full"
          >
            <PushPin
              size={16}
              weight={state === "pinned" ? "fill" : "regular"}
              className={state === "pinned" ? "rotate-45" : ""}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {state === "pinned" ? "Masquer la barre" : "Épingler la barre"}
          <span className="ml-2 text-white/20">⌘B</span>
        </TooltipContent>
      </Tooltip>
    </motion.nav>
  );
}
