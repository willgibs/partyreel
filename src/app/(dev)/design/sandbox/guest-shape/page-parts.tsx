"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Download, LayoutGrid, ListFilter } from "lucide-react";

import { ExportDialog } from "@/components/app/export/export-dialog";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { EVENT } from "./fixtures";

/**
 * THE GUEST PAGE'S GROUND, ROUND TWO. Round one's page-parts drew seven
 * switches (`door`, `nothing`, `chrome`, `live`, `dialogs`, `yours`,
 * `account`); every one of them is now ruled and wired (docs/systems/guest-flow.md),
 * so this file keeps only what is still true of the SHIPPED page and reusable
 * as the ground `chrome.tsx`, `welcome.tsx` and `theirs.tsx` draw their three
 * open questions on top of. The retired switches, and the files that only
 * existed to answer them (`door.tsx`, `dialogs.tsx`, `account.tsx`,
 * `yours.tsx`), are gone with round one's asks (the `profile-page` precedent:
 * a round replaces its questions rather than accreting them).
 *
 * ★ WHAT IS THE SHIPPED COMPONENT AND WHAT IS QUOTED, still true of every
 * piece below: `GuestMasonry`, `Logo`, `Button` and `ExportDialog` are
 * imported and used exactly as shipped; `guest-header.tsx` (session-resolving,
 * so it would draw whatever the author is signed in as inside a lab frame) and
 * the tile-size control (still `app-vocabulary`'s own board, ruled `cluster`
 * but not yet wired) are QUOTED — the top bar's own markup, and a static
 * reproduction of the ruled cluster shape.
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

/** The gutter both blocks keep, the shipped one (BLEED). */
export const GUTTER = "px-5";

/**
 * ★ THE WORDS KEEP THE COLUMN, THE PHOTOGRAPHS DO NOT (`gallery-wiring`,
 * 2026-09-19, quoted unchanged from round one): COLUMN is `w-full max-w-2xl
 * px-5`, 632px of measure pinned LEFT so its first letter lands on the same
 * 20px line as the logo above it and the album's first column below it; BLEED
 * is the gutter alone, and the window decides the rest.
 */
export const READABLE = "max-w-2xl";

/* ── the top bar ─────────────────────────────────────────────────────────── */

/**
 * `guest-header.tsx`, quoted: the wordmark, and the one Partyreel sentence a
 * host's event carries. `sticky`/`right` are `chrome`'s own knobs (the
 * `header` shape pins this bar and swaps its right slot for Add); every other
 * option leaves both at their shipped defaults.
 */
export function TopBar({
  sticky = false,
  right,
}: {
  sticky?: boolean;
  right?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/60 bg-background px-5 py-3",
        sticky && "sticky top-0 z-30",
      )}
    >
      <Logo />
      <div className="flex h-8 items-center">
        {right ?? (
          <Button variant="ghost" size="sm">
            Start for free
          </Button>
        )}
      </div>
    </header>
  );
}

/* ── the event block ─────────────────────────────────────────────────────── */

/** The left-editorial header: the name, the byline, the count, the description.
 *  Every surface this round draws is a full, open album, so the redacted-locked
 *  reading round one's `EventBlock` carried lives in `welcome.tsx` now, on the
 *  one shell that still meets a locked page. */
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
      <p className="mt-2 max-w-prose text-[15px] text-pretty text-muted-foreground">
        {EVENT.description}
      </p>
    </header>
  );
}

/* ── the gallery's own control row ───────────────────────────────────────── */

/** A tile-size glyph: N small squares standing in for N columns (`app-vocabulary`,
 *  quoted). */
function SizeGlyph({ n }: { n: 1 | 2 | 3 }) {
  return (
    <span
      aria-hidden
      className="grid size-3.5 grid-cols-2 gap-px"
      style={n === 1 ? { gridTemplateColumns: "1fr" } : undefined}
    >
      {Array.from({ length: n * n }, (_, i) => (
        <span key={i} className="rounded-[1.5px] bg-current" />
      ))}
    </span>
  );
}

/**
 * THE TILE-SIZE CONTROL'S GUEST MOUNT (`app-vocabulary`, `gallery-controls-home=cluster`,
 * ruled 2026-09-20, not yet wired): the segmented size control plus the
 * reserved Sort/Filter pills, in the gallery's own row beside Download all.
 * The shape is ruled and not this board's question, so it is reproduced
 * static and minimal — `chrome` needs it PRESENT, in every option, above the
 * album it sits over; `theirs` hangs its own filter beside it via `after`.
 */
export function ControlsRow({
  albumKey,
  after,
}: {
  albumKey: string;
  after?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Tile size"
          className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
        >
          {([3, 2, 1] as const).map((n, i) => (
            <span
              key={n}
              className={cn(
                "flex size-6 items-center justify-center rounded-[3px]",
                i === 0 ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              <SizeGlyph n={n} />
            </span>
          ))}
        </div>
        <span aria-hidden className="h-4 w-px bg-border" />
        <span className="flex items-center gap-1 rounded-full border border-dashed border-border/70 px-2 py-1 text-[10px] text-muted-foreground/70">
          <ListFilter className="size-3" aria-hidden /> Sort
        </span>
        <span className="flex items-center gap-1 rounded-full border border-dashed border-border/70 px-2 py-1 text-[10px] text-muted-foreground/70">
          <LayoutGrid className="size-3" aria-hidden /> Filter
        </span>
        {after}
      </div>
      <ExportDialog scope="guest" albumKey={albumKey}>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
        >
          <Download className="size-4" /> Download all
        </button>
      </ExportDialog>
    </div>
  );
}

/* ── the foot ─────────────────────────────────────────────────────────────── */

/** The report footer, as shipped: the one thing at the foot of a full album. */
export function ReportFoot() {
  return (
    <footer className="mt-8 flex justify-center border-t border-border/60 pt-5 pb-4">
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        Report this album
      </button>
    </footer>
  );
}

/* ── the real scroll container ───────────────────────────────────────────── */

/**
 * ★ A REAL SCROLL CONTAINER, NOT A PAGE PUSHED UP BY A MARGIN (the `demo-event`
 * precedent, its own page-parts.tsx). `chrome` is a question about what
 * survives a scroll — found on landing, reachable deep in the album — so the
 * frame's whole height is an overflow-y-auto box and `scrollTo` drives its
 * real scrollTop: a `sticky` header sticks, a `fixed` dock pins to the FRAME's
 * own viewport, and the measurement reads true.
 */
export function ScrollPage({
  scrollTo = 0,
  children,
}: {
  scrollTo?: number;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  // Applied after layout AND once more after the photographs decode, because a
  // column of images that has not resolved its heights is shorter than the
  // page it will be and clamps the scroll short.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollTop = scrollTo;
    const win = el.ownerDocument.defaultView;
    const late = win?.setTimeout(() => {
      el.scrollTop = scrollTo;
    }, 1200);
    return () => {
      if (late !== undefined) win?.clearTimeout(late);
    };
  }, [scrollTo]);

  return (
    <div className="relative h-screen bg-background text-foreground">
      <div data-gs-scroll ref={box} className="h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

/** A page drawn behind an open shell: the real backdrop, so what is judged is
 *  the shell against the page it covers rather than against nothing. */
export function Scrim() {
  return <div className="gs-scrim" />;
}
