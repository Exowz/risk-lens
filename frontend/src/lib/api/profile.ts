/**
 * TanStack Query hooks for user profile and Risk Profiler Express.
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts
 * Used by: components/shared/risk-profiler-modal.tsx, app/(dashboard)/profile/page.tsx
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

// ── Types ──

export interface RiskProfilerRequest {
  horizon: "court" | "moyen" | "long";
  loss_tolerance: "faible" | "modere" | "eleve";
  objective: "preservation" | "equilibre" | "croissance";
  experience: "debutant" | "intermediaire" | "expert";
}

export interface SuggestedTicker {
  ticker: string;
  weight: number;
  reason: string;
}

export interface RiskProfilerResponse {
  profile_name: string;
  profile_description: string;
  suggested_tickers: SuggestedTicker[];
  risk_score: number;
}

export interface UserRiskProfileResponse {
  id: string;
  horizon: string;
  loss_tolerance: string;
  objective: string;
  experience: string;
  profile_name: string;
  risk_score: number;
}

const PROFILE_KEYS = {
  riskProfile: ["risk-profile"] as const,
};

// ── API Functions ──

async function submitRiskProfiler(
  data: RiskProfilerRequest,
): Promise<RiskProfilerResponse> {
  return apiClient<RiskProfilerResponse>("/api/v1/profile/risk-profiler", {
    method: "POST",
    body: data,
  });
}

async function fetchRiskProfile(): Promise<UserRiskProfileResponse | null> {
  return apiClient<UserRiskProfileResponse | null>(
    "/api/v1/profile/risk-profile",
  );
}

// ── Hooks ──

export function useRiskProfile() {
  return useQuery({
    queryKey: PROFILE_KEYS.riskProfile,
    queryFn: fetchRiskProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitRiskProfiler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitRiskProfiler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.riskProfile });
    },
  });
}
