import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * THE PARTYREEL MARKS + the careers hero field.
 *
 * The marks are hand-built DOM art in the help-emblems.tsx tradition (pure divs
 * + tokens, no images, achromatic), and they draw GLOBAL PRODUCT CONCEPTS, not
 * engine internals (Will's ruling): each one is a beat of the loop a visitor
 * already knows from the rest of the site. A new mark belongs here only if it
 * names another beat.
 *
 * ! THE FIELD IS NOT A GRID, and that is the whole point. The first version
 *   tiled them uniformly and Will's read was exact: "too crowded, tight, and
 *   busy... a very tight, generic icon grid." A uniform cell size plus a
 *   uniform gap is what makes any icon set look like a sample sheet. So the
 *   field below is THREE PARALLAX LAYERS of scattered marks at very different
 *   scales, each drifting at its own speed. Depth, not density, is what makes
 *   it read as a made thing.
 *
 * ! The marks also carry INTERNAL DETAIL now (sprocket holes, data modules, a
 *   photo inside the phone). The near layer renders them large enough to
 *   reward a look, which was the other half of "the icons don't feel very
 *   complex." Silhouette still has to work at 24px for the far layer, so every
 *   mark is a strong solid shape FIRST and detail second.
 */

export type MarkKind =
  | "scan"
  | "phone"
  | "album"
  | "choose"
  | "reel"
  | "share"
  | "keep"
  | "download";

export function Mark({ kind }: { kind: MarkKind }) {
  switch (kind) {
    case "scan":
      // The QR: finder blocks, a quiet-zone module scatter, one accent module.
      return (
        <span className="relative block size-full">
          <span className="absolute top-0 left-0 size-[32%] rounded-[2px] bg-current" />
          <span className="absolute top-[8%] left-[8%] size-[16%] rounded-[1px] bg-current/25" />
          <span className="absolute top-0 right-0 size-[32%] rounded-[2px] bg-current" />
          <span className="absolute top-[8%] right-[8%] size-[16%] rounded-[1px] bg-current/25" />
          <span className="absolute bottom-0 left-0 size-[32%] rounded-[2px] bg-current" />
          <span className="absolute bottom-[8%] left-[8%] size-[16%] rounded-[1px] bg-current/25" />
          <span className="absolute top-[42%] right-[10%] size-[13%] rounded-[1px] bg-current/70" />
          <span className="absolute top-[62%] right-[32%] size-[13%] rounded-[1px] bg-current/45" />
          <span className="absolute right-[8%] bottom-[6%] size-[20%] rounded-[2px] bg-current" />
          <span className="absolute right-[34%] bottom-[10%] size-[11%] rounded-[1px] bg-current/55" />
        </span>
      );
    case "phone":
      // A guest's phone with a photo already in it. No app, no account.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-y-0 left-1/2 w-[54%] -translate-x-1/2 rounded-[6px] bg-current" />
          <span className="absolute inset-y-[13%] left-1/2 w-[38%] -translate-x-1/2 overflow-hidden rounded-[2px] bg-current/20">
            <span className="absolute inset-x-0 bottom-0 h-[42%] bg-current/45" />
            <span className="absolute top-[16%] right-[18%] size-[22%] rounded-full bg-current/55" />
          </span>
        </span>
      );
    case "album":
      // The grid filling up: landed, arriving, and one still empty.
      return (
        <span className="grid size-full grid-cols-3 grid-rows-3 gap-[8%]">
          {[1, 0.22, 1, 0.22, 1, 1, 1, 0.22, 0.6].map((o, i) => (
            <span
              key={i}
              className="rounded-[2px] bg-current"
              style={{ opacity: o }}
            />
          ))}
        </span>
      );
    case "choose":
      // Curation: one stays, one goes, and the host is the one deciding.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-x-0 top-0 h-[44%] overflow-hidden rounded-[3px] bg-current">
            <span className="absolute right-[10%] bottom-[12%] h-[16%] w-[34%] -rotate-45 rounded-full bg-current" />
          </span>
          <span className="absolute inset-x-0 bottom-0 h-[44%] rounded-[3px] bg-current/18" />
          <span className="absolute right-[6%] bottom-[14%] h-[2px] w-[26%] rotate-45 rounded-full bg-current/45" />
          <span className="absolute right-[6%] bottom-[14%] h-[2px] w-[26%] -rotate-45 rounded-full bg-current/45" />
        </span>
      );
    case "reel":
      // The filmstrip: rails, sprockets, and the cut down to the highlights.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-x-0 top-0 flex h-[16%] items-center justify-around rounded-[2px] bg-current/55 px-[6%]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[46%] w-[9%] rounded-[1px] bg-current/40" />
            ))}
          </span>
          <span className="absolute inset-x-0 bottom-0 flex h-[16%] items-center justify-around rounded-[2px] bg-current/55 px-[6%]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[46%] w-[9%] rounded-[1px] bg-current/40" />
            ))}
          </span>
          <span className="absolute inset-x-0 top-[24%] flex h-[52%] gap-[6%]">
            {[1, 0.6, 0.3].map((o, i) => (
              <span
                key={i}
                className="flex-1 rounded-[2px] bg-current"
                style={{ opacity: o }}
              />
            ))}
          </span>
        </span>
      );
    case "share":
      // One link, everybody's copy of the same event.
      return (
        <span className="relative block size-full">
          <span className="absolute top-0 left-1/2 size-[28%] -translate-x-1/2 rounded-full bg-current" />
          <span className="absolute top-[30%] left-1/2 h-[16%] w-[2px] -translate-x-1/2 bg-current/60" />
          <span className="absolute top-[46%] inset-x-[14%] h-[2px] bg-current/60" />
          <span className="absolute top-[46%] left-[14%] h-[16%] w-[2px] bg-current/60" />
          <span className="absolute top-[46%] right-[14%] h-[16%] w-[2px] bg-current/60" />
          <span className="absolute top-[46%] left-1/2 h-[16%] w-[2px] -translate-x-1/2 bg-current/60" />
          <span className="absolute bottom-0 left-0 size-[24%] rounded-[2px] bg-current/75" />
          <span className="absolute bottom-0 left-1/2 size-[24%] -translate-x-1/2 rounded-[2px] bg-current/75" />
          <span className="absolute right-0 bottom-0 size-[24%] rounded-[2px] bg-current/75" />
        </span>
      );
    case "keep":
      // Albums do not expire: the same event, stacked and held.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-x-[24%] top-0 h-[18%] rounded-[2px] bg-current/25" />
          <span className="absolute inset-x-[12%] top-[24%] h-[18%] rounded-[2px] bg-current/50" />
          <span className="absolute inset-x-0 top-[48%] h-[52%] overflow-hidden rounded-[3px] bg-current">
            <span className="absolute inset-x-[12%] bottom-[16%] h-[34%] rounded-[2px] bg-current/30" />
          </span>
        </span>
      );
    case "download":
      // Originals out, at the quality they arrived.
      return (
        <span className="relative block size-full">
          <span className="absolute top-0 left-1/2 h-[36%] w-[3px] -translate-x-1/2 rounded-full bg-current" />
          <span className="absolute top-[30%] left-1/2 size-0 -translate-x-1/2 border-x-[0.14em] border-t-[0.18em] border-x-transparent border-t-current" />
          <span className="absolute inset-x-0 bottom-0 h-[18%] rounded-[2px] bg-current" />
          <span className="absolute inset-x-[16%] bottom-[24%] h-[8%] rounded-full bg-current/35" />
        </span>
      );
  }
}

/**
 * A deterministic 0-1 from an integer seed. INTEGER ops only (xorshift), never
 * Math.random or Math.sin: this runs on the server and again during hydration,
 * and float transcendentals are not guaranteed bit-identical across engines.
 */
function rnd(seed: number): number {
  let x = seed * 2654435761;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 100000) / 100000;
}

const KINDS: MarkKind[] = [
  "scan",
  "phone",
  "album",
  "choose",
  "reel",
  "share",
  "keep",
  "download",
];

type LayerSpec = {
  /** Jittered-grid resolution. Coverage stays even; placement stays irregular. */
  cols: number;
  rows: number;
  /** Mark size range, in viewport-width units so the field scales with the page. */
  minVw: number;
  maxVw: number;
  opacity: [number, number];
  /** Drift clock. Different per layer IS the parallax. */
  seconds: number;
  seed: number;
};

/**
 * Far / mid / near. The near layer is deliberately sparse and only a little
 * brighter than the mid: it exists to give the field depth, not to compete with
 * the headline (the scrim owns the centre).
 */
const LAYERS: LayerSpec[] = [
  { cols: 8, rows: 5, minVw: 1.6, maxVw: 2.5, opacity: [0.09, 0.15], seconds: 95, seed: 11 },
  { cols: 5, rows: 4, minVw: 3.4, maxVw: 4.8, opacity: [0.14, 0.22], seconds: 68, seed: 47 },
  { cols: 3, rows: 2, minVw: 7, maxVw: 9.5, opacity: [0.24, 0.34], seconds: 44, seed: 91 },
];

function Layer({ spec }: { spec: LayerSpec }) {
  const cells = [];
  for (let r = 0; r < spec.rows; r++) {
    for (let c = 0; c < spec.cols; c++) {
      const i = r * spec.cols + c + spec.seed;
      // Jittered grid: an even spread that never lines up. A pure random
      // scatter clumps; a plain grid is the thing we are running away from.
      const jx = (rnd(i * 3 + 1) - 0.5) * 0.9;
      const jy = (rnd(i * 3 + 2) - 0.5) * 0.9;
      const size =
        spec.minVw + rnd(i * 3 + 3) * (spec.maxVw - spec.minVw);
      const opacity =
        spec.opacity[0] + rnd(i * 5 + 7) * (spec.opacity[1] - spec.opacity[0]);
      cells.push(
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={
            {
              left: `${((c + 0.5 + jx) / spec.cols) * 100}%`,
              top: `${((r + 0.5 + jy) / spec.rows) * 100}%`,
              width: `${size}vw`,
              height: `${size}vw`,
              opacity,
            } as CSSProperties
          }
        >
          <Mark kind={KINDS[(i * 5) % KINDS.length]} />
        </span>,
      );
    }
  }
  return (
    <div
      data-mkt-wall
      // Overrides ONLY the duration of the sheet's drift, so the loop-pause
      // contract and the reduced-motion guard both still come from
      // marketing.css. Taller than the box because the drift travels -14%.
      style={{ animationDuration: `${spec.seconds}s` }}
      className="absolute inset-x-0 -top-[10%] h-[130%] text-foreground"
    >
      {cells}
    </div>
  );
}

/**
 * The hero field. Sits behind the scrim; the section clips it.
 */
export function MarksField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {LAYERS.map((spec) => (
        <Layer key={spec.seed} spec={spec} />
      ))}
    </div>
  );
}

/**
 * A single mark at a usable size, for section anchors in the page body. Using
 * the hero's own vocabulary down the page is what ties the two halves together
 * instead of leaving the field as decoration that appears once and never again.
 */
export function MarkBadge({
  kind,
  className,
}: {
  kind: MarkKind;
  className?: string;
}) {
  // ! Sized at 34px, not 24: below about 30px these marks' internal detail
  //   collapses into a gray smudge and the badge reads as a blob. Pick kinds
  //   with a strong silhouette for this slot (album, scan, reel, keep hold up;
  //   choose and download do not).
  return (
    <span aria-hidden className={cn("block size-[34px] text-foreground/75", className)}>
      <Mark kind={kind} />
    </span>
  );
}
