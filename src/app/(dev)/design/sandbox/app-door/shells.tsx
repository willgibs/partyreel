"use client";

import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * ROUND TWO'S SHARED GROUND: the two screen sizes, the safety wrapper, and the
 * two small pieces every shape of `tour` stacks its screens in. Kept from
 * round one because `tour` still draws on real shipped pieces (`SetNameStep`,
 * `Button`) that carry real handlers.
 *
 * ★ SUBTRACTIVE. Round one's `page`, `existing` and `surfaces` asks are ruled
 * and wired (`door-wiring`, `f7075a73`), so the shapes this file drew for them
 * (`DoorCard`, `DoorPage`, `DoorSheetBody`, `Sheet`, `Scrim`, `PhotoWall`) are
 * gone with the asks: none of them is reachable from `welcome`, which never
 * touches the login page or the guest gate's sheet. `app-door.css`'s overlay
 * and wall rules went with them.
 *
 * ★ WHY `Screen` AND `FlowCard` LIVE HERE, NOT IN `welcome.tsx`. Four shapes
 * are four files now (`welcome.tsx` for `cards` and `one`, `stage.tsx`,
 * `film.tsx`), and `board.tsx` asks `welcome.tsx` for all four so the ask's
 * preview map stays in one place. A shape file importing its numbered wrapper
 * FROM `welcome.tsx` would make `welcome.tsx` import `stage.tsx` and
 * `stage.tsx` import `welcome.tsx` back, which is a cycle the bundler resolves
 * by luck rather than by design. The two pieces neither shape owns sit beside
 * `Still` instead, which every shape already depends on.
 */

/* ── the screens ─────────────────────────────────────────────────────────── */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;

/** Board state arrives as strings; anything unknown is the laptop. */
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

/* ── the still ───────────────────────────────────────────────────────────── */

/**
 * ★ A PREVIEW IS A STILL, AND THAT IS A SAFETY RULE, NOT A STYLE ONE.
 *
 * `SetNameStep` holds a real handler that writes `profiles.display_name`, and
 * the closing doors below it are real `Button`s pointed at real navigation.
 * Capturing the click before it reaches React's handler is the one way to keep
 * the shipped components on the board and still promise that no preview
 * touches the network or leaves the frame.
 *
 * Submits and Enter are caught too: a form inside a frame would otherwise
 * navigate the frame's document.
 */
export function Still({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      onSubmitCapture={(e) => e.preventDefault()}
      onKeyDownCapture={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      onClickCapture={(e) => {
        const el = e.target as HTMLElement | null;
        if (el?.closest("button, a, [role='button']")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
}

/* ── the stack's shared pieces ───────────────────────────────────────────── */

/**
 * One screen of a flow, numbered, so the count a caption claims is the count
 * a reader can see. `wide` swaps the caption's own column for the wider one
 * `stage`'s "copy beside it" layout needs; the children pick their own width
 * either way, this only keeps the label lined up with what sits under it.
 */
export function Screen({
  n,
  of,
  label,
  wide = false,
  children,
}: {
  n: number;
  of: number;
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div data-ad-screen className="flex flex-col gap-2">
      <p
        className={cn(
          "mx-auto w-full text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        {n} of {of} · {label}
      </p>
      {children}
    </div>
  );
}

/** The card every narrow screen of the flow is drawn in, as the shipped flow draws it. */
export function FlowCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("mx-auto w-full max-w-lg", className)}>{children}</Card>
  );
}
