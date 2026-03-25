"use client";

/**
 * User profile page.
 *
 * Displays avatar with initials, user info, preferences,
 * and risk profile section (if profiled via Risk Profiler Express).
 *
 * Depends on: lib/auth/client.ts, lib/store/mode-context.tsx,
 *             lib/api/portfolios.ts, lib/api/profile.ts, shadcn/ui
 * Used by: /profile route
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useSession } from "@/lib/auth/client";
import {
  useAlerts,
  useCreateAlert,
  useDeleteAlert,
  useReportHistory,
  type AlertCreateRequest,
} from "@/lib/api/alerts";
import { usePortfolios } from "@/lib/api/portfolios";
import {
  usePreferences,
  useRiskProfile,
  useUpdatePreferences,
} from "@/lib/api/profile";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { RiskProfilerModal } from "@/components/shared/risk-profiler-modal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

function getInitials(email: string): string {
  const name = email.split("@")[0];
  if (name.includes(".")) {
    const parts = name.split(".");
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const LABEL_MAP: Record<string, string> = {
  court: "Court terme (< 2 ans)",
  moyen: "Moyen terme (2-5 ans)",
  long: "Long terme (> 5 ans)",
  faible: "Faible (< 10%)",
  modere: "Modérée (10-25%)",
  eleve: "Élevée (> 25%)",
  preservation: "Préserver le capital",
  equilibre: "Équilibre rendement/risque",
  croissance: "Maximiser la croissance",
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  expert: "Expert",
};

const MC_OPTIONS = [1000, 5000, 10000] as const;

const METRIC_LABELS: Record<string, string> = {
  var_95: "VaR 95%",
  sharpe: "Sharpe",
  volatility: "Volatilité",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: portfolios } = usePortfolios();
  const { data: riskProfile } = useRiskProfile();
  const { data: dbPreferences } = usePreferences();
  const { data: alerts } = useAlerts();
  const { data: reportHistory } = useReportHistory();
  const { activePortfolioId } = usePortfolioStore();
  const updatePrefs = useUpdatePreferences();
  const createAlertMutation = useCreateAlert();
  const deleteAlertMutation = useDeleteAlert();
  const { mode, setMode } = useMode();
  const [showProfiler, setShowProfiler] = useState(false);
  const [mcSims, setMcSims] = useState(10000);
  const [saved, setSaved] = useState(false);
  const t = useTranslations();

  // Alert form state
  const [alertMetric, setAlertMetric] = useState<"var_95" | "sharpe" | "volatility">("var_95");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");
  const [alertThreshold, setAlertThreshold] = useState("");

  // Hydrate MC sims from DB
  useEffect(() => {
    if (dbPreferences) {
      setMcSims(dbPreferences.monte_carlo_simulations);
    }
  }, [dbPreferences]);

  const email = session?.user?.email ?? "";
  const name = session?.user?.name ?? email.split("@")[0];
  const createdAt = session?.user?.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString("fr-FR", {
        dateStyle: "long",
      })
    : "—";

  return (
    <div className="p-6 space-y-6">
      {/* User info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{name}</CardTitle>
              <CardDescription>{email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">{t("profile.member_since")}</p>
              <p className="text-sm font-medium">{createdAt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("nav.portfolio")}</p>
              <p className="text-sm font-medium">
                {portfolios?.length ?? 0} {t("profile.portfolios_count")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Profile */}
      {riskProfile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {riskProfile.profile_name}
            </CardTitle>
            <CardDescription>{t("profile.risk_profile_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Risk score */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t("profile.risk_score")}
              </span>
              <AnimatedCircularProgressBar
                value={riskProfile.risk_score * 10}
                gaugePrimaryColor="#3b82f6"
                gaugeSecondaryColor="rgba(255,255,255,0.06)"
                className="size-28 text-xl"
              />
              <div className="flex justify-between w-full mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {t("profile.conservative")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("profile.aggressive")}
                </span>
              </div>
            </div>

            {/* Questionnaire answers — 2x2 grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t("profile.horizon")}
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {LABEL_MAP[riskProfile.horizon] ?? riskProfile.horizon}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t("profile.loss_tolerance")}
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {LABEL_MAP[riskProfile.loss_tolerance] ??
                    riskProfile.loss_tolerance}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t("profile.objective")}
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {LABEL_MAP[riskProfile.objective] ?? riskProfile.objective}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t("profile.experience")}
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {LABEL_MAP[riskProfile.experience] ?? riskProfile.experience}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfiler(true)}
            >
              {t("profile.redo_profiler")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {t("profile.risk_profile")}
            </CardTitle>
            <CardDescription>
              {t("profile.risk_profile_empty_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowProfiler(true)}>
              {t("profile.create_profile")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Risk Profiler Modal */}
      <RiskProfilerModal
        open={showProfiler}
        onClose={() => setShowProfiler(false)}
      />

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("profile.preferences")}</CardTitle>
          <CardDescription>
            {t("profile.preferences_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("mode.expert")}</p>
              <p className="text-xs text-muted-foreground">
                {mode === "expert"
                  ? t("profile.expert_mode_desc")
                  : t("profile.beginner_mode_desc")}
              </p>
            </div>
            <Switch
              checked={mode === "expert"}
              onCheckedChange={(checked) =>
                setMode(checked ? "expert" : "beginner")
              }
            />
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium">{t("profile.mc_simulations")}</p>
            <p className="text-xs text-muted-foreground mb-3">
              {t("profile.mc_simulations_desc")}
            </p>
            <div className="flex gap-2">
              {MC_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setMcSims(opt);
                    setSaved(false);
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-mono transition-all ${
                    mcSims === opt
                      ? "border-white/30 bg-white/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-white/20"
                  }`}
                >
                  {opt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={updatePrefs.isPending}
              onClick={() => {
                updatePrefs.mutate(
                  { mode, monte_carlo_simulations: mcSims },
                  {
                    onSuccess: () => {
                      setSaved(true);
                      setTimeout(() => setSaved(false), 2000);
                    },
                  },
                );
              }}
            >
              {updatePrefs.isPending ? t("profile.saving") : t("profile.save")}
            </Button>
            {saved && (
              <span className="text-xs text-emerald-500">
                {t("toasts.preferences_saved")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {t("profile.report_history")}
          </CardTitle>
          <CardDescription>
            {t("profile.report_history_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportHistory && reportHistory.length > 0 ? (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

              {reportHistory.map((report) => (
                <div key={report.report_id} className="relative pl-8 pb-4">
                  {/* Dot */}
                  <div className="absolute left-1.5 top-1.5 size-3 rounded-full border-2 border-blue-500 bg-background" />

                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {report.portfolio_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.generated_at).toLocaleDateString(
                          "fr-FR",
                          { dateStyle: "medium" },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("profile.no_reports")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("profile.alerts")}</CardTitle>
          <CardDescription>
            {t("profile.alerts_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active alerts */}
          {alerts && alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {METRIC_LABELS[alert.metric] ?? alert.metric}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {alert.direction === "above" ? t("profile.above") : t("profile.below")}{" "}
                      <span className="font-mono">{alert.threshold}</span>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-400"
                    onClick={() => deleteAlertMutation.mutate(alert.id)}
                    disabled={deleteAlertMutation.isPending}
                  >
                    {t("portfolio.delete")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Create alert form */}
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("profile.new_alert")}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select
                value={alertMetric}
                onValueChange={(v) =>
                  setAlertMetric(v as "var_95" | "sharpe" | "volatility")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="var_95">VaR 95%</SelectItem>
                  <SelectItem value="sharpe">Sharpe</SelectItem>
                  <SelectItem value="volatility">{t("profile.volatility_label")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={alertDirection}
                onValueChange={(v) =>
                  setAlertDirection(v as "above" | "below")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">{t("profile.above")}</SelectItem>
                  <SelectItem value="below">{t("profile.below")}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                step="0.01"
                placeholder={t("profile.threshold")}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              disabled={
                !alertThreshold ||
                !activePortfolioId ||
                createAlertMutation.isPending
              }
              onClick={() => {
                if (!activePortfolioId || !alertThreshold) return;
                const req: AlertCreateRequest = {
                  portfolio_id: activePortfolioId,
                  metric: alertMetric,
                  threshold: parseFloat(alertThreshold),
                  direction: alertDirection,
                };
                createAlertMutation.mutate(req, {
                  onSuccess: () => setAlertThreshold(""),
                });
              }}
            >
              {createAlertMutation.isPending
                ? t("profile.creating_alert")
                : t("profile.add_alert")}
            </Button>
            {!activePortfolioId && (
              <p className="text-xs text-muted-foreground">
                {t("profile.select_portfolio_for_alert")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
