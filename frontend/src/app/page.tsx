"use client";

/**
 * Landing page — public, always accessible at /.
 *
 * Minimal, text-forward, product screenshot,
 * massive typography, dark premium, EXPANSIVE WHITESPACE.
 */

import { useEffect, useState } from "react";

import { useSession } from "@/lib/auth/client";
import {
  LandingNavbar,
  HeroSection,
  ProductSection,
  ModeSection,
  TechMarquee,
  CTASection,
  LandingFooter,
} from "@/components/landing";

export default function LandingPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isLoggedIn = mounted && !!session;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-y-auto font-sans">
      <LandingNavbar isLoggedIn={isLoggedIn} />
      <HeroSection isLoggedIn={isLoggedIn} />
      <ProductSection />
      <ModeSection />
      <TechMarquee />
      <CTASection isLoggedIn={isLoggedIn} />
      <LandingFooter />
    </div>
  );
}
