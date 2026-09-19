"use client";

import { type ReactNode } from "react";
import { Bookmark, Flag, ImageUp, Lock, QrCode } from "lucide-react";

import {
  GalleryEmptyState,
  GUEST_GHOST_FRAMES,
} from "@/components/guest/gallery-empty-state";
import { GhostGrid } from "@/components/guest/ghost-grid";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { Logo } from "@/components/shared/logo";
import { River } from "@/components/shared/river/river";
import { Button } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { ARRIVAL, EVENT, FIXTURES, type FixtureId } from "./fixtures";

/**
 * THE GUEST PAGE, IN PARTS, SO ONE PART AT A TIME CAN MOVE.
 *
 * Every picture on this board is this page at a real screen, with exactly one
 * axis changed, which is what makes seven questions one board rather than seven
 * boards in a coat: the album is judged under the chrome that was picked, the
 * live signal on the header that was picked, the door over the page it covers.
 *
 * ★ WHAT IS THE SHIPPED COMPONENT AND WHAT IS QUOTED. The album (`GuestMasonry`),
 * the empty album (`GalleryEmptyState` and its river), the locked backdrop
 * (`GhostGrid`), the wordmark (`Logo`), every button (`Button`) and both gate
 * bodies (`PasswordGate`, `EnterEventPrompt`, in door.tsx) are imported and
 * wrapped, never edited. Three things are QUOTED from their shipped source with
 * their classNames copied, and each has a reason that is a landmine rather than
 * a preference:
 *
 *  1. `guest-header.tsx` resolves the visitor's Supabase session on mount, so
 *     in a lab frame it would draw whatever the author happens to be signed in
 *     as, and fetch `/api/me/menu` for every frame on the stage.
 *  2. `event-experience.tsx` is the page's own shell: it wants a gallery
 *     PROMISE, four imperative handles and a router, and the thing this board
 *     asks about is the shape it composes, not the composition it ships.
 *  3. `entry-shell.tsx`, `GuestShare`, `SaveEventButton` and `ReportDialog` all
 *     portal to `document.body`, which inside a frame is the BOARD's body: the
 *     surface would leave the picture entirely (door.tsx, dialogs.tsx).
 *
 * Nothing quoted carries a rule of its own: the tokens, the type steps, the
 * corners and the material are all read from the real sheet the frame copies.
 */

/* ── the screens ─────────────────────────────────────────────────────────── */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;

/** Board state arrives as strings; anything unknown falls back to phone first. */
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/** The page's gutter, the shipped one (`px-5` on the guest page). */
const GUTTER = "px-5";

/* ── the top bar ─────────────────────────────────────────────────────────── */

/**
 * `guest-header.tsx`, quoted: the wordmark, and the one Partyreel sentence a
 * host's event carries. Held constant across every option on this board, so no
 * decision here is secretly a decision about the growth hook.
 */
export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <div className="flex h-8 items-center">
        <Button variant="ghost" size="sm">
          Start for free
        </Button>
      </div>
    </header>
  );
}

/* ── the event block ─────────────────────────────────────────────────────── */

export type LiveShape = "none" | "line" | "land";

export const liveOf = (v: string | undefined): LiveShape =>
  v === "none" ? "none" : v === "line" ? "line" : "land";

/**
 * The left-editorial header: the name, the byline, the count, the description.
 * A LOCKED page carries the name and nothing else, which is not a style choice:
 * the server hands the page a redacted event, so the host's name and the date
 * are not in the payload to draw.
 */
export function EventBlock({
  fixture,
  live = "none",
  className,
}: {
  fixture: FixtureId;
  live?: LiveShape;
  className?: string;
}) {
  const f = FIXTURES[fixture];
  const count = live === "land" ? f.count + 1 : f.count;
  return (
    <header className={className}>
      <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
      {!f.redacted && (
        <>
          <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-faint">Hosted by</span>
              <span className="font-medium text-foreground">{EVENT.host}</span>
            </span>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>{formatEventDate(EVENT.date)}</span>
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {count} photos &amp; videos from {EVENT.guests} guests
            </span>
            {/* THE LIVE SIGNAL. Nothing is rendered today: the doorbell's
                `live` only chooses the poll's cadence, so an album that
                updates in under a second never says it can. */}
            {live === "line" && (
              <span className="flex items-center gap-1.5 text-faint">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-success"
                />
                3 in the last hour
              </span>
            )}
          </p>
          <p className="mt-2 max-w-prose text-[15px] text-pretty text-muted-foreground">
            {EVENT.description}
          </p>
        </>
      )}
    </header>
  );
}

/* ── the actions ─────────────────────────────────────────────────────────── */

export type ChromeShape = "column" | "bar" | "dock";

export const chromeOf = (v: string | undefined): ChromeShape =>
  v === "bar" ? "bar" : v === "column" ? "column" : "dock";

/** The three actions, in whichever furniture the shape asks for. */
function AddButton({ className }: { className?: string }) {
  return (
    <Button type="button" size="lg" className={className}>
      <ImageUp /> Add photos
    </Button>
  );
}

function SaveButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="outline" className={cn("h-9", className)}>
      <Bookmark /> Save
    </Button>
  );
}

function InviteButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="outline" className={cn("h-9", className)}>
      <QrCode /> Invite
    </Button>
  );
}

/** The column's action block, as shipped: a full-width Add over Save + Invite. */
export function ActionColumn() {
  return (
    <div data-gs-actions className="mt-4">
      <AddButton className="w-full" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <SaveButton className="w-full" />
        <InviteButton className="w-full" />
      </div>
    </div>
  );
}

/** The bar's row: the three actions at the album's right edge. */
export function ActionRow({ screen }: { screen: ScreenId }) {
  if (screen === "375")
    // A phone has no room for a row beside the name, so the bar option keeps
    // the column's own stack there and the decision is a laptop's alone.
    return <ActionColumn />;
  return (
    <div data-gs-actions className="flex shrink-0 items-center gap-2">
      <SaveButton />
      <InviteButton />
      <AddButton className="h-9" />
    </div>
  );
}

/**
 * The dock: one bar at the foot of the screen, at every width and every scroll
 * position, holding the three actions the page has.
 */
export function ActionDock({ screen }: { screen: ScreenId }) {
  return (
    <div
      data-gs-dock
      data-gs-actions
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 px-5 py-3 backdrop-blur-sm"
    >
      <div
        className={cn(
          "flex items-center gap-2",
          screen === "1440" && "justify-end",
        )}
      >
        <SaveButton className={screen === "375" ? "flex-1" : undefined} />
        <InviteButton className={screen === "375" ? "flex-1" : undefined} />
        <AddButton className={cn("h-9", screen === "375" && "flex-[2]")} />
      </div>
    </div>
  );
}

/* ── the album ───────────────────────────────────────────────────────────── */

export type NothingShape = "two" | "river" | "words";

export const nothingOf = (v: string | undefined): NothingShape =>
  v === "two" ? "two" : v === "words" ? "words" : "river";

/**
 * The album at whatever the fixture holds, wearing the landed width rule: two
 * columns at a phone (the component's own), a ~240px tile to the window's edge
 * from there up (gallery-wiring, 2026-09-19).
 *
 * ★ `land` IS ONE MORE PHOTOGRAPH, not a filter over the same ones. The
 * question is what a guest sees when somebody else's phone reaches this page
 * while they are on it, and the honest picture of that is an album with a tile
 * in it that was not there a second ago: the layout re-flows, and the newest
 * tile grows into its column (guest-shape.css). Drawn from the album's own
 * twelfth still so the new tile is not a repeat of the one beside it.
 */
export function Album({
  fixture,
  screen,
  live = "none",
}: {
  fixture: FixtureId;
  screen: ScreenId;
  live?: LiveShape;
}) {
  const f = FIXTURES[fixture];
  const items = live === "land" ? [ARRIVAL, ...f.items] : f.items;
  return (
    <div
      data-gs-album={screen === "1440" ? "wide" : "phone"}
      data-gs-landing={live === "land" ? "" : undefined}
    >
      <GuestMasonry items={items} />
    </div>
  );
}

/**
 * THE TWO LANGUAGES FOR "PHOTOGRAPHS ARE COMING", and the one that replaces
 * them. `GhostGrid` is nine empty squares; `GalleryEmptyState` is the river
 * under a title and a CTA, ghosted on its wrapper (Will, `guest-photos=ghost`).
 *
 * ★ THE RIVER LEAKS NOTHING BEHIND A LOCK. Its nine frames are the local
 * `/guest-ghost` WebPs, never the event's media, so a locked page carries the
 * name and the count exactly as it does today.
 */
export function Nothing({
  where,
  shape,
  count,
}: {
  where: "locked" | "empty";
  shape: NothingShape;
  count: number;
}) {
  if (where === "locked") {
    const line = (
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Lock className="size-4" aria-hidden />
        <p className="text-[15px]">{count} photos &amp; videos inside</p>
      </div>
    );
    if (shape === "words")
      return (
        <div data-gs-nothing className="mt-8 space-y-4">
          {line}
        </div>
      );
    if (shape === "river")
      return (
        <div data-gs-nothing className="mt-8 space-y-4">
          {line}
          {/* A dimmer than the empty album's, because a locked page should not
              promise as loudly as an album already open. */}
          <div className="opacity-25 grayscale-[85%]">
            <River frames={GUEST_GHOST_FRAMES} />
          </div>
        </div>
      );
    return (
      <div data-gs-nothing className="mt-8 space-y-4">
        {line}
        <GhostGrid />
      </div>
    );
  }

  if (shape === "words")
    return (
      <div
        data-gs-nothing
        className="mt-10 flex flex-col items-center gap-4 text-center"
      >
        <p className="font-heading text-subsection text-balance">
          This is where it all lands
        </p>
        <Button size="lg">Be the first to add a photo</Button>
      </div>
    );
  if (shape === "two")
    return (
      <div
        data-gs-nothing
        className="mt-8 flex flex-col items-center gap-4 text-center"
      >
        <GhostGrid />
        <p className="font-heading text-subsection text-balance">
          This is where it all lands
        </p>
        <Button size="lg">Be the first to add a photo</Button>
      </div>
    );
  return (
    <div data-gs-nothing className="mt-8">
      <GalleryEmptyState onAddFirst={() => {}} />
    </div>
  );
}

/** The teaser's own boundary: nine photographs and the button that asks. */
export function TeaserFoot({ count }: { count: number }) {
  return (
    <div className="mt-5 flex justify-center">
      <Button>See all {count} photos</Button>
    </div>
  );
}

/** The report footer, as shipped: the one thing at the foot of the page. */
export function ReportFoot() {
  return (
    <footer className="mt-8 flex justify-center border-t border-border/60 pt-5">
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Flag className="size-3" aria-hidden /> Report this album
      </button>
    </footer>
  );
}

/* ── the whole page ──────────────────────────────────────────────────────── */

/**
 * THE PAGE. `chrome` decides where the actions sit, `nothing` what an album
 * with no photographs says, `live` whether the album admits it is filling.
 * `overlay` is whatever door is standing over it.
 */
export function GuestPage({
  screen,
  fixture,
  chrome = "column",
  nothing = "river",
  live = "none",
  overlay,
  underActions,
  aboveAlbum,
  dim = false,
}: {
  screen: ScreenId;
  fixture: FixtureId;
  chrome?: ChromeShape;
  nothing?: NothingShape;
  live?: LiveShape;
  /** A surface floating over the page: a door, a dialog, the viewer. */
  overlay?: ReactNode;
  /** A panel that opens IN the page, under the button that asked for it. */
  underActions?: ReactNode;
  /** A strip the album carries above its photographs. */
  aboveAlbum?: ReactNode;
  dim?: boolean;
}) {
  const f = FIXTURES[fixture];
  const wide = screen === "1440";
  const empty = f.access === "full" && f.items.length === 0;
  const locked = f.access === "none";

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="min-h-0 flex-1">
        {/* The words keep a readable column and the album runs wide, which is
            the shape gallery-wiring landed: both start on the same left line. */}
        <div
          className={cn(
            "py-8",
            wide ? "px-5" : GUTTER,
            chrome === "dock" && "pb-24",
          )}
        >
          {locked ? (
            <>
              <EventBlock fixture={fixture} />
              <div className={wide ? "max-w-md" : undefined}>
                <Nothing where="locked" shape={nothing} count={f.count} />
              </div>
            </>
          ) : (
            <>
              {chrome === "bar" && wide ? (
                <div className="flex items-start justify-between gap-6">
                  <EventBlock fixture={fixture} live={live} />
                  <ActionRow screen={screen} />
                </div>
              ) : (
                <>
                  <EventBlock fixture={fixture} live={live} />
                  {chrome === "column" && <ActionColumn />}
                  {chrome === "bar" && <ActionRow screen={screen} />}
                </>
              )}
              {underActions}
              <div className="mt-7">
                {aboveAlbum}
                {empty ? (
                  <Nothing where="empty" shape={nothing} count={0} />
                ) : (
                  <>
                    <Album fixture={fixture} screen={screen} live={live} />
                    {f.access === "teaser" && <TeaserFoot count={f.count} />}
                  </>
                )}
              </div>
              {!empty && f.access === "full" && <ReportFoot />}
            </>
          )}
        </div>
      </div>
      {chrome === "dock" && !locked && <ActionDock screen={screen} />}
      {dim && <div className="gs-scrim" />}
      {overlay}
    </div>
  );
}
