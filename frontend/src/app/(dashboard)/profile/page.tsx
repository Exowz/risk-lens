"use client";

/**
 * User profile page.
 *
 * Displays avatar with initials, user info, and preferences
 * (Expert/Beginner mode).
 *
 * Depends on: lib/auth/client.ts, lib/store/mode-context.tsx,
 *             lib/api/portfolios.ts, shadcn/ui
 * Used by: /profile route
 */

import { useSession } from "@/lib/auth/client";
import { usePortfolios } from "@/lib/api/portfolios";
import { useMode } from "@/lib/store/mode-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: portfolios } = usePortfolios();
  const { mode, setMode } = useMode();

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
