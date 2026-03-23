/**
 * TanStack Query hooks for risk calculation endpoints.
 *
 * All API calls go through lib/api/client.ts which handles auth token injection.
 * Results are cached with 1h staleTime (matches backend calculation_cache TTL).
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts, types/risk.ts
 * Used by: components/risk/*, app/(dashboard)/risk/page.tsx
 */

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  CVaRResult,
  MonteCarloResult,
  RiskSummary,
  VaRResult,
} from "@/types/risk";

const STALE_TIME = 60 * 60 * 1000; // 1 hour

// ── Request types ──

interface VaRRequest {
  portfolio_id: string;
  confidence_level?: number;
  method?: "historical" | "parametric";
  period?: string;
}

interface MonteCarloRequest {
  portfolio_id: string;
  n_simulations?: number;
  n_days?: number;
  period?: string;
}

interface RiskSummaryRequest {
  portfolio_id: string;
  period?: string;
}

// ── API functions ──

async function fetchVaR(params: VaRRequest): Promise<VaRResult> {
  return apiClient<VaRResult>("/api/v1/risk/var", {
    method: "POST",
    body: params,
  });
}

async function fetchCVaR(params: VaRRequest): Promise<CVaRResult> {
  return apiClient<CVaRResult>("/api/v1/risk/cvar", {
    method: "POST",
    body: params,
  });
}

async function fetchMonteCarlo(
  params: MonteCarloRequest,
): Promise<MonteCarloResult> {
  return apiClient<MonteCarloResult>("/api/v1/risk/montecarlo", {
    method: "POST",
    body: params,
  });
}

async function fetchRiskSummary(
  params: RiskSummaryRequest,
): Promise<RiskSummary> {
  return apiClient<RiskSummary>("/api/v1/risk/summary", {
    method: "POST",
    body: params,
  });
}

// ── TanStack Query Hooks ──
// Using useMutation since these are POST endpoints that trigger computation.
// The staleTime hint is embedded in the mutation cache via gcTime.

export function useVaR() {
  return useMutation({
    mutationFn: fetchVaR,
    gcTime: STALE_TIME,
  });
}

export function useCVaR() {
  return useMutation({
    mutationFn: fetchCVaR,
    gcTime: STALE_TIME,
  });
}

export function useMonteCarlo() {
  return useMutation({
    mutationFn: fetchMonteCarlo,
    gcTime: STALE_TIME,
  });
}

export function useRiskSummary() {
  return useMutation({
    mutationFn: fetchRiskSummary,
    gcTime: STALE_TIME,
  });
}
