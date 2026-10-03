"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { Images } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import type { Case } from "./fixtures";

/**
 * WHAT THE COVER SAYS UNDER THE NAME, FOUR WAYS, NONE OF THEM ON A CLOCK.
 *
 * His pick in round two was the night along the foot, with one condition:
 * "we need to ensure the final design spanning the card isn't reliant on a
 * 'timeline'" (a weekend with a slow trickle, no date set, a morning whose
 * photographs all land early). So nothing here has a start, an end, a range or
 * an hour on it:
 *
 *  - `strip`, his pick's direction: the album laid photo by photo, its first
 *    photograph at the left and its newest at the right, each mark as tall as
 *    how many photographs landed with it, so a morning, a weekend, an undated
 *    album and a trickle all fill the same line and none has a gap;
 *  - `faces`, who made the album: the faces of everyone who added, newest
 *    first, the newest lit while they are adding;
 *  - `latest`, the newest in a line: the photograph that landed last, who sent
 *    it and how long ago, then the totals;
 *  - `colours`, the album's own colours: one ribbon of every photograph's
 *    colour in the order they landed (bible 6, colour from the photographs).
 *
 * ★ WHITE ON THE COVER, BOTH THEMES: every fact stands on the photograph
 * (`data-surface="photo"`), so it wears the photograph's ink and material,
 * never the page's tokens.
 *
 * ★ LIT IS "PHOTOS LANDING NOW" (the newest within a quarter of an hour), and
 * it holds its light: a host keeps the hub open all night, and a pulse that
 * beat for hours would pull her eye off the album (the live mark's own rule).
 * What moves is the album itself: a new mark, face, photograph or colour
 * landing at the newest end.
 */

export type FactsId = "strip" | "faces" | "latest" | "colours";

/* ── the strip, photo by photo ─────────────────────────────────────────────── */

/** How near in time a photograph counts as landing "with" another, in minutes. */
const WITH = 10;

/**
 * EVERY PHOTOGRAPH'S HEIGHT: how many photographs landed within ten minutes of
 * it, itself included. A run of a dozen from one press of Add stands tall, a
 * lone photograph on a quiet Tuesday stands short, and the busiest stretch of
 * a party stands tallest, on any album's own scale.
 */
function landedWith(arrivals: readonly number[]): number[] {
  const out: number[] = [];
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < arrivals.length; i++) {
    const t = arrivals[i];
    while (arrivals[lo] < t - WITH) lo++;
    while (hi < arrivals.length && arrivals[hi] <= t + WITH) hi++;
    out.push(hi - lo);
  }
  return out;
}

/**
 * THE STRIP'S MARKS: `slots` of them across the foot. An album with more
 * photographs than slots folds a run of neighbours into each (the mark as tall
 * as the run's average), so the whole album always spans the card; one with
 * fewer takes a slot each at the newest end, and the slots before its first
 * photograph wait as the quiet line it will fill. Each mark is then softened
 * against its two neighbours, so the line reads as the album's breath rather
 * than a barcode of single photographs.
 */
export function stripMarks(
  arrivals: readonly number[],
  slots: number,
): { h: number; waiting: boolean; fresh: boolean }[] {
  const n = arrivals.length;
  if (n === 0)
    return Array.from({ length: slots }, () => ({
      h: 0,
      waiting: true,
      fresh: false,
    }));
  const heights = landedWith(arrivals);
  const newest = arrivals[n - 1];
  const fresh = (i: number) => arrivals[i] > newest - 15;
  const pad = Math.max(0, slots - n);
  const raw = Array.from({ length: slots }, (_, s) => {
    if (s < pad) return null;
    if (n <= slots) {
      const i = s - pad;
      return { h: heights[i], fresh: fresh(i) };
    }
    const from = Math.floor((s / slots) * n);
    const to = Math.max(from + 1, Math.floor(((s + 1) / slots) * n));
    let sum = 0;
    for (let i = from; i < to; i++) sum += heights[i];
    return { h: sum / (to - from), fresh: fresh(to - 1) };
  });
  const soft = raw.map((m, s) => {
    if (!m) return 0;
    const l = raw[s - 1]?.h ?? m.h;
    const r = raw[s + 1]?.h ?? m.h;
    return 0.25 * l + 0.5 * m.h + 0.25 * r;
  });
  const peak = Math.max(...soft);
  return raw.map((m, s) =>
    m
      ? { h: soft[s] / peak, waiting: false, fresh: m.fresh }
      : { h: 0, waiting: true, fresh: false },
  );
}

/** The count at the newest end: the album's number, or what an empty one waits for. */
function EndCount({ c }: { c: Case }) {
  if (c.photos === 0)
    return (
      <span className="shrink-0 pb-px text-xs text-white/70">
        No photos yet
      </span>
    );
  return (
    <span className="flex shrink-0 items-center gap-1.5 pb-px">
      <span
        className="eh-end"
        data-lit={c.live ? "" : undefined}
        aria-hidden
      />
      <span className="font-heading text-base leading-none tabular-nums">
        {formatCount(c.photos)}
      </span>
    </span>
  );
}

/**
 * HOW MANY MARKS THE STRIP DRAWS: one a photograph, spread across the whole
 * foot, up to as many as fit (160 at a desk, 52 in a hand) and then a run of
 * neighbours a mark; and never fewer than a quiet line's worth (54, 19), so a
 * very small album gathers at the newest end rather than standing three marks
 * a room apart. Only that small album shows the quiet points it will fill: an
 * album of any size spans the card, never a bar filling towards a number.
 */
function slotsFor(photos: number, narrow: boolean): number {
  const most = narrow ? 52 : 160;
  const least = narrow ? 19 : 54;
  return Math.min(most, Math.max(least, photos));
}

export function FactsStrip({ c, narrow }: { c: Case; narrow: boolean }) {
  const height = narrow ? 22 : 30;
  const slots = slotsFor(c.photos, narrow);
  const marks = stripMarks(c.arrivals, slots);
  const filled = marks.filter((m) => !m.waiting).length;
  return (
    <div
      data-eh-facts="strip"
      data-eh-read={
        c.photos === 0
          ? `${slots} waiting slots, no photos yet`
          : `${filled} of ${slots} marks filled, ${formatCount(c.photos)} photos${c.live ? ", the newest lit" : ""}`
      }
      className="flex items-end gap-3 text-white"
      style={{ height }}
    >
      <span
        aria-hidden
        className="eh-strip relative flex h-full flex-1 items-end justify-between"
      >
        {marks.map((m, i) => (
          <span
            key={i}
            className="eh-strip-mark"
            data-waiting={m.waiting ? "" : undefined}
            data-new={c.live && m.fresh ? "" : undefined}
            style={
              m.waiting
                ? undefined
                : ({
                    height: `${3 + (height - 3) * m.h}px`,
                    opacity: 0.55 + 0.45 * m.h,
                  } as CSSProperties)
            }
          />
        ))}
      </span>
      <EndCount c={c} />
      <span className="sr-only">
        {c.photos === 0
          ? "No photos yet"
          : `${formatCount(c.photos)} photos${c.live ? ", landing now" : ""}`}
      </span>
    </div>
  );
}

/* ── the faces ─────────────────────────────────────────────────────────────── */

export function FactsFaces({ c, narrow }: { c: Case; narrow: boolean }) {
  const shown = narrow ? 6 : 10;
  const faces = c.faces.slice(0, shown);
  const more = c.faces.length - faces.length;
  if (c.faces.length === 0)
    return (
      <div
        data-eh-facts="faces"
        data-eh-read="no faces yet, five empty seats"
        className="flex items-center gap-3 text-white"
      >
        <span className="flex" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-8 rounded-full border-[1.5px] border-dashed border-white/45",
                i > 0 && "-ms-2",
              )}
            />
          ))}
        </span>
        <span className="text-sm text-white/75">
          {narrow ? "Faces land here" : "Your guests' faces land here as they add"}
        </span>
      </div>
    );
  return (
    <div
      data-eh-facts="faces"
      data-eh-read={`${faces.length} faces shown of ${c.faces.length}${c.live ? ", the newest lit" : ""}`}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white"
    >
      <AvatarGroup className="eh-faces">
        {faces.map((p, i) => (
          <Avatar
            key={p.seed}
            seed={p.seed}
            size={narrow ? "default" : "lg"}
            data-lit={c.live && i === 0 ? "" : undefined}
            className="relative"
            style={{ zIndex: shown - i }}
          >
            <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ))}
        {more > 0 ? (
          <AvatarGroupCount className="relative text-white">
            +{formatCount(more)}
          </AvatarGroupCount>
        ) : null}
      </AvatarGroup>
      <span className="flex items-center gap-1.5 text-label font-semibold tracking-[0.08em] text-white uppercase tabular-nums">
        <Images className="size-3.5 text-white/75" aria-hidden />
        {formatCount(c.photos)} photos
      </span>
      <span className="sr-only">
        {`${c.faces[0].name}${c.live ? " is adding now" : " added last"}, and ${formatCount(c.faces.length - 1)} others`}
      </span>
    </div>
  );
}

/* ── the newest, in a line ─────────────────────────────────────────────────── */

export function FactsLatest({ c, narrow }: { c: Case; narrow: boolean }) {
  const latest = c.latest;
  const print = narrow ? 44 : 56;
  if (!latest)
    return (
      <div
        data-eh-facts="latest"
        data-eh-read="no photo yet, an empty print"
        className="flex items-center gap-3 text-white"
      >
        <span
          aria-hidden
          className="shrink-0 rounded-[3px] border-[1.5px] border-dashed border-white/45"
          style={{ width: print, height: print }}
        />
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">No photos yet</span>
          <span className="text-xs text-white/70">
            The newest lands here, with who sent it
          </span>
        </span>
      </div>
    );
  const said = `${latest.who} added ${latest.n} ${latest.n === 1 ? "photo" : "photos"}`;
  return (
    <div
      data-eh-facts="latest"
      data-eh-read={`${said}, ${latest.ago}`}
      className={cn(
        "flex items-center text-white",
        narrow ? "gap-3" : "gap-3.5",
      )}
    >
      <span
        className="eh-print relative shrink-0"
        data-lit={c.live ? "" : undefined}
        style={{ width: print, height: print }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the newest photograph */}
        <img
          src={latest.src}
          alt=""
          className="size-full rounded-[2px] object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-base font-medium">{said}</span>
        <span className="flex items-center gap-2 text-xs text-white/75">
          {c.live ? <span className="eh-now" aria-hidden /> : null}
          <span>{latest.ago}</span>
          <span aria-hidden className="text-white/40">
            ·
          </span>
          <span className="tabular-nums">
            {formatCount(c.photos)} photos from {formatCount(c.guests)}{" "}
            {c.guests === 1 ? "guest" : "guests"}
          </span>
        </span>
      </span>
    </div>
  );
}

/* ── the album's colours ───────────────────────────────────────────────────── */

type Rgb = readonly [number, number, number];

/** Every still's colour, read once per document session off its own pixels. */
const COLOURS = new Map<string, Rgb>();
const listeners = new Set<() => void>();
let revision = 0;

/** RGB (0..255) to HSL (0..1), and back. */
function hsl([r, g, b]: Rgb): [number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === R
      ? (G - B) / d + (G < B ? 6 : 0)
      : max === G
        ? (B - R) / d + 2
        : (R - G) / d + 4;
  return [h / 6, s, l];
}

function rgb([h, s, l]: [number, number, number]): Rgb {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(
      255 * (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))),
    );
  };
  return [f(0), f(8), f(4)];
}

/**
 * A PHOTOGRAPH'S COLOUR, read off its own pixels: the vivid ones weigh most
 * (a pixel's saturation squared, by its brightness), so a dance floor reads
 * as its lights and a garden as its flowers rather than both as the beige an
 * average makes of everything; then held in a band that reads on the cover
 * (never darker than mid, never washed out).
 */
function readColour(src: string) {
  if (COLOURS.has(src) || typeof window === "undefined") return;
  COLOURS.set(src, [90, 90, 90]);
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 12;
    canvas.height = 12;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 12, 12);
    const px = ctx.getImageData(0, 0, 12, 12).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let w = 0;
    for (let i = 0; i < px.length; i += 4) {
      const [, sat, lit] = hsl([px[i], px[i + 1], px[i + 2]]);
      const weight = 0.02 + sat * sat * Math.min(lit, 1 - lit) * 2;
      r += px[i] * weight;
      g += px[i + 1] * weight;
      b += px[i + 2] * weight;
      w += weight;
    }
    const [h, sat, lit] = hsl([r / w, g / w, b / w]);
    COLOURS.set(
      src,
      rgb([h, Math.min(0.85, Math.max(0.4, sat * 1.25)), Math.min(0.68, Math.max(0.48, lit))]),
    );
    revision++;
    for (const l of listeners) l();
  };
  img.src = src;
}

function useColours(srcs: readonly string[]): number {
  useEffect(() => {
    for (const s of srcs) readColour(s);
  }, [srcs]);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => revision,
    () => 0,
  );
}

/** The strip's photographs: the album's own. */
function sourcesOf(c: Case): string[] {
  return c.album.map((s) => s.src);
}

export function FactsColours({ c, narrow }: { c: Case; narrow: boolean }) {
  const srcs = useMemo(() => sourcesOf(c), [c]);
  const rev = useColours(srcs);
  // `rev` is the colours' own revision: the chips follow each still as it is
  // read. A run of photos from one moment looks alike, so the album is laid in
  // runs of three to eight, each a chip of its photograph's colour as wide as
  // the run is long: a strip of the party's colours, never a bar filling up.
  const runs = useMemo(() => {
    if (c.photos === 0 || rev < 0) return [];
    const n = c.photos;
    const out: { len: number; rgb: Rgb }[] = [];
    let at = 0;
    for (let k = 0; at < n; k++) {
      const len = Math.min(n - at, 3 + ((k * 7) % 6));
      out.push({
        len,
        rgb: COLOURS.get(srcs[(k * 5 + (k >> 1)) % srcs.length]) ?? [
          90, 90, 90,
        ],
      });
      at += len;
    }
    return out;
  }, [c.photos, srcs, rev]);
  const height = narrow ? 8 : 12;
  return (
    <div
      data-eh-facts="colours"
      data-eh-read={
        c.photos === 0
          ? "an empty strip, no photos yet"
          : `${runs.length} chips of ${formatCount(c.photos)} photos' colours${c.live ? ", the newest lit" : ""}`
      }
      className="flex items-center gap-3 text-white"
    >
      <span
        aria-hidden
        className={cn(
          "relative flex flex-1",
          narrow ? "gap-[1.5px]" : "gap-[2px]",
          c.photos === 0 && "eh-ribbon-empty rounded-[2px]",
        )}
        style={{ height }}
      >
        {runs.map((r, i) => (
          <span
            key={i}
            className="eh-chip"
            data-lit={c.live && i === runs.length - 1 ? "" : undefined}
            style={{
              flexGrow: r.len,
              backgroundColor: `rgb(${r.rgb[0]} ${r.rgb[1]} ${r.rgb[2]})`,
            }}
          />
        ))}
      </span>
      <EndCount c={c} />
      <span className="sr-only">
        {c.photos === 0
          ? "No photos yet"
          : `${formatCount(c.photos)} photos${c.live ? ", landing now" : ""}`}
      </span>
    </div>
  );
}

/** One fact element by id. */
export function Facts({
  facts,
  c,
  narrow,
}: {
  facts: FactsId;
  c: Case;
  narrow: boolean;
}) {
  if (facts === "faces") return <FactsFaces c={c} narrow={narrow} />;
  if (facts === "latest") return <FactsLatest c={c} narrow={narrow} />;
  if (facts === "colours") return <FactsColours c={c} narrow={narrow} />;
  return <FactsStrip c={c} narrow={narrow} />;
}
