"use client";

import { type ReactNode } from "react";
import { Clock, DoorClosed } from "lucide-react";

import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { AlmostIn, DoorHeading } from "@/components/guest/door/heading";
import {
  DOOR_SCRIM,
  DoorGlyph,
  DoorLamp,
  type LampStrength,
} from "@/components/guest/door/lit";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import { Logo } from "@/components/shared/logo";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { floatingEdgeEntranceResponsive } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { EVENT, HOST } from "./fixtures";
import type { ScreenId } from "./screens";

/**
 * THE GUEST'S SIDE OF A WAITING DOOR (ported from event-safety's `guest.tsx`
 * for the `waiting` ask). The shipped `NotFoundScreen` and `GhostRiver` are
 * the real components, and so are the lit door's own pieces (`door/lit.tsx`,
 * `door/heading.tsx`), imported rather than redrawn so the door here cannot
 * drift from the one a guest meets. The Sheet around them is quoted: the guest
 * header resolves a session on mount and the Sheet sits in a Radix portal.
 *
 * ★ NOTHING REAL STANDS BEHIND A WAITING DOOR (the board's `nothing-behind`
 * call): the ghost river a password page draws, never the teaser's photos.
 * The waiting words are placeholders, judged for size and tone; the closed
 * screen's own words are `locked-door`'s, so no door here draws them.
 */

/** The guest header, quoted (`guest-header.tsx`): the logo, then who this is. */
export function GuestTop() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <div className="flex h-8 items-center">
        <Button variant="ghost" size="sm" tabIndex={-1}>
          Start for free
        </Button>
      </div>
    </header>
  );
}

/** The event's own heading, as the door's page draws it behind the sheet. */
function EventHead() {
  return (
    <div>
      <p className="font-heading text-page text-balance">{EVENT.name}</p>
    </div>
  );
}

/** `ui/sheet.tsx`'s scrim and panel, quoted: its content keeps its classes private. */
const SHEET_SCRIM =
  "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs";
const SHEET_PANEL =
  "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer";

/**
 * THE DOOR ITSELF, HELD AND LIT (`entry-shell.tsx`): the one product Sheet in
 * the door's padding (`DOOR_SHEET`), no handle and no close, the door's own
 * scrim over the page, the lamp on the Sheet's free edge (the top in a hand,
 * the left at a desk), and the ghost river behind it.
 */
export function HeldDoor({
  screen,
  lamp = "base",
  children,
}: {
  screen: ScreenId;
  lamp?: LampStrength;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestTop />
      <div className="px-5 pt-6">
        <EventHead />
        <div className="mt-8">
          <GhostRiver />
        </div>
      </div>
      <div aria-hidden className={cn(SHEET_SCRIM, DOOR_SCRIM)} />
      <div
        data-slot="sheet-content"
        data-side="responsive"
        data-entry-sheet=""
        data-door-lit=""
        data-set-door={screen === "375" ? "phone" : "desk"}
        className={cn(SHEET_PANEL, floatingEdgeEntranceResponsive, DOOR_SHEET)}
      >
        <DoorLamp edge="free" strength={lamp} />
        <div className="relative pt-1">{children}</div>
      </div>
    </div>
  );
}

/** The words a door says: a title and one plain line, measured as one. */
export type DoorWords = { title: string; line: string };

/**
 * A DOOR STEP, AS EVERY STEP OF THE LIT DOOR HEADS (`door/heading.tsx`'s one
 * scale, from the left): the eyebrow, the title on the page step, the line,
 * then the step's own controls. The line carries `data-set-line`, which is
 * what the frame's caption counts.
 */
export function DoorStep({
  eyebrow,
  almost = false,
  words,
  children,
}: {
  eyebrow: string;
  almost?: boolean;
  words: DoorWords;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <DoorHeading
        eyebrow={
          almost ? (
            <AlmostIn>Almost in</AlmostIn>
          ) : (
            <>
              <DoorGlyph icon={DoorClosed} hue={1} className="size-3" />
              {eyebrow}
            </>
          )
        }
        title={words.title}
        reason={<span data-set-line>{words.line}</span>}
      />
      {children}
    </div>
  );
}

/** The waiting door's live mark: still, so reduced motion has nothing to stop. */
export function WaitingMark({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
      <Clock className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/** The waiting page, in the closed door's family (`NotFoundScreen` wearing a clock). */
export function WaitingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestTop />
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
        <NotFoundScreen
          icon={Clock}
          title={`${HOST.first} has been asked`}
          description={
            <span data-set-line>
              {`This page opens the album the moment ${HOST.first} lets you in.`}
            </span>
          }
          actions={
            <Button size="cta" variant="outline" tabIndex={-1}>
              What is Partyreel?
            </Button>
          }
          footnote={<WaitingMark label="Asked 2 min ago" />}
        />
      </main>
    </div>
  );
}
