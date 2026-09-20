"use client";

import { type ReactNode } from "react";
import { AlertTriangle, Ban, Check, Clock, Wifi } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatEventDate } from "@/lib/utils";

import { EVENT, UNPROVEN_MAY_NOT, WALL, type Person } from "./fixtures";

/**
 * THE GROUND ALL SIX DECISIONS STAND ON.
 *
 * ★ WHAT IS SHIPPED AND WHAT IS DRAWN, said once here rather than six times.
 * The guest door (`EnterEventPrompt`, and `AccountDoor` inside it), the album
 * (`GuestMasonry`), the queue's grid (`ReviewGrid`) and every avatar (`Avatar`
 * with its `seed`, the orb `avatar-wiring` shipped on 2026-09-20) are the
 * PRODUCTION components, imported whole. What is DRAWN by this board is the
 * only thing the product does not have: any mark, strip, pile or deadline that
 * says an address has not been proven. That is the whole question, so there is
 * nothing to import for it, and none of it is a proposal about a look — a
 * ruling here is a ruling about WHERE the fact goes, not about the glyph.
 *
 * ★ PHONE FIRST. A guest is standing at a party holding a phone, and the code
 * that never arrives arrives (or does not) on that phone. 1440 is on the knob
 * because the host reading the queue is at a desk half the time.
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

/** The shipped guest gutter. */
export const GUTTER = "px-5";

/* ── the page a guest is standing on ─────────────────────────────────────── */

/**
 * The album's own header, quoted from `event-experience.tsx`'s left-editorial
 * block: the name, the byline, the count. Quoted rather than imported because
 * the shipped shell resolves a live session and a real event payload, and a
 * lab frame would draw whoever the author is signed in as.
 */
export function EventBlock({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <header className={className}>
      <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
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
      <p className="mt-1 text-xs text-muted-foreground">
        {count} photos &amp; videos from {EVENT.guests} guests
      </p>
    </header>
  );
}

/** A full-height page the frame can scroll, so a sticky thing sticks. */
export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-screen overflow-y-auto bg-background text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A labelled half of a frame. `host-lens`, `collision` and `expiry` each have
 * two audiences in one picture (the guest's screen and the host's), and the
 * only honest way to compare "who is told" is to draw both at once.
 */
export function Pane({
  label,
  tone = "plain",
  className,
  children,
}: {
  label: string;
  tone?: "plain" | "host" | "warn";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-background",
        className,
      )}
    >
      <p
        className={cn(
          "border-b border-border/60 px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase",
          tone === "host"
            ? "bg-muted/60 text-foreground"
            : tone === "warn"
              ? "bg-warning/10 text-warning"
              : "bg-muted/30 text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

/* ── the marks this board invents, in one place ──────────────────────────── */

export type MarkShape = "mark" | "ring" | "none";

/**
 * AN AVATAR THAT CAN SAY ITS ADDRESS IS UNPROVEN, three ways.
 *
 * `Avatar` is the shipped component (and the orb under it is the shipped
 * generator). The mark and the ring are the two guest-visible forms `badge`
 * asks about: a corner glyph that names the state, and a dashed rim that only
 * a person looking for it reads. `none` is the avatar exactly as it ships.
 */
export function PersonAvatar({
  person,
  shape,
  size = "sm",
}: {
  person: Person;
  shape: MarkShape;
  size?: "sm" | "default" | "lg";
}) {
  const unproven = !person.proven && shape !== "none";
  return (
    // ★ `data-gv-unproven` IS THE MEASUREMENT, not a style hook: `ring` carries
    // no glyph, so counting marks would report zero for an option that labels
    // exactly as many people as `mark` does. One attribute, both forms.
    <span
      data-gv-unproven={unproven ? "" : undefined}
      className="relative inline-flex shrink-0"
    >
      <Avatar
        size={size}
        seed={person.seed}
        className={cn(
          unproven &&
            shape === "ring" &&
            "opacity-55 after:border-dashed after:border-muted-foreground/70",
        )}
      >
        <AvatarImage src={undefined} alt="" />
        <AvatarFallback className="text-[10px]">
          {person.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      {unproven && shape === "mark" && (
        <span
          data-gv-mark
          aria-label="Email not confirmed"
          className="absolute -right-0.5 -bottom-0.5 flex size-2.5 items-center justify-center rounded-full bg-background"
        >
          <span className="size-1.5 rounded-full bg-warning" />
        </span>
      )}
    </span>
  );
}

/**
 * The state in two words, or in one glyph.
 *
 * ★ `compact` IS A MEASUREMENT FINDING, NOT A STYLE. The host's queue is the
 * shipped uniform grid, which is three columns at 375, so a tile is about 110px
 * wide: the words "Not confirmed" beside an avatar and a name clipped at the
 * tile's edge on the first capture. On a tile the state is the glyph and the
 * chip's own tone; the words belong where there is a line to put them on (the
 * host's guest list).
 */
export function StateChip({
  proven,
  compact = false,
  className,
}: {
  proven: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      data-gv-state={proven ? "proven" : "unproven"}
      aria-label={proven ? "Confirmed" : "Not confirmed"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 text-[10px] font-medium",
        compact ? "px-1" : "px-1.5",
        proven
          ? "bg-muted text-muted-foreground"
          : "bg-warning/15 text-warning",
        className,
      )}
    >
      {proven ? (
        <Check className="size-2.5" aria-hidden />
      ) : (
        <Clock className="size-2.5" aria-hidden />
      )}
      {!compact && (proven ? "Confirmed" : "Not confirmed")}
    </span>
  );
}

/* ── the cost strips ─────────────────────────────────────────────────────── */

/**
 * WHAT AN UNPROVEN GUEST MAY NOT DO. Identical under every `gate` option on
 * purpose: it is the allowance, which the goal rules is a cost line and not a
 * decision, so drawing it three times unchanged is what keeps the axis being
 * judged the gate itself.
 */
export function AllowanceStrip({ muted = false }: { muted?: boolean }) {
  return (
    <div
      data-gv-allowance
      className={cn(
        "rounded-lg border border-dashed border-border px-3 py-2",
        muted && "opacity-45",
      )}
    >
      <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        The same on every option
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {UNPROVEN_MAY_NOT.map((line) => (
          <li
            key={line}
            className="flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <Ban className="size-2.5 shrink-0" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * THE WALL, under every `outage` option. The same three rows every time, for
 * the same reason the allowance repeats: the limits do not move, only the
 * remedy does, and an option that reads well against a limit nobody can see is
 * an option chosen blind.
 */
export function WallStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div
      data-gv-wall
      className="rounded-lg border border-border bg-muted/30 px-3 py-2"
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        <Wifi className="size-3" aria-hidden />
        One venue, one IP
      </p>
      <ul className="mt-1.5 space-y-1">
        {WALL.filter((w) => !compact || w.severe).map((w) => (
          <li key={w.id} className="flex items-start gap-1.5 text-[10px]">
            {w.severe ? (
              <AlertTriangle
                className="mt-px size-2.5 shrink-0 text-warning"
                aria-hidden
              />
            ) : (
              <Check
                className="mt-px size-2.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            )}
            <span className="min-w-0">
              <span className="font-medium text-foreground">{w.what}</span>{" "}
              <span className="text-muted-foreground">
                {w.by}, {w.limit}.
              </span>{" "}
              {w.severe && <span className="text-warning">{w.bite}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
