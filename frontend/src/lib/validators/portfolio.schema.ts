/**
 * Zod schemas for portfolio creation/editing.
 *
 * Validates:
 *   - Portfolio name (1-100 chars)
 *   - Tickers (uppercase alphanumeric, 1-10 chars)
 *   - Weights (0 < w <= 1, sum to 1.0 ± 0.001)
 *   - No duplicate tickers
 *
 * Depends on: zod
 * Used by: components/portfolio/portfolio-form.tsx
 */

import { z } from "zod";

export const assetInputSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .max(10, "Ticker must be at most 10 characters")
    .transform((v) => v.toUpperCase().trim()),
  weight: z
    .number({ message: "Weight must be a number" })
    .gt(0, "Weight must be greater than 0")
    .lte(1, "Weight must be at most 1"),
});

export const portfolioCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Portfolio name is required")
    .max(100, "Portfolio name must be at most 100 characters"),
  assets: z
    .array(assetInputSchema)
    .min(1, "At least one asset is required")
    .max(20, "Maximum 20 assets per portfolio")
    .refine(
      (assets) => {
        const total = assets.reduce((sum, a) => sum + a.weight, 0);
        return Math.abs(total - 1.0) <= 0.001;
      },
      { message: "Weights must sum to 100%" },
    )
    .refine(
      (assets) => {
        const tickers = assets.map((a) => a.ticker.toUpperCase().trim());
        return new Set(tickers).size === tickers.length;
      },
      { message: "Duplicate tickers are not allowed" },
    ),
});

export type PortfolioFormData = z.infer<typeof portfolioCreateSchema>;
export type AssetFormData = z.infer<typeof assetInputSchema>;
