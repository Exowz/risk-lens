"use client";

/**
 * Command Palette — Cmd+K / Ctrl+K global search.
 *
 * Depends on: cmdk, @phosphor-icons/react, lib/api/portfolios,
 *             lib/store/portfolio-store, lib/store/mode-context,
 *             lib/store/sidebar-store, next-intl
 * Used by: app/(dashboard)/layout.tsx
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTranslations } from "next-intl";
import {
  Atom,
  Briefcase,
  ChartBar,
  ChartLineUp,
  ChartPie,
  FileText,
  HouseLine,
  Lightning,
  MagnifyingGlass,
  PushPin,
  ShieldWarning,
  Sparkle,
  Student,
  UserCircle,
  X,
} from "@phosphor-icons/react";

import { usePortfolios } from "@/lib/api/portfolios";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useSidebarStore } from "@/lib/store/sidebar-store";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { data: portfolios } = usePortfolios();
  const { setMode } = useMode();
  const { setActivePortfolio } = usePortfolioStore();
  const { setState: setSidebarState } = useSidebarStore();
  const [search, setSearch] = useState("");
  const t = useTranslations();

  const close = useCallback(() => {
    onOpenChange(false);
    setSearch("");
  }, [onOpenChange]);

  const runAction = useCallback(
    (fn: () => void) => {
      fn();
      close();
    },
    [close],
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div
        className="fixed z-[101] left-1/2 top-[20%] -translate-x-1/2"
        style={{
          width: 560,
          maxHeight: 480,
          background: "var(--layout-canvas)",
          border: "1px solid var(--layout-surface-border)",
          borderRadius: "1rem",
          boxShadow: "var(--layout-canvas-shadow)",
          overflow: "hidden",
        }}
      >
        <Command shouldFilter={true} value="" onValueChange={() => {}}>
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--layout-separator)]">
            <MagnifyingGlass size={16} className="text-[var(--layout-text-faint)] shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={t('command_palette.placeholder')}
              className="flex-1 bg-transparent text-sm text-[var(--layout-text)] placeholder:text-[var(--layout-text-faint)] focus:outline-none"
            />
          </div>

          {/* Results */}
          <Command.List className="overflow-y-auto max-h-72 py-2">
            <Command.Empty className="px-4 py-6 text-sm text-[var(--layout-text-faint)] text-center">
              {t('command_palette.no_results')}
            </Command.Empty>

            {/* Navigation */}
            <Command.Group
              heading={t('command_palette.nav_group')}
              className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--layout-text-faint)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
            >
              <PaletteItem
                icon={<HouseLine size={16} />}
                label={t('nav.overview')}
                hint="⌘1"
                onSelect={() => runAction(() => router.push("/overview"))}
              />
              <PaletteItem
                icon={<ChartPie size={16} />}
                label={t('nav.portfolio')}
                hint="⌘2"
                onSelect={() => runAction(() => router.push("/portfolio"))}
              />
              <PaletteItem
                icon={<ShieldWarning size={16} />}
                label={t('nav.risk')}
                hint="⌘3"
                onSelect={() => runAction(() => router.push("/risk"))}
              />
              <PaletteItem
                icon={<ChartLineUp size={16} />}
                label={t('nav.markowitz')}
                hint="⌘4"
                onSelect={() => runAction(() => router.push("/markowitz"))}
              />
              <PaletteItem
                icon={<Lightning size={16} />}
                label={t('nav.stress')}
                hint="⌘5"
                onSelect={() => runAction(() => router.push("/stress"))}
              />
              <PaletteItem
                icon={<FileText size={16} />}
                label={t('nav.report')}
                hint="⌘6"
                onSelect={() => runAction(() => router.push("/report"))}
              />
              <PaletteItem
                icon={<UserCircle size={16} />}
                label={t('nav.profile')}
                onSelect={() => runAction(() => router.push("/profile"))}
              />
            </Command.Group>

            {/* Actions */}
            <Command.Group
              heading={t('command_palette.actions_group')}
              className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--layout-text-faint)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
            >
              <PaletteItem
                icon={<Sparkle size={16} />}
                label={t('command_palette.generate_report')}
                onSelect={() => runAction(() => router.push("/report"))}
              />
              <PaletteItem
                icon={<ChartBar size={16} />}
                label={t('command_palette.run_montecarlo')}
                onSelect={() => runAction(() => router.push("/risk"))}
              />
              <PaletteItem
                icon={<Student size={16} />}
                label={t('command_palette.beginner_mode')}
                onSelect={() => runAction(() => setMode("beginner"))}
              />
              <PaletteItem
                icon={<Atom size={16} />}
                label={t('command_palette.expert_mode')}
                onSelect={() => runAction(() => setMode("expert"))}
              />
              <PaletteItem
                icon={<PushPin size={16} />}
                label={t('command_palette.pin_sidebar')}
                hint="⌘B"
                onSelect={() => runAction(() => setSidebarState("pinned"))}
              />
              <PaletteItem
                icon={<X size={16} />}
                label={t('command_palette.hide_sidebar')}
                hint="⌘B"
                onSelect={() => runAction(() => setSidebarState("hidden"))}
              />
            </Command.Group>

            {/* Portfolios */}
            {portfolios && portfolios.length > 0 && (
              <Command.Group
                heading={t('command_palette.portfolios_group')}
                className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--layout-text-faint)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
              >
                {portfolios.map((p) => (
                  <PaletteItem
                    key={p.id}
                    icon={<Briefcase size={16} />}
                    label={p.name}
                    onSelect={() =>
                      runAction(() => {
                        setActivePortfolio(p.id);
                        router.push("/overview");
                      })
                    }
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </>
  );
}

function PaletteItem({
  icon,
  label,
  hint,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 my-0.5 cursor-pointer text-[var(--layout-text)] data-[selected=true]:bg-[var(--layout-active)] hover:bg-[var(--layout-hover)] transition-colors"
    >
      <span className="text-[var(--layout-text-muted)] shrink-0">{icon}</span>
      <span className="text-sm flex-1">{label}</span>
      {hint && <span className="text-xs text-[var(--layout-text-faint)]">{hint}</span>}
    </Command.Item>
  );
}
