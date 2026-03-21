/**
 * BetterAuth server-side configuration.
 *
 * Manages user sessions and authentication state.
 * Connects to PostgreSQL for session/user storage.
 *
 * Depends on: better-auth, pg
 * Used by: app/api/auth/[...betterauth]/route.ts, proxy.ts
 */

import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://postgres:password@localhost:5432/risklens",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  basePath: "/api/auth",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
