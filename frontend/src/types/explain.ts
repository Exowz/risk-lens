/**
 * TypeScript interfaces mirroring backend explanation Pydantic schemas.
 *
 * Depends on: backend/app/schemas/explain.py
 * Used by: lib/api/explain.ts, components/shared/ai-chart-explanation.tsx
 */

export interface ExplanationResponse {
  explanation: string;
}
