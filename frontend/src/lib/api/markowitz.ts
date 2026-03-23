/**
 * TanStack Query hook for Markowitz efficient frontier.
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts, types/markowitz.ts
 * Used by: app/(dashboard)/markowitz/page.tsx
 */

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { MarkowitzResult } from "@/types/markowitz";

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
