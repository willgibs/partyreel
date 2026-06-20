"use client";

import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Wraps ONE action control in a styled hover/focus tooltip (desktop; radix
// tooltips don't fire on touch, which is what we want — mobile reads the icons
// directly). Reuses the root TooltipProvider (200ms delay). `asChild` keeps the
// child as the real <button>/<a>, so its aria-label stays the a11y name and the
// tooltip is just the visible label. (3c.2 polish — gallery-action labels.)
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
