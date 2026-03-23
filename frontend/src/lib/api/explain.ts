/**
 * TanStack Query hooks for AI chart explanation endpoints.
 *
 * Uses useMutation — explanations are triggered on user click,
 * not automatically on page load.
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts, types/explain.ts
 * Used by: components/shared/ai-chart-explanation.tsx, chart components
 */

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { ExplanationResponse } from "@/types/explain";

type Mode = "beginner" | "expert";

// ── API functions ──

async function fetchMonteCarloExplanation(params: {
  mode: Mode;
  mean_final_value: number;
  var_95: number;
  probability_of_loss: number;
  n_simulations: number;
  n_days: number;
}): Promise<ExplanationResponse> {
  return apiClient<ExplanationResponse>("/api/v1/risk/explain-montecarlo", {
    method: "POST",
    body: params,
  });
}

async function fetchDistributionExplanation(params: {
  mode: Mode;
  var_95: number;
  mean_final_value: number;
  std_final_value: number;
  percentile_5: number;
  percentile_95: number;
}): Promise<ExplanationResponse> {
  return apiClient<ExplanationResponse>("/api/v1/risk/explain-distribution", {
    method: "POST",
    body: params,
  });
}

async function fetchMarkowitzExplanation(params: {
  mode: Mode;
  current_sharpe: number;
  current_volatility: number;
  current_return: number;
  max_sharpe_ratio: number;
  max_sharpe_volatility: number;
  max_sharpe_return: number;
  min_variance_volatility: number;
}): Promise<ExplanationResponse> {
  return apiClient<ExplanationResponse>(
    "/api/v1/markowitz/explain-position",
    { method: "POST", body: params },
  );
}

async function fetchStressExplanation(params: {
  mode: Mode;
  scenarios: {
    scenario_name: string;
    total_return: number;
    max_drawdown: number;
    recovery_days: number | null;
  }[];
}): Promise<ExplanationResponse> {
  return apiClient<ExplanationResponse>("/api/v1/stress/explain-result", {
    method: "POST",
    body: params,
  });
}

// ── Hooks (useMutation — triggered on click, not on load) ──

export function useMonteCarloExplanation() {
  return useMutation({
    mutationFn: fetchMonteCarloExplanation,
  });
}

export function useDistributionExplanation() {
  return useMutation({
    mutationFn: fetchDistributionExplanation,
  });
}

export function useMarkowitzExplanation() {
  return useMutation({
    mutationFn: fetchMarkowitzExplanation,
  });
}

export function useStressExplanation() {
  return useMutation({
    mutationFn: fetchStressExplanation,
  });
}
