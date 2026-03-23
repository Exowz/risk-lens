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

import { useState } from "react";

import { useSession } from "@/lib/auth/client";
import { usePortfolios } from "@/lib/api/portfolios";
import { useRiskProfile } from "@/lib/api/profile";
import { useMode } from "@/lib/store/mode-context";
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
import { Progress } from "@/components/ui/progress";
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

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: portfolios } = usePortfolios();
  const { data: riskProfile } = useRiskProfile();
  const { mode, setMode } = useMode();
  const [showProfiler, setShowProfiler] = useState(false);

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
              <p className="text-xs text-muted-foreground">Membre depuis</p>
              <p className="text-sm font-medium">{createdAt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Portefeuilles</p>
              <p className="text-sm font-medium">
                {portfolios?.length ?? 0} portefeuille
                {(portfolios?.length ?? 0) !== 1 ? "s" : ""}
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
            <CardDescription>Profil de risque personnalisé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Risk score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Score de risque
                </span>
                <span className="font-mono text-sm text-foreground">
                  {riskProfile.risk_score}/10
                </span>
              </div>
              <Progress value={riskProfile.risk_score * 10} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  Conservateur
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Agressif
                </span>
              </div>
            </div>

            {/* Questionnaire answers — 2x2 grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Horizon
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {LABEL_MAP[riskProfile.horizon] ?? riskProfile.horizon}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Tolérance aux pertes
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {LABEL_MAP[riskProfile.loss_tolerance] ??
                    riskProfile.loss_tolerance}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Objectif
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {LABEL_MAP[riskProfile.objective] ?? riskProfile.objective}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Expérience
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
              Refaire le profil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Profil de risque
            </CardTitle>
            <CardDescription>
              Découvrez votre profil d&apos;investisseur en quelques questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowProfiler(true)}>
              Créer mon profil de risque
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
          <CardTitle className="text-base font-medium">Préférences</CardTitle>
          <CardDescription>
            Personnalisez l&apos;affichage de RiskLens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mode Expert</p>
              <p className="text-xs text-muted-foreground">
                {mode === "expert"
                  ? "Toutes les métriques techniques et données brutes visibles"
                  : "Labels simplifiés et explications pédagogiques"}
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
            <p className="text-sm font-medium">
              Simulations Monte Carlo
            </p>
            <p className="text-xs text-muted-foreground">
              Par défaut : 10 000 trajectoires · 252 jours de trading
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
