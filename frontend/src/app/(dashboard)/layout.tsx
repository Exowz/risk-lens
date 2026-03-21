"use client";

/**
 * Protected dashboard layout with sidebar navigation.
 *
 * Uses BetterAuth useSession to verify auth state client-side.
 * Provides sidebar navigation to all dashboard sub-pages.
 *
 * Depends on: lib/auth/client.ts, shadcn/ui, lucide-react
 * Used by: all (dashboard)/* pages
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth/client";
import { clearSessionTokenCache } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  PieChart,
  TrendingDown,
  Target,
  AlertTriangle,
  FileText,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/risk", label: "Risk Analysis", icon: TrendingDown },
  { href: "/markowitz", label: "Markowitz", icon: Target },
  { href: "/stress", label: "Stress Test", icon: AlertTriangle },
  { href: "/report", label: "Report", icon: FileText },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r bg-muted/40 p-4">
          <Skeleton className="mb-6 h-8 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-10 w-full" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  async function handleSignOut() {
    clearSessionTokenCache();
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-muted/40">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">RiskLens</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Portfolio Risk Management
          </p>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-4">
          <p className="mb-2 truncate text-sm text-muted-foreground">
            {session.user?.email}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
