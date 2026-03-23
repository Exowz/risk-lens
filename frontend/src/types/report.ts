/**
 * TypeScript interfaces mirroring backend report Pydantic schemas.
 *
 * Depends on: backend/app/schemas/report.py
 * Used by: lib/api/report.ts, app/(dashboard)/report/page.tsx
 */

export interface ReportResult {
  report_id: string;
  content: string;
  generated_at: string;
  from_cache: boolean;
}
