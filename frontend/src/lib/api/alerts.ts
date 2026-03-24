/**
 * TanStack Query hooks for user alerts and notifications.
 *
 * Depends on: @tanstack/react-query, lib/api/client.ts
 * Used by: app/(dashboard)/profile/page.tsx, dashboard alert banner
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

// ── Types ──

export interface AlertCreateRequest {
  portfolio_id: string;
  metric: "var_95" | "sharpe" | "volatility";
  threshold: number;
  direction: "above" | "below";
}

export interface AlertResponse {
  id: string;
  portfolio_id: string;
  metric: string;
  threshold: number;
  direction: string;
  active: boolean;
  created_at: string;
}

export interface NotificationResponse {
  id: string;
  alert_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ReportHistoryItem {
  report_id: string;
  portfolio_id: string;
  portfolio_name: string;
  generated_at: string;
}

const ALERT_KEYS = {
  alerts: ["alerts"] as const,
  notifications: ["notifications"] as const,
  reportHistory: ["report-history"] as const,
};

// ── API Functions ──

async function fetchAlerts(): Promise<AlertResponse[]> {
  return apiClient<AlertResponse[]>("/api/v1/alerts");
}

async function createAlert(data: AlertCreateRequest): Promise<AlertResponse> {
  return apiClient<AlertResponse>("/api/v1/alerts", {
    method: "POST",
    body: data,
  });
}

async function deleteAlert(id: string): Promise<void> {
  return apiClient<void>(`/api/v1/alerts/${id}`, { method: "DELETE" });
}

async function fetchNotifications(): Promise<NotificationResponse[]> {
  return apiClient<NotificationResponse[]>("/api/v1/alerts/notifications");
}

async function fetchReportHistory(): Promise<ReportHistoryItem[]> {
  return apiClient<ReportHistoryItem[]>("/api/v1/report/history");
}

// ── Hooks ──

export function useAlerts() {
  return useQuery({
    queryKey: ALERT_KEYS.alerts,
    queryFn: fetchAlerts,
    staleTime: 60 * 1000,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERT_KEYS.alerts });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERT_KEYS.alerts });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ALERT_KEYS.notifications,
    queryFn: fetchNotifications,
    staleTime: 30 * 1000,
  });
}

export function useReportHistory() {
  return useQuery({
    queryKey: ALERT_KEYS.reportHistory,
    queryFn: fetchReportHistory,
    staleTime: 5 * 60 * 1000,
  });
}
