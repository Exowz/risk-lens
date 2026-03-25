/**
 * TanStack Query hook for Markowitz efficient frontier.
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts, types/markowitz.ts
 * Used by: app/(dashboard)/markowitz/page.tsx
 */

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { MarkowitzResult } from "@/types/markowitz";
import { useLocaleStore } from "@/lib/store/locale-store";

interface MarkowitzRequest {
  portfolio_id: string;
  n_points?: number;
  period?: string;
}

async function fetchFrontier(
  params: MarkowitzRequest,
): Promise<MarkowitzResult> {
  return apiClient<MarkowitzResult>("/api/v1/markowitz/frontier", {
    method: "POST",
    body: params,
  });
}

export function useMarkowitz() {
  return useMutation({
    mutationFn: fetchFrontier,
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// ── Portefeuille Bavard ──

export interface MarkowitzPointExplanation {
  explanation: string;
  suggested_action: string;
}

export async function fetchMarkowitzPointExplanation(params: {
  portfolio_id: string;
  point_type: "min_variance" | "max_sharpe" | "current" | "frontier";
  volatility: number;
  expected_return: number;
  weights: Record<string, number>;
  mode: "beginner" | "expert";
  locale?: string;
}): Promise<MarkowitzPointExplanation> {
  return apiClient<MarkowitzPointExplanation>("/api/v1/markowitz/explain", {
    method: "POST",
    body: { ...params, locale: params.locale ?? useLocaleStore.getState().locale },
  });
}
