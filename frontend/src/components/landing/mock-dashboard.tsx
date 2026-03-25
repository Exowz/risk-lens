"use client";

import { motion } from "motion/react";
import { ChartLineUp, ShieldCheck, Code } from "@phosphor-icons/react";

const kpis = [
  { label: "Value at Risk (95%)", value: "-2.52%", color: "#f87171" },
  { label: "Sharpe Ratio", value: "0.851", color: "#60a5fa" },
  { label: "Simulations", value: "10,000", color: "#a78bfa" },
  { label: "Max Drawdown", value: "-18.4%", color: "#fbbf24" },
];

const chartBars = [35, 52, 44, 68, 58, 72, 65, 80, 74, 88, 82, 70, 78, 85, 90, 95, 88, 102];

export function MockDashboard() {
  return (
    <div className="flex h-[500px] sm:h-[700px] w-full flex-col overflow-hidden bg-[#050505] font-sans">
      {/* macOS Style Window Header */}
      <div className="flex h-14 items-center border-b border-white/[0.05] bg-[#0A0A0A] px-6">
        <div className="flex gap-2.5">
          <div className="h-3.5 w-3.5 rounded-full bg-[#ED6A5E] border border-[#D04E42]" />
          <div className="h-3.5 w-3.5 rounded-full bg-[#F4BF4F] border border-[#D6A243]" />
          <div className="h-3.5 w-3.5 rounded-full bg-[#61C554] border border-[#4A983D]" />
        </div>
        <div className="mx-auto flex h-7 items-center rounded-md bg-white/[0.03] px-4 border border-white/[0.05]">
          <span className="text-[11px] font-medium text-white/40 tracking-wide">risklens-dashboard — bash</span>
        </div>
        <div className="w-14" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden sm:flex w-20 flex-col items-center gap-8 border-r border-white/[0.05] bg-[#0A0A0A] py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 shadow-inner">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <div className="flex flex-col gap-6 text-white/20">
            <ChartLineUp size={24} className="text-white/80" />
            <ShieldCheck size={24} />
            <Code size={24} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col gap-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/[0.02] via-[#050505] to-[#050505]">
          {/* Top Bar / Greeting */}
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-xl font-medium text-white/90 tracking-tight">Portfolio Overview</h3>
              <p className="text-sm text-white/40 mt-2">Live risk metrics updated via FastAPI.</p>
            </div>
            <div className="h-10 w-32 rounded-full bg-white/[0.03] border border-white/[0.05]" />
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04]"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="text-[11px] font-medium uppercase tracking-widest text-white/30 mb-4">
                  {kpi.label}
                </p>
                <p
                  className="font-mono text-3xl font-semibold tracking-tight"
                  style={{ color: kpi.color }}
                >
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="flex-1 rounded-2xl border border-white/[0.05] bg-[#0A0A0A] p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative z-10 flex items-center justify-between mb-8">
              <p className="text-sm font-medium text-white/60">Monte Carlo Simulation Path</p>
            </div>

            {/* Minimalist Bar Chart */}
            <div className="relative z-10 flex items-end justify-between flex-1 gap-1.5 w-full h-full pb-2 border-b border-white/10">
              {chartBars.map((h, i) => (
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  transition={{ duration: 1.2, delay: i * 0.04, ease: "easeOut" }}
                  viewport={{ once: true }}
                  key={i}
                  className="w-full rounded-t-sm bg-gradient-to-t from-white/10 to-white/30"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
