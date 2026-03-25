"use client";

import { motion } from "motion/react";

import { MockDashboard } from "./mock-dashboard";

export function ProductSection() {
  return (
    <section className="relative px-6 py-48 md:py-64">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-150px" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative rounded-[2rem] border border-white/[0.1] bg-black/50 p-3 md:p-4 backdrop-blur-xl shadow-2xl"
          style={{
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.8), 0 0 160px rgba(255,255,255,0.05)",
          }}
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-white/[0.05]">
            <MockDashboard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
