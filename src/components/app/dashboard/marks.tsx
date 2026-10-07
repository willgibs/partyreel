import type { ReactNode } from "react";

import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * THE DASHBOARD'S SMALL STATES (host-dashboard r1, the carried `tile` call): a dot that says live, and a
 * mark, one state on a cover, at most one in each top corner.
 *
 * ★ LIVE IS THE RECORDING RED, THE ONE POINT THAT BREATHES (brand-marks r1's status set: a fault, a count that
 * needs her and live share the one red, `--signal`), the one moving thing on a page that is otherwise still: the
 * point dims and comes back (theme.css's `live-signal`), never a ring of light rung out from it, since a glow is
 * the light's and live is a point. Still under reduced motion, where the point alone is the state. It was the
 * success green with a ping, which read as done rather than happening.
 */
export function LiveDot({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      data-live-dot=""
      className={cn(
        "inline-block shrink-0 rounded-full bg-(--signal) motion-safe:animate-live-signal",
        small ? "size-1.5" : "size-2",
      )}
    />
  );
}

/**
 * A status dot off a photograph: someone waits (the needs-you status, `--needs-you`: the one red a count that waits
 * on her wears on every surface, the hub's badges and the code's corner too), or something to set up (an open ring).
 */
export function StateDot({
  tone,
  className,
}: {
  tone: "waiting" | "setup";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        tone === "waiting" ? "bg-(--needs-you)" : "border border-current",
        className,
      )}
    />
  );
}

/**
 * A MARK: one state on a cover, on the product's one glass over a photograph, or the page's own chip on
 * a cover that is still its date. Live carries the dot, a count waiting wears the needs-you status, a step to set up
 * is plain with an open ring.
 */
export function Mark({
  tone,
  on,
  children,
}: {
  tone: "live" | "waiting" | "setup";
  /** On a photograph it is glass; on a date face it is the page's chip. */
  on: "photo" | "page";
  children: ReactNode;
}) {
  return (
    <span
      data-mark={tone}
      className={cn(
        "flex h-6 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[11px] leading-none font-medium whitespace-nowrap",
        on === "photo"
          ? cn("text-white", GLASS_MARK)
          : "bg-background text-foreground shadow-lift ring-1 ring-foreground/8",
      )}
    >
      {tone === "live" ? (
        <LiveDot small />
      ) : (
        <StateDot
          tone={tone}
          className={cn(
            "size-1.5",
            tone === "setup" &&
              (on === "photo" ? "text-white" : "text-foreground/60"),
          )}
        />
      )}
      {children}
    </span>
  );
}
