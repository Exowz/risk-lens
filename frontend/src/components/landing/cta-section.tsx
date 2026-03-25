"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

interface CTASectionProps {
  isLoggedIn: boolean;
}

export function CTASection({ isLoggedIn }: CTASectionProps) {
  const t = useTranslations();

  return (
    <section className="relative px-6 py-48 md:py-64 border-t border-white/[0.05] bg-[#050505]">
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-medium tracking-tighter text-white leading-tight"
        >
          {t("landing.cta_final")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="mt-10 text-xl text-white/40"
        >
          {t("landing.cta_final_subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-16"
        >
          <Link
            href={isLoggedIn ? "/overview" : "/register"}
            className="group inline-flex h-16 items-center gap-3 rounded-full bg-white px-12 text-base font-semibold text-black transition-all hover:bg-white/90 hover:scale-[1.02]"
          >
            {isLoggedIn ? t("landing.cta_dashboard") : t("landing.cta_now")}
            <ArrowRight size={20} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
