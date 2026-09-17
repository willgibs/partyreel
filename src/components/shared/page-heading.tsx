import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

// The ONE source for app PAGE titles (Dashboard, Settings, Account, event name, admin pages).
// Renders the brand heading face via the `font-heading` utility = Urbanist 700 (globals.css).
// This is the ladder's `page` step: 24 at a phone, 28 at 1440 (theme.css). Card and dialog
// titles wear the `card-title` step (Urbanist 600), the app's quiet middle is `subsection`,
// and per-setting labels stay Inter 500 (FormLabel).
//
// ★ THE SIZE IS THE STEP, AND A CALL SITE NO LONGER PICKS A NUMBER (Will's type ruling,
// 2026-09-17). Every app h1 wears the same step; "the app travels one rung" is what that law
// means. Size still rides via className and twMerge still wins, but a STOCK size (`text-3xl`,
// `text-lg`) now takes the h1 off the ladder and loses the step's leading and tracking with it.
// The three call sites that passed one were re-pointed at the wiring: two dropped the override,
// and the admin gate card kept a rank by naming another STEP (`text-subsection`).
//
// Do NOT add `font-semibold` (it would drop the 700 to 600), `tracking-tight` (our theme zeroes
// --tracking-tight, and it now CANCELS the step's own letter-spacing through --tw-tracking) or
// a `leading-*` (the same trap through --tw-leading).
export function PageHeading({ className, ...props }: ComponentProps<"h1">) {
  return <h1 className={cn("font-heading text-page", className)} {...props} />;
}
