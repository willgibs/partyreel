"use client";

import { type CSSProperties, useState } from "react";

import { Stage, Toggle, type Ground, type Mode } from "@/components/dev/board";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { Glow } from "@/components/shared/glow";
import { cn } from "@/lib/utils";

import {
  AURORA_CADENCE,
  CadenceKnob,
  Cell,
  Knob,
  Part,
  Photo,
  Proposal,
} from "./shared";

/**
 * PART C: THE CADENCE. PART D: THE PUBLISH BEAT'S VIOLET.
 *
 * Both are open rulings that ride this board, and they turn out to be the same
 * question asked twice: is a knob on the light a property of the ENGINE or of
 * the THING the light is doing?
 *
 * C  The engine's ruled register is 8s (Will, 2026-08-31); every shipped lamp
 *    passes --spill-cadence, which is 11s. Three strips, identical in every
 *    other respect, so the only variable is the clock. The third is the
 *    aurora's proposed one: a field the size of a chapter cannot move at a
 *    lamp's speed, which is the finding that makes this not a single number.
 *
 * D  The publish beat is an inset box-shadow at oklch(0.62 0.2 300 / 0.55),
 *    the --reel action hue written as a literal (globals.css, @keyframes
 *    rxp-pubglow). SPILL's law 3 bans a state colour as light and the NEVER
 *    list names "violet reel glows" by name, so the beat ships in violation of
 *    a ratified law. The resolution on the board is not "drop the violet": it
 *    is that the light never takes its colour FROM a meaning, and when a moment
 *    wants a hue it takes the nearest of the five. 300 becomes 305, which is
 *    the same violet to the eye and a different thing in the doctrine.
 */

/* ────────────────────────────────  C. THE CADENCE  ───────────────────────── */

const CLOCKS: { dur: string; label: string; note: string }[] = [
  {
    dur: "8s",
    label: "8 seconds",
    note: "The engine's ruled register, and its default.",
  },
  {
    dur: "11s",
    label: "11 seconds",
    note: "--spill-cadence: what every shipped lamp actually passes.",
  },
  {
    dur: AURORA_CADENCE,
    label: "33 seconds",
    note: "The aurora's proposed clock: three laps of the lamp, for a field the size of a chapter.",
  },
];

function CadenceStrip({
  dur,
  label,
  note,
  small,
}: {
  dur: string;
  label: string;
  note: string;
  small: boolean;
}) {
  const h = small ? 120 : 150;
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="relative isolate w-full overflow-hidden"
        style={{ height: h }}
      >
        <Glow shape="seam" vars={{ "--glw-dur": dur, "--glw-h": `${h}px` }} />
        <div data-glw-seamline aria-hidden />
        {/* The period, marked. Two comets three seconds apart are almost
            impossible to tell apart by eye on a single strip; a hairline
            crossing on the same clock makes the difference countable. It is not
            phase locked to the comet and does not claim to be. */}
        <div
          data-lgt-phase
          data-lgt-loop
          aria-hidden
          style={{ "--lgt-dur": dur } as CSSProperties}
        />
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground">{label}</span>
        <span className="block">{note}</span>
      </p>
    </div>
  );
}

export function CadencePart({ mode, rules }: { mode: Mode; rules: string[] }) {
  const small = mode === "phone";
  return (
    <Part
      n="C"
      title="The cadence: 8 seconds, 11 seconds, and the one that is neither"
      rules={rules}
      lede={
        <p>
          Three identical seams. Same geometry, same register, same house five,
          same ground: only the clock differs. The two under ruling are the
          first two. The third is on the strip because part B needs it, and
          because putting them side by side is what shows that a lamp and a
          field are not the same instrument.
        </p>
      }
    >
      <Stage mode={mode} ground="cinema" height={small ? 620 : 700}>
        <div
          className={cn(
            "flex h-full flex-col justify-center gap-6",
            small ? "px-4" : "px-10",
          )}
        >
          {CLOCKS.map((c) => (
            <CadenceStrip key={c.dur} {...c} small={small} />
          ))}
        </div>
      </Stage>

      <Proposal>
        One register for a lamp, and it should be the engine{"'"}s own 8
        seconds: 11 was the footer alone with nothing else moving, and on a page
        with three lamps the slower clock reads as three things drifting rather
        than one room breathing. The aurora is not a lamp and takes a multiple,
        so --spill-cadence stays one token and gains a sibling rather than a
        second opinion.
      </Proposal>

      {/* ★ THE STRIPS ABOVE CANNOT SETTLE THIS RULING AND ARE NOT MEANT TO.
          Three seams in a column show that 8 and 11 are different; they cannot
          show what three lamps a viewport apart feel like on a page you are
          scrolling, which is the actual question ("the whole page at 11s
          against the whole page at 8s", footer-glow.tsx). So the ruling gets
          the same instrument the tuner's slider has: write the token, leave the
          lab, walk the home page. */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CadenceKnob seconds={8} />
          <CadenceKnob seconds={11} />
          <span className="text-[11px] text-muted-foreground">
            Writes --spill-cadence on the site, the same override the tuner
            panel{"'"}s slider writes. Then walk the home page: the footer seam,
            the film strip and the reel pool are a viewport apart, and that is
            the comparison the strips above cannot make.
          </span>
        </div>
      </div>
    </Part>
  );
}

/* ──────────────────────────  D. THE PUBLISH BEAT  ───────────────────────── */

type BeatId = "shipped" | "house" | "leaned";

const BEATS: { id: BeatId; label: string; note: string }[] = [
  {
    id: "shipped",
    label: "As shipped",
    note: "rxp-pubglow: an inset shadow at oklch(0.62 0.2 300), the --reel action hue. 700ms, then nothing, and nothing at all under reduced motion.",
  },
  {
    id: "house",
    label: "The house five",
    note: "A bloom with no colours, the QR plate's model. No meaning in the hue at all.",
  },
  {
    id: "leaned",
    label: "The five, leaned to 305",
    note: "The same bloom, the section narrowing the five toward violet. The aurora's own grammar.",
  },
];

/** The violet temperature: the five narrowed to violet and its neighbour, taken
 *  from the lamp set's literals. The beat reads violet without a single colour
 *  entering the system that was not already in it. */
const LEANED: CSSProperties = {
  "--lamp-1": LAMP_SET[4],
  "--lamp-2": LAMP_SET[3],
  "--lamp-3": LAMP_SET[4],
  "--lamp-4": LAMP_SET[4],
  "--lamp-5": LAMP_SET[3],
} as CSSProperties;

function ReelFrame({
  beat,
  runId,
  published,
  small,
}: {
  beat: BeatId;
  runId: number;
  published: boolean;
  small: boolean;
}) {
  const w = small ? 156 : 272;
  const h = Math.round(w * 0.62);
  const bloom = beat !== "shipped";
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* ★ A BLOOM'S LIGHT LIVES IN A BOX BIGGER THAN THE OBJECT. [data-glw] is
          overflow:hidden, so a glow inset to the frame cannot spill past it and
          reads as a rounded rectangle of colour (design-system.md found this
          twice: the reel treatment and the QR plate). The host is -inset-8. */}
      {bloom ? (
        <div
          aria-hidden
          className="absolute -inset-20"
          style={beat === "leaned" ? LEANED : undefined}
        >
          <Glow
            shape="bloom"
            runId={runId}
            vars={{
              "--glw-base": published ? "0.22" : "0.06",
              "--glw-strength": "0.72",
              "--glw-reach": "62%",
              "--glw-blur": "26px",
            }}
          />
        </div>
      ) : null}
      <div
        className="relative h-full w-full overflow-hidden border border-border"
        style={{ borderRadius: "var(--radius)" }}
      >
        <Photo
          id="concert-confetti"
          sizes="260px"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/90">
            <span
              aria-hidden
              className="ml-0.5 border-y-[6px] border-l-[10px] border-y-transparent border-l-black/80"
            />
          </span>
        </div>
        {/* The shipped beat, verbatim: the production attribute and the
            production keyframe in globals.css, re-keyed to replay. It declares
            nothing outside its animation, so its rest state is no state, which
            is the difference the other two are arguing with. */}
        {beat === "shipped" && published ? (
          <div
            key={runId}
            aria-hidden
            data-rxp-pubglow
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: "var(--radius)" }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function VioletPart({ mode, rules }: { mode: Mode; rules: string[] }) {
  const [ground, setGround] = useState<Ground>("app-dark");
  const [runId, setRunId] = useState(0);
  const small = mode === "phone";

  return (
    <Part
      n="D"
      title="The publish beat's violet"
      rules={rules}
      lede={
        <>
          <p>
            The Studio{"'"}s publish beat breathes violet on the reel{"'"}s own
            frame. Law 3 bans a state colour as light, and the doctrine{"'"}s
            NEVER list names this exact case. Three specimens: the beat as it
            ships, the same moment in the house five with no hue meaning at all,
            and the house five narrowed toward 305 by the surface the moment
            happens on.
          </p>
          <p>
            Press publish. Watch what each one leaves behind: the shipped beat
            declares nothing outside its animation, so it flashes and the frame
            is exactly as it was. A bloom decays to its base, so the object that
            just went live stays lit.
          </p>
          <p>
            There is a second finding under the colour one, and it decides the
            case on its own. The shipped beat lives entirely inside the reduced
            motion block and declares no box shadow outside it, so a visitor who
            asked for less motion is told nothing at all when their reel goes
            live. A bloom rests at its base in both states, which is law 4 doing
            exactly the job it was written for.
          </p>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Knob label="Ground">
          <Toggle
            ariaLabel="Ground"
            options={[
              { id: "app-dark" as Ground, label: "App dark" },
              { id: "cinema" as Ground, label: "Cinema" },
              { id: "app-light" as Ground, label: "App light" },
            ]}
            value={ground}
            onChange={setGround}
          />
        </Knob>
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="h-8 rounded-[var(--radius-action-sm)] bg-foreground px-3 text-[12px] font-medium text-background transition-transform duration-150 ease-emphasis active:scale-[0.97]"
        >
          {runId === 0 ? "Publish" : "Publish again"}
        </button>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {runId === 0 ? "At rest" : `Run ${runId}`}
        </span>
      </div>

      <Stage mode={mode} ground={ground} height={small ? 700 : 400}>
        <div
          className={cn(
            "grid h-full items-center gap-8",
            small ? "grid-cols-1 px-6" : "grid-cols-3 px-12",
          )}
        >
          {BEATS.map((b) => (
            <Cell key={b.id} name={b.label} note={b.note}>
              {/* A fixed specimen row, so three notes of different lengths do
                  not leave the three frames at three heights. */}
              <div
                className="flex w-full items-center justify-center"
                style={{ height: small ? 132 : 210 }}
              >
                <ReelFrame
                  beat={b.id}
                  runId={runId}
                  published={runId > 0}
                  small={small}
                />
              </div>
            </Cell>
          ))}
        </div>
      </Stage>

      <Proposal>
        Light never takes its colour from a meaning. A moment that wants a hue
        takes the nearest of the five and leans the set toward it, which is the
        aurora{"'"}s grammar applied to a beat: 300 becomes 305, the violet is
        kept, law 3 stands, and the engine gains nothing it did not already
        have. The beat also stops being a flash: it decays to a base, so the
        reel that just went live is lit while it is live.
      </Proposal>
    </Part>
  );
}
