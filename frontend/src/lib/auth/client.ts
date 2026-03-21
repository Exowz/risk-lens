/**
 * BetterAuth client-side configuration.
 *
 * Provides useSession hook and auth methods (signIn, signUp, signOut)
 * for client components.
 *
 * Depends on: better-auth/react
 * Used by: login/register pages, dashboard layout, API client
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
});

export const { useSession, signIn, signUp, signOut } = authClient;
