/**
 * Generic API response and error types.
 *
 * Used by: lib/api/client.ts, all TanStack Query hooks
 */

export interface ApiError {
  detail: string;
  status: number;
}
