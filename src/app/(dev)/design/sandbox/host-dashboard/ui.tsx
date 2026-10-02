"use client";

import { createContext, type ReactNode, useContext } from "react";
import { Check } from "lucide-react";

import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import type { Photo } from "./fixtures";

/**
 * THE BOARD'S SMALL PIECES: a photograph at its crop, a mark on a
 * photograph, a status dot, the storage ring, and the screen every drawing is
 * laid out for.
 *
 * ★ LAYOUT READS THE SCREEN, NEVER A BREAKPOINT. A frame is a real 1440 or
 * 375 viewport, but a `lg:` class written here compiles into the lab's
 * `utilities.lab` layer, which loses to production's unprefixed utility on the
 * same element at every width (`design.css` says why). So each drawing is told
 * which screen it is for (`useWide`) and picks its classes in JavaScript; the
 * production components it mounts keep their own breakpoints, which work.
 */

const WideContext = createContext(true);

export function WideProvider({
  wide,
  children,
}: {
  wide: boolean;
  children: ReactNode;
}) {
  return <WideContext.Provider value={wide}>{children}</WideContext.Provider>;
}

/** True at 1440, false at 375. */
export const useWide = () => useContext(WideContext);

/** A photograph at its crop, filling its (relative, clipped) box. */
export function Still({
  photo,
  className,
  eager = false,
}: {
  photo: Photo;
  className?: string;
  eager?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixture still at a crop, as every board draws one
    <img
      src={photo.src}
      alt=""
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      className={cn("absolute inset-0 size-full object-cover", className)}
      style={{
        objectPosition: photo.pos,
        transform: photo.zoom === 1 ? undefined : `scale(${photo.zoom})`,
        transformOrigin: photo.pos,
      }}
    />
  );
}

export type Tone = "live" | "waiting" | "setup" | "ready" | "quiet";

const DOT: Record<Tone, string> = {
  live: "bg-success",
  waiting: "bg-warning",
  setup: "bg-white/80 ring-0",
  ready: "bg-success",
  quiet: "bg-white/60",
};

/**
 * A MARK: one state on a photograph, on the product's one glass. A live dot
 * breathes (the board's sheet; still under reduced motion), a waiting count is
 * amber, a step to set up is plain, ready carries its tick.
 */
export function Mark({
  tone,
  on = "photo",
  children,
  className,
}: {
  tone: Tone;
  /** On a photograph it is glass; on the page's own card it is the page's chip. */
  on?: "photo" | "page";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      data-hd-mark={tone}
      className={cn(
        "flex h-6 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[11px] leading-none font-medium whitespace-nowrap",
        on === "photo"
          ? cn("text-white", GLASS_MARK)
          : "bg-background text-foreground shadow-lift ring-1 ring-foreground/8",
        className,
      )}
    >
      {tone === "ready" ? (
        <Check className="size-3 text-success" aria-hidden strokeWidth={3} />
      ) : tone === "quiet" ? null : (
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            on === "page" && tone === "setup"
              ? "border border-foreground/60 bg-transparent"
              : DOT[tone],
            tone === "live" && "hd-breathe",
          )}
        />
      )}
      {children}
    </span>
  );
}

/** A status dot off a photograph, on the page's own ground. */
export function Dot({
  tone,
  className,
}: {
  tone: "live" | "waiting" | "setup" | "done";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        tone === "live" && "hd-breathe bg-success",
        tone === "waiting" && "bg-warning",
        tone === "setup" && "border border-current bg-transparent",
        tone === "done" && "bg-success",
        className,
      )}
    />
  );
}

/**
 * THE STORAGE RING (a new atom this board names): the plan's shelf as one
 * 18px ring and its percent, beside New event, where the full-width line
 * stood. Its popover is production's storage meter's, unchanged (drawn closed
 * here). Amber from the dashboard's own threshold, as the line was.
 */
export function StorageRing({ pct, plan }: { pct: number; plan: string }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const warn = pct > 85;
  return (
    <span
      data-hd-storage={pct}
      className="flex h-9 items-center gap-2 rounded-full px-2.5 text-xs text-muted-foreground tabular-nums"
      title={`${plan}: ${pct}% of storage used`}
    >
      <svg viewBox="0 0 18 18" className="size-[18px] -rotate-90" aria-hidden>
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          strokeWidth="2.5"
          className="stroke-foreground/12"
        />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(Math.max(pct, 2) / 100) * c} ${c}`}
          className={warn ? "stroke-warning" : "stroke-foreground/70"}
        />
      </svg>
      <span>{`${pct}%`}</span>
    </span>
  );
}

/** The small capitals a section or a stage opens with. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-label text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
