"use client";

import { type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Gauge,
  KeyRound,
  Ban,
  Wifi,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatEventDate } from "@/lib/utils";

import {
  ALLOWANCE,
  EVENT,
  FACTS,
  HELD,
  JOBS,
  MAIL_STILL_FAILS,
  METER,
  PRINCIPLE,
  WALL,
  WALL_UNREAD,
  type Person,
} from "./fixtures";

/**
 * THE GROUND ALL FIVE DECISIONS STAND ON.
 *
 * ★ WHAT IS SHIPPED AND WHAT IS DRAWN, said once here rather than five times.
 * The guest door (`EnterEventPrompt`, with `AccountDoor` inside it), the album
 * (`GuestMasonry`), the queue's grid and every avatar (`Avatar` with its
 * `seed`, the diagonal `avatar-wiring` shipped on 2026-09-20) are the
 * PRODUCTION components, imported whole. What is DRAWN by this board is the
 * only thing the product does not have: any mark, slot, allowance or switch
 * that says an address has not been proven. That is the whole question, so
 * there is nothing to import for it, and a ruling here is a ruling about WHERE
 * a fact goes, never about a glyph.
 *
 * ★ PHONE FIRST. A guest is standing at a party holding a phone. 1440 is on the
 * knob because the host reading the queue and the settings sheet is at a desk
 * half the time.
 */

/* -- the screens ---------------------------------------------------------- */

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

/* -- the page a guest is standing on -------------------------------------- */

/**
 * The album's own header, quoted from `event-experience.tsx`'s left-editorial
 * block. Quoted rather than imported because the shipped shell resolves a live
 * session and a real event payload, and a lab frame would draw whoever the
 * author is signed in as.
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
          &middot;
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
 * A labelled half of a frame. Four of the five decisions have two audiences in
 * one picture (the guest's screen and the host's), and the only honest way to
 * compare "who is told" is to draw both at once.
 */
export function Pane({
  label,
  tone = "plain",
  className,
  children,
}: {
  label: string;
  tone?: "plain" | "host" | "warn" | "good";
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
              : tone === "good"
                ? "bg-success/10 text-success"
                : "bg-muted/30 text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

/** One line of board voice under a picture, for a frame note that is not an option. */
export function FrameNote({
  label,
  children,
  tone = "plain",
}: {
  label: string;
  children: ReactNode;
  tone?: "plain" | "warn" | "good";
}) {
  return (
    <p
      data-gv-note
      className={cn(
        "rounded-lg px-3 py-2 text-[11px] leading-snug",
        tone === "warn"
          ? "bg-warning/10 text-warning"
          : tone === "good"
            ? "bg-success/10 text-success"
            : "bg-muted/50 text-muted-foreground",
      )}
    >
      <span className="font-semibold tracking-[0.06em] uppercase">
        {label}
      </span>{" "}
      {children}
    </p>
  );
}

/* -- the mark his ruling already made ------------------------------------- */

export type MarkShape = "mark" | "none";

/**
 * THE AVATAR THAT SAYS ITS ADDRESS IS UNPROVEN, on his ruling and his note.
 *
 * `badge=mark` was ruled, with two corrections in the same breath: "Rather than
 * a warning icon, this could be more subtle" and "When the icon/mark is
 * hovered, a tooltip should clarify what it means". So the mark is a small dot
 * at the disc's corner rather than a triangle, and it carries a real tooltip
 * with the sentence that tells a guest what to do about it. `Avatar` and the
 * generator under it are the shipped ones.
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
  const disc = (
    // ★ `data-gv-unproven` IS THE MEASUREMENT, not a style hook: the caption
    // counts labelled people, and counting glyphs would miss a form that
    // carries none.
    <span
      data-gv-unproven={unproven ? "" : undefined}
      className="relative inline-flex shrink-0"
    >
      <Avatar size={size} seed={person.seed}>
        <AvatarImage src={undefined} alt="" />
        <AvatarFallback className="text-[10px]">
          {person.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      {unproven && (
        <span
          data-gv-mark
          aria-label="Email not confirmed"
          className="absolute -right-0.5 -bottom-0.5 flex size-2.5 items-center justify-center rounded-full bg-background"
        >
          <span className="size-1.5 rounded-full bg-warning/80" />
        </span>
      )}
    </span>
  );
  if (!unproven) return disc;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{disc}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-52 text-center">
          Hasn&rsquo;t confirmed their email yet. Their photos are in; the mark
          goes when they tap their code.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** The state in two words, or in one glyph on a tile too narrow for words. */
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
        proven ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning",
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

/**
 * A TYPED ADDRESS, IN A SLOT THAT IS NEVER THE VERIFIED ONE. The red team's
 * third security case: the host's lightbox has always shown a string proven on
 * the auth server, and a string somebody typed at a door may not inherit that
 * place. So it is drawn in its own row, dimmer, with the word "typed" in it,
 * and it is never the line a host would copy into a mail client by reflex.
 */
export function ClaimedSlot({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  return (
    <span
      data-gv-claimed
      className={cn(
        "inline-flex min-w-0 items-center gap-1 rounded border border-dashed border-warning/45 px-1.5 py-0.5 text-[10px] text-muted-foreground",
        className,
      )}
    >
      <span className="shrink-0 font-medium text-warning">Typed</span>
      <span className="truncate">{address}</span>
      <span className="shrink-0 text-faint">unconfirmed</span>
    </span>
  );
}

/* -- the strips every frame can carry ------------------------------------- */

/**
 * THE PRINCIPLE, THE THREE JOBS, THE FACTS AND THE FOUR HELD RULINGS, on the
 * first decision's frames. It is the only long thing on this board, and it is
 * on the FIRST step on purpose: everything after it is a picture.
 */
export function FactsPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div data-gv-facts className="space-y-2.5">
      <p className="rounded-lg bg-foreground px-3 py-2 text-[12px] leading-snug font-medium text-background">
        {PRINCIPLE}
      </p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {JOBS.map((j) => (
          <div
            key={j.id}
            className="rounded-lg border border-border bg-muted/30 px-2.5 py-2"
          >
            <p className="text-[10px] font-semibold tracking-[0.08em] uppercase">
              {j.name}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-foreground">
              {j.line}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              Proof: {j.proof}
            </p>
          </div>
        ))}
      </div>
      {!compact && (
        <ul className="space-y-1">
          {FACTS.map((f) => (
            <li
              key={f.id}
              data-gv-fact={f.kind}
              className="flex items-start gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5"
            >
              {f.kind === "is" ? (
                <KeyRound
                  className="mt-0.5 size-3 shrink-0 text-success"
                  aria-hidden
                />
              ) : (
                <Ban
                  className="mt-0.5 size-3 shrink-0 text-destructive"
                  aria-hidden
                />
              )}
              <span className="min-w-0 text-[10px] leading-snug">
                <span className="font-medium text-foreground">
                  {f.kind === "is" ? "" : "Refused: "}
                  {f.what}
                </span>{" "}
                <span className="text-muted-foreground">{f.why}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-2">
        <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Held from round one, and everything here is drawn on top of them
        </p>
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {HELD.map((h) => (
            <li key={h.id} className="text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">{h.ask}</span>{" "}
              {h.said}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * THE WALL, RE-MEASURED. The same four rows wherever it is drawn, for the
 * reason round one gave and then got wrong: an option that reads well against a
 * limit nobody can see is an option chosen blind, and a limit drawn wrong is
 * worse than none. Every figure is Supabase's DOCUMENTED default, labelled as
 * documented, and the unread line says so.
 */
export function WallStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div
      data-gv-wall
      className="rounded-lg border border-border bg-muted/30 px-3 py-2"
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        <Wifi className="size-3" aria-hidden />
        One venue, one address, as documented
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
      <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
        {WALL_UNREAD}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-warning">
        {MAIL_STILL_FAILS}
      </p>
    </div>
  );
}

/**
 * THE HOST'S METER, under every `allowance` option. The never-refund fact is
 * the whole reason that decision exists, and it is invisible in the product:
 * a host cannot see who spent their month, only that it is spent.
 */
export function MeterStrip({
  spentGb,
  caption,
  tone = "plain",
}: {
  spentGb: number;
  caption: string;
  tone?: "plain" | "warn" | "bad";
}) {
  const pct = Math.min(
    100,
    Math.round((spentGb / METER.freeMonthlyGb) * 100),
  );
  return (
    <div data-gv-meter data-gv-spent={String(spentGb)} className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Gauge className="size-3" aria-hidden />
          This month, uploaded &middot; Maya, Free
        </span>
        <span>
          {spentGb} GB of {METER.freeMonthlyGb} GB
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "bad"
              ? "bg-destructive"
              : tone === "warn"
                ? "bg-warning"
                : "bg-foreground/60",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p
        className={cn(
          "text-[10px] leading-snug",
          tone === "bad"
            ? "text-destructive"
            : tone === "warn"
              ? "text-warning"
              : "text-muted-foreground",
        )}
      >
        {caption}
      </p>
      <p className="text-[10px] leading-snug text-muted-foreground">
        {METER.line} {METER.abuse}
      </p>
    </div>
  );
}

/** The allowance in one line, drawn under the options that have one. */
export function AllowanceLine({ shape }: { shape: "handful" | "budget" | "open" }) {
  return (
    <p
      data-gv-allowance={shape}
      className="rounded-lg border border-dashed border-border px-3 py-2 text-[10px] leading-snug text-muted-foreground"
    >
      {shape === "handful" &&
        `Every session that has not proved an address may add ${ALLOWANCE.handful} photographs and no video. After that, one tap proves it.`}
      {shape === "budget" &&
        `This event accepts ${ALLOWANCE.budget} photographs from sessions that have not proved an address. Maya can raise it while the party runs.`}
      {shape === "open" &&
        "No cap. A session that has proved nothing may add as much as any other."}
    </p>
  );
}
