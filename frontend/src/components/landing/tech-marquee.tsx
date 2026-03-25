"use client";

import { useTranslations } from "next-intl";

import { Marquee } from "@/components/ui/marquee";

const TECH_ITEMS = [
  "Next.js 16", "FastAPI", "PostgreSQL 16", "Mistral AI",
  "PyPortfolioOpt", "D3.js", "Recharts", "BetterAuth",
  "yfinance", "Framer Motion", "TypeScript", "Docker",
];

export function TechMarquee() {
  const t = useTranslations();

  return (
    <section className="relative border-t border-white/[0.05] py-48 md:py-64 overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-black to-transparent z-10" />

      <div className="mx-auto max-w-5xl mb-20 text-center relative z-20">
        <p className="text-base font-medium tracking-widest uppercase text-white/30">{t("landing.tech_title")}</p>
      </div>

      <Marquee pauseOnHover className="[--duration:50s]">
        {TECH_ITEMS.map((item) => (
          <span
            key={item}
            className="mx-8 text-4xl md:text-6xl font-semibold tracking-tighter text-white/10 transition-colors hover:text-white/40"
          >
            {item}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
