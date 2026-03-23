"use client";

/**
 * Animated tooltip wrapper for financial metrics.
 *
 * Uses Framer Motion spring animation (Aceternity-style) on hover.
 * In expert mode: shows technical label + expert tooltip.
 * In beginner mode: shows simplified label + vulgarization tooltip.
 *
 * Depends on: motion/react, lib/store/mode-context.tsx
 * Used by: risk, markowitz, stress, dashboard pages
 */

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { useMode } from "@/lib/store/mode-context";
import { Info } from "lucide-react";

/** Known metric keys with beginner/expert explanations. */
const METRIC_EXPLANATIONS: Record<
  string,
  { beginner: string; tipBeginner: string; tipExpert: string }
> = {
  var_95: {
    beginner: "Perte max journalière (1 jour sur 20)",
    tipBeginner:
      "Sur 20 jours de trading, vous perdrez plus que ce montant une fois.",
    tipExpert:
      "Value at Risk at 95% confidence — 5th percentile of the daily P&L distribution.",
  },
  var_99: {
    beginner: "Perte max journalière (1 jour sur 100)",
    tipBeginner:
      "Sur 100 jours de trading, vous perdrez plus que ce montant une fois.",
    tipExpert:
      "Value at Risk at 99% confidence — 1st percentile of the daily P&L distribution.",
  },
  cvar: {
    beginner: "Perte moyenne dans les pires cas",
    tipBeginner:
      "Quand les choses tournent vraiment mal, voici la perte moyenne attendue.",
    tipExpert:
      "Conditional VaR (Expected Shortfall) — mean loss beyond the VaR threshold. A coherent risk measure capturing tail risk.",
  },
  sharpe: {
    beginner: "Rendement par unité de risque",
    tipBeginner:
      "Plus c'est élevé, mieux c'est. Au-dessus de 1.0 = bon rendement pour le risque pris.",
    tipExpert:
      "Sharpe Ratio — excess return per unit of volatility. (R_p - R_f) / σ_p using risk-free rate of 0.",
  },
  drawdown: {
    beginner: "Chute maximale depuis le sommet",
    tipBeginner:
      "La pire baisse que votre portefeuille a subie depuis son plus haut point.",
    tipExpert:
      "Maximum Drawdown — largest peak-to-trough decline in portfolio value over the observation period.",
  },
  p_loss: {
    beginner: "Probabilité de perdre de l'argent",
    tipBeginner:
      "Pourcentage de scénarios simulés qui terminent en perte.",
    tipExpert:
      "Monte Carlo P(Loss) — fraction of simulated terminal values below the initial investment.",
  },
  volatility: {
    beginner: "Variabilité du portefeuille",
    tipBeginner:
      "Plus c'est élevé, plus votre portefeuille fait le yoyo. Mesure l'instabilité.",
    tipExpert:
      "Annualized Volatility — standard deviation of daily returns × √252.",
  },
  return: {
    beginner: "Rendement annuel",
    tipBeginner:
      "Combien votre portefeuille gagne (ou perd) en moyenne par an.",
    tipExpert:
      "Annualized Return — geometric mean of daily returns scaled to 252 trading days.",
  },
  recovery: {
    beginner: "Temps pour se remettre",
    tipBeginner:
      "Nombre de jours pour retrouver le niveau d'avant la crise.",
    tipExpert:
      "Recovery period — trading days from the trough back to the pre-crisis peak.",
  },
};

interface MetricTooltipProps {
  /** Key matching METRIC_EXPLANATIONS (e.g. "var_95", "sharpe") */
  metricKey: string;
  /** Technical/expert label */
  label: string;
  /** The metric value to display */
  children: React.ReactNode;
}

export function MetricTooltip({
  metricKey,
  label,
  children,
}: MetricTooltipProps) {
  const { mode } = useMode();
  const explanation = METRIC_EXPLANATIONS[metricKey];
  const [hovered, setHovered] = useState(false);
  const springConfig = { stiffness: 200, damping: 15 };
  const x = useMotionValue(0);
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-30, 30]),
    springConfig,
  );

  const displayLabel =
    mode === "beginner" && explanation ? explanation.beginner : label;
  const tipText = explanation
    ? mode === "beginner"
      ? explanation.tipBeginner
      : explanation.tipExpert
    : null;

  if (!tipText) {
    return (
      <div>
        <p className="text-xs text-muted-foreground">{displayLabel}</p>
        {children}
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative inline-flex"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(e) => {
          const half = e.currentTarget.offsetWidth / 2;
          x.set(e.nativeEvent.offsetX - half);
        }}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              style={{ translateX }}
              className="absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full whitespace-normal"
            >
              <div className="max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-xs text-card-foreground shadow-xl">
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                {tipText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="inline-flex cursor-help items-center gap-1 text-xs text-muted-foreground">
          {displayLabel}
          <Info className="size-3 text-muted-foreground/60" />
        </p>
      </div>
      {children}
    </div>
  );
}
