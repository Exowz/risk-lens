/**
 * Base fetch wrapper for FastAPI backend communication.
 *
 * Automatically injects the BetterAuth session token into
 * the Authorization header for all requests.
 *
 * BetterAuth session cookies are HttpOnly, so we cannot read them
 * from document.cookie. Instead we call /api/auth/get-session
 * (same-origin — the browser sends the HttpOnly cookie automatically)
 * and cache the returned token in memory.
 *
 * Depends on: NEXT_PUBLIC_API_URL env var, BetterAuth /api/auth/get-session
 * Used by: all TanStack Query hooks in /lib/api/
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface ApiError {
  detail: string;
  status: number;
}

// ── Session token cache ──

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Fetch the session token from BetterAuth's get-session endpoint.
 *
 * The browser sends the HttpOnly session cookie automatically since
 * the request is same-origin. The response includes the raw token
 * which we can then forward to FastAPI as a Bearer token.
 *
 * Cached in memory for 4 minutes (BetterAuth cookieCache is 5 min).
 */
async function getSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // Return cached token if still fresh
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch("/api/auth/get-session", {
      credentials: "include",
    });
    if (!res.ok) return null;

    const data: { session?: { token?: string } } = await res.json();
    const token = data?.session?.token ?? null;

    if (token) {
      cachedToken = token;
      tokenExpiresAt = Date.now() + 4 * 60 * 1000; // 4 min
    }

    return token;
  } catch {
    return null;
  }
}

/** Clear the cached token (call on sign-out). */
export function clearSessionTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

// ── API client ──

/**
 * Make an authenticated request to the FastAPI backend.
 *
 * @param endpoint - API path (e.g., "/api/v1/portfolios")
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response
 * @throws ApiError with status and detail on non-OK responses
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  // Inject auth token — reject early if not authenticated
  const token = await getSessionToken();
  if (!token) {
    throw { detail: "Not authenticated", status: 401 } satisfies ApiError;
  }
  headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // If FastAPI says 401, our cached token may be stale — clear it
    if (response.status === 401) {
      clearSessionTokenCache();
    }

    const errorData = await response.json().catch(() => ({
      detail: "An unexpected error occurred",
    }));

    const error: ApiError = {
      detail: errorData.detail ?? "Request failed",
      status: response.status,
    };
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
