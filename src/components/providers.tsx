"use client";

import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Client providers mounted once at the root layout. `children` are server
 * components passed through as props, so wrapping here does NOT opt the whole
 * tree into client rendering. Add future cross-cutting providers (analytics,
 * posthog) here so the root layout stays a clean server component.
 *
 * ThemeProvider drives the `.dark` class on <html> (attribute="class" — exactly
 * what the `@custom-variant dark` in globals.css keys off). It defaults to the
 * visitor's device setting (system) and persists a host's override to
 * localStorage, so the preference is global (it styles the marketing site too).
 * The ONLY toggle UI is the account menu (UserMenu). This REQUIRES
 * `suppressHydrationWarning` on <html> (next-themes sets the class in a pre-paint
 * script, before React hydrates). disableTransitionOnChange skips the color sweep.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* skipDelayDuration: once one tooltip has shown, siblings within 300ms
          open instantly - scanning a toolbar doesn't re-pay the delay. */}
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
