"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { ActionTooltip } from "@/components/shared/action-tooltip";
import { RouteSkeleton } from "@/components/shared/route-skeleton";
import { SetNameStep } from "@/components/shared/set-name-step";

import { Row } from "@/app/(dev)/design/reference/reference-ui";

/**
 * The shared pieces that need a handler or a mount of their own. Moved here
 * from `reference/` in the gallery round (2026-09-12) so the collector indexes
 * them at /design/patterns, the page that actually renders them, instead of
 * /design/reference, which is not a route (see components/interactive-demos).
 */

/** RouteSkeleton: the pulse and the hub, the bare app-shell content the real
 *  loading.tsx files return, safe to show inline. */
export function RouteSkeletonDemo() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border">
        <p className="border-b border-border bg-muted/40 px-3 py-1.5 text-micro text-muted-foreground">
          Pulse: the dashboard
        </p>
        <div className="p-3">
          <RouteSkeleton variant="pulse" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <p className="border-b border-border bg-muted/40 px-3 py-1.5 text-micro text-muted-foreground">
          Hub: the event page
        </p>
        <div className="p-3">
          <RouteSkeleton variant="hub" />
        </div>
      </div>
    </div>
  );
}

/** ActionTooltip: the lightbox-only tooltip around one real action control. */
export function ActionTooltipDemo() {
  const [liked, setLiked] = useState(false);
  return (
    <Row>
      <ActionTooltip label={liked ? "Unlike" : "Like"}>
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          onClick={() => setLiked((v) => !v)}
          className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground"
        >
          <Heart className={liked ? "size-4 fill-like text-like" : "size-4"} />
        </button>
      </ActionTooltip>
      <span className="text-sm text-muted-foreground">
        The child keeps its own aria-label; the tooltip is presentational.
      </span>
    </Row>
  );
}

// SetNameStep takes an onSaved CALLBACK (a function prop), so it can only be
// rendered from a client component (functions can't cross the RSC boundary).
// `inert` makes it a visual-only preview: its real submit hits a server action.
export function SetNameStepDemo() {
  return (
    <div inert>
      <SetNameStep onSaved={() => {}} />
    </div>
  );
}
