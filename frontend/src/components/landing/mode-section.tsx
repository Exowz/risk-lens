"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export function ModeSection() {
  const t = useTranslations();

  return (
    <section className="relative border-t border-white/[0.05] bg-[#050505] px-6 py-48 md:py-64">
      <div className="mx-auto max-w-6xl">
        <div className="mb-32 text-center">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white mb-6">
            {t("landing.features_title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 md:gap-16 lg:grid-cols-2">
          {/* Beginner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group flex flex-col justify-between rounded-[2.5rem] border border-white/[0.05] bg-[#0A0A0A] p-10 md:p-14 transition-colors hover:border-white/10"
          >
            <div>
              <h3 className="text-3xl font-medium tracking-tight text-white mb-4">{t("landing.demo_beginner")}</h3>
              <p className="text-base text-white/40 mb-12 leading-relaxed">{t("landing.demo_beginner_sub")}</p>
            </div>

            <div className="space-y-4">
              {[
                { label: t("metrics.beginner.var_95"), value: "-2.52%", color: "text-red-400" },
                { label: t("metrics.beginner.sharpe"), value: "0.851", color: "text-blue-400" },
                { label: t("metrics.beginner.volatility"), value: "26.53%", color: "text-amber-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-white/[0.03] bg-white/[0.01] px-6 py-5">
                  <span className="text-base font-medium text-white/60">{row.label}</span>
                  <span className={`font-mono text-lg ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Expert */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="group flex flex-col justify-between rounded-[2.5rem] border border-white/[0.05] bg-[#0A0A0A] p-10 md:p-14 transition-colors hover:border-white/10"
          >
            <div>
              <h3 className="text-3xl font-medium tracking-tight text-white mb-4">{t("landing.demo_expert")}</h3>
              <p className="text-base text-white/40 mb-12 leading-relaxed">{t("landing.demo_expert_sub")}</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.03] bg-[#050505] p-6 font-mono text-sm text-white/50 leading-loose">
                <span className="text-purple-400">def</span> <span className="text-blue-400">calculate_sharpe</span>(returns, risk_free_rate):<br />
                &nbsp;&nbsp;&nbsp;&nbsp;excess = returns - risk_free_rate<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> np.mean(excess) / np.std(excess)
              </div>
              {[
                { label: t("metrics.expert.var_95"), value: "-2.52%", color: "text-white/80" },
                { label: t("metrics.expert.sharpe"), value: "0.851", color: "text-white/80" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-white/[0.03] bg-white/[0.01] px-6 py-4">
                  <span className="text-sm text-white/40">{row.label}</span>
                  <span className={`font-mono text-sm ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
