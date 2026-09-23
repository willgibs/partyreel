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
      {/* delayDuration 0 (`bulk-toolbar=icon`, Will, 2026-09-20: "Tooltip should
          appear immediately on hover rather than delayed" - said of the bulk
          bar, but the root provider is the one dial every tooltip site-wide
          reads, so the ask is site-wide too; the lightbox's ActionTooltip
          opens at once now as well). skipDelayDuration: once one tooltip has
          shown, siblings within 300ms open instantly - scanning a toolbar
          doesn't re-pay the delay, which matters more than ever now that
          "the delay" itself is zero for the FIRST tooltip in a group (it is
          what keeps a fast mouse pass from flashing one open per pixel). */}
      <TooltipProvider delayDuration={0} skipDelayDuration={300}>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
