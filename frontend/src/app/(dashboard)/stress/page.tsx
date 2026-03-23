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
import { fetchMetricExplanation } from "@/lib/api/explain";
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

// ── Generate normalized curve data from scenario ──

function buildCurveData(scenario: ScenarioResult): { day: number; value: number }[] {
  const totalDays = scenario.recovery_days
    ? Math.max(scenario.recovery_days, 60)
    : 60;
  const drawdown = Math.abs(scenario.max_drawdown);
  const troughDay = Math.round(totalDays * 0.3);
  const points: { day: number; value: number }[] = [];

  for (let d = 0; d <= totalDays; d++) {
    let value: number;
    if (d <= troughDay) {
      // Fall phase: ease from 100 to trough
      const t = d / troughDay;
      const eased = t * t; // quadratic ease-in
      value = 100 - drawdown * 100 * eased;
    } else {
      // Recovery phase
      const recoveryProgress = (d - troughDay) / (totalDays - troughDay);
      const troughValue = 100 - drawdown * 100;
      if (scenario.recovery_days !== null) {
        // Full recovery
        const eased = 1 - Math.pow(1 - recoveryProgress, 2);
        value = troughValue + (100 - troughValue) * eased;
      } else {
        // Partial recovery — doesn't reach 100
        const partialTarget = troughValue + (100 - troughValue) * 0.4;
        const eased = 1 - Math.pow(1 - recoveryProgress, 2);
        value = troughValue + (partialTarget - troughValue) * eased;
      }
    }
    points.push({ day: d, value: Math.round(value * 100) / 100 });
  }
  return points;
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
    }
  }, [activePortfolioId, reset, mutate]);

  const handleRun = () => {
    if (!activePortfolioId) return;
    mutate({ portfolio_id: activePortfolioId, period: "max" });
  };

  // Find selected scenario data
  const selectedScenario = useMemo(
    () => data?.scenarios.find((s) => s.scenario_name === selectedCrisis) ?? null,
    [data, selectedCrisis],
  );

  const curveData = useMemo(
    () => (selectedScenario ? buildCurveData(selectedScenario) : []),
    [selectedScenario],
  );

  // Trough index for color split
  const troughIndex = useMemo(() => {
    if (!curveData.length) return 0;
    let minIdx = 0;
    for (let i = 1; i < curveData.length; i++) {
      if (curveData[i].value < curveData[minIdx].value) minIdx = i;
    }
    return minIdx;
  }, [curveData]);

  // Select crisis and start animation
  const selectCrisis = (key: string) => {
    // Clear previous
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
    setVisiblePoints(0);
    setPhase("idle");
    setSelectedCrisis(key);
    setOpenCard(null);

    if (!data?.scenarios.find((s) => s.scenario_name === key)) return;

    // Phase 1: Narrative
    const t1 = setTimeout(() => setPhase("narrative"), 50);

    // Phase 2: Fall (after 500ms narrative)
    const t2 = setTimeout(() => {
      setPhase("fall");
      // Animate points up to trough
      const scenario = data!.scenarios.find((s) => s.scenario_name === key)!;
      const curve = buildCurveData(scenario);
      let minIdx = 0;
      for (let i = 1; i < curve.length; i++) {
        if (curve[i].value < curve[minIdx].value) minIdx = i;
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
      {/* Run button */}
      <div className="flex justify-end">
        <Button onClick={handleRun} disabled={isPending}>
          {isPending ? "Exécution..." : "Lancer le stress test"}
        </Button>
      </div>

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

              {/* Chart */}
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
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={lineColor}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Zone 3 — Post-animation KPIs */}
          <AnimatePresence>
            {phase === "done" && selectedScenario && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, staggerChildren: 0.1 }}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                  >
                    <KpiExpandableCard
                      label={mode === "beginner" ? "Rendement total" : "Total Return"}
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

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                  >
                    <KpiExpandableCard
                      label={mode === "beginner" ? "Pire chute" : "Max Drawdown"}
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

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                  >
                    <KpiExpandableCard
                      label={mode === "beginner" ? "Temps de récupération" : "Recovery Days"}
                      value={selectedScenario.recovery_days ?? 0}
                      decimals={0}
                      valueSuffix={
                        selectedScenario.recovery_days !== null
                          ? mode === "beginner"
                            ? " jours"
                            : " days"
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
