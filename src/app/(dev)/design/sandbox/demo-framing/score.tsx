"use client";

import {
  REVEAL_MS,
  revealEase,
} from "@/components/marketing/sections/home/hero-stream";

import type { Flow } from "./hero";
import { DRIFT, foldAt, rateAt, type Score, secondsOf, stepAt } from "./typing";

/**
 * THE LOOP'S SCORE, UNDER A TAKE: what moves when, over one loop, so the
 * turns can be seen in a still as well as in the frames. It is drawn from the
 * very table the frames run (`typing.ts`), sampled, so the score and the
 * motion cannot disagree: the address's lane (standing, or changing), the
 * code's (standing over it, or gone), and the stream's (its pace, or how far
 * the album is out of the link).
 *
 * Plain SVG in the lab's own ink (`currentColor`), so it reads on the lab's
 * light and dark alike.
 */

const W = 1000;
const LANE = 20;
const GAP = 12;
const LABEL = 132;

/** A span of the loop as x on the chart. */
const xOf = (ms: number, loop: number) => LABEL + ((W - LABEL) * ms) / loop;

/** How far the album is out of the link, 0 to 1, in the takes that rewind. */
function outOf(score: Score, t: number) {
  const f = foldAt(score, t);
  return revealEase(f.since / REVEAL_MS) * (1 - revealEase(f.fold));
}

export function LoopScore({ flow, score }: { flow: Flow; score: Score }) {
  const loop = score.loop;
  const y1 = 6;
  const y2 = y1 + LANE + GAP;
  const y3 = y2 + LANE + GAP;
  const axis = y3 + LANE + 14;
  const H = axis + 12;

  // A later pass, where every landing ramps (the first opens at full).
  const later = (ms: number) => ms + loop;
  const level = (ms: number) =>
    flow === "rewind" ? outOf(score, later(ms)) : rateAt(score, later(ms));
  const pts: string[] = [];
  for (let ms = 0; ms <= loop; ms += 30) {
    const y = y3 + LANE - level(ms) * LANE;
    pts.push(`${xOf(ms, loop).toFixed(1)},${y.toFixed(1)}`);
  }
  const area = `M${xOf(0, loop)},${y3 + LANE} L${pts.join(" L")} L${xOf(loop, loop)},${y3 + LANE} Z`;

  // The code: standing over an address, gone while it changes (and, where the
  // album rewinds, gone as soon as the album has folded halfway in).
  const codeUp = (ms: number) => {
    const s = stepAt(score, later(ms));
    if (s.phase !== "hold") return false;
    return flow !== "rewind" || foldAt(score, later(ms)).fold < 0.35;
  };
  const codeSpans: { from: number; to: number }[] = [];
  let open: number | null = null;
  for (let ms = 0; ms <= loop; ms += 10) {
    const on = codeUp(ms);
    if (on && open === null) open = ms;
    if ((!on || ms + 10 > loop) && open !== null) {
      codeSpans.push({ from: open, to: on ? loop : ms });
      open = null;
    }
  }

  const ticks: number[] = [];
  for (let s = 0; s * 1000 <= loop; s += 5) ticks.push(s * 1000);
  const lane3 = flow === "rewind" ? "The album, out" : "The stream";

  return (
    <figure className="flex max-w-5xl flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full text-foreground"
        role="img"
        aria-label={`The loop's score: ${secondsOf(score)} seconds, ${score.addresses.length} addresses`}
      >
        {[
          ["The address", y1],
          ["The code", y2],
          [lane3, y3],
        ].map(([label, y]) => (
          <text
            key={label}
            x={0}
            y={Number(y) + 14}
            className="fill-current text-[13px]"
            opacity={0.7}
          >
            {label}
          </text>
        ))}

        {/* The address: a bar while it stands, one thread while it changes
            (its erase, the beat on the bare domain and its typing). */}
        {spansOf(score).map((s, i) => {
          const x = xOf(s.from, loop);
          const w = Math.max(1, xOf(s.to, loop) - x);
          return (
            <g key={i}>
              <rect
                x={x}
                y={s.standing ? y1 : y1 + LANE / 2 - 2}
                width={w}
                height={s.standing ? LANE : 4}
                rx={s.standing ? 4 : 2}
                className="fill-current"
                opacity={s.standing ? 0.14 : 0.55}
              />
              {s.standing && w > 64 ? (
                <text
                  x={x + 8}
                  y={y1 + 14}
                  className="fill-current text-[12px] font-medium"
                >
                  {s.slug}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* The code, while it stands. */}
        {codeSpans.map((s, i) => (
          <rect
            key={i}
            x={xOf(s.from, loop)}
            y={y2}
            width={Math.max(1, xOf(s.to, loop) - xOf(s.from, loop))}
            height={LANE}
            rx={4}
            className="fill-current"
            opacity={0.22}
          />
        ))}

        {/* The stream's pace, or how far the album is out of the link. */}
        <rect
          x={LABEL}
          y={y3}
          width={W - LABEL}
          height={LANE}
          rx={4}
          className="fill-current"
          opacity={0.05}
        />
        <path d={area} className="fill-current" opacity={0.32} />

        {ticks.map((t) => (
          <text
            key={t}
            x={xOf(t, loop)}
            y={axis + 8}
            textAnchor={t === 0 ? "start" : "middle"}
            className="fill-current text-[11px] tabular-nums"
            opacity={0.55}
          >
            {t / 1000}s
          </text>
        ))}
      </svg>
      <figcaption className="text-xs text-pretty text-muted-foreground">
        {captionOf(flow, score)}
      </figcaption>
    </figure>
  );
}

/** The address's lane as spans: each stand, and each change between two. */
function spansOf(
  score: Score,
): { standing: boolean; slug: string; from: number; to: number }[] {
  const out: { standing: boolean; slug: string; from: number; to: number }[] =
    [];
  for (const s of score.steps) {
    const standing = s.phase === "hold";
    const last = out[out.length - 1];
    if (last && !last.standing && !standing) last.to = s.to;
    else out.push({ standing, slug: s.slug, from: s.from, to: s.to });
  }
  return out;
}

function captionOf(flow: Flow, score: Score): string {
  const s = secondsOf(score);
  const drift = Math.round(DRIFT * 100);
  switch (flow) {
    case "drift":
      return `One loop, ${s} s, read off the table the frames run: while an address stands its code stands over it and the stream runs full; the code sinks and the stream eases to ${drift}% as the next is typed, and both come back as it lands.`;
    case "rewind":
      return `One loop, ${s} s, read off the table the frames run: each address that lands opens its code and bursts its own album out of the link; before the next, the album folds back in and the invite closes, so the typing always has the stage.`;
    case "inflow":
      return `One loop, ${s} s, read off the table the frames run: while an address stands its code stands and photographs come in from both edges at full pace; they ease to ${drift}% while the next is typed, and the new code arrives as it lands.`;
  }
}
