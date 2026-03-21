/**
 * TypeScript interfaces mirroring backend Pydantic schemas for portfolios.
 *
 * Keep in sync with backend/app/schemas/portfolio.py.
 *
 * Used by: lib/api/portfolios.ts, components/portfolio/*
 */

export interface AssetResponse {
  id: string;
  ticker: string;
  weight: number;
}

export interface PortfolioResponse {
  id: string;
  name: string;
  assets: AssetResponse[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioListItem {
  id: string;
  name: string;
  asset_count: number;
  created_at: string;
  updated_at: string;
}

export interface AssetInput {
  ticker: string;
  weight: number;
}

export interface PortfolioCreateRequest {
  name: string;
  assets: AssetInput[];
}

/** Normalized price data point for charting */
export interface PricePoint {
  date: string;
  value: number;
}

/** Normalized prices keyed by ticker */
export type NormalizedPrices = Record<string, PricePoint[]>;
