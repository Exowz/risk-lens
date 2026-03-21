/**
 * Dashboard overview page with placeholder KPI cards.
 *
 * This is a Server Component. KPI data will be fetched via
 * TanStack Query hooks once the API endpoints are implemented.
 *
 * Depends on: shadcn/ui (Card)
 * Used by: /dashboard route
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const placeholderKpis = [
  {
    title: "Portfolio Value",
    description: "Total current value",
    value: "--",
    subtitle: "Select a portfolio to view",
  },
  {
    title: "Value at Risk (95%)",
    description: "1-day VaR",
    value: "--",
    subtitle: "Run risk analysis",
  },
  {
    title: "Expected Return",
    description: "Annualized",
    value: "--",
    subtitle: "Based on historical data",
  },
  {
    title: "Sharpe Ratio",
    description: "Risk-adjusted return",
    value: "--",
    subtitle: "Higher is better",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your portfolio risk metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {placeholderKpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.description}</CardDescription>
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Welcome to RiskLens. Create or select a portfolio to begin
            analyzing risk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Navigate to the Portfolio section to create your first portfolio,
            then use Risk Analysis, Markowitz optimization, and Stress Testing
            to evaluate your positions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
