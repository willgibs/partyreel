"use client";

import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Wraps ONE action control in a styled hover/focus tooltip (desktop). Reuses the
// root TooltipProvider (200ms delay). `asChild` keeps the child as the real
// <button>/<a>, so its aria-label stays the a11y name and the tooltip is the
// visible label.
//
// LIGHTBOX-ONLY (Will, 2026-06-20 redo). The lightbox renders client-only
// (`MediaLightboxLazy` is `ssr:false`), so its tooltips can't cause a hydration
// mismatch. Do NOT use this on the SSR'd gallery tiles — wrapping ~50 tile actions
// in radix Tooltips (esp. the nested Tooltip->Dialog on Remove) regressed host
// gallery hydration in prod (the subtree silently failed to hydrate). Tiles use
// native `title` instead.
export function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
