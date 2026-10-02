"use client";

import {
  DRIFT,
  type Score,
  secondsOf,
  stepAt,
  WARP,
  WAVE_MS,
  waveAt,
  warpAt,
} from "./typing";

/**
 * THE LOOP'S SCORE, UNDER A HERO: what moves when, over one loop, so the
 * turns can be seen in a still as well as in the frames. It is drawn from the
 * very table the frames run (`typing.ts`), sampled, so the score and the
 * motion cannot disagree: the address's lane (standing, or changing), the
 * object's (what it does at each turn), and the album's (the stream's pace,
 * its warps standing out of it, or how full a wall of photographs is).
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

/** How each hero's album moves, for its score: a stream, or a wall that fills. */
export type Album = "stream" | "wall";

export function LoopScore({
  score,
  album,
  object,
  caption,
}: {
  score: Score;
  album: Album;
  /** The object's lane: its name, and what it does while an address stands. */
  object: string;
  caption: string;
}) {
  const loop = score.loop;
  const y1 = 6;
  const y2 = y1 + LANE + GAP;
  const y3 = y2 + LANE + GAP;
  const axis = y3 + LANE + 14;
  const H = axis + 12;

  // A later pass, where every landing warps (the first opens at full).
  const later = (ms: number) => ms + loop;
  const level = (ms: number) => {
    if (album === "stream") return warpAt(score, later(ms)) / WARP;
    const w = waveAt(score, later(ms));
    return Math.min(1, w.since / WAVE_MS) * (1 - w.rest * 0.6);
  };
  const pts: string[] = [];
  for (let ms = 0; ms <= loop; ms += 20) {
    const y = y3 + LANE - level(ms) * LANE;
    pts.push(`${xOf(ms, loop).toFixed(1)},${y.toFixed(1)}`);
  }
  const area = `M${xOf(0, loop)},${y3 + LANE} L${pts.join(" L")} L${xOf(loop, loop)},${y3 + LANE} Z`;

  // The object: turned to the address while it stands, between two while
  // the next is typed.
  const objectSpans: { from: number; to: number }[] = [];
  let open: number | null = null;
  for (let ms = 0; ms <= loop; ms += 10) {
    const on = stepAt(score, later(ms)).phase === "hold";
    if (on && open === null) open = ms;
    if ((!on || ms + 10 > loop) && open !== null) {
      objectSpans.push({ from: open, to: on ? loop : ms });
      open = null;
    }
  }

  const ticks: number[] = [];
  for (let s = 0; s * 1000 <= loop; s += 5) ticks.push(s * 1000);
  const lane3 = album === "stream" ? "The stream" : "The album";

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
          [object, y2],
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

        {objectSpans.map((s, i) => (
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
        {captionOf(score, album, caption)}
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

function captionOf(score: Score, album: Album, object: string): string {
  const s = secondsOf(score);
  const drift = Math.round(DRIFT * 100);
  return album === "stream"
    ? `One loop, ${s} s, read off the table the frames run: ${object}; the stream eases to ${drift}% while the next address is typed, and leaves each landing at ${WARP} times its pace before settling.`
    : `One loop, ${s} s, read off the table the frames run: ${object}; the album steps back while the next address is typed, and fills anew from the link as it lands.`;
}
