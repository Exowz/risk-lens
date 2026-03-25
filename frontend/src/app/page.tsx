"use client";

/**
 * Landing page — public, always accessible at /.
 *
 * Sections: Navbar (Aceternity Resizable), Hero (BackgroundBeams + Spotlight + Meteors),
 * Features (MagicCard + BorderBeam), Mode showcase, Tech marquee, Final CTA, Footer.
 *
 * Depends on: ui/resizable-navbar, ui/background-beams, ui/spotlight, ui/meteors,
 *             ui/blur-text, ui/word-rotate, ui/shimmer-button, ui/magic-card,
 *             ui/border-beam, ui/marquee, ui/blur-fade, ui/animated-shiny-text,
 *             ui/number-ticker, @phosphor-icons/react, lib/auth/client, next-intl
 * Used by: / route (public)
 */

import Link from "next/link";
import {
  ShieldWarning,
  Brain,
  ChartLineUp,
  Lightning,
  Check,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { BlurFade } from "@/components/ui/blur-fade";
import { BlurText } from "@/components/ui/blur-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { MagicCard } from "@/components/ui/magic-card";
import { Marquee } from "@/components/ui/marquee";
import { Meteors } from "@/components/ui/meteors";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Spotlight } from "@/components/ui/spotlight";
import { WordRotate } from "@/components/ui/word-rotate";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "@/components/ui/resizable-navbar";
import { useSession } from "@/lib/auth/client";

// ── Tech stack items (not translatable — brand names) ──

const TECH_ITEMS = [
  "Next.js 16",
  "FastAPI",
  "PostgreSQL 16",
  "Mistral AI",
  "PyPortfolioOpt",
  "D3.js",
  "Recharts",
  "BetterAuth",
  "yfinance",
  "Framer Motion",
  "Tailwind CSS",
  "TypeScript",
];

// ── Page ──

export default function LandingPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const t = useTranslations();

  // ── Nav items (inside component to access t()) ──

  const navLinks = [
    { name: t("landing.features_badge"), link: "#features" },
    { name: t("landing.nav_demo"), link: "#demo" },
    { name: t("landing.nav_about"), link: "#about" },
  ];

  // ── Feature cards data ──

  const features = [
    {
      icon: ShieldWarning,
      iconColor: "text-blue-400",
      title: t("landing.feature1_title"),
      description: t("landing.feature1_desc"),
      tags: ["VaR", "CVaR", "Monte Carlo"],
    },
    {
      icon: Brain,
      iconColor: "text-purple-400",
      title: t("landing.feature2_title"),
      description: t("landing.feature2_desc"),
      tags: ["Mistral AI", "Explications", "Mode Débutant/Expert"],
    },
    {
      icon: ChartLineUp,
      iconColor: "text-emerald-400",
      title: t("landing.feature3_title"),
      description: t("landing.feature3_desc"),
      tags: ["Frontière efficiente", "Max Sharpe", "Min Variance"],
    },
    {
      icon: Lightning,
      iconColor: "text-amber-400",
      title: t("landing.feature4_title"),
      description: t("landing.feature4_desc"),
      tags: ["2008", "COVID-19", "Taux 2022"],
    },
  ];

  // ── Mode showcase data ──

  const beginnerRows = [
    { label: t("metrics.beginner.var_95"), value: "-2.52%", color: "text-red-500" },
    { label: t("metrics.beginner.sharpe"), value: "0.851", color: "text-blue-400" },
    { label: t("metrics.beginner.volatility"), value: "26.53%", color: "text-amber-400" },
  ];

  const expertRows = [
    { label: t("metrics.expert.var_95"), value: "-2.52%", color: "text-red-500" },
    { label: t("metrics.expert.sharpe"), value: "0.851", color: "text-blue-400" },
    { label: t("metrics.expert.volatility"), value: "26.53%", color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0b0e] overflow-y-auto">
      {/* ───── Navbar ───── */}
      <Navbar>
        <NavBody>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">R</span>
            </div>
            <span className="text-sm font-semibold text-white">RiskLens</span>
          </Link>

          {/* Center nav */}
          <NavItems items={navLinks} />

          {/* Right CTAs */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/overview">
                <NavbarButton variant="primary">{t("landing.cta_dashboard")}</NavbarButton>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <NavbarButton variant="secondary">{t("landing.cta_login")}</NavbarButton>
                </Link>
                <Link href="/register">
                  <NavbarButton variant="primary">{t("landing.cta_start")}</NavbarButton>
                </Link>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile nav */}
        <MobileNav>
          <MobileNavHeader>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-white">R</span>
              </div>
              <span className="text-sm font-semibold text-white">RiskLens</span>
            </Link>
            <MobileNavToggle isOpen={false} onClick={() => {}} />
          </MobileNavHeader>
          <MobileNavMenu isOpen={false} onClose={() => {}}>
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.link}
                className="block py-2 text-sm text-white/60 hover:text-white"
              >
                {item.name}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              {isLoggedIn ? (
                <Link href="/overview">
                  <ShimmerButton className="w-full" shimmerSize="0.05em">
                    {t("landing.cta_dashboard")}
                  </ShimmerButton>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-white/60 text-center py-2">
                    {t("landing.cta_login")}
                  </Link>
                  <Link href="/register">
                    <ShimmerButton className="w-full" shimmerSize="0.05em">
                      {t("landing.cta_start")}
                    </ShimmerButton>
                  </Link>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* ───── Hero Section ───── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <BackgroundBeams className="absolute inset-0" />
        <Meteors number={12} />
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#3b82f6"
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center px-6">
          {/* Badge */}
          <BlurFade delay={0.1} inView>
            <div className="flex justify-center mb-6">
              <AnimatedShinyText className="text-xs text-white/60">
                {t("landing.badge")}
              </AnimatedShinyText>
            </div>
          </BlurFade>

          {/* Title */}
          <BlurFade delay={0.2} inView>
            <BlurText
              text={t("landing.title")}
              className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
            />
          </BlurFade>

          {/* Cycling subtitle */}
          <BlurFade delay={0.4} inView>
            <div className="flex items-center justify-center gap-2 mt-6 text-2xl text-white/40">
              <span>{t("landing.subtitle_prefix")}</span>
              <WordRotate
                words={t("landing.words").split(",")}
                className="text-2xl text-blue-400"
              />
              <span>{t("landing.subtitle_suffix")}</span>
            </div>
          </BlurFade>

          {/* Description */}
          <BlurFade delay={0.5} inView>
            <p className="text-base text-white/50 max-w-xl mx-auto mt-4">
              {t("landing.description")}
            </p>
          </BlurFade>

          {/* CTAs */}
          <BlurFade delay={0.6} inView>
            <div className="flex items-center justify-center gap-4 mt-10">
              {isLoggedIn ? (
                <Link href="/overview">
                  <ShimmerButton
                    shimmerColor="#ffffff"
                    background="rgba(255,255,255,0.05)"
                    className="px-8 py-3"
                  >
                    {t("landing.cta_dashboard")}
                  </ShimmerButton>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <ShimmerButton
                      shimmerColor="#ffffff"
                      background="rgba(255,255,255,0.05)"
                      className="px-8 py-3"
                    >
                      {t("landing.cta_start")}
                    </ShimmerButton>
                  </Link>
                  <a href="#demo">
                    <button className="border border-white/20 text-white px-6 py-3 rounded-full hover:border-white/40 hover:bg-white/[0.04] transition-colors text-sm">
                      {t("landing.cta_demo")}
                    </button>
                  </a>
                </>
              )}
            </div>
          </BlurFade>

          {/* Social proof */}
          <BlurFade delay={0.7} inView>
            <p className="text-xs text-white/25 mt-4">
              {t("landing.social_proof")}
            </p>
          </BlurFade>

          {/* Stats row */}
          <BlurFade delay={0.8} inView>
            <div className="flex items-center justify-center gap-0 mt-16">
              <div className="flex-1 text-center">
                <NumberTicker
                  value={10000}
                  className="font-mono text-3xl text-white"
                />
                <p className="text-xs text-white/40 mt-1">{t("landing.stat_simulations")}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex-1 text-center">
                <NumberTicker
                  value={3}
                  className="font-mono text-3xl text-white"
                />
                <p className="text-xs text-white/40 mt-1">{t("landing.stat_crises")}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex-1 text-center">
                <NumberTicker
                  value={6}
                  className="font-mono text-3xl text-white"
                />
                <p className="text-xs text-white/40 mt-1">{t("landing.stat_metrics")}</p>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-16">
              <div className="flex justify-center mb-4">
                <AnimatedShinyText className="text-xs text-white/60">
                  {t("landing.features_badge")}
                </AnimatedShinyText>
              </div>
              <BlurText
                text={t("landing.features_title")}
                className="text-3xl font-bold text-white"
              />
              <p className="text-base text-white/40 mt-3">
                {t("landing.features_subtitle")}
              </p>
            </div>
          </BlurFade>

          {/* 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <BlurFade key={idx} delay={0.1 + idx * 0.1} inView>
                <MagicCard
                  className="relative bg-[#161920] border border-white/[0.08] rounded-xl overflow-hidden"
                  gradientColor="#1a2744"
                >
                  <div className="p-6">
                    <feature.icon
                      size={32}
                      weight="duotone"
                      className={`${feature.iconColor} mb-3`}
                    />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/50 mb-4">
                      {feature.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {feature.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1 text-white/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <BorderBeam
                    colorFrom="#3b82f6"
                    colorTo="#10b981"
                    duration={8}
                  />
                </MagicCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Beginner/Expert Section ───── */}
      <section
        id="demo"
        className="relative py-24 px-6"
        style={{ background: "rgba(255,255,255,0.015)" }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-16">
              <div className="flex justify-center mb-4">
                <AnimatedShinyText className="text-xs text-white/60">
                  {t("landing.demo_badge")}
                </AnimatedShinyText>
              </div>
              <BlurText
                text={t("landing.demo_title")}
                className="text-3xl font-bold text-white"
              />
              <p className="text-base text-white/40 mt-3">
                {t("landing.demo_subtitle")}
              </p>
            </div>
          </BlurFade>

          {/* Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Beginner */}
            <BlurFade delay={0.2} inView>
              <MagicCard
                className="relative rounded-xl overflow-hidden bg-[#0d1a13] border border-emerald-500/15"
                gradientColor="#0f2a1a"
              >
                <div className="p-6">
                  <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-medium text-emerald-400 mb-5">
                    {t("landing.demo_beginner")}
                  </span>

                  <div className="space-y-3">
                    {beginnerRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5"
                      >
                        <span className="text-sm text-white/60">{row.label}</span>
                        <span className={`font-mono text-sm ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-white/30 mt-5">
                    {t("landing.demo_beginner_footer")}
                  </p>
                </div>
              </MagicCard>
            </BlurFade>

            {/* Expert */}
            <BlurFade delay={0.3} inView>
              <MagicCard
                className="relative rounded-xl overflow-hidden bg-[#0d1221] border border-blue-500/15"
                gradientColor="#0f1a2a"
              >
                <div className="p-6">
                  <span className="inline-block rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-0.5 text-xs font-medium text-blue-400 mb-5">
                    {t("landing.demo_expert")}
                  </span>

                  <div className="space-y-3">
                    {expertRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5"
                      >
                        <span className="text-sm text-white/60">{row.label}</span>
                        <span className={`font-mono text-sm ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-mono text-white/25 mt-3">
                    Sharpe = (Rp - Rf) / σp
                  </p>
                  <p className="text-xs text-white/30 mt-2">
                    {t("landing.demo_expert_footer")}
                  </p>
                </div>
              </MagicCard>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ───── Tech Stack Section ───── */}
      <section id="about" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <AnimatedShinyText className="text-xs text-white/60">
                  {t("landing.tech_badge")}
                </AnimatedShinyText>
              </div>
              <BlurText
                text={t("landing.tech_title")}
                className="text-3xl font-bold text-white"
              />
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <Marquee pauseOnHover className="[--duration:30s]">
              {TECH_ITEMS.map((item) => (
                <span
                  key={item}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-2.5 text-sm text-white/50 whitespace-nowrap"
                >
                  {item}
                </span>
              ))}
            </Marquee>
          </BlurFade>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-white/[0.03]">
        <BlurFade delay={0.1} inView>
          <div className="text-center">
            <BlurText
              text={t("landing.cta_final")}
              className="text-4xl font-bold text-white"
            />
            <p className="text-base text-white/40 mt-2 mb-8">
              {t("landing.cta_final_subtitle")}
            </p>
            <Link href={isLoggedIn ? "/overview" : "/register"}>
              <ShimmerButton
                shimmerColor="#ffffff"
                background="rgba(255,255,255,0.05)"
                className="px-8 py-4 text-base"
              >
                {isLoggedIn ? t("landing.cta_dashboard") : t("landing.cta_now")}
              </ShimmerButton>
            </Link>
          </div>
        </BlurFade>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/[0.06] py-8 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">RiskLens</span>
            <span className="text-xs text-white/30">
              {t("landing.footer_project")}
            </span>
          </div>
          <span className="text-xs text-white/30 text-center sm:text-right">
            {t("landing.footer_disclaimer")}
          </span>
        </div>
      </footer>
    </div>
  );
}
