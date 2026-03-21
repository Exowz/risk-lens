"use client";

/**
 * Client-side providers wrapper for TanStack Query.
 *
 * Wraps the entire app with QueryClientProvider for data fetching.
 *
 * Depends on: @tanstack/react-query
 * Used by: app/layout.tsx
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
