"use client";

import type { ReactNode } from "react";
import {
  Clapperboard,
  Copy,
  ListChecks,
  Monitor,
  Play,
  QrCode,
  Settings,
  Users,
} from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Logo } from "@/components/shared/logo";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  ALBUM,
  JOIN_LABEL,
  JOIN_URL,
  JUST_ADDED,
  QR_STYLE,
  WALL,
} from "./fixtures";
import { WallStill } from "./stills";

/**
 * THE WALL'S FURNITURE: everything drawn OVER the reel, and the one surface
 * that is not a wall at all (the host's hub, where the wall is opened).
 *
 * ★ A WALL IS READ FROM ACROSS A ROOM, AND THAT IS THE ONLY THING THAT MAKES
 * IT A NEW SURFACE. Nothing here invents a scale: the site's own ladder is
 * FLUID (`--text-title` and friends clamp against the viewport), and a `Frame`
 * is a real 1920 viewport, so the same `text-title` a marketing hero wears
 * resolves to 80 px here because the room really is that wide. That is the
 * whole reason this board draws in frames rather than in a div: a div would
 * have handed every step the lab page's own width and the wall would have been
 * a picture of a wall (bible 5, 8).
 *
 * ★ THE CODE'S PLATE IS SOLID WHITE, AND IT IS A SCANNER RULE RATHER THAN A
 * PALETTE CHOICE (`event-qr.tsx`'s own note, carried): a code that inverts with
 * the theme stops decoding on half the phones at a party. Everything else on
 * the wall is the glass ruling's dark pane over media (`paper=dark`), which is
 * the one treatment that reads over a bright photograph and a dark one without
 * being retuned per frame.
 *
 * ★ AND THE WALL BELONGS TO THE EVENT (bible 4). The host's name is the biggest
 * thing on it; the only Partyreel on the wall is the readable address under the
 * code, which exists because somebody across the room has to be able to type it
 * when their camera will not focus.
 */

/* ── the wall's own ground ───────────────────────────────────────────────── */

/**
 * The safe area: a television overscans and a room reads from a distance, so
 * the furniture sits a percentage of the WALL in from its edges rather than a
 * fixed 64 px that would be a hairline at 1920 and a margin at 1440.
 */
const PAD = "[--pad:3.4vw]";

export function WallRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-rsc-wall=""
      className={cn("relative size-full overflow-hidden bg-black", PAD, className)}
    >
      {children}
    </div>
  );
}

/**
 * ★ TYPE OVER A PHOTOGRAPH NEEDS ITS OWN GROUND, AND A FULL-SCREEN SCRIM IS NOT
 * IT. A wall that dims its whole picture to carry a corner line has spent the
 * photograph to print an address. The scrim is a gradient on the EDGE the
 * furniture sits on and nowhere else, so the middle of every frame is the
 * photograph at full strength.
 */
export function Scrim({ side }: { side: "bottom" | "top" | "right" }) {
  const dir =
    side === "bottom"
      ? "bg-gradient-to-t from-black/85 via-black/35 to-transparent inset-x-0 bottom-0 h-[34%]"
      : side === "top"
        ? "bg-gradient-to-b from-black/75 via-black/30 to-transparent inset-x-0 top-0 h-[26%]"
        : "bg-gradient-to-l from-black/80 to-transparent inset-y-0 right-0 w-[34%]";
  return <div aria-hidden className={cn("pointer-events-none absolute", dir)} />;
}

/**
 * ★ AND THE GLYPHS CARRY THEIR OWN LIGHT, because a gradient alone cannot.
 * A wall plays whatever the room uploaded: the next photograph may be a white
 * dress in the sun exactly where the name sits, and a scrim tuned for that is a
 * scrim that fogs every dark frame. This is the glass ruling's own answer to
 * the same arithmetic (`GLASS_MARK_LIT`: a dark halo costs nothing over a dark
 * photograph and is the whole difference over a bright one), applied to type on
 * a wall rather than to a mark on a tile.
 */
export const INK =
  "[text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_28px_rgb(0_0_0/0.45)]";

/* ── the code ────────────────────────────────────────────────────────────── */

/** The shipped designer's own renderer, on the plate a scanner needs. */
function Code({ size }: { size: number }) {
  return (
    <div
      data-rsc-code=""
      className="rounded-[var(--radius)] bg-white p-[0.6vw]"
      style={{ lineHeight: 0 }}
    >
      <StyledQr
        value={JOIN_URL}
        size={size}
        style={QR_STYLE}
        className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      />
    </div>
  );
}

/** The wall's own smallest voice: an address a person can type, and the ask. */
function ScanLines({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[0.3vw]",
        align === "center" && "items-center text-center",
      )}
    >
      <p className={cn("text-section font-heading font-medium leading-none text-white", INK)}>
        Scan to add yours
      </p>
      <p className={cn("text-prose text-white/75 tabular-nums", INK)}>
        {JOIN_LABEL}
      </p>
    </div>
  );
}

/** Small, in the corner it belongs in, with the ask beside it. */
export function CornerCode() {
  return (
    <div
      data-rsc-qr="corner"
      className="absolute bottom-[var(--pad)] right-[var(--pad)] flex items-center gap-[1.2vw]"
    >
      <div className="text-right">
        <p className={cn("text-section font-heading font-medium leading-none text-white", INK)}>
          Scan to add yours
        </p>
        <p className={cn("mt-[0.4vw] text-prose text-white/75 tabular-nums", INK)}>
          {JOIN_LABEL}
        </p>
      </div>
      <Code size={200} />
    </div>
  );
}

/**
 * A column of its own down the right, the code big enough to read at the bar.
 *
 * ★ THE PANEL DOES NOT CARRY THE EVENT'S NAME, although the obvious sketch of
 * it does. The name is the `name` ask's one variable, and a panel that printed
 * it too would have made all three of that ask's options identical under this
 * one: the catalog would have lost a decision to a layout. So the panel is the
 * invitation, whole, and the name goes wherever `name` puts it.
 */
export function SideCode() {
  return (
    <aside
      data-rsc-qr="panel"
      className={cn(
        "absolute inset-y-0 right-0 flex w-[26%] flex-col items-center justify-center gap-[1.8vw] px-[2vw]",
        GLASS_MARK,
        "border-l border-white/10",
      )}
    >
      <Code size={340} />
      <ScanLines align="center" />
      <p className="text-prose text-white/50">No app required.</p>
    </aside>
  );
}

/** The wall itself, taken over by the code for a few seconds every so often. */
export function Interstitial() {
  return (
    <div
      data-rsc-qr="interstitial"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[1.4vw] bg-black/80"
    >
      <p className="font-heading text-title font-semibold leading-none text-white">
        {WALL.name}
      </p>
      <Code size={400} />
      <ScanLines align="center" />
    </div>
  );
}

/* ── the event's name ────────────────────────────────────────────────────── */

/** A wordmark in the corner: the name at the weight a credit carries. */
export function CornerName() {
  return (
    <div
      data-rsc-name="wordmark"
      className="absolute left-[var(--pad)] top-[var(--pad)]"
    >
      <p className={cn("font-heading text-chapter font-semibold leading-none text-white", INK)}>
        {WALL.name}
      </p>
      <p className={cn("mt-[0.5vw] text-prose text-white/75 tabular-nums", INK)}>
        {WALL.photos} photos from {WALL.guests} guests
      </p>
    </div>
  );
}

/** A bar across the head: the name owns a strip and the picture starts under it. */
export function TitleBar() {
  return (
    <header
      data-rsc-name="bar"
      className={cn(
        "absolute inset-x-0 top-0 flex items-center justify-between gap-[2vw] px-[var(--pad)] py-[1.4vw]",
        GLASS_MARK,
        "border-b border-white/10",
      )}
    >
      <p className="font-heading text-title font-semibold leading-none text-white">
        {WALL.name}
      </p>
      <p className="text-prose text-white/60 tabular-nums">
        {WALL.photos} photos from {WALL.guests} guests
      </p>
    </header>
  );
}

/* ── the just-added beat ─────────────────────────────────────────────────── */

/** A lower third that rides in for one hold and leaves with the photograph. */
export function LowerThird() {
  return (
    <div
      data-rsc-caption="lower-third"
      className="absolute bottom-[calc(var(--pad)*1.9)] left-[var(--pad)] max-w-[52%]"
    >
      <p className={cn("text-prose uppercase tracking-[0.08em] text-white/80", INK)}>
        Just added
      </p>
      <p className={cn("mt-[0.5vw] font-heading text-title font-semibold leading-none text-white", INK)}>
        {JUST_ADDED.name}
      </p>
    </div>
  );
}

/**
 * A chip in the corner: the same fact, at the size of a notification.
 *
 * ★ IT SITS TOP RIGHT BECAUSE THE NAME SITS TOP LEFT, and under a title bar it
 * drops below it. A board that drew the two on top of each other would be
 * showing a collision rather than a decision.
 */
export function CornerChip({ underBar = false }: { underBar?: boolean }) {
  return (
    <div
      data-rsc-caption="chip"
      className={cn(
        "absolute right-[var(--pad)] flex items-center gap-[0.6vw] rounded-full px-[1vw] py-[0.5vw]",
        underBar ? "top-[calc(var(--pad)+5.2vw)]" : "top-[var(--pad)]",
        GLASS_MARK,
      )}
    >
      <span className="size-[0.7vw] rounded-full bg-white" />
      <p className="text-section leading-none text-white">
        Just added by {JUST_ADDED.name}
      </p>
    </div>
  );
}

/* ── the empty and idle states ───────────────────────────────────────────── */

/** Under three items: the wall says what it is waiting for, and asks. */
export function IdleInvite() {
  return (
    <div
      data-rsc-idle="invite"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6vw] px-[var(--pad)] text-center"
    >
      <p className="font-heading text-title font-semibold leading-none text-white">
        {WALL.name}
      </p>
      <Code size={360} />
      <div>
        <p className="text-section font-heading font-medium leading-none text-white">
          Scan to add yours
        </p>
        <p className="mt-[0.4vw] text-prose text-white/60 tabular-nums">
          {JOIN_LABEL}
        </p>
      </div>
      <p data-rsc-idle-line="" className="text-prose text-white/70">
        The reel begins with the third photo. Two so far.
      </p>
    </div>
  );
}

/** The code alone, as big as the wall allows, and the name under it. */
export function IdleCode() {
  return (
    <div
      data-rsc-idle="code"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[1.8vw]"
    >
      <Code size={560} />
      <p
        data-rsc-idle-line=""
        className="text-section text-white/70 tabular-nums"
      >
        {JOIN_LABEL}
      </p>
    </div>
  );
}

/** The two photographs the album has, held long and dissolving; the code small. */
export function IdleStills() {
  return (
    <div data-rsc-idle="stills" className="absolute inset-0">
      <WallStill id="idleA" label="The album's first photograph" />
      <Scrim side="bottom" />
      <p
        data-rsc-idle-line=""
        className={cn(
          "absolute bottom-[var(--pad)] left-[var(--pad)] font-heading text-chapter font-semibold leading-none text-white",
          INK,
        )}
      >
        {WALL.name}
      </p>
      <div className="absolute bottom-[var(--pad)] right-[var(--pad)]">
        <Code size={200} />
      </div>
    </div>
  );
}

/* ── the Start plate ─────────────────────────────────────────────────────── */

/**
 * ★ THE PLATE EXISTS BECAUSE OF A BROWSER RULE, NOT A DESIGN ONE. Fullscreen
 * and the wake lock both require a user gesture in the tab that asks, and the
 * wall opens in a NEW tab, which has none. So the first thing on the wall is
 * always something to press, and the plate comes back if fullscreen is left.
 * The three options differ in what that press LOOKS like, never in whether it
 * is there.
 */
function StartButton({ label }: { label: string }) {
  return (
    <span
      data-rsc-start-button=""
      data-dir-press
      className="inline-flex items-center gap-[0.8vw] rounded-full bg-white px-[2.4vw] py-[1.1vw] font-heading text-section font-semibold leading-none text-black"
    >
      <Play className="size-[1.8vw] fill-black" aria-hidden />
      {label}
    </span>
  );
}

export function StartPlain() {
  return (
    <div
      data-rsc-start="button"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[2vw] px-[var(--pad)] text-center"
    >
      <p className="font-heading text-title font-semibold leading-none text-white">
        {WALL.name}
      </p>
      <StartButton label="Start the reel" />
      <p className="text-prose text-white/55">
        It fills the screen and keeps it awake. Press Escape to leave.
      </p>
    </div>
  );
}

export function StartFrame() {
  return (
    <div data-rsc-start="frame" className="absolute inset-0">
      <WallStill id="first" label="The reel's first frame" />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6vw] text-center">
        <span
          data-rsc-start-button=""
          data-dir-press
          className={cn(
            "flex size-[7vw] items-center justify-center rounded-full border border-white/30",
            GLASS_MARK,
          )}
        >
          <Play className="size-[2.6vw] fill-white text-white" aria-hidden />
        </span>
        <p className={cn("font-heading text-title font-semibold leading-none text-white", INK)}>
          {WALL.name}
        </p>
        <p className={cn("text-prose text-white/75", INK)}>
          Press to play on this screen
        </p>
      </div>
    </div>
  );
}

export function StartCountdown() {
  return (
    <div
      data-rsc-start="countdown"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[1.4vw] px-[var(--pad)] text-center"
    >
      <p className="font-heading text-chapter font-semibold leading-none text-white/70">
        {WALL.name}
      </p>
      <p className="font-heading text-display font-semibold leading-none text-white tabular-nums">
        3
      </p>
      <p className="text-prose text-white/60">Starting the reel</p>
      <StartButton label="Start now" />
    </div>
  );
}

/* ── Review on the wall ──────────────────────────────────────────────────── */

/** For the host only, in the corner a host glances at and the room never reads. */
export function ReviewHost() {
  return (
    <div
      data-rsc-review="host"
      className={cn(
        "absolute bottom-[var(--pad)] left-[var(--pad)] flex items-center gap-[0.7vw] rounded-full px-[1vw] py-[0.5vw]",
        GLASS_MARK,
        "border border-white/15",
      )}
    >
      <ListChecks className="size-[1.6vw] text-white/70" aria-hidden />
      <p className="text-prose leading-none text-white/85 tabular-nums">
        {WALL.waiting} waiting, on your phone
      </p>
    </div>
  );
}

/** A line the whole room reads, so a guest knows why theirs is not up yet. */
export function ReviewRoom() {
  return (
    <div
      data-rsc-review="room"
      className="absolute inset-x-[var(--pad)] bottom-[calc(var(--pad)*0.5)] text-center"
    >
      <p className={cn("text-section leading-none text-white/85", INK)}>
        New photos appear once {WALL.host.split(" ")[0]} approves them.
      </p>
    </div>
  );
}

/* ── the host's hub, where the wall is opened ────────────────────────────── */

const CARD =
  "flex h-24 w-40 shrink-0 flex-col justify-between gap-1 rounded-xl border border-border p-3";

/**
 * THE HUB'S CARDS ROW, QUOTED CLASS FOR CLASS RATHER THAN MOUNTED.
 * `EventCardsRow` calls `useEventShare` (a provider this board has no business
 * standing up), observes its own stickiness and renders a `next/link` per card.
 * The decision here is where the wall's DOOR sits, so the row is taken verbatim
 * from `event-feed/event-cards-row.tsx` at rest (`h-24 w-40`, `font-heading
 * text-card-title`, the `text-xs` value line) and nothing navigates.
 */
function HubShell({
  door,
  children,
}: {
  door: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-8 py-3">
        <Logo />
        <span className="text-sm text-muted-foreground">
          Partyreel / {WALL.name}
        </span>
      </header>
      <div className="px-8 py-6">
        <h1 className="font-heading text-page font-semibold">{WALL.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {WALL.photos} photos from {WALL.guests} guests
        </p>
        <div className="mt-5 flex items-center gap-2">
          {/* Review wears the needs-action colour the shipped row gives it
              while a queue waits (`event-cards-row.tsx`). */}
          <div
            data-rsc-card
            className={cn(CARD, "border-warning/40 bg-warning/5")}
          >
            <ListChecks className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-heading text-card-title font-medium">Review</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {WALL.waiting} waiting
            </span>
          </div>
          <div data-rsc-card className={CARD}>
            <Clapperboard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-heading text-card-title font-medium">Reel</span>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <div data-rsc-card className={CARD}>
            <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-heading text-card-title font-medium">Guests</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {WALL.guests}
            </span>
          </div>
          <div data-rsc-card className={CARD}>
            <Settings className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-heading text-card-title font-medium">Settings</span>
            <span className="text-xs text-muted-foreground">Open</span>
          </div>
          {door}
        </div>
        {children}
        {/* The album under the row: the shared fixture's own photographs, so
            the hub a door is judged on is a hub with an event in it. */}
        <div className="mt-6 grid grid-cols-6 gap-1">
          {ALBUM.slice(0, 12).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
            <img
              key={m.id}
              src={m.previewUrl ?? m.url}
              alt=""
              className="aspect-[4/5] w-full rounded-[var(--radius-tile)] object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** One more door in the row the host already reads. */
export function HubRowDoor() {
  return (
    <HubShell
      door={
        <div
          data-rsc-door="hub"
          className={cn(CARD, "border-foreground/25")}
        >
          <Monitor className="size-4 shrink-0" aria-hidden />
          <span className="font-heading text-card-title font-medium">
            Play on a screen
          </span>
          <span className="text-xs text-muted-foreground">New tab</span>
        </div>
      }
    >
      <p
        data-rsc-door-line=""
        className="mt-3 text-sm text-muted-foreground"
      >
        Sign in on the screen&apos;s browser first, and the album opens without
        the welcome.
      </p>
    </HubShell>
  );
}

/** The same door, plus a link a second machine could be handed. Later work. */
export function HubLinkDoor() {
  return (
    <HubShell
      door={
        <div
          data-rsc-door="link"
          className={cn(CARD, "border-foreground/25")}
        >
          <Monitor className="size-4 shrink-0" aria-hidden />
          <span className="font-heading text-card-title font-medium">
            Play on a screen
          </span>
          <span className="text-xs text-muted-foreground">New tab</span>
        </div>
      }
    >
      <div
        data-rsc-door-later=""
        className="mt-3 flex max-w-xl items-center gap-2 rounded-[var(--radius)] border border-dashed border-border px-3 py-2"
      >
        <QrCode className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1 truncate text-sm text-muted-foreground tabular-nums">
          partyreel.com/screen/9f2c4a
        </span>
        <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p
        data-rsc-door-line=""
        className="mt-2 max-w-xl text-sm text-muted-foreground"
      >
        Later: a screen link is a capability token, so it must expire, be
        revocable, and never carry the host&apos;s own session.
      </p>
    </HubShell>
  );
}

/** Inside settings, beside the other things a host sets once. */
export function SheetDoor() {
  return (
    <HubShell door={null}>
      <div
        data-rsc-door="sheet"
        className="mt-5 max-w-xl rounded-[var(--radius-float)] border border-border bg-card p-4"
      >
        <p className="font-heading text-card-title font-medium">Settings</p>
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
          <span className="text-sm">Show the reel</span>
          <span className="h-5 w-9 rounded-full bg-foreground/80" />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/60 py-3">
          <div>
            <span className="text-sm">Play on a screen</span>
            <p
              data-rsc-door-line=""
              className="text-xs text-muted-foreground"
            >
              Opens in a new tab. Sign in on the screen&apos;s browser first.
            </p>
          </div>
          <Monitor className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
      </div>
    </HubShell>
  );
}
