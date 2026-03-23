/**
 * TanStack Query hooks for portfolio CRUD operations.
 *
 * All API calls go through lib/api/client.ts which handles auth token injection.
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts, types/portfolio.ts
 * Used by: components/portfolio/*, app/(dashboard)/portfolio/page.tsx
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import type {
  LiveQuote,
  NormalizedPrices,
  PortfolioCreateRequest,
  PortfolioListItem,
  PortfolioResponse,
} from "@/types/portfolio";

const PORTFOLIO_KEYS = {
  all: ["portfolios"] as const,
  detail: (id: string) => ["portfolios", id] as const,
  prices: (id: string) => ["portfolios", id, "prices"] as const,
  livePrices: (id: string) => ["portfolios", id, "live-prices"] as const,
};

/** Fetch all portfolios for the current user */
async function fetchPortfolios(): Promise<PortfolioListItem[]> {
  return apiClient<PortfolioListItem[]>("/api/v1/portfolios");
}

/** Fetch a single portfolio by ID */
async function fetchPortfolio(id: string): Promise<PortfolioResponse> {
  return apiClient<PortfolioResponse>(`/api/v1/portfolios/${id}`);
}

/** Create a new portfolio */
async function createPortfolio(
  data: PortfolioCreateRequest,
): Promise<PortfolioResponse> {
  return apiClient<PortfolioResponse>("/api/v1/portfolios", {
    method: "POST",
    body: data,
  });
}

/** Delete a portfolio */
async function deletePortfolio(id: string): Promise<void> {
  return apiClient<void>(`/api/v1/portfolios/${id}`, {
    method: "DELETE",
  });
}

/** Fetch normalized historical prices for a portfolio's assets */
async function fetchPortfolioPrices(id: string): Promise<NormalizedPrices> {
  return apiClient<NormalizedPrices>(`/api/v1/portfolios/${id}/prices`);
}

/** Fetch live quotes (current price + daily change) for portfolio assets */
async function fetchLivePrices(id: string): Promise<LiveQuote[]> {
  return apiClient<LiveQuote[]>(`/api/v1/portfolios/${id}/live-prices`);
}

// ── TanStack Query Hooks ──

export function usePortfolios() {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.all,
    queryFn: fetchPortfolios,
  });
}

export function usePortfolio(id: string | null) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.detail(id ?? ""),
    queryFn: () => fetchPortfolio(id!),
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEYS.all });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePortfolio,
    onSuccess: (_data, deletedId) => {
      // Clear active portfolio if it was the one deleted
      const { activePortfolioId, setActivePortfolio } =
        usePortfolioStore.getState();
      if (activePortfolioId === deletedId) {
        setActivePortfolio(null);
      }

      // Invalidate list and remove stale detail/prices queries
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEYS.all });
      queryClient.removeQueries({
        queryKey: PORTFOLIO_KEYS.detail(deletedId),
      });
      queryClient.removeQueries({
        queryKey: PORTFOLIO_KEYS.prices(deletedId),
      });
    },
  });
}

export function usePortfolioPrices(id: string | null) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.prices(id ?? ""),
    queryFn: () => fetchPortfolioPrices(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes (price data doesn't change often)
  });
}

export function useLivePrices(id: string | null) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.livePrices(id ?? ""),
    queryFn: () => fetchLivePrices(id!),
    enabled: !!id,
    refetchInterval: 60_000, // Auto-refresh every 60 seconds
    staleTime: 30_000,
  });
}
