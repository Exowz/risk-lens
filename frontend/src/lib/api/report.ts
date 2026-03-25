/**
 * TanStack Query hooks for report generation.
 *
 * PDF export is handled client-side via jspdf (text rendering).
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts, types/report.ts
 * Used by: app/(dashboard)/report/page.tsx
 */

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { ReportResult } from "@/types/report";
import { useLocaleStore } from "@/lib/store/locale-store";

interface ReportRequest {
  portfolio_id: string;
  locale?: string;
}

async function fetchGenerateReport(
  params: ReportRequest,
): Promise<ReportResult> {
  return apiClient<ReportResult>("/api/v1/report/generate", {
    method: "POST",
    body: { ...params, locale: params.locale ?? useLocaleStore.getState().locale },
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: fetchGenerateReport,
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
