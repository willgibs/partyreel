"use client";

import "./gallery-empty-state.css";

import { Play } from "lucide-react";
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
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { videoPosterSrc } from "@/lib/media/poster";
import { cn } from "@/lib/utils";

/**
 * THE CONTACT SHEET, DRAWN (the-wait r1, Will's `wait=sheet`; the layout is `lib/disposable/contact-sheet.ts`). One
 * drawing for both sides: the album's wait a guest meets (`gallery-empty-state-wait.tsx`), and the very same sheet
 * Maya's hub draws as her cover (`event-hub-head-cover.tsx`, the-wait's `cover=guests`). It reads no album and no
 * session: it is handed the numbers, her own shots and the clock, so neither side's live source rides into the other's
 * page.
 */

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

/** This device's own file is an object URL (`pendingUrls`): for a video, the video itself, never a picture of it. */
const isOwnFile = (src: string) => src.startsWith("blob:");

/**
 * ★ ONE OF HERS, DRAWN FROM WHAT IT IS (red-team 46's MEDIUM: her own video was an `<img>` of a video file, the browser's
 * broken-image glyph in the fourth lit square). A shot's picture is this device's own FILE or a still presigned for her
 * alone (a photograph's tile, a video's poster), and only a still is a picture an `<img>` can draw. Her video's file
 * draws as its first frame instead: a muted, inline, paused `<video>` with no controls, nothing playing (the fragment
 * `videoPosterSrc` adds is what makes iOS paint a frame rather than black). A picture that cannot be drawn (a clip this
 * browser cannot decode, a link that has expired) leaves its square bare, never broken: `onError` is the only honest
 * test, as `PickPreview` answers the same moment. The caller keys it by `src`, so a new picture gets its chance.
 */
function HerPicture({ src, video }: { src: string; video: boolean }) {
  const [drawable, setDrawable] = useState(true);
  if (!drawable) return null;
  return video && isOwnFile(src) ? (
    <video
      src={videoPosterSrc(src)}
      muted
      playsInline
      preload="metadata"
      tabIndex={-1}
      draggable={false}
      onError={() => setDrawable(false)}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- her own picture: this device's file or a tile presigned for her alone
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setDrawable(false)}
    />
  );
}

/**
 * HER VIDEO'S MARK: the album's own (`CornerPlayBadge`'s glass and glyph, one of Will's three permitted marks) in the
 * corner the album puts it, a share of a square about thirty pixels wide rather than the tile's 20 px.
 */
function VideoMark() {
  return (
    <span
      aria-hidden
      data-wait-video=""
      className={cn(
        "pointer-events-none absolute bottom-[8%] left-[8%] flex aspect-square w-[44%] items-center justify-center rounded-full",
        GLASS_MARK,
      )}
    >
      <Play
        className={cn(
          "ml-px h-auto w-1/2 fill-white text-white",
          GLASS_MARK_LIT,
        )}
      />
    </span>
  );
}

/**
 * ★ THE CLOCK'S WORDS BREAK AT THEIR PHRASES, NEVER INSIDE ONE (crumbs-61, red-team 48's NIT): "All at once tomorrow at 9 am
 * · in 17 h 5 min" is two phrases, and at a phone's 375 the footer wrapped it mid-phrase ("in 17 h 5" over "min"), and the
 * desk's side column the same ("in 16 h" over "16 min"). Each phrase is one unbreakable run: the footer gives the clock a
 * row of its own when it does not fit beside her count (`flex-wrap`), where it stands whole, and the side column, which is
 * narrower than the clock by design, stacks the two as the two lines they are (`stacked`: the dot gives way to the
 * break). What a screen reader hears is the sheet's own sentence, which keeps the dot.
 */
function ClockWords({
  line,
  countdown,
  stacked = false,
}: {
  line: string;
  countdown: string | null;
  stacked?: boolean;
}) {
  if (!countdown) return line;
  return stacked ? (
    <>
      <span className="block">{line}</span>{" "}
      <span className="block">{countdown}</span>
    </>
  ) : (
    <>
      <span className="whitespace-nowrap">{line}</span>
      <span aria-hidden> · </span>
      <span className="whitespace-nowrap">{countdown}</span>
    </>
  );
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
  // Everyone's squares are numbers, so the count's noun is only as exact as hers: a video among hers makes "photos" a
  // lie (red-team 46's NIT), said the way the dashboard's claims say a mix of the two ("photo or video", "photos and videos").
  const one = sheet.count === 1;
  const noun = hers.some((s) => !s.sending && s.video)
    ? one
      ? "photo or video"
      : "photos and videos"
    : one
      ? "photo"
      : "photos";

  const yours =
    sheet.hers > 0 ? (
      onOpenHers ? (
        <button
          type="button"
          onClick={onOpenHers}
          data-wait-yours=""
          className="wait-muted -mx-1 flex shrink-0 items-center gap-1.5 rounded-md px-1 py-0.5 whitespace-nowrap transition-colors hover:text-[var(--gallery-foreground)] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          <span className="wait-key" aria-hidden />
          {`${yoursLabel} · ${formatCount(sheet.hers)}`}
        </button>
      ) : (
        <span
          data-wait-yours=""
          className="wait-muted flex shrink-0 items-center gap-1.5 whitespace-nowrap"
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
        {`${formatCount(sheet.count)} ${noun} developing${sheet.hers > 0 ? `, ${formatCount(sheet.hers)} of them yours` : ""}. ${clockText}.`}
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
        {/* The pill is for the eye: at a busy party it would speak every arrival, and the sentence above has the count. */}
        {!wide && <span aria-hidden>{pill}</span>}
        {wide && (
          <div className="space-y-2 text-xs">
            <span aria-hidden className="block">
              {pill}
            </span>
            {yours}
            <p className="wait-muted" data-wait-clock="">
              <ClockWords line={clockLine} countdown={countdown} stacked />
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
                  <HerPicture
                    key={cell.src}
                    src={cell.src}
                    video={cell.video}
                  />
                )}
                {cell.video && <VideoMark />}
              </span>
            ),
          )}
        </div>
        {!wide && (
          // Her count never wraps, and the clock takes a row of its own when it does not fit beside it (a 375 phone with
          // tomorrow's clock is five pixels short): alone, it stays at the right edge as it always stood.
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            {yours}
            <span
              className={cn("wait-muted", !yours && "ml-auto text-right")}
              data-wait-clock=""
            >
              <ClockWords line={clockLine} countdown={countdown} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
