"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";

import { useLocaleStore, type Locale } from "@/lib/store/locale-store";

const LANG_OPTIONS: { value: Locale; flag: string; label: string }[] = [
  { value: "fr", flag: "🇫🇷", label: "Français" },
  { value: "en", flag: "🇬🇧", label: "English" },
  { value: "es", flag: "🇪🇸", label: "Español" },
  { value: "zh", flag: "🇨🇳", label: "中文" },
];

interface LandingNavbarProps {
  isLoggedIn: boolean;
}

export function LandingNavbar({ isLoggedIn }: LandingNavbarProps) {
  const t = useTranslations();
  const router = useRouter();
  const { locale, setLocale } = useLocaleStore();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    if (langOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);

  const currentLang = LANG_OPTIONS.find((l) => l.value === locale) ?? LANG_OPTIONS[0];

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setLangOpen(false);
    router.refresh();
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-black/50 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-12">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.08] transition-colors group-hover:bg-white/[0.08]">
            <span className="text-xs font-bold text-white">R</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">RiskLens</span>
        </Link>

        <div className="flex items-center gap-8">
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 text-xs font-medium text-white/50 transition-colors hover:text-white"
            >
              <span className="text-base">{currentLang.flag}</span>
              <CaretDown size={12} weight="bold" className={`transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full z-50 mt-4 w-44 rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-2 shadow-2xl backdrop-blur-xl"
                >
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleLocaleChange(opt.value)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                        locale === opt.value
                          ? "bg-white/10 text-white"
                          : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{opt.flag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-white/[0.1]" />

          {isLoggedIn ? (
            <Link
              href="/overview"
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition-all hover:bg-white/90 hover:scale-105"
            >
              {t("landing.cta_dashboard")}
            </Link>
          ) : (
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-xs font-medium text-white/50 transition-colors hover:text-white">
                {t("landing.cta_login")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition-all hover:bg-white/90 hover:scale-105"
              >
                {t("landing.cta_start")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
