"use client";

/**
 * Landing page — public, no auth required.
 *
 * Sections: Hero (BackgroundBeams + Spotlight), Feature cards (WobbleCard),
 * Mode showcase (Beginner/Expert), Final CTA, Footer.
 *
 * Depends on: ui/background-beams, ui/spotlight, ui/blur-text,
 *             ui/wobble-card, @phosphor-icons/react
 * Used by: /welcome route (unauthenticated root redirect)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldWarning,
  Brain,
  ChartLineUp,
  Lightning,
  Check,
} from "@phosphor-icons/react";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { BlurText } from "@/components/ui/blur-text";
import { Spotlight } from "@/components/ui/spotlight";
import { WobbleCard } from "@/components/ui/wobble-card";

// ── Cycling words for tagline ──

const WORDS = [
  "portefeuilles",
  "risques",
  "stratégies",
  "décisions",
  "opportunités",
];

function CyclingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative min-w-[220px] text-left">
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[index]}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="inline-block text-blue-400"
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── Feature cards data ──

const FEATURES = [
  {
    icon: ShieldWarning,
    title: "Analyse de risque quantitative",
    description:
      "VaR, CVaR, Monte Carlo, Sharpe ratio. La même rigueur que les banques d'investissement.",
  },
  {
    icon: Brain,
    title: "Intelligence artificielle",
    description:
      "Mistral analyse vos résultats et les explique en langage naturel, adapté à votre niveau.",
  },
  {
    icon: ChartLineUp,
    title: "Optimisation Markowitz",
    description:
      "Visualisez la frontière efficiente et découvrez le portefeuille optimal pour votre profil.",
  },
  {
    icon: Lightning,
    title: "Stress testing historique",
    description:
      "Simulez l'impact de 2008, COVID-19 et 2022 sur votre portefeuille en temps réel.",
  },
];

// ── Mode showcase items ──

const BEGINNER_ITEMS = [
  "Perte max journalière (1 jour sur 20)",
  "Score rendement/risque",
  "Variabilité du portefeuille",
];

const EXPERT_ITEMS = [
  "VaR 95% historique",
  "Ratio de Sharpe annualisé",
  "Volatilité annualisée (σ × √252)",
];

// ── Page ──

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#0a0b0e] overflow-y-auto">
      {/* ───── Section 1: Hero ───── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <BackgroundBeams className="absolute inset-0" />
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#3b82f6"
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="inline-block rounded-full bg-white/[0.06] border border-white/10 px-4 py-1 text-xs text-white/60">
              Projet Bachelor Data &amp; AI — ECE Paris 2025-2026
            </span>
          </motion.div>

          {/* Title */}
          <div className="mt-8">
            <BlurText
              text="Démocratisez votre analyse de risque financier"
              className="text-4xl sm:text-5xl font-bold tracking-tight text-white"
            />
          </div>

          {/* Cycling tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-xl text-white/50 mt-6"
          >
            Analysez vos <CyclingWord /> avec l&apos;IA
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-base text-white/50 max-w-xl mx-auto mt-4"
          >
            RiskLens combine la finance quantitative institutionnelle avec
            l&apos;intelligence artificielle pour rendre l&apos;analyse de
            risque accessible à tous — du novice à l&apos;expert.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <Link href="/register">
              <button className="bg-white text-black font-medium px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors text-sm">
                Commencer
              </button>
            </Link>
            <Link href="/login">
              <button className="border border-white/20 text-white px-6 py-2.5 rounded-full hover:border-white/40 hover:bg-white/[0.04] transition-colors text-sm">
                Se connecter
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ───── Section 2: Feature cards ───── */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
              >
                <WobbleCard containerClassName="bg-[#161920] border border-white/[0.08] rounded-xl">
                  <div className="p-6">
                    <feature.icon
                      size={28}
                      weight="duotone"
                      className="text-blue-400 mb-3"
                    />
                    <h3 className="text-base font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/50">
                      {feature.description}
                    </p>
                  </div>
                </WobbleCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Section 3: Mode showcase ───── */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <BlurText
              text="Conçu pour tous les profils"
              className="text-3xl font-semibold text-white"
            />
            <p className="text-base text-white/50 mt-3">
              Passez du mode Débutant au mode Expert en un clic
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {/* Beginner */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-left"
            >
              <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-medium text-emerald-400 mb-4">
                Débutant
              </span>
              <ul className="space-y-3">
                {BEGINNER_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                    <Check size={16} weight="bold" className="text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-white/40 mt-4">
                Explications en langage courant
              </p>
            </motion.div>

            {/* Expert */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 text-left"
            >
              <span className="inline-block rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-0.5 text-xs font-medium text-blue-400 mb-4">
                Expert
              </span>
              <ul className="space-y-3">
                {EXPERT_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                    <Check size={16} weight="bold" className="text-blue-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-white/40 mt-4">
                Métriques quantitatives complètes
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── Section 4: Final CTA ───── */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-white/[0.03]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold text-white">
            Prêt à analyser votre portefeuille ?
          </h2>
          <div className="mt-8">
            <Link href="/register">
              <button className="bg-white text-black font-semibold px-8 py-3 rounded-full text-base hover:bg-white/90 transition-colors">
                Commencer maintenant
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/[0.06] py-6 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-white/30">
            RiskLens — ECE Paris 2025-2026
          </span>
          <span className="text-xs text-white/30 text-center sm:text-right">
            Les données sont fournies par Yahoo Finance. Ne constitue pas un
            conseil en investissement.
          </span>
        </div>
      </footer>
    </div>
  );
}
