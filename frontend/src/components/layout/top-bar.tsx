"use client";

/**
 * Top bar — full width, 48px, transparent background.
 *
 * Left: language selector pill. Center: portfolio selector pill. Right: theme toggle.
 *
 * Depends on: @phosphor-icons/react, ui/select, lib/api/portfolios,
 *             lib/store/portfolio-store, lib/store/locale-store, next-intl
 * Used by: app/(dashboard)/layout.tsx
 */

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolios } from "@/lib/api/portfolios";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useLocaleStore, type Locale } from "@/lib/store/locale-store";

const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "fr", label: "🇫🇷 Français" },
  { value: "en", label: "🇬🇧 English" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "zh", label: "🇨🇳 中文" },
];

export function TopBar() {
  const router = useRouter();
  const t = useTranslations();
  const { locale, setLocale } = useLocaleStore();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
  const { activePortfolioId, setActivePortfolio } = usePortfolioStore();

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale as Locale);
    router.refresh();
  };

  return (
    <div
      style={{
        height: 56,
        padding: "0 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      {/* Left — Language selector */}
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger
          style={{
            background: "var(--layout-surface)",
            border: "1px solid var(--layout-surface-border)",
            borderRadius: 9999,
            padding: "2px 12px",
            fontSize: 12,
            color: "var(--layout-text)",
            width: "auto",
            height: 28,
            gap: 4,
          }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Center — Portfolio selector */}
      <div>
        {portfoliosLoading ? (
          <Skeleton className="h-7 w-32 rounded-full" />
        ) : portfolios && portfolios.length > 0 ? (
          <Select
            value={activePortfolioId ?? undefined}
            onValueChange={(val) => setActivePortfolio(val)}
          >
            <SelectTrigger
              style={{
                background: "var(--layout-surface)",
                border: "1px solid var(--layout-surface-border)",
                borderRadius: 9999,
                padding: "2px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--layout-text)",
                width: "auto",
                height: 28,
                gap: 6,
              }}
            >
              <SelectValue placeholder={t('topbar.portfolio_selector')} />
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
          <span style={{ fontSize: 12, color: "var(--layout-text-faint)" }}>
            {t('topbar.no_portfolio')}
          </span>
        )}
      </div>

      {/* Right — Theme toggle (visual) */}
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        style={{
          background: "var(--layout-surface)",
          border: "1px solid var(--layout-surface-border)",
          borderRadius: 9999,
          padding: 6,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--layout-text-muted)",
        }}
      >
        {resolvedTheme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
      </button>
    </div>
  );
}
