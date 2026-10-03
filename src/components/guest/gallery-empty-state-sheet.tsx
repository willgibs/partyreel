"use client";

import "./gallery-empty-state.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  columnsFor,
  type HerShot,
  layoutSheet,
  type Sheet,
  sheetCapFor,
} from "@/lib/disposable/contact-sheet";
import type { WaitingFacts } from "@/lib/disposable/facts";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import {
  countdownWords,
  WAIT_TITLE,
  waitClockLine,
  type WaitClock,
} from "@/lib/disposable/wait-words";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

/**
 * THE CONTACT SHEET, DRAWN (the-wait r1, Will's `wait=sheet`; the layout is `lib/disposable/contact-sheet.ts`). One
 * drawing for both sides: the album's wait a guest meets (`gallery-empty-state-wait.tsx`), and the very same sheet
 * Maya's hub draws as her cover (`event-gallery.tsx`, the-wait's `cover=guests`). It reads no album and no session:
 * it is handed the numbers, her own shots and the clock, so neither side's live source rides into the other's page.
 */
/* ── the drawing, shared with Maya's hub ─────────────────────────────────── */

/** The well's width at which the count stands beside the sheet rather than over it. */
const SIDE_BY_SIDE_PX = 1024;
/** The side column's width, its gap and the well's padding at a desk (`w-56`, `gap-10`, `p-8`). */
const SIDE_COLUMN_PX = 224 + 40;
const PAD_WIDE_PX = 64;
const PAD_NARROW_PX = 32;
/** A phone's well, before anything is measured (375 less the album's 12 px gutters). */
const PHONE_WELL_PX = 351;
/** How long "+1 just now" stands after the count climbs. */
const BUMP_MS = 6_000;
/** The cells the folded chip takes at the head of a capped sheet. */
const FOLD_CELLS = 3;

/** The well's width, measured as it lays out (a first paint from the album's own last width on this device). */
function useWellWidth(
  first: number | null,
): [number, (el: HTMLDivElement | null) => void] {
  const [width, setWidth] = useState(first ?? PHONE_WELL_PX);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    const read = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    observer.current = ro;
  }, []);
  return [width, ref];
}

/**
 * ONE CONTACT SHEET: the count and the wait's word over (or, at a desk, beside) a sheet of squares, the oldest folding
 * away past a few rows while the count climbs (Will's cover note: "a max visual size then just let the count increase"),
 * hers lit, the clock and her own under it. `onOpenHers` makes "Yours" the door to her list; without it, it is a count.
 */
export function ContactSheet({
  waiting,
  hers,
  clock,
  onOpenHers,
  firstPaintWidth = null,
  yoursLabel = "Yours",
  className,
}: {
  waiting: Pick<WaitingFacts, "count" | "minutes"> | null;
  hers: readonly HerShot[];
  clock: WaitClock;
  onOpenHers?: () => void;
  firstPaintWidth?: number | null;
  /** What her own are called under the sheet ("Yours"). */
  yoursLabel?: string;
  className?: string;
}) {
  const nowMs = useWaitClock();
  const [width, wellRef] = useWellWidth(firstPaintWidth);
  const wide = width >= SIDE_BY_SIDE_PX;
  const sheetWidth = wide
    ? width - PAD_WIDE_PX - SIDE_COLUMN_PX
    : width - PAD_NARROW_PX;
  const columns = columnsFor(sheetWidth);
  const cap = sheetCapFor(columns);

  const sheet: Sheet = useMemo(() => {
    const full = layoutSheet({ waiting, hers, cap, nowMs });
    // A capped sheet gives its first cells to the fold's chip, so the rows stay the cap's.
    return full.folded > 0
      ? layoutSheet({ waiting, hers, cap: cap - FOLD_CELLS, nowMs })
      : full;
  }, [waiting, hers, cap, nowMs]);

  /* "+1 just now": the count climbing while she looks, said for a few seconds (adjusted in the render that sees it). */
  const [seen, setSeen] = useState(sheet.count);
  const [bump, setBump] = useState<{ n: number; id: number } | null>(null);
  if (sheet.count !== seen) {
    setSeen(sheet.count);
    if (sheet.count > seen) setBump({ n: sheet.count - seen, id: sheet.count });
  }
  useEffect(() => {
    if (!bump) return;
    const timer = window.setTimeout(() => setBump(null), BUMP_MS);
    return () => window.clearTimeout(timer);
  }, [bump]);

  /* Her landing takes one pass of light: a shot of hers this visit that newly stands landed on the sheet (one her rows'
     read brings back from an earlier visit knows when she took it, and never lights up as if it had just landed). */
  const [landedKeys, setLandedKeys] = useState<ReadonlySet<string>>(
    () => new Set(hers.filter((s) => !s.sending).map((s) => s.key)),
  );
  const [landing, setLanding] = useState<string | null>(null);
  const landedNow = hers.filter((s) => !s.sending);
  const fresh = landedNow.find((s) => !landedKeys.has(s.key));
  if (fresh) {
    setLandedKeys(new Set(landedNow.map((s) => s.key)));
    if (fresh.at === null) setLanding(fresh.key);
  }
  useEffect(() => {
    if (!landing) return;
    const timer = window.setTimeout(() => setLanding(null), 2_600);
    return () => window.clearTimeout(timer);
  }, [landing]);

  const clockLine = waitClockLine(clock, nowMs);
  const countdown =
    clock.kind === "develop" && nowMs !== null
      ? countdownWords(clock.developsAt, nowMs)
      : null;
  const clockText = countdown ? `${clockLine} · ${countdown}` : clockLine;
  const folded = sheet.folded;

  const yours =
    sheet.hers > 0 ? (
      onOpenHers ? (
        <button
          type="button"
          onClick={onOpenHers}
          data-wait-yours=""
          className="wait-muted -mx-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-[var(--gallery-foreground)] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          <span className="wait-key" aria-hidden />
          {`${yoursLabel} · ${formatCount(sheet.hers)}`}
        </button>
      ) : (
        <span
          data-wait-yours=""
          className="wait-muted flex items-center gap-1.5"
        >
          <span className="wait-key" aria-hidden />
          {`${yoursLabel} · ${formatCount(sheet.hers)}`}
        </span>
      )
    ) : null;

  const pill = bump ? (
    <span
      key={bump.id}
      className="wait-pill text-xs font-medium"
      data-wait-bump=""
    >
      {`+${formatCount(bump.n)} just now`}
    </span>
  ) : null;

  return (
    <div
      ref={wellRef}
      data-contact-sheet={sheet.count}
      className={cn(
        "wait-well",
        wide ? "flex items-stretch gap-10 p-8" : "p-4",
        className,
      )}
    >
      {/* What a screen reader hears of it: the sheet's facts in one sentence, the squares themselves only a picture. */}
      <p className="sr-only">
        {`${formatCount(sheet.count)} ${sheet.count === 1 ? "photo" : "photos"} developing${sheet.hers > 0 ? `, ${formatCount(sheet.hers)} of them yours` : ""}. ${clockText}.`}
      </p>
      <div
        className={cn(
          "flex shrink-0 justify-between",
          wide ? "w-56 flex-col" : "items-end",
        )}
      >
        <div aria-hidden>
          <p
            data-wait-count={sheet.count}
            className="font-heading leading-none tabular-nums"
            style={{ fontSize: wide ? 64 : 44 }}
          >
            {formatCount(sheet.count)}
          </p>
          <p className="wait-muted mt-2 text-sm" data-wait-title="">
            {WAIT_TITLE}
          </p>
        </div>
        {!wide && <span aria-live="polite">{pill}</span>}
        {wide && (
          <div className="space-y-2 text-xs">
            <span aria-live="polite">{pill}</span>
            {yours}
            <p className="wait-muted" data-wait-clock="">
              {clockText}
            </p>
          </div>
        )}
      </div>
      <div className={cn(wide ? "min-w-0 flex-1 self-center" : "mt-4")}>
        <div
          aria-hidden
          className="wait-sheet"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          data-wait-sheet={sheet.cells.length}
        >
          {folded > 0 && (
            <span
              data-wait-folded={folded}
              className="wait-muted flex items-center justify-center rounded-[3px] text-[10px] font-medium tabular-nums"
              style={{
                gridColumn: `span ${FOLD_CELLS}`,
                background:
                  "color-mix(in oklab, var(--gallery-foreground) 6%, var(--gallery))",
              }}
            >
              {`+${formatCount(folded)}`}
            </span>
          )}
          {sheet.cells.map((cell) =>
            cell.kind === "theirs" ? (
              <span
                key={cell.key}
                className="wait-cell"
                style={
                  cell.warm > 0
                    ? ({ "--warm": cell.warm } as CSSProperties)
                    : undefined
                }
              />
            ) : (
              <span
                key={cell.key}
                className="wait-cell"
                data-hers={cell.kind === "hers" ? "" : undefined}
                data-sending={cell.kind === "sending" ? "" : undefined}
                data-landing={
                  cell.kind === "hers" && cell.key === `h:${landing}`
                    ? ""
                    : undefined
                }
              >
                {cell.src && (
                  // eslint-disable-next-line @next/next/no-img-element -- her own picture: this device's file or a tile presigned for her alone
                  <img
                    src={cell.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                )}
              </span>
            ),
          )}
        </div>
        {!wide && (
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0">{yours}</span>
            <span className="wait-muted text-right" data-wait-clock="">
              {clockText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
