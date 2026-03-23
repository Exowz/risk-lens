/**
 * TanStack Query hook for stress testing.
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts, types/stress.ts
 * Used by: app/(dashboard)/stress/page.tsx
 */

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { StressTestResult } from "@/types/stress";

interface StressTestRequest {
  portfolio_id: string;
  period?: string;
}

async function fetchStressTest(
  params: StressTestRequest,
): Promise<StressTestResult> {
  return apiClient<StressTestResult>("/api/v1/stress/run", {
    method: "POST",
    body: params,
  });
}

export function useStressTest() {
  return useMutation({
    mutationFn: fetchStressTest,
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
