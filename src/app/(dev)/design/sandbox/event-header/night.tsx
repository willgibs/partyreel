"use client";

import type { CSSProperties } from "react";
import { Images } from "lucide-react";

import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  clock,
  EVENT,
  type HostFacts,
  NIGHT_FROM,
  nightDensity,
  NOW,
} from "./fixtures";

/**
 * THE NIGHT, AS AN INSTRUMENT: his banked idea from disposable-mode r3 ("The
 * night on a dial was super cool, wonder if that could be banked and used as
 * a cool analytics UI or something for hosts?"), drawn twice, round and long.
 *
 * ★ THE DIAL IS A CLOCK, NOT A CHART. It is a 12-hour face, so a photograph
 * taken at 9:30 stands where the hand would at 9:30 and anyone reads it
 * without a legend: the night fills the face clockwise from the first
 * photograph, a mark every five minutes as long as that five minutes was busy,
 * the count at its heart and now a lit point on the rim.
 *
 * ★ STILL, NEVER A PULSE (`ui/badge`'s live mark, and why): a host keeps the
 * hub open all night, and a light that beat for hours would pull her eye off
 * the album. Now is a point that holds its light; what moves is the night
 * itself, a new mark landing where the photograph did.
 *
 * ★ WHITE ON GLASS, BOTH THEMES: the instrument stands on the cover's
 * photograph (`data-surface="photo"`), so it wears the photograph's material
 * (`glass`) and the photograph's ink, never the page's tokens, and its one
 * colour is the photographs behind it (bible 6).
 *
 * The week before, the face waits: no marks, its track dashed, and the days
 * to the party at its heart.
 */

/* ── the dial ─────────────────────────────────────────────────────────────── */

/** The face's own units: a 200 by 200 box, the centre at 100. */
const C = 100;
/** The night's track, and how far a mark reaches in from it (short of the count at the heart). */
const TRACK = 80;
const REACH = 19;

/** A minute after midnight as an angle on a 12-hour face, in radians, 12 at the top. */
const angle = (minute: number) =>
  (((minute % 720) / 720) * 360 - 90) * (Math.PI / 180);

const at = (minute: number, r: number) =>
  [C + Math.cos(angle(minute)) * r, C + Math.sin(angle(minute)) * r] as const;

/** An arc of the night along a radius, clockwise from one minute to another. */
function arc(from: number, to: number, r: number): string {
  const [x0, y0] = at(from, r);
  const [x1, y1] = at(to, r);
  const large = ((to - from) % 720) / 720 > 0.5 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/**
 * The night in a mark every ten minutes, each the night around its moment
 * (the strip's own reading, so the two instruments agree on when it peaked),
 * and its busiest, which every mark is measured against: five degrees apart on
 * the face, each mark stands clear of the next like a watch's minute track
 * rather than running into a wedge.
 */
const BINS = nightDensity(Math.round((NOW - NIGHT_FROM) / 10), 6);
const PEAK = Math.max(...BINS.map((b) => b.n));
const PEAK_AT = Math.round(BINS.find((b) => b.n === PEAK)?.at ?? NIGHT_FROM);

export function NightDial({
  f,
  size,
  className,
}: {
  f: HostFacts;
  /** The face's edge, in px. */
  size: number;
  className?: string;
}) {
  const waiting = f.photos === 0;
  const big = size >= 120;
  return (
    <span
      data-eh-dial={
        waiting
          ? `waiting, ${f.daysToGo} days to go`
          : `${BINS.length} marks, the busiest at ${clock(PEAK_AT)}`
      }
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full glass text-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="eh-dial absolute inset-0 size-full"
        aria-hidden
      >
        {/* The hours, as a watch has them: the quarters a step longer. */}
        {Array.from({ length: 12 }, (_, h) => {
          const quarter = h % 3 === 0;
          const [x0, y0] = at(h * 60, quarter ? 86 : 89);
          const [x1, y1] = at(h * 60, 94);
          return (
            <line
              key={h}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              className={quarter ? "eh-dial-quarter" : "eh-dial-hour"}
            />
          );
        })}
        {waiting ? (
          <circle cx={C} cy={C} r={TRACK} className="eh-dial-waiting" />
        ) : (
          <>
            <path d={arc(NIGHT_FROM, NOW, TRACK)} className="eh-dial-track" />
            {BINS.map((b) => {
              const len = 2 + REACH * (b.n / PEAK);
              const [x0, y0] = at(b.at, TRACK - 4);
              const [x1, y1] = at(b.at, TRACK - 4 - len);
              return (
                <line
                  key={b.at}
                  x1={x0}
                  y1={y0}
                  x2={x1}
                  y2={y1}
                  className="eh-dial-mark"
                  style={
                    { "--eh-mark": 0.5 + 0.5 * (b.n / PEAK) } as CSSProperties
                  }
                />
              );
            })}
            {(() => {
              const [x, y] = at(NOW, TRACK);
              return (
                <>
                  <circle cx={x} cy={y} r={11} className="eh-dial-now-halo" />
                  <circle cx={x} cy={y} r={5} className="eh-dial-now" />
                </>
              );
            })()}
          </>
        )}
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <span
          className={cn(
            "font-heading tabular-nums",
            big ? "text-[1.75rem]" : "text-[1.25rem]",
          )}
        >
          {waiting ? formatCount(f.daysToGo) : formatCount(f.photos)}
        </span>
        <span
          className={cn(
            "mt-1 flex items-center gap-1 text-white/70",
            big ? "text-[11px]" : "text-[9px]",
          )}
        >
          {waiting ? (
            "days to go"
          ) : (
            <>
              <Images className={big ? "size-3" : "size-2.5"} aria-hidden />
              {big ? "photos" : null}
            </>
          )}
        </span>
      </span>
      <span className="sr-only">
        {waiting
          ? `${f.daysToGo} days until ${EVENT.name}`
          : `${formatCount(f.photos)} photos since ${clock(NIGHT_FROM)}, the busiest at ${clock(PEAK_AT)}, live now`}
      </span>
    </span>
  );
}

/* ── the strip ────────────────────────────────────────────────────────────── */

/**
 * THE NIGHT ALONG THE COVER'S FOOT: the same marks laid end to end, from the
 * first photograph at the left to now at the right, each as tall as its
 * stretch of the night was busy, the count at the end beside the lit point.
 * The bins widen with the screen's narrowness, so a mark is never thinner than
 * a pixel can draw and the phone reads the same shape in fewer marks.
 *
 * The week before, the strip is the days still to wait: a dashed line from
 * today to the party's date.
 */
export function NightStrip({
  f,
  narrow,
  date,
}: {
  f: HostFacts;
  /** A phone: fewer, wider marks. */
  narrow: boolean;
  /** The event's date as the head says it. */
  date: string;
}) {
  const height = narrow ? 22 : 30;
  if (f.photos === 0) {
    return (
      <div
        data-eh-strip={`waiting, ${f.daysToGo} days to go`}
        className="flex items-center gap-3 text-[11px] text-white/70 tabular-nums"
        style={{ height }}
      >
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-white" aria-hidden />
          Today
        </span>
        <span
          aria-hidden
          className="h-px flex-1 border-t border-dashed border-white/40"
        />
        <span className="font-medium text-white">{f.daysToGo} days</span>
        <span
          aria-hidden
          className="h-px flex-1 border-t border-dashed border-white/40"
        />
        <span>{date}</span>
      </div>
    );
  }
  // A mark every few pixels at either width, each the night around its moment.
  const bins = nightDensity(narrow ? 46 : 170, narrow ? 7 : 4);
  const peak = Math.max(...bins.map((b) => b.n));
  return (
    <div
      data-eh-strip={`${bins.length} marks, the busiest at ${clock(Math.round(bins.find((b) => b.n === peak)?.at ?? NOW))}`}
      className="flex items-end gap-3 text-white"
      style={{ height }}
    >
      <span className="pb-0.5 text-[11px] text-white/70 tabular-nums">
        {clock(NIGHT_FROM)}
      </span>
      <span
        aria-hidden
        className="eh-strip relative flex h-full flex-1 items-end"
        style={{ "--eh-strip-n": bins.length } as CSSProperties}
      >
        {bins.map((b) => (
          <span
            key={b.at}
            className="eh-strip-mark"
            data-new={b.at > NOW - 12 ? "" : undefined}
            style={
              {
                height: `${2 + (height - 4) * (b.n / peak)}px`,
                opacity: 0.45 + 0.55 * (b.n / peak),
              } as CSSProperties
            }
          />
        ))}
      </span>
      <span className="flex items-center gap-1.5 pb-px">
        <span className="eh-strip-now" aria-hidden />
        <span className="font-heading text-base leading-none tabular-nums">
          {formatCount(f.photos)}
        </span>
      </span>
      <span className="sr-only">
        {`${formatCount(f.photos)} photos since ${clock(NIGHT_FROM)}, live now`}
      </span>
    </div>
  );
}
