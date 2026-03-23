/**
 * TypeScript interfaces mirroring backend Markowitz Pydantic schemas.
 *
 * Depends on: backend/app/schemas/markowitz.py
 * Used by: lib/api/markowitz.ts, components/charts/efficient-frontier.tsx
 */

export interface FrontierPoint {
  volatility: number;
  expected_return: number;
}

export interface PortfolioWeights {
  weights: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export interface PortfolioPoint {
  volatility: number;
  expected_return: number;
  sharpe_ratio: number;
}

export interface MarkowitzResult {
  frontier_points: FrontierPoint[];
  min_variance: PortfolioWeights;
  max_sharpe: PortfolioWeights;
  current_portfolio: PortfolioPoint;
  from_cache: boolean;
}
