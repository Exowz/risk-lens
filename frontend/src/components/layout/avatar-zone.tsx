"use client";

/**
 * Avatar zone — bottom-left, syncs visibility with SidebarRail.
 *
 * Shows user initials in a circle. Click opens dropdown (profile, sign out).
 * Follows the same pinned/hidden/peek state as the sidebar.
 *
 * Depends on: ui/dropdown-menu, lib/auth/client, lib/api/client,
 *             lib/store/sidebar-store
 * Used by: app/(dashboard)/layout.tsx
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearSessionTokenCache } from "@/lib/api/client";
import { signOut } from "@/lib/auth/client";
import { useSidebarStore } from "@/lib/store/sidebar-store";

function getInitials(email: string): string {
  const name = email.split("@")[0];
  if (name.includes(".")) {
    const parts = name.split(".");
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface AvatarZoneProps {
  session: {
    user?: {
      email?: string | null;
      name?: string | null;
    } | null;
  };
}

export function AvatarZone({ session }: AvatarZoneProps) {
  const router = useRouter();
  const { state, isPeeking } = useSidebarStore();
  const email = session.user?.email ?? "";
  const name = session.user?.name ?? email.split("@")[0];

  const isVisible = state === "pinned" || isPeeking;

  const handleSignOut = useCallback(async () => {
    clearSessionTokenCache();
    await signOut();
    router.push("/login");
  }, [router]);

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        x: isVisible ? 0 : -60,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            style={{
              width: 52,
              height: 52,
              flexShrink: 0,
              borderRadius: "1rem",
              background: "var(--layout-surface)",
              border: "1px solid var(--layout-surface-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--layout-text-muted)",
              cursor: "pointer",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--layout-active-text)";
              e.currentTarget.style.background = "var(--layout-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--layout-text-muted)";
              e.currentTarget.style.background = "var(--layout-surface)";
            }}
          >
            {getInitials(email)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel>
            <p className="text-xs font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            Profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
