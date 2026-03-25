"use client";

import { useTranslations } from "next-intl";

export function LandingFooter() {
  const t = useTranslations();

  return (
    <footer className="border-t border-white/[0.05] bg-black px-6 py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 md:flex-row">
        <div className="flex items-center gap-3 text-white/30">
          <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">R</span>
          </div>
          <span className="text-base font-medium tracking-tight">RiskLens</span>
        </div>
        <div className="flex gap-10 text-sm text-white/30">
          <span className="hover:text-white/60 transition-colors cursor-pointer">{t("landing.footer_project")}</span>
          <span className="hover:text-white/60 transition-colors cursor-pointer">{t("landing.footer_disclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}
