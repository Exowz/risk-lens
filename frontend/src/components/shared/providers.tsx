"use client";

/**
 * Client-side providers wrapper.
 *
 * Wraps the entire app with ThemeProvider, QueryClientProvider, ModeProvider,
 * and TooltipProvider.
 *
 * Depends on: next-themes, @tanstack/react-query, lib/store/mode-context.tsx,
 *             shadcn/ui tooltip
 * Used by: app/layout.tsx
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ModeProvider } from "@/lib/store/mode-context";

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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <ModeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ModeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
