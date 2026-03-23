"use client";

/**
 * Portfolio creation form with dynamic asset rows.
 *
 * Uses React Hook Form + Zod for validation.
 * Validates weights sum to 1.0, no duplicate tickers, valid ticker format.
 *
 * Depends on: react-hook-form, @hookform/resolvers/zod, shadcn/ui
 * Used by: app/(dashboard)/portfolio/page.tsx
 */

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePortfolio } from "@/lib/api/portfolios";
import {
  portfolioCreateSchema,
  type PortfolioFormData,
} from "@/lib/validators/portfolio.schema";

interface PortfolioFormProps {
  onSuccess?: () => void;
  initialName?: string;
  initialAssets?: { ticker: string; weight: number }[];
}

export function PortfolioForm({
  onSuccess,
  initialName,
  initialAssets,
}: PortfolioFormProps) {
  const createMutation = useCreatePortfolio();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioCreateSchema),
    defaultValues: {
      name: initialName ?? "",
      assets:
        initialAssets && initialAssets.length > 0
          ? initialAssets
          : [{ ticker: "", weight: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets",
  });

  const watchedAssets = watch("assets");
  const totalWeight = watchedAssets?.reduce(
    (sum, a) => sum + (Number(a.weight) || 0),
    0,
  );

  async function onSubmit(data: PortfolioFormData) {
    createMutation.mutate(
      {
        name: data.name,
        assets: data.assets.map((a) => ({
          ticker: a.ticker.toUpperCase().trim(),
          weight: a.weight,
        })),
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Portfolio name */}
          <div className="space-y-2">
            <Label htmlFor="name">Portfolio Name</Label>
            <Input
              id="name"
              placeholder="e.g., Tech Growth Portfolio"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Assets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Assets</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ticker: "", weight: 0 })}
                disabled={fields.length >= 20}
              >
                <Plus className="mr-1 size-3" />
                Add Asset
              </Button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_120px_40px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Ticker</span>
              <span>Weight (%)</span>
              <span />
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_120px_40px] items-start gap-2"
              >
                <div>
                  <Input
                    placeholder="AAPL"
                    {...register(`assets.${index}.ticker`)}
                  />
                  {errors.assets?.[index]?.ticker && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.assets[index].ticker?.message}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="25"
                    {...register(`assets.${index}.weight`, {
                      setValueAs: (v: string) => {
                        const num = parseFloat(v);
                        return isNaN(num) ? 0 : num / 100;
                      },
                    })}
                  />
                  {errors.assets?.[index]?.weight && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.assets[index].weight?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  className="size-9"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}

            {/* Weight total indicator */}
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total Weight</span>
              <span
                className={
                  Math.abs((totalWeight ?? 0) - 1.0) <= 0.001
                    ? "font-medium text-green-600 dark:text-green-400"
                    : "font-medium text-destructive"
                }
              >
                {((totalWeight ?? 0) * 100).toFixed(1)}%
              </span>
            </div>

            {/* Form-level asset errors */}
            {errors.assets?.root && (
              <p className="text-sm text-destructive">
                {errors.assets.root.message}
              </p>
            )}
            {errors.assets?.message && (
              <p className="text-sm text-destructive">
                {errors.assets.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {createMutation.isError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {(createMutation.error as { detail?: string })?.detail ??
                "Failed to create portfolio"}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending
              ? "Creating..."
              : "Create Portfolio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
