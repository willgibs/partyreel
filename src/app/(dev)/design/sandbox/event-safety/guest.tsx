"use client";

import { type CSSProperties, type ReactNode } from "react";
import { Clock, DoorClosed, Lock, QrCode, RefreshCw, X } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { GuestBar } from "@/components/guest/guest-bar";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { AlmostIn, DoorHeading } from "@/components/guest/door/heading";
import {
  DOOR_SCRIM,
  DoorCheck,
  DoorGlyph,
  DoorLamp,
  type LampStrength,
} from "@/components/guest/door/lit";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import { Logo } from "@/components/shared/logo";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingEdgeEntranceResponsive } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { ALBUM, EVENT, HOST, REFUSED } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE GUEST'S SIDE: every door a block or a closed album puts in front of a
 * person, and the album a refusal closes. The shipped `NotFoundScreen`,
 * `GuestBar` and `GhostRiver` are the real components, since all three are
 * presentational, and so are the lit door's own pieces (`door/lit.tsx`,
 * `door/heading.tsx`: the lamp, the heading from the left, the check that
 * blooms), imported rather than redrawn so the door here cannot drift from the
 * one a guest meets again (the refresh, 2026-09-28: every door on this board
 * had been drawn before the door wore lit). The Sheet around them is quoted:
 * the guest header resolves a session on mount and the Sheet sits in a Radix
 * portal, and neither may reach the network or portal out of the frame.
 *
 * ★ THE WORDS ON EVERY CLOSED DOOR ARE PLACEHOLDERS (the brief: "judged for
 * size and tone, not final copy"), and none of them is one of `voice-guest`'s
 * lines; the one line of his here is the failed upload's, worn as he picked it
 * (`failed=exact`). What IS decided here is the door's form, where it stands
 * and what it gives away; the line itself is the size a plain sentence takes.
 *
 * ★ NOTHING REAL STANDS BEHIND A CLOSED OR WAITING DOOR (the board's
 * `nothing-behind` call): the ghost river a password page draws, never the
 * teaser's nine photographs. A door that exists to keep an album closed does
 * not open a window onto it.
 */

/** Who the header says this device is. */
type Who =
  | { kind: "stranger" }
  | { kind: "member"; name: string; seed: string };

/** The guest header, quoted (`guest-header.tsx`): the logo, then who this is. */
export function GuestTop({ who = { kind: "stranger" } }: { who?: Who }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <div className="flex h-8 items-center">
        {who.kind === "stranger" ? (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        ) : (
          <Avatar size="sm" seed={who.seed}>
            <AvatarFallback className="text-[10px]">
              {who.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

/** The event's own heading: the name, and the host's byline where it is shown. */
function EventHead({ byline = true }: { byline?: boolean }) {
  return (
    <div>
      <p className="font-heading text-page text-balance">{EVENT.name}</p>
      {byline && (
        <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-faint">Hosted by</span>
          <Avatar seed={HOST.seed} size="sm">
            <AvatarFallback>{HOST.first.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{HOST.first}</span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{EVENT.date}</span>
        </p>
      )}
    </div>
  );
}

/** The album on the shipped column rule, as a guest holds it. */
function Album({ items }: { items: readonly GridMedia[] }) {
  return (
    <div className={GALLERY_COLUMNS}>
      {items.map((item) => (
        <div
          key={item.id}
          style={
            {
              aspectRatio: `${item.width} / ${item.height}`,
              borderRadius: "var(--radius-tile)",
            } as CSSProperties
          }
          className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
        >
          <MediaTile item={item} playBadge="none" />
        </div>
      ))}
    </div>
  );
}

/** The album page a guest already inside holds: the header, the heading, the album. */
export function GuestAlbum({
  who,
  overlay,
}: {
  who: Who;
  overlay?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestTop who={who} />
      <div className="space-y-5 px-5 pt-6 pb-10">
        <EventHead />
        <Album items={ALBUM} />
      </div>
      {overlay}
    </div>
  );
}

/* ── the three forms a closed door can take ───────────────────────────────── */

/** The words a closed door says: a title and one plain line, measured as one. */
export type DoorWords = { title: string; line: string };

/** The blocked door's placeholder words, shared by every form that says them. */
export const CLOSED: DoorWords = {
  title: "This album is closed",
  line: "It isn't open to visitors right now.",
};

/**
 * THE PRIVATE ALBUM'S LOCKED SCREEN (`e/[token]/page.tsx`'s private branch): the
 * not-found family wearing a lock, under the real header, one link home.
 * `below` is what an option adds under the actions (the way back in for
 * someone already a guest).
 */
export function LockedScreen({
  words,
  below,
  notice,
}: {
  words: DoorWords;
  below?: ReactNode;
  /** A line above the lock, for the moment a visit ends here. */
  notice?: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestTop />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-20">
        {notice}
        <NotFoundScreen
          icon={Lock}
          title={words.title}
          description={<span data-es-line>{words.line}</span>}
          actions={
            <Button size="cta" variant="outline" tabIndex={-1}>
              What is Partyreel?
            </Button>
          }
          footnote={below}
        />
      </main>
    </div>
  );
}

/**
 * THE DEAD LINK (`e/[token]/not-found.tsx`), word for word: the page a
 * mistyped QR meets. Its own words are the ones a blocked person would read,
 * which is this option's whole cost: it tells them the host may have deleted
 * the album and to ask the host to resend it.
 */
export function DeadLink({ notice }: { notice?: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestBar />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-20">
        {notice}
        <NotFoundScreen
          icon={QrCode}
          eyebrow="Event link"
          title="This event link didn't work"
          description={
            <span data-es-line>
              The link may be mistyped, or the host may have deleted the event.
              Double-check the QR code or link, or ask the host to resend it.
            </span>
          }
          actions={
            <Button size="cta" tabIndex={-1}>
              What is Partyreel?
            </Button>
          }
          help={<HelpLine href="/help">Visit the help center</HelpLine>}
        />
      </main>
    </div>
  );
}

/**
 * `ui/sheet.tsx`'s scrim and panel, quoted: its content element keeps its
 * classes private, and a Radix portal would leave the frame. Production's own
 * utilities, so the responsive posture resolves at the frame's real width.
 */
const SHEET_SCRIM =
  "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs";
const SHEET_PANEL =
  "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer";

/**
 * THE ONE PRODUCT SHEET, AT REST (`SheetContent responsive`): the bottom sheet
 * in a hand and the panel from the right at a desk, both from the floating
 * layer's own posture pair (`floatingEdgeEntranceResponsive`, keyed by the
 * `data-side` it sets), never re-spelled here.
 */
function ResponsiveSheet({
  scrim,
  className,
  attrs,
  close = false,
  children,
}: {
  /** The door's own scrim (`DOOR_SCRIM`), laid over the Sheet's. */
  scrim?: string;
  className?: string;
  /** The data attributes the real one carries (`data-entry-sheet`, `data-door-lit`). */
  attrs?: Record<`data-${string}`, string>;
  /** The Sheet's close in its corner (a free sheet; the held door has none). */
  close?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div aria-hidden className={cn(SHEET_SCRIM, scrim)} />
      <div
        data-slot="sheet-content"
        data-side="responsive"
        {...attrs}
        className={cn(SHEET_PANEL, floatingEdgeEntranceResponsive, className)}
      >
        {children}
        {close && (
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            aria-label="Close"
            className="absolute top-3 right-3"
          >
            <X />
          </Button>
        )}
      </div>
    </>
  );
}

/**
 * THE DOOR ITSELF, HELD AND LIT (`entry-shell.tsx`, guest-door `6f06207e`,
 * door-r3-wiring `97038b8e`): the one product Sheet in the door's padding
 * (`DOOR_SHEET`), no handle and no close, the door's own scrim over the page
 * (`DOOR_SCRIM`), and the lamp on the Sheet's free edge (the top in a hand,
 * the left at a desk), in the house five here because nothing behind a closed
 * door may be sampled. Behind it the ghost river (or, mid-visit, the album the
 * door has just closed over). `lamp` blooms on "You're in", as the shell does.
 */
export function HeldDoor({
  screen,
  behind = "river",
  who,
  lamp = "base",
  children,
}: {
  screen: ScreenId;
  behind?: "river" | "album";
  who?: Who;
  lamp?: LampStrength;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestTop who={who} />
      {behind === "album" ? (
        <div className="space-y-5 px-5 pt-6 pb-10">
          <EventHead />
          <Album items={ALBUM} />
        </div>
      ) : (
        <div className="px-5 pt-6">
          <EventHead byline={false} />
          <div className="mt-8">
            <GhostRiver />
          </div>
        </div>
      )}
      <ResponsiveSheet
        scrim={DOOR_SCRIM}
        className={DOOR_SHEET}
        attrs={{
          "data-entry-sheet": "",
          "data-door-lit": "",
          "data-es-door": screen === "375" ? "phone" : "desk",
        }}
      >
        <DoorLamp edge="free" strength={lamp} />
        <div className="relative pt-1">{children}</div>
      </ResponsiveSheet>
    </div>
  );
}

/**
 * A DOOR STEP, AS EVERY STEP OF THE LIT DOOR HEADS (`door/heading.tsx`'s one
 * scale, from the left): the eyebrow, the title on the page step, the line,
 * then the step's own controls. The eyebrow is the gate's "Almost in" with its
 * lit Lock where the person is still at the gate (`almost`), otherwise the
 * album's name beside a small glyph in the lamp's light (`icons=lit`: the small
 * glyphs take the same light). The line carries `data-es-line`, which is what
 * the frame's caption counts.
 */
export function DoorStep({
  Icon = DoorClosed,
  eyebrow,
  almost = false,
  words,
  children,
}: {
  Icon?: typeof DoorClosed;
  eyebrow: string;
  /** The gate's eyebrow ("Almost in"), for someone still at it. */
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
              <DoorGlyph icon={Icon} hue={1} className="size-3" />
              {eyebrow}
            </>
          )
        }
        title={words.title}
        reason={<span data-es-line>{words.line}</span>}
      />
      {children}
    </div>
  );
}

/**
 * THE DOOR'S SUCCESS BEAT, QUOTED (`entry-modal.tsx`'s `SuccessStep`, beat=lit):
 * the check blooming in the lamp's hues (the real `DoorCheck`, its motion its
 * own and still under reduced motion), "You're in" in place, and the line under
 * it. Its door lamp blooms with it (`HeldDoor`'s `lamp="bloom"`).
 */
export function InStep({ line }: { line: string }) {
  return (
    <div
      data-door-beat="in"
      className="flex flex-col items-center gap-4 py-8 text-center"
    >
      <DoorCheck size="mark" />
      <div>
        <p className="font-heading text-page">You&rsquo;re in</p>
        <p className="mt-1 text-base text-muted-foreground">{line}</p>
      </div>
    </div>
  );
}

/** A quiet line and its link, under a door's actions. */
export function QuietWay({ lead, link }: { lead: string; link: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {lead}{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        {link}
      </span>
    </p>
  );
}

/**
 * The waiting door's live mark: still, so reduced motion has nothing to stop.
 * It stands where its step reads from (the lit door's left, the page's centre).
 */
export function WaitingMark({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
      <Clock className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/**
 * What did not go when a block refuses Dom's two sends mid-visit, in
 * voice-guest's `failed=exact` heading ("{failed} of {sent} didn't upload"):
 * the failure sheet heads with it, and the held door says it on its way shut.
 */
export const REFUSED_HEADING = `${REFUSED.length} of ${REFUSED.length} didn’t upload`;

/**
 * THE FAILURE SHEET, QUOTED (`upload/failure-sheet.tsx`, the one product Sheet)
 * for the refusal a block causes mid-visit: Dom sends two more after the block
 * and neither goes. It speaks in Will's `voice-guest` pick, `failed=exact`
 * ("2 of 8 didn't upload", Retry both: "clear about the failure", never cute),
 * not in today's "2 files did not go". Its line is exact's "The other N are in
 * the album", which says nothing when none went, so it is left out. Each row
 * prints the server's own sentence, as the sheet always does, and the retry
 * stays where the sheet always keeps it: nothing on a guest's phone can tell a
 * refusal that will pass from one that never will, which is what keeps a block
 * from reading as one.
 */
export function RefusedSheet({ reason }: { reason: string }) {
  return (
    <ResponsiveSheet
      close
      attrs={{ "data-es-sheet": "" }}
      className="overflow-y-auto"
    >
      <div data-slot="sheet-header" className="flex flex-col gap-0.5 p-4">
        <p className="font-heading text-card-title font-medium text-foreground">
          {REFUSED_HEADING}
        </p>
      </div>
      <div className="px-4">
        <div className="flex flex-col gap-4">
          <Button size="cta" className="w-full" tabIndex={-1} data-es-reach>
            <RefreshCw /> Retry both
          </Button>
          <ul className="flex flex-col gap-3">
            {REFUSED.map((f, i) => (
              <li key={f.name} className="flex items-center gap-3">
                <span
                  className="size-11 shrink-0 overflow-hidden bg-black/10"
                  style={{ borderRadius: "var(--radius-tile)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the guest's own pick */}
                  <img src={f.url} alt="" className="size-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-reading font-medium">
                    {f.name}
                  </span>
                  <span
                    data-es-line={i === 0 ? "" : undefined}
                    className="block text-reading text-pretty text-muted-foreground"
                  >
                    {reason}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  tabIndex={-1}
                  className="shrink-0"
                >
                  <RefreshCw /> Retry
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div data-slot="sheet-footer" className="mt-auto flex flex-col gap-2 p-4">
        <Button variant="ghost" size="lg" className="w-full" tabIndex={-1}>
          Not now
        </Button>
      </div>
    </ResponsiveSheet>
  );
}

/** A line over the lock for the moment a visit ends at it. */
export function EndedNotice({ text }: { text: string }) {
  return (
    <p
      className={cn(
        "rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground",
      )}
    >
      {text}
    </p>
  );
}
