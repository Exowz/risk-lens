"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  const t = useTranslations();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center pt-32 pb-48 md:pb-64">
      {/* Massive Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-white/[0.015] blur-[180px] rounded-[100%]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-12 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 backdrop-blur-md"
        >
          <AnimatedShinyText className="text-sm font-medium text-white/60">
            {t("landing.badge")}
          </AnimatedShinyText>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-6xl sm:text-8xl md:text-9xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 leading-[1.05]"
        >
          {t("landing.title_line1")}
          <br />
          {t("landing.title_line2")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-12 max-w-2xl text-xl sm:text-2xl font-light tracking-tight text-white/40 leading-relaxed"
        >
          {t("landing.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link
            href={isLoggedIn ? "/overview" : "/register"}
            className="group flex h-14 items-center gap-3 rounded-full bg-white px-10 text-base font-semibold text-black transition-all hover:bg-white/90 hover:scale-[1.02]"
          >
            {isLoggedIn ? t("landing.cta_dashboard") : t("landing.cta_start")}
            <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
