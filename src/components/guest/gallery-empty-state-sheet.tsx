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
  SHEET_FOLD_CELLS as FOLD_CELLS,
  sheetCapFor,
} from "@/lib/disposable/contact-sheet";
import {
  DEVELOP_TEMPO,
  type DevelopMotion,
  layoutDevelopSheet,
  momentsOf,
  rowOf,
  sinkAt,
  waveAt,
} from "@/lib/disposable/contact-sheet-develop";
import {
  DEVELOP_TITLES,
  developClockLine,
  developSentence,
} from "@/lib/disposable/develop-words";
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
 *
 * AND ITS DEVELOP (the-wait r2, Will's `arrival=in-place`; the data is `lib/disposable/contact-sheet-develop.ts`):
 * `DevelopSheet` is the same sheet the morning after, square for square, each square now the photograph it was, its
 * well's ground a layer of its own so the develop can let it go while the squares stay.
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
          className="wait-muted -mx-1 flex shrink-0 focus-halo items-center gap-1.5 rounded-md px-1 py-0.5 whitespace-nowrap transition-colors outline-none hover:text-[var(--gallery-foreground)]"
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

/* ── the develop ─────────────────────────────────────────────────────────── */

/** A part's moment on the develop's timeline, as the style its animation reads (`.develop-a`). */
export const developAt = (ms: number): CSSProperties =>
  ({ "--develop-at": `${Math.round(ms)}ms` }) as CSSProperties;

/** A square's picture, as the develop draws it: the photograph's small preview (a video's poster). */
export type DevelopPicture = { src: string; video: boolean };

/**
 * THE SHEET'S WORD, TURNING: "Developing" while it stands, "Developed" as the roll comes up (the old word goes, the new
 * one rises a beat after it; reduced motion fades it in).
 */
function DevelopTitle({
  playing,
  motion,
}: {
  playing: boolean;
  motion: DevelopMotion;
}) {
  if (!playing) return DEVELOP_TITLES.before;
  const { word } = momentsOf(motion);
  return (
    <span className="grid" data-develop-title="">
      <span
        className="develop-a wait-develop-fade-out [grid-area:1/1]"
        style={developAt(word)}
      >
        {DEVELOP_TITLES.before}
      </span>
      <span
        className={cn(
          "develop-a [grid-area:1/1]",
          motion === "reduced" ? "wait-develop-fade-in" : "wait-develop-rise",
        )}
        style={developAt(word + DEVELOP_TEMPO.step.word)}
      >
        {DEVELOP_TITLES.after}
      </span>
    </span>
  );
}

/**
 * THE DEVELOP'S SHEET (the-wait r2, `arrival=in-place`): the contact sheet as it stood all night, the roll's squares in
 * the night's order, each the photograph it was. `still` is the sheet before it moves: everyone's dark, hers lit, the
 * pictures loading unseen. `play` develops it: each square flashes and comes up from bright and pale in the night's
 * order, the word turns, then the squares a tile grows out of stand empty (`slots`: the tile is drawn over them,
 * `gallery-empty-state-wait.tsx`), the rest sink row by row, its words go and its well dissolves. Reduced motion: the
 * pictures fade up together, the word fades, and the whole sheet fades as the album fades in.
 *
 * ★ ITS FRAME IS `ContactSheet`'S, CLASS FOR CLASS (the well's padding, the count's column, the squares' columns and
 * cap, the foot), so the sheet that develops is the sheet that stood, to the square; only the ground is its own layer.
 */
export function DevelopSheet({
  roll,
  count,
  hers,
  pictures,
  slots,
  stage,
  motion,
  developsAt,
  firstPaintWidth = null,
  className,
}: {
  /** The roll that developed, newest first. */
  roll: readonly string[];
  /** The whole roll's count, where the roll in hand is its newest part. */
  count?: number;
  hers: ReadonlySet<string>;
  /** The squares' pictures, by id: a square without one develops in the dark. */
  pictures: ReadonlyMap<string, DevelopPicture>;
  /** The squares a tile grows out of: drawn empty, the tile standing over them. */
  slots: ReadonlySet<string>;
  stage: "still" | "play";
  motion: DevelopMotion;
  developsAt: string;
  firstPaintWidth?: number | null;
  className?: string;
}) {
  const nowMs = useWaitClock();
  const [width, wellRef] = useWellWidth(firstPaintWidth);
  const wide = width >= SIDE_BY_SIDE_PX;
  const sheetWidth = wide
    ? width - PAD_WIDE_PX - SIDE_COLUMN_PX
    : width - PAD_NARROW_PX;
  const plan = useMemo(
    () => layoutDevelopSheet({ roll, hers, sheetWidth, count }),
    [roll, hers, sheetWidth, count],
  );
  const playing = stage === "play";
  const full = motion === "full";
  const t = momentsOf(motion);
  const n = plan.cells.length;
  const videos = plan.cells.some((c) => pictures.get(c.id)?.video);

  // In the full pass the words go as the squares begin to sink; in reduced motion the whole sheet fades at once.
  const wordsGo =
    playing && full
      ? {
          className: "develop-a wait-develop-fade-out",
          style: developAt(t.open),
        }
      : null;
  const clock = developClockLine(developsAt, nowMs);
  const yours =
    plan.hers > 0 ? (
      <span
        data-wait-yours=""
        className="wait-muted flex shrink-0 items-center gap-1.5 whitespace-nowrap"
      >
        <span className="wait-key" aria-hidden />
        {`Yours · ${formatCount(plan.hers)}`}
      </span>
    ) : null;

  return (
    <div
      className={cn(
        "relative",
        playing && !full && "develop-a wait-develop-fade-out",
        className,
      )}
      style={playing && !full ? developAt(t.open) : undefined}
      data-develop-sheet={plan.count}
      data-develop-stage={stage}
    >
      {/* The well's ground (`.wait-well`: the media surface, its rim and the house's lamp over it), on its own. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0",
          playing && full && "develop-a wait-develop-fade-out",
        )}
        style={
          playing && full
            ? developAt(t.open + DEVELOP_TEMPO.step.ground)
            : undefined
        }
        data-develop-ground=""
      >
        <div className="wait-well size-full" />
      </div>
      <div
        ref={wellRef}
        className={cn(
          "relative text-[var(--gallery-foreground)]",
          wide ? "flex items-stretch gap-10 p-8" : "p-4",
        )}
      >
        <p className="sr-only">
          {developSentence({
            count: plan.count,
            hers: plan.hers,
            videos,
            developsAt,
            nowMs,
          })}
        </p>
        <div
          className={cn(
            "flex shrink-0 justify-between",
            wide ? "w-56 flex-col" : "items-end",
          )}
        >
          <div
            aria-hidden
            className={wordsGo?.className}
            style={wordsGo?.style}
          >
            <p
              data-wait-count={plan.count}
              className="font-heading leading-none tabular-nums"
              style={{ fontSize: wide ? 64 : 44 }}
            >
              {formatCount(plan.count)}
            </p>
            <p className="wait-muted mt-2 text-sm" data-wait-title="">
              <DevelopTitle playing={playing} motion={motion} />
            </p>
          </div>
          {wide && (
            <div
              aria-hidden
              className={cn("space-y-2 text-xs", wordsGo?.className)}
              style={wordsGo?.style}
            >
              {yours}
              <p className="wait-muted" data-wait-clock="">
                {clock}
              </p>
            </div>
          )}
        </div>
        <div className={cn(wide ? "min-w-0 flex-1 self-center" : "mt-4")}>
          <div
            aria-hidden
            className="wait-sheet"
            style={{
              gridTemplateColumns: `repeat(${plan.columns}, minmax(0, 1fr))`,
            }}
            data-wait-sheet={n}
          >
            {plan.folded > 0 && (
              <span
                data-wait-folded={plan.folded}
                className={cn(
                  "wait-muted flex items-center justify-center rounded-[3px] text-[10px] font-medium tabular-nums",
                  playing && full && "develop-a wait-develop-sink",
                )}
                style={{
                  gridColumn: `span ${FOLD_CELLS}`,
                  background:
                    "color-mix(in oklab, var(--gallery-foreground) 6%, var(--gallery))",
                  ...(playing && full ? developAt(sinkAt(0)) : null),
                }}
              >
                {`+${formatCount(plan.folded)}`}
              </span>
            )}
            {plan.cells.map((cell, i) => {
              // A square a tile grows out of keeps its place, empty: the tile is drawn over it from its first frame.
              if (playing && slots.has(cell.id))
                return (
                  <span
                    key={cell.id}
                    className="wait-cell"
                    data-develop-slot={cell.id}
                    style={{ visibility: "hidden" }}
                  />
                );
              const wave = waveAt(i, n, motion);
              const picture = pictures.get(cell.id);
              const sinks = playing && full;
              return (
                <span
                  key={cell.id}
                  className={cn(
                    "wait-cell",
                    sinks && "develop-a wait-develop-sink",
                  )}
                  style={sinks ? developAt(sinkAt(rowOf(plan, i))) : undefined}
                  data-develop-sq={cell.id}
                  data-develop-wave={Math.round(wave)}
                  data-hers={cell.hers ? "" : undefined}
                >
                  {picture &&
                    (cell.hers ? (
                      // Hers stood lit all night: her photograph, as it was.
                      // eslint-disable-next-line @next/next/no-img-element -- a presigned preview (media-cost-policy)
                      <img src={picture.src} alt="" draggable={false} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- a presigned preview (media-cost-policy)
                      <img
                        src={picture.src}
                        alt=""
                        draggable={false}
                        decoding="async"
                        className={cn(
                          playing
                            ? cn(
                                "develop-a",
                                full
                                  ? "wait-develop-up"
                                  : "wait-develop-fade-in",
                              )
                            : "wait-develop-picture",
                        )}
                        style={playing ? developAt(wave) : undefined}
                      />
                    ))}
                  {cell.hers && picture?.video && <VideoMark />}
                  {!cell.hers && playing && full && (
                    <span
                      aria-hidden
                      className="develop-a wait-develop-flash"
                      style={developAt(wave)}
                    />
                  )}
                </span>
              );
            })}
          </div>
          {!wide && (
            <div
              aria-hidden
              className={cn(
                "mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs",
                wordsGo?.className,
              )}
              style={wordsGo?.style}
            >
              {yours}
              <span
                className={cn("wait-muted", !yours && "ml-auto text-right")}
                data-wait-clock=""
              >
                {clock}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
