/**
 * TypeScript interfaces mirroring backend risk Pydantic schemas.
 *
 * Depends on: backend/app/schemas/risk.py
 * Used by: lib/api/risk.ts, components/risk/*, components/charts/*
 */

export interface VaRResult {
  var: number;
  confidence_level: number;
  method: "historical" | "parametric";
  period: string;
  n_observations: number;
  from_cache: boolean;
}

export interface CVaRResult {
  cvar: number;
  var: number;
  confidence_level: number;
  method: "historical" | "parametric";
  period: string;
  n_observations: number;
  from_cache: boolean;
}

export interface MonteCarloResult {
  mean_final_value: number;
  median_final_value: number;
  std_final_value: number;
  percentile_5: number;
  percentile_95: number;
  var_95: number;
  probability_of_loss: number;
  n_simulations: number;
  n_days: number;
  sample_paths: number[][];
  final_values: number[];
  from_cache: boolean;
}

export interface RiskSummary {
  var_95_historical: number;
  var_99_historical: number;
  var_95_parametric: number;
  var_99_parametric: number;
  cvar_95: number;
  cvar_99: number;
  annualized_return: number;
  annualized_volatility: number;
  sharpe_ratio: number;
  n_observations: number;
  period: string;
  from_cache: boolean;
}
