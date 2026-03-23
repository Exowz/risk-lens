"use client";

/**
 * Risk Profiler Express — 6-step onboarding modal.
 *
 * Triggered when: user is logged in + has zero portfolios.
 * Steps: Intro (TypewriterEffect) → 4 questions → Result (MultiStepLoader → profile).
 *
 * Depends on: shadcn Dialog, Aceternity TypewriterEffect, MultiStepLoader,
 *             Framer Motion, lib/api/profile.ts
 * Used by: app/(dashboard)/layout.tsx
 */

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

import {
  useSubmitRiskProfiler,
  type RiskProfilerRequest,
  type RiskProfilerResponse,
} from "@/lib/api/profile";

// ── Types ──

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface OptionCard {
  value: string;
  label: string;
  description: string;
}

// ── Constants ──

const HORIZON_OPTIONS: OptionCard[] = [
  { value: "court", label: "Court terme", description: "Moins de 2 ans" },
  { value: "moyen", label: "Moyen terme", description: "2 à 5 ans" },
  { value: "long", label: "Long terme", description: "Plus de 5 ans" },
];

const LOSS_TOLERANCE_OPTIONS: OptionCard[] = [
  { value: "faible", label: "Faible", description: "Moins de 10% de perte" },
  { value: "modere", label: "Modérée", description: "10 à 25% de perte" },
  { value: "eleve", label: "Élevée", description: "Plus de 25% de perte" },
];

const OBJECTIVE_OPTIONS: OptionCard[] = [
  {
    value: "preservation",
    label: "Préserver mon capital",
    description: "Sécurité avant tout",
  },
  {
    value: "equilibre",
    label: "Équilibre rendement/risque",
    description: "Un compromis raisonnable",
  },
  {
    value: "croissance",
    label: "Maximiser la croissance",
    description: "Rendement maximum",
  },
];

const EXPERIENCE_OPTIONS: OptionCard[] = [
  {
    value: "debutant",
    label: "Débutant",
    description: "Je découvre l'investissement",
  },
  {
    value: "intermediaire",
    label: "Intermédiaire",
    description: "Quelques années d'expérience",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Investisseur aguerri",
  },
];

const LOADING_STATES = [
  { text: "Analyse de votre profil..." },
  { text: "Calcul des allocations optimales..." },
  { text: "Génération de vos recommandations..." },
];

const TYPEWRITER_WORDS = [
  { text: "Bienvenue" },
  { text: "sur" },
  { text: "RiskLens." },
  { text: "Avant" },
  { text: "de" },
  { text: "commencer," },
  { text: "laissez-nous" },
  { text: "comprendre" },
  { text: "votre" },
  { text: "profil" },
  { text: "d'investisseur." },
];

// ── Sub-components ──

function QuestionStep({
  question,
  options,
  selected,
  onSelect,
}: {
  question: string;
  options: OptionCard[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-lg font-medium text-foreground text-center">
        {question}
      </h2>
      <div className="grid gap-4 w-full max-w-md">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`rounded-xl border p-5 text-left transition-all cursor-pointer ${
              selected === option.value
                ? "border-white/30 bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                : "border-border bg-card hover:border-white/20 hover:scale-[1.02]"
            }`}
          >
            <p className="text-sm font-medium text-foreground">
              {option.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultDisplay({
  result,
  onCreatePortfolio,
  onSkip,
}: {
  result: RiskProfilerResponse;
  onCreatePortfolio: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          {result.profile_name}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {result.profile_description}
        </p>
      </div>

      {/* Risk score */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Score de risque</span>
          <span className="font-mono text-sm text-foreground">
            {result.risk_score}/10
          </span>
        </div>
        <Progress value={result.risk_score * 10} className="h-2" />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Conservateur</span>
          <span className="text-[10px] text-muted-foreground">Agressif</span>
        </div>
      </div>

      {/* Suggested tickers */}
      <div className="w-full space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Allocation suggérée
        </h3>
        {result.suggested_tickers.map((ticker) => (
          <div
            key={ticker.ticker}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-sm font-medium text-foreground">
                {ticker.ticker}
              </span>
              <span className="font-mono text-sm text-blue-400">
                {(ticker.weight * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={ticker.weight * 100} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">{ticker.reason}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full mt-2">
        <Button onClick={onCreatePortfolio} className="w-full">
          Créer mon portefeuille avec cette allocation
        </Button>
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Commencer sans profil
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──

export function RiskProfilerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [showButton, setShowButton] = useState(false);
  const [answers, setAnswers] = useState<Partial<RiskProfilerRequest>>({});
  const [result, setResult] = useState<RiskProfilerResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const submitMutation = useSubmitRiskProfiler();

  const handleAnswer = useCallback(
    (key: keyof RiskProfilerRequest, value: string) => {
      const updated = { ...answers, [key]: value };
      setAnswers(updated);

      // Auto-advance after selection with a short delay
      setTimeout(() => {
        if (step < 5) {
          setStep((step + 1) as Step);
        } else if (step === 5) {
          // Last question → submit to Mistral
          setStep(6);
          setIsAnalyzing(true);

          submitMutation.mutate(updated as RiskProfilerRequest, {
            onSuccess: (data) => {
              setResult(data);
              setIsAnalyzing(false);
            },
            onError: () => {
              setIsAnalyzing(false);
            },
          });
        }
      }, 300);
    },
    [answers, step, submitMutation],
  );

  const handleCreatePortfolio = useCallback(() => {
    if (!result) return;

    // Build query params for portfolio pre-fill
    const assets = result.suggested_tickers
      .map((t) => `${t.ticker}:${t.weight}`)
      .join(",");
    const profileName = result.profile_name;

    onClose();
    router.push(
      `/portfolio?prefill=true&name=${encodeURIComponent(profileName)}&assets=${encodeURIComponent(assets)}`,
    );
  }, [result, onClose, router]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const progressValue = (step / 6) * 100;

  return (
    <>
      <MultiStepLoader
        loadingStates={LOADING_STATES}
        loading={isAnalyzing}
        duration={1500}
        loop
      />

      <Dialog open={open && !isAnalyzing} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Profil de risque</DialogTitle>

          {/* Progress bar */}
          <div className="mb-6">
            <Progress value={progressValue} className="h-1" />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {step}/6
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 — Intro */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-8 py-8"
              >
                <TypewriterEffect
                  words={TYPEWRITER_WORDS}
                  className="text-lg sm:text-xl font-medium"
                  cursorClassName="h-5 bg-blue-500"
                />

                {/* Show button after typewriter completes (~3.3s for 11 words) */}
                {!showButton && (
                  <div className="h-10">
                    {/* Delay button appearance */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.5 }}
                      onAnimationComplete={() => setShowButton(true)}
                    />
                  </div>
                )}
                {showButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button onClick={() => setStep(2)} size="lg">
                      Commencer
                    </Button>
                  </motion.div>
                )}

                {/* Fallback: show button after delay even if animation doesn't fire */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showButton ? 0 : 1 }}
                  transition={{ delay: 4 }}
                  onAnimationComplete={() => {
                    if (!showButton) setShowButton(true);
                  }}
                  className="absolute"
                />
              </motion.div>
            )}

            {/* Step 2 — Horizon */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <QuestionStep
                  question="Sur quelle durée souhaitez-vous investir ?"
                  options={HORIZON_OPTIONS}
                  selected={answers.horizon ?? null}
                  onSelect={(v) => handleAnswer("horizon", v)}
                />
              </motion.div>
            )}

            {/* Step 3 — Loss tolerance */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <QuestionStep
                  question="Quelle perte maximale pouvez-vous supporter ?"
                  options={LOSS_TOLERANCE_OPTIONS}
                  selected={answers.loss_tolerance ?? null}
                  onSelect={(v) => handleAnswer("loss_tolerance", v)}
                />
              </motion.div>
            )}

            {/* Step 4 — Objective */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <QuestionStep
                  question="Quel est votre objectif principal ?"
                  options={OBJECTIVE_OPTIONS}
                  selected={answers.objective ?? null}
                  onSelect={(v) => handleAnswer("objective", v)}
                />
              </motion.div>
            )}

            {/* Step 5 — Experience */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <QuestionStep
                  question="Quel est votre niveau d'expérience en investissement ?"
                  options={EXPERIENCE_OPTIONS}
                  selected={answers.experience ?? null}
                  onSelect={(v) => handleAnswer("experience", v)}
                />
              </motion.div>
            )}

            {/* Step 6 — Result */}
            {step === 6 && !isAnalyzing && result && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <ResultDisplay
                  result={result}
                  onCreatePortfolio={handleCreatePortfolio}
                  onSkip={handleSkip}
                />
              </motion.div>
            )}

            {/* Step 6 — Error state */}
            {step === 6 && !isAnalyzing && !result && submitMutation.isError && (
              <motion.div
                key="step-6-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <p className="text-sm text-muted-foreground">
                  Analyse temporairement indisponible.
                </p>
                <Button variant="outline" onClick={handleSkip}>
                  Continuer sans profil
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
