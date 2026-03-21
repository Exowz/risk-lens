/**
 * BetterAuth catch-all route handler.
 *
 * Handles all /api/auth/* requests (sign-in, sign-up, sign-out, session, etc.)
 *
 * Depends on: lib/auth/server.ts
 * Used by: BetterAuth client SDK
 */

import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";

export const { GET, POST } = toNextJsHandler(auth);
