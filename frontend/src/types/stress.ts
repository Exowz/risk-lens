/**
 * TypeScript interfaces mirroring backend stress test Pydantic schemas.
 *
 * Depends on: backend/app/schemas/stress.py
 * Used by: lib/api/stress.ts, components/stress/*, components/charts/stress-bar-chart.tsx
 */

export interface ScenarioResult {
  scenario_name: string;
  start_date: string;
  end_date: string;
  total_return: number;
  max_drawdown: number;
  recovery_days: number | null;
}

export interface ScenarioComparison {
  scenario_name: string;
  current_drawdown: number;
  optimized_drawdown: number;
}

export interface StressTestResult {
  scenarios: ScenarioResult[];
  comparisons: ScenarioComparison[];
  from_cache: boolean;
}
