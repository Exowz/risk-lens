"use client";

/**
 * Sidebar rail — icons-only, 52px fixed width, 3-state visibility.
 *
 * Pinned: visible, sidebar takes space in layout via spacer.
 * Hidden: animated out (opacity 0, x -60).
 * Peek: same visual as pinned, overlays canvas (layout handles positioning).
 *
 * NEVER shows text labels. Tooltips on every icon (side="right").
 * Positioning is handled by the fixed container in layout.tsx.
 *
 * Depends on: @phosphor-icons/react, ui/tooltip, lib/store/sidebar-store, next-intl
 * Used by: app/(dashboard)/layout.tsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
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
  labelKey: string;
  icon: PhosphorIcon;
}

const navItems: NavItem[] = [
  { href: "/overview", labelKey: "nav.overview", icon: HouseLine },
  { href: "/portfolio", labelKey: "nav.portfolio", icon: ChartPie },
  { href: "/risk", labelKey: "nav.risk", icon: ShieldWarning },
  { href: "/markowitz", labelKey: "nav.markowitz", icon: ChartLineUp },
  { href: "/stress", labelKey: "nav.stress", icon: Lightning },
  { href: "/report", labelKey: "nav.report", icon: FileText },
];

export function SidebarRail() {
  const pathname = usePathname();
  const { state, isPeeking, toggle } = useSidebarStore();
  const t = useTranslations();

  const isVisible = state === "pinned" || isPeeking;

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
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {/* Logo — icon only */}
      <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0 mb-2">
        <span className="text-lg font-bold text-foreground">R</span>
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
                        ? "bg-[var(--layout-active)] text-[var(--layout-active-text)]"
                        : "text-[var(--layout-text-muted)] hover:text-[var(--layout-text)] hover:bg-[var(--layout-hover)]"
                    }`}
                  >
                    <Icon size={20} weight={isActive ? "fill" : "regular"} />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t(item.labelKey)}
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
            className="flex items-center justify-center py-2 rounded-lg text-[var(--layout-text-faint)] hover:text-[var(--layout-text-muted)] hover:bg-[var(--layout-hover)] transition-all duration-150 w-full"
          >
            <PushPin
              size={16}
              weight={state === "pinned" ? "fill" : "regular"}
              className={state === "pinned" ? "rotate-45" : ""}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {state === "pinned" ? t('command_palette.hide_sidebar') : t('command_palette.pin_sidebar')}
          <span className="ml-2 text-[var(--layout-text-faint)]">⌘B</span>
        </TooltipContent>
      </Tooltip>
    </motion.nav>
  );
}
