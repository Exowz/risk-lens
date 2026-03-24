"use client";

/**
 * Crash-Test Temporel animé — complete refonte.
 *
 * Zone 1: Crisis selector (3 clickable cards)
 * Zone 2: Animated Recharts LineChart with phases (narrative, fall, counter, recovery)
 * Zone 3: Post-animation KPI metrics + WhyExpandableCard
 *
 * Depends on: recharts, motion/react, @phosphor-icons/react,
 *             lib/api/stress, lib/api/explain, components/shared/*,
 *             components/ui/count-up
 * Used by: /stress route
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Lightning, Warning, TrendDown } from "@phosphor-icons/react";

import { KpiExpandableCard } from "@/components/shared/kpi-expandable-card";
import { WhyExpandableCard } from "@/components/shared/why-expandable-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { fetchMetricExplanation, fetchStressExplanation } from "@/lib/api/explain";
import { useStressTest } from "@/lib/api/stress";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import type { ScenarioResult } from "@/types/stress";

// ── Crisis card definitions ──

interface CrisisCard {
  key: string;
  title: string;
  period: string;
  phrase: string;
  narrative: string;
  icon: typeof Lightning;
}

const CRISES: CrisisCard[] = [
  {
    key: "Financial Crisis 2008",
    title: "Crise Financière 2008",
    period: "Sep 2008 → Mar 2009",
    phrase: "L'effondrement de Lehman Brothers",
    narrative: "Septembre 2008. Lehman Brothers s'effondre.",
    icon: Lightning,
  },
  {
    key: "COVID-19 2020",
    title: "Pandémie COVID-19",
    period: "Fév 2020 → Avr 2020",
    phrase: "Les marchés s'effondrent en 33 jours",
    narrative: "Février 2020. Le monde s'arrête.",
    icon: Warning,
  },
  {
    key: "Rate Hikes 2022",
    title: "Hausse des taux Fed",
    period: "Jan 2022 → Oct 2022",
    phrase: "La fin de l'argent gratuit",
    narrative: "Janvier 2022. La Fed relève ses taux.",
    icon: TrendDown,
  },
];

// ── Animation phases ──

type AnimPhase = "idle" | "narrative" | "fall" | "counter" | "recovery" | "done";

// ── Generate normalized curve data ──

function buildCurveData(
  drawdownPct: number,
  recoveryDays: number | null,
): { day: number; value: number }[] {
  const totalDays = recoveryDays ? Math.max(recoveryDays, 60) : 60;
  const drawdown = Math.abs(drawdownPct);
  const troughDay = Math.round(totalDays * 0.3);
  const points: { day: number; value: number }[] = [];

  for (let d = 0; d <= totalDays; d++) {
    let value: number;
    if (d <= troughDay) {
      const t = d / troughDay;
      const eased = t * t;
      value = 100 - drawdown * 100 * eased;
    } else {
      const recoveryProgress = (d - troughDay) / (totalDays - troughDay);
      const troughValue = 100 - drawdown * 100;
      if (recoveryDays !== null) {
        const eased = 1 - Math.pow(1 - recoveryProgress, 2);
        value = troughValue + (100 - troughValue) * eased;
      } else {
        const partialTarget = troughValue + (100 - troughValue) * 0.4;
        const eased = 1 - Math.pow(1 - recoveryProgress, 2);
        value = troughValue + (partialTarget - troughValue) * eased;
      }
    }
    points.push({ day: d, value: Math.round(value * 100) / 100 });
  }
  return points;
}

/** Merge current + optimized curves into one array for dual-line chart */
function buildDualCurveData(
  scenario: ScenarioResult,
  optimizedDrawdown: number | undefined,
): { day: number; current: number; optimized?: number }[] {
  const currentCurve = buildCurveData(scenario.max_drawdown, scenario.recovery_days);
  // Optimized uses same timeline but shallower drawdown, assume similar recovery shape
  const optCurve = optimizedDrawdown != null
    ? buildCurveData(optimizedDrawdown, scenario.recovery_days)
    : null;

  return currentCurve.map((pt, i) => ({
    day: pt.day,
    current: pt.value,
    optimized: optCurve?.[i]?.value,
  }));
}

// ── Main page ──

export default function StressPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { mode } = useMode();
  const { mutate, data, isPending, error, reset } = useStressTest();

  const [selectedCrisis, setSelectedCrisis] = useState<string | null>(null);
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [visiblePoints, setVisiblePoints] = useState(0);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [chartExplanation, setChartExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const animTimers = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers
  useEffect(() => {
    return () => animTimers.current.forEach(clearTimeout);
  }, []);

  // Auto-run stress test when portfolio changes
  useEffect(() => {
    if (activePortfolioId) {
      reset();
      setSelectedCrisis(null);
      setPhase("idle");
      setVisiblePoints(0);
      mutate({ portfolio_id: activePortfolioId, period: "max" });
      setChartExplanation(null);
    }
  }, [activePortfolioId, reset, mutate]);

  // Find selected scenario data
  const selectedScenario = useMemo(
    () => data?.scenarios.find((s) => s.scenario_name === selectedCrisis) ?? null,
    [data, selectedCrisis],
  );

  // Find comparison data for selected scenario
  const selectedComparison = useMemo(
    () => data?.comparisons?.find((c) => c.scenario_name === selectedCrisis) ?? null,
    [data, selectedCrisis],
  );
  const optimizedDrawdown = selectedComparison?.optimized_drawdown;

  const curveData = useMemo(
    () => (selectedScenario ? buildDualCurveData(selectedScenario, optimizedDrawdown) : []),
    [selectedScenario, optimizedDrawdown],
  );

  // Select crisis and start animation
  const selectCrisis = (key: string) => {
    // Clear previous
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
    setVisiblePoints(0);
    setPhase("idle");
    setSelectedCrisis(key);
    setOpenCard(null);
    setChartExplanation(null);

    if (!data?.scenarios.find((s) => s.scenario_name === key)) return;

    // Phase 1: Narrative
    const t1 = setTimeout(() => setPhase("narrative"), 50);

    // Phase 2: Fall (after 500ms narrative)
    const t2 = setTimeout(() => {
      setPhase("fall");
      // Animate points up to trough
      const scenario = data!.scenarios.find((s) => s.scenario_name === key)!;
      const optDD = data!.comparisons?.find((c) => c.scenario_name === key)?.optimized_drawdown;
      const curve = buildDualCurveData(scenario, optDD);
      let minIdx = 0;
      for (let i = 1; i < curve.length; i++) {
        if (curve[i].current < curve[minIdx].current) minIdx = i;
      }
      const fallSteps = minIdx + 1;
      const fallDuration = 800;
      const stepTime = fallDuration / fallSteps;

      for (let i = 0; i <= minIdx; i++) {
        const t = setTimeout(() => setVisiblePoints(i + 1), i * stepTime);
        animTimers.current.push(t);
      }

      // Phase 3: Counter (after fall finishes)
      const t3 = setTimeout(() => setPhase("counter"), fallDuration + 100);
      animTimers.current.push(t3);

      // Phase 4: Recovery (after counter 1.5s)
      const t4 = setTimeout(() => {
        setPhase("recovery");
        const totalPoints = curve.length;
        const recoverySteps = totalPoints - minIdx;
        const recoveryDuration = 1200;
        const recoveryStepTime = recoveryDuration / recoverySteps;

        for (let i = minIdx + 1; i < totalPoints; i++) {
          const t = setTimeout(
            () => setVisiblePoints(i + 1),
            (i - minIdx) * recoveryStepTime,
          );
          animTimers.current.push(t);
        }

        // Done
        const t5 = setTimeout(() => setPhase("done"), recoveryDuration + 200);
        animTimers.current.push(t5);
      }, fallDuration + 1800);
      animTimers.current.push(t4);
    }, 550);

    animTimers.current.push(t1, t2);
  };

  // KPI analyze callbacks
  const mkAnalyze = useCallback(
    (metricName: string, metricValue: number, context?: Record<string, number | string | null>) =>
      () =>
        fetchMetricExplanation({
          metric_name: metricName,
          metric_value: metricValue,
          portfolio_id: activePortfolioId ?? "",
          mode,
          context: { scenario: selectedCrisis, ...context },
        }),
    [activePortfolioId, mode, selectedCrisis],
  );

  // Chart AI analyze handler — includes comparison data for the AI
  const handleAnalyzeChart = useCallback(() => {
    if (!data || isExplaining) return;
    setIsExplaining(true);
    setChartExplanation(null);
    fetchStressExplanation({
      mode,
      scenarios: data.scenarios.map((s) => {
        const comp = data.comparisons?.find((c) => c.scenario_name === s.scenario_name);
        return {
          scenario_name: s.scenario_name,
          total_return: s.total_return,
          max_drawdown: s.max_drawdown,
          recovery_days: s.recovery_days,
          optimized_drawdown: comp?.optimized_drawdown ?? null,
        };
      }),
    })
      .then((res) => setChartExplanation(res.explanation))
      .catch(() => setChartExplanation("Analyse temporairement indisponible."))
      .finally(() => setIsExplaining(false));
  }, [data, mode, isExplaining]);

  // Auto-trigger AI explanation when animation finishes
  useEffect(() => {
    if (phase === "done" && data && !chartExplanation && !isExplaining) {
      handleAnalyzeChart();
    }
  }, [phase, data, chartExplanation, isExplaining, handleAnalyzeChart]);

  const toggle = (key: string) =>
    setOpenCard(openCard === key ? null : key);

  // ── Empty state ──

  if (!activePortfolioId) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Aucun portefeuille sélectionné</CardTitle>
            <CardDescription>
              Créez ou sélectionnez un portefeuille pour simuler son comportement
              lors des crises de 2008, 2020 et 2022.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>Voir les portefeuilles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visible curve data (for animation)
  const displayData = curveData.slice(0, visiblePoints);

  // Line color: red during fall, emerald after trough (if recovered)
  const lineColor =
    phase === "recovery" || phase === "done"
      ? selectedScenario?.recovery_days !== null
        ? "#10b981"
        : "#ef4444"
      : "#ef4444";

  return (
    <div className="p-6 space-y-6">
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="size-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
          Chargement des stress tests...
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Échec du stress test"}
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Zone 1 — Crisis selector */}
          <div className="grid gap-4 sm:grid-cols-3">
            {CRISES.map((crisis) => {
              const isActive = selectedCrisis === crisis.key;
              const Icon = crisis.icon;
              return (
                <button
                  key={crisis.key}
                  type="button"
                  onClick={() => selectCrisis(crisis.key)}
                  className={`
                    text-left rounded-xl p-5 cursor-pointer transition-all duration-200
                    border bg-card
                    ${
                      isActive
                        ? "border-white/30 bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        : "border-white/[0.08] hover:border-white/20 hover:scale-[1.02]"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon
                      size={20}
                      weight={isActive ? "fill" : "regular"}
                      className={isActive ? "text-white" : "text-muted-foreground"}
                    />
                    <span className="font-medium text-foreground">{crisis.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{crisis.period}</p>
                  <p className="text-sm text-white/60">{crisis.phrase}</p>
                </button>
              );
            })}
          </div>

          {/* Zone 2 — Animated chart */}
          {selectedScenario && (
            <motion.div
              className="relative rounded-xl border border-border bg-card overflow-hidden"
              animate={
                phase === "fall"
                  ? { x: [-2, 2, -2, 1, -1, 0] }
                  : { x: 0 }
              }
              transition={
                phase === "fall"
                  ? { duration: 0.3, delay: 0.5 }
                  : { duration: 0 }
              }
            >
              {/* Narrative overlay */}
              <AnimatePresence>
                {phase === "narrative" && (
                  <motion.div
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-lg font-medium text-white/80 bg-black/40 backdrop-blur rounded-xl p-4">
                      {CRISES.find((c) => c.key === selectedCrisis)?.narrative}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Counter overlay */}
              <AnimatePresence>
                {phase === "counter" && (
                  <motion.div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {selectedScenario.recovery_days !== null ? (
                      <p className="text-4xl font-mono text-white/60">
                        <CountUp
                          to={selectedScenario.recovery_days}
                          duration={1500}
                          decimals={0}
                          suffix=" jours"
                        />
                      </p>
                    ) : (
                      <p className="text-xl font-mono text-white/60">
                        Non récupéré sur la période
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedScenario.recovery_days !== null
                        ? "pour récupérer"
                        : ""}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Animated dual curve */}
              <div className="p-4" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      label={{
                        value: "Jours",
                        position: "insideBottomRight",
                        offset: -5,
                        style: { fontSize: 11, fill: "rgba(255,255,255,0.3)" },
                      }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    {/* Current portfolio */}
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke={lineColor}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      name="Portefeuille actuel"
                    />
                    {/* Optimized portfolio */}
                    {optimizedDrawdown != null && (
                      <Line
                        type="monotone"
                        dataKey="optimized"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        isAnimationActive={false}
                        name="Optimisé Max Sharpe"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legend + AI explanation — appears after animation */}
              <AnimatePresence>
                {phase === "done" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                      {/* Legend */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ backgroundColor: lineColor }} />
                          Portefeuille actuel
                        </span>
                        {optimizedDrawdown != null && (
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-blue-500" />
                            Optimisé Max Sharpe
                          </span>
                        )}
                      </div>

                      {/* AI explanation — auto-triggered after animation */}
                      <div className="pt-2 border-t border-border">
                        {isExplaining && (
                          <div className="space-y-2">
                            <div className="h-3 w-full rounded bg-muted animate-pulse" />
                            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                          </div>
                        )}
                        {chartExplanation && !isExplaining && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2"
                          >
                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                              {chartExplanation}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white/20">Analysé par IA</span>
                              <button
                                type="button"
                                onClick={handleAnalyzeChart}
                                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                              >
                                Rafraîchir
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Zone 3 — Post-animation KPIs: current vs optimized */}
          <AnimatePresence>
            {phase === "done" && selectedScenario && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Current portfolio row */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: lineColor }} />
                    {mode === "beginner" ? "Votre portefeuille" : "Portefeuille actuel"}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                      <KpiExpandableCard
                        label={mode === "beginner" ? "Rendement total" : "Rendement total"}
                        value={selectedScenario.total_return * 100}
                        valuePrefix={selectedScenario.total_return >= 0 ? "+" : ""}
                        valueSuffix="%"
                        valueColor={selectedScenario.total_return >= 0 ? "emerald" : "red"}
                        metricKey="stress-return"
                        onAnalyze={mkAnalyze("total_return", selectedScenario.total_return, {
                          max_drawdown: selectedScenario.max_drawdown,
                          recovery_days: selectedScenario.recovery_days,
                          scenario: selectedScenario.scenario_name,
                        })}
                        isOpen={openCard === "stress-return"}
                        onToggle={() => toggle("stress-return")}
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                      <KpiExpandableCard
                        label={mode === "beginner" ? "Pire chute" : "Drawdown max"}
                        value={selectedScenario.max_drawdown * 100}
                        valueSuffix="%"
                        valueColor="red"
                        metricKey="stress-drawdown"
                        onAnalyze={mkAnalyze("max_drawdown", selectedScenario.max_drawdown, {
                          total_return: selectedScenario.total_return,
                          recovery_days: selectedScenario.recovery_days,
                          scenario: selectedScenario.scenario_name,
                        })}
                        isOpen={openCard === "stress-drawdown"}
                        onToggle={() => toggle("stress-drawdown")}
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                      <KpiExpandableCard
                        label={mode === "beginner" ? "Temps de récupération" : "Jours de récupération"}
                        value={selectedScenario.recovery_days ?? 0}
                        decimals={0}
                        valueSuffix={
                          selectedScenario.recovery_days !== null
                            ? mode === "beginner" ? " jours" : " days"
                            : undefined
                        }
                        valueColor="foreground"
                        metricKey="stress-recovery"
                        onAnalyze={mkAnalyze("recovery_days", selectedScenario.recovery_days ?? -1, {
                          max_drawdown: selectedScenario.max_drawdown,
                          total_return: selectedScenario.total_return,
                          scenario: selectedScenario.scenario_name,
                        })}
                        isOpen={openCard === "stress-recovery"}
                        onToggle={() => toggle("stress-recovery")}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Optimized portfolio row */}
                {selectedComparison && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-500" />
                      {mode === "beginner" ? "Portefeuille optimisé" : "Optimisé Max Sharpe"}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                        <KpiExpandableCard
                          label={mode === "beginner" ? "Rendement total" : "Rendement total"}
                          value={selectedComparison.optimized_return * 100}
                          valuePrefix={selectedComparison.optimized_return >= 0 ? "+" : ""}
                          valueSuffix="%"
                          valueColor={selectedComparison.optimized_return >= 0 ? "emerald" : "red"}
                          metricKey="stress-opt-return"
                          onAnalyze={mkAnalyze("total_return", selectedComparison.optimized_return, {
                            max_drawdown: selectedComparison.optimized_drawdown,
                            recovery_days: selectedComparison.optimized_recovery_days,
                            scenario: selectedScenario.scenario_name,
                            portfolio_type: "optimized_max_sharpe",
                          })}
                          isOpen={openCard === "stress-opt-return"}
                          onToggle={() => toggle("stress-opt-return")}
                        />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                        <KpiExpandableCard
                          label={mode === "beginner" ? "Pire chute" : "Drawdown max"}
                          value={selectedComparison.optimized_drawdown * 100}
                          valueSuffix="%"
                          valueColor="red"
                          metricKey="stress-opt-drawdown"
                          onAnalyze={mkAnalyze("max_drawdown", selectedComparison.optimized_drawdown, {
                            total_return: selectedComparison.optimized_return,
                            recovery_days: selectedComparison.optimized_recovery_days,
                            scenario: selectedScenario.scenario_name,
                            portfolio_type: "optimized_max_sharpe",
                          })}
                          isOpen={openCard === "stress-opt-drawdown"}
                          onToggle={() => toggle("stress-opt-drawdown")}
                        />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <KpiExpandableCard
                          label={mode === "beginner" ? "Temps de récupération" : "Jours de récupération"}
                          value={selectedComparison.optimized_recovery_days ?? 0}
                          decimals={0}
                          valueSuffix={
                            selectedComparison.optimized_recovery_days !== null
                              ? mode === "beginner" ? " jours" : " days"
                              : undefined
                          }
                          valueColor="foreground"
                          metricKey="stress-opt-recovery"
                          onAnalyze={mkAnalyze("recovery_days", selectedComparison.optimized_recovery_days ?? -1, {
                            max_drawdown: selectedComparison.optimized_drawdown,
                            total_return: selectedComparison.optimized_return,
                            scenario: selectedScenario.scenario_name,
                            portfolio_type: "optimized_max_sharpe",
                          })}
                          isOpen={openCard === "stress-opt-recovery"}
                          onToggle={() => toggle("stress-opt-recovery")}
                        />
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhyExpandableCard */}
          <WhyExpandableCard
            beginnerContent={
              <>
                <p className="mb-2">
                  Les <strong>stress tests</strong> montrent ce qui serait arrivé à votre portefeuille
                  pendant les grandes crises passées (2008, COVID, hausse des taux 2022).
                </p>
                <p className="mb-2">
                  Le <strong>drawdown</strong> est la pire chute subie. Les <strong>jours de recovery</strong>{" "}
                  indiquent combien de temps il a fallu pour se remettre.
                </p>
                <p>
                  Sélectionnez une crise pour voir l&apos;animation du comportement de votre portefeuille.
                </p>
              </>
            }
            expertContent={
              <>
                <p className="mb-2">
                  <strong>Historical stress testing</strong> replays your portfolio through exact crisis
                  date ranges (2008-09 to 2009-03, 2020-02 to 2020-04, 2022-01 to 2022-10) to measure
                  realized drawdowns beyond what parametric models predict.
                </p>
                <p className="mb-2">
                  <strong>Max drawdown</strong> is the largest peak-to-trough decline. <strong>Recovery
                  days</strong> count trading sessions from trough back to pre-crisis peak (null if
                  not recovered within the observation window).
                </p>
                <p>
                  The animated curve shows normalized portfolio value (base 100) through the crisis period.
                </p>
              </>
            }
          />

          {data.from_cache && (
            <p className="text-xs text-muted-foreground text-center">
              Résultats chargés depuis le cache
            </p>
          )}
        </>
      )}
    </div>
  );
}
