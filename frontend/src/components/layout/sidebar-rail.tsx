"use client";

/**
 * Sidebar rail — Arc Browser style with 3 states.
 *
 * Pinned: 220px, icons + labels, always visible.
 * Hidden: 0px, off-screen. Canvas takes full width.
 * Peek: when hidden, mouse near left edge triggers overlay.
 *
 * Depends on: @phosphor-icons/react, ui/tooltip, lib/store/sidebar-store
 * Used by: app/(dashboard)/layout.tsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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

  const isExpanded = state === "pinned" || isPeeking;
  const isOverlay = isPeeking && state === "hidden";

  return (
    <motion.nav
      initial={false}
      animate={{
        width: isExpanded ? 220 : 52,
        opacity: state === "hidden" && !isPeeking ? 0 : 1,
        x: state === "hidden" && !isPeeking ? -60 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        flexShrink: 0,
        background: "var(--layout-surface)",
        border: "1px solid var(--layout-surface-border)",
        borderRadius: "1rem",
        padding: "0.75rem",
        display: "flex",
        flexDirection: "column",
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
      {/* Logo */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 px-2 pb-3 mb-1 border-b border-white/[0.06]"
          >
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-white">R</span>
            </div>
            <span className="text-sm font-semibold text-white whitespace-nowrap">
              RiskLens
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return isExpanded ? (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
              >
                <Icon size={18} weight={isActive ? "fill" : "regular"} />
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              </div>
            </Link>
          ) : (
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
            className={`flex items-center ${
              isExpanded ? "gap-2 px-2.5" : "justify-center"
            } py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150 w-full`}
          >
            <PushPin
              size={16}
              weight={state === "pinned" ? "fill" : "regular"}
              className={state === "pinned" ? "rotate-45" : ""}
            />
            {isExpanded && (
              <span className="text-xs whitespace-nowrap">
                {state === "pinned" ? "Masquer la barre" : "Épingler la barre"}
              </span>
            )}
          </button>
        </TooltipTrigger>
        {!isExpanded && (
          <TooltipContent side="right" sideOffset={8}>
            Épingler la barre
            <span className="ml-2 text-white/20">⌘B</span>
          </TooltipContent>
        )}
      </Tooltip>
    </motion.nav>
  );
}
