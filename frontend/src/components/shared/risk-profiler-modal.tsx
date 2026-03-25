"use client";

/**
 * Risk Profiler Express — 6-step onboarding modal.
 *
 * Triggered when: user is logged in + has zero portfolios.
 * Steps: Intro (TypewriterEffect) → 4 questions → Result (MultiStepLoader → profile).
 *
 * Depends on: shadcn Dialog, Aceternity TypewriterEffect, MultiStepLoader,
 *             Framer Motion, lib/api/profile.ts, next-intl
 * Used by: app/(dashboard)/layout.tsx
 */

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
                ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                : "border-border bg-card hover:border-muted-foreground hover:scale-[1.02]"
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
  t,
}: {
  result: RiskProfilerResponse;
  onCreatePortfolio: () => void;
  onSkip: () => void;
  t: ReturnType<typeof useTranslations>;
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
          <span className="text-xs text-muted-foreground">{t('risk_score_label')}</span>
          <span className="font-mono text-sm text-foreground">
            {result.risk_score}/10
          </span>
        </div>
        <Progress value={result.risk_score * 10} className="h-2" />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{t('conservative')}</span>
          <span className="text-[10px] text-muted-foreground">{t('aggressive')}</span>
        </div>
      </div>

      {/* Suggested tickers */}
      <div className="w-full space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          {t('suggested_allocation')}
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
          {t('create_portfolio')}
        </Button>
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('skip')}
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
  const t = useTranslations('risk_profiler');
  const tCommon = useTranslations('common');
  const [step, setStep] = useState<Step>(1);
  const [showButton, setShowButton] = useState(false);
  const [answers, setAnswers] = useState<Partial<RiskProfilerRequest>>({});
  const [result, setResult] = useState<RiskProfilerResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const submitMutation = useSubmitRiskProfiler();

  // ── Translated constants (must be inside component for t() access) ──

  const TYPEWRITER_WORDS = useMemo(
    () => t('intro').split(' ').map((word) => ({ text: word })),
    [t],
  );

  const HORIZON_OPTIONS: OptionCard[] = useMemo(
    () => [
      { value: "court", label: t('q1_short'), description: t('q1_short_desc') },
      { value: "moyen", label: t('q1_medium'), description: t('q1_medium_desc') },
      { value: "long", label: t('q1_long'), description: t('q1_long_desc') },
    ],
    [t],
  );

  const LOSS_TOLERANCE_OPTIONS: OptionCard[] = useMemo(
    () => [
      { value: "faible", label: t('q2_low'), description: t('q2_low_desc') },
      { value: "modere", label: t('q2_medium'), description: t('q2_medium_desc') },
      { value: "eleve", label: t('q2_high'), description: t('q2_high_desc') },
    ],
    [t],
  );

  const OBJECTIVE_OPTIONS: OptionCard[] = useMemo(
    () => [
      { value: "preservation", label: t('q3_preserve'), description: "" },
      { value: "equilibre", label: t('q3_balance'), description: "" },
      { value: "croissance", label: t('q3_growth'), description: "" },
    ],
    [t],
  );

  const EXPERIENCE_OPTIONS: OptionCard[] = useMemo(
    () => [
      { value: "debutant", label: t('q4_beginner'), description: "" },
      { value: "intermediaire", label: t('q4_intermediate'), description: "" },
      { value: "expert", label: t('q4_expert'), description: "" },
    ],
    [t],
  );

  const LOADING_STATES = useMemo(
    () => [
      { text: t('analyzing') },
      { text: t('loading_allocations') },
      { text: t('loading_recommendations') },
    ],
    [t],
  );

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
      .map((tk) => `${tk.ticker}:${tk.weight}`)
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
          <DialogTitle className="sr-only">{t('dialog_title')}</DialogTitle>

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
                      {t('start')}
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
                  question={t('q1_question')}
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
                  question={t('q2_question')}
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
                  question={t('q3_question')}
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
                  question={t('q4_question')}
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
                  t={t}
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
                  {tCommon('unavailable')}
                </p>
                <Button variant="outline" onClick={handleSkip}>
                  {t('skip')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
