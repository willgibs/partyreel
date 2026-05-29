"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Client providers mounted once at the root layout. `children` are server
 * components passed through as props, so wrapping here does NOT opt the whole
 * tree into client rendering. Add future cross-cutting providers (theme,
 * analytics, posthog) here so the root layout stays a clean server component.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={200}>{children}</TooltipProvider>;
}
