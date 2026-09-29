"use client";

import type { Motion } from "./hero";
import {
  DRIFT,
  rateAt,
  type Score as TypingScore,
  secondsOf,
  TOGETHER_RATE,
} from "./typing";

/**
 * THE LOOP'S SCORE, UNDER AN OPTION: what moves when, over one loop, so "they
 * take turns" and "together" can be seen in a still as well as in the frames.
 * It is drawn from the very table the frames run (`typing.ts`), sampled, so
 * the score and the motion cannot disagree: the address's lane (standing, or
 * changing), and under it the stream's pace, or, where the stream has moved
 * to the QR code page, the prints dealt round the address.
 *
 * Plain SVG in the lab's own ink (`currentColor`), so it reads on the lab's
 * light and dark alike.
 */

const W = 1000;
const LANE = 22;
const GAP = 16;
const LABEL = 132;

/** A span of the loop as x on the chart. */
const xOf = (ms: number, loop: number) => LABEL + ((W - LABEL) * ms) / loop;

export function LoopScore({
  motion,
  score,
}: {
  motion: Motion;
  /** Null for a still address: the score is one standing address. */
  score: TypingScore | null;
}) {
  const typed = score && score.steps.length > 1 ? score : null;
  // A still address has no loop of its own; the chart shows twenty seconds of it.
  const loop = typed?.loop ?? 20_000;
  const lane2 = motion === "stage" ? "The prints" : "The stream";
  const y1 = 8;
  const y2 = y1 + LANE + GAP;
  const axis = y2 + LANE + 14;
  const H = axis + 14;

  // The stream's pace, sampled every 40 ms, as an area under a line.
  const pace = (ms: number) =>
    motion === "turns" && typed
      ? rateAt(typed, ms + typed.loop) // a later pass: every landing ramps
      : motion === "together"
        ? TOGETHER_RATE
        : 1;
  let area = "";
  if (motion !== "stage") {
    const pts: string[] = [];
    for (let ms = 0; ms <= loop; ms += 40) {
      const x = xOf(ms, loop);
      const y = y2 + LANE - pace(ms) * LANE;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    area = `M${xOf(0, loop)},${y2 + LANE} L${pts.join(" L")} L${xOf(loop, loop)},${y2 + LANE} Z`;
  }

  const ticks: number[] = [];
  for (let s = 0; s * 1000 <= loop; s += 5) ticks.push(s * 1000);

  return (
    <figure className="flex max-w-5xl flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full text-foreground"
        role="img"
        aria-label={`The loop's score: ${
          typed
            ? `${secondsOf(typed)} seconds, ${typed.addresses.length} addresses`
            : "one still address"
        }`}
      >
        <text
          x={0}
          y={y1 + 15}
          className="fill-current text-[13px]"
          opacity={0.7}
        >
          The address
        </text>
        <text
          x={0}
          y={y2 + 15}
          className="fill-current text-[13px]"
          opacity={0.7}
        >
          {lane2}
        </text>

        {/* The address: a bar while it stands, one thread while it changes
            (its erase, the beat on the bare domain and its typing). */}
        {spansOf(typed, score?.addresses[0] ?? "", loop).map((s, i) => {
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
                  y={y1 + 15}
                  className="fill-current text-[12px] font-medium"
                >
                  {s.slug}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* The stream's pace, or the prints dealt round the address. */}
        {motion === "stage" ? (
          (typed?.steps ?? []).map((s, i) => {
            const x = xOf(s.from, loop);
            const w = Math.max(1, xOf(s.to, loop) - x);
            return s.phase === "hold" ? (
              <rect
                key={i}
                x={x}
                y={y2}
                width={w}
                height={LANE}
                rx={4}
                className="fill-current"
                opacity={0.14}
              />
            ) : null;
          })
        ) : (
          <>
            <rect
              x={LABEL}
              y={y2}
              width={W - LABEL}
              height={LANE}
              rx={4}
              className="fill-current"
              opacity={0.05}
            />
            <path d={area} className="fill-current" opacity={0.32} />
            {/* Under `together`, where each landing turns the stream to its
                party: the photographs born behind the card after it are
                that party's. */}
            {motion === "together"
              ? (typed?.steps ?? [])
                  .filter((s) => s.phase === "hold")
                  .map((s, i) => (
                    <rect
                      key={i}
                      x={xOf(s.from, loop) - 1}
                      y={y2 - 3}
                      width={2}
                      height={LANE + 6}
                      rx={1}
                      className="fill-current"
                      opacity={0.8}
                    />
                  ))
              : null}
          </>
        )}

        {/* The time, every five seconds. */}
        {ticks.map((t) => (
          <text
            key={t}
            x={xOf(t, loop)}
            y={axis + 10}
            textAnchor={t === 0 ? "start" : "middle"}
            className="fill-current text-[11px] tabular-nums"
            opacity={0.55}
          >
            {t / 1000}s
          </text>
        ))}
      </svg>
      <figcaption className="text-xs text-pretty text-muted-foreground">
        {captionOf(motion, typed)}
      </figcaption>
    </figure>
  );
}

/** The address's lane as spans: each stand, and each change between two. */
function spansOf(
  typed: TypingScore | null,
  own: string,
  loop: number,
): { standing: boolean; slug: string; from: number; to: number }[] {
  if (!typed) return [{ standing: true, slug: own, from: 0, to: loop }];
  const out: { standing: boolean; slug: string; from: number; to: number }[] =
    [];
  for (const s of typed.steps) {
    const standing = s.phase === "hold";
    const last = out[out.length - 1];
    if (last && !last.standing && !standing) last.to = s.to;
    else out.push({ standing, slug: s.slug, from: s.from, to: s.to });
  }
  return out;
}

function captionOf(motion: Motion, typed: TypingScore | null): string {
  const drift = Math.round(DRIFT * 100);
  const calm = Math.round(TOGETHER_RATE * 100);
  if (!typed)
    return "The loop's score: the demo's own address stands still, and the stream runs at its full pace the whole time, as today.";
  const s = secondsOf(typed);
  switch (motion) {
    case "turns": {
      // The share of a loop the stream runs at full pace, sampled off the
      // same table (a later pass, where every landing ramps back up).
      let full = 0;
      let n = 0;
      for (let ms = 0; ms < typed.loop; ms += 20, n++)
        if (rateAt(typed, ms + typed.loop) > 0.99) full++;
      const share = Math.round((100 * full) / n);
      return `One loop, ${s} s, read off the table the frames run: while an address stands the stream runs full (${share}% of the loop); it eases to ${drift}% of its pace before one is erased and comes back once the next has landed, so the two never move at full force together.`;
    }
    case "together":
      return `One loop, ${s} s, read off the table the frames run: the stream runs the whole time at ${calm}% of today's pace, and each address that lands turns the card's prints, then the photographs born behind it, to its party.`;
    case "stage":
      return `One loop, ${s} s, read off the table the frames run: the prints lift away as an address is erased and are dealt back in, one after another, as the next one lands; the stream runs on the QR code page instead.`;
    default:
      return `One loop, ${s} s.`;
  }
}
