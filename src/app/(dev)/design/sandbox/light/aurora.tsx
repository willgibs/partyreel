"use client";

import { type CSSProperties, useState } from "react";

import { Stage, Toggle, type Ground, type Mode } from "@/components/dev/board";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { Glow, type GlowVars } from "@/components/shared/glow";
import { cn } from "@/lib/utils";

import { AURORA_CADENCE, Labeled, Part, Proposal } from "./shared";

/**
 * PART B: THE LAMP WITHOUT MEDIA, AND THE AURORA.
 *
 * SPILL's law 1 as written ("if you cannot point at the object emitting, there
 * is no spill") does not admit the footer's seam, which is the one production
 * lamp with no media and the one Will named as the model. The law is not wrong
 * about what it was killing (even rims, concentric halos, a premium pill); it
 * is wrong about what it was looking for. A lamp does not need an OBJECT. It
 * needs a PLACE: an edge, a boundary, a screen, a plate, a horizon. The footer
 * seam has one, the rim of a button does not, and the same verdicts fall out.
 *
 * That opens the question this part is really about. If a place is enough, what
 * is the largest honest one? A chapter has two boundaries of its own, and the
 * three candidates below are three answers at three scales:
 *
 *   A  THE SEAM        the footer's own lamp, unchanged in kind, at a chapter's
 *                      top edge. The tune: nothing new, one more placement.
 *   B  THE AURORA      the chapter lit from BOTH its boundaries, low and slow,
 *                      the hue set narrowed to the chapter's temperature, the
 *                      copy sitting in the clean middle between them.
 *   C  THE ROOM        no boundary at all: one field behind the whole chapter,
 *                      so the section sits INSIDE the light. The replace.
 *
 * ★ C IS THE CANDIDATE THE ENGINE WARNS ABOUT, ON PURPOSE. globals.css: "a
 * seam is a band, not a fill ... generalising that away is what turns spill
 * into a wash sitting on the copy". C is exactly that generalisation, at a
 * register low enough that it might survive it. It is on the board so the
 * warning can be tested rather than quoted.
 *
 * The colour is the engine's own hook and not a new mechanism: [data-glw]
 * declares --glw-c1..5 as var(--lamp-*), and "an ancestor can retune these" is
 * written into globals.css as a feature. A chapter setting --lamp-* recolours
 * every lamp inside it, so a temperature is a narrowing of the identity's five,
 * never a sixth colour. That is the whole claim of the aurora as identity.
 */

type Candidate = "none" | "seam" | "aurora" | "room";
type Register = "accent" | "identity";
type Temperature = "house" | "warm" | "cool";

const CANDIDATES: { id: Candidate; label: string }[] = [
  { id: "none", label: "Bare" },
  { id: "seam", label: "A. The seam" },
  { id: "aurora", label: "B. The aurora" },
  { id: "room", label: "C. The room" },
];

const REGISTERS: { id: Register; label: string }[] = [
  { id: "accent", label: "Accent" },
  { id: "identity", label: "Identity" },
];

const TEMPERATURES: { id: Temperature; label: string }[] = [
  { id: "house", label: "House five" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
];

const GROUNDS: { id: Ground; label: string }[] = [
  { id: "cinema", label: "Cinema" },
  { id: "paper", label: "Paper" },
];

/**
 * THE PROPOSED PAPER FIVE, hand-tuned.
 *
 * design-system.md: the paper register is `SPILL_REGISTER.paper` (l 0.88, c
 * 0.08), one flat row for every hue, and it says so itself: "a hand-tuned paper
 * five is still an open design task". This is that task, done, so the aurora
 * has something honest to sit on when the ground is near white.
 *
 * What a flat row gets wrong on paper is per hue, and predictably: 85 amber
 * goes dirty against white long before the others, so it wants more lightness
 * and less chroma; 155 green is muddier still; 255 blue and 305 violet stay
 * clean and can carry the chroma that makes the light read as light at all.
 * Same five HUES, exactly, which is the part that is the identity.
 */
const PAPER_FIVE = [
  "oklch(0.88 0.085 25)",
  "oklch(0.905 0.07 85)",
  "oklch(0.895 0.065 155)",
  "oklch(0.87 0.085 255)",
  "oklch(0.87 0.09 305)",
];

/** A temperature is a re-ORDERING and narrowing of the five, never a new hue:
 *  the warm chapter drops green and blue out of the field and lets coral,
 *  amber and violet take their slots. Written from the literals in lamp-set.ts
 *  rather than as var(--lamp-n) aliases, so a slot can reference a slot this
 *  same block is also rewriting without a resolution cycle. */
function lampVars(ground: Ground, temp: Temperature): CSSProperties {
  const base = ground === "paper" ? PAPER_FIVE : LAMP_SET;
  const pick: Record<Temperature, number[]> = {
    house: [0, 1, 2, 3, 4],
    warm: [0, 1, 4, 0, 1],
    cool: [3, 4, 2, 3, 4],
  };
  const out: Record<string, string> = {};
  pick[temp].forEach((src, i) => {
    out[`--lamp-${i + 1}`] = base[src];
  });
  return out as CSSProperties;
}

/**
 * THE REGISTERS. Accent is one chapter on a page carrying the light; identity
 * is every chapter carrying it, which is only survivable much lower. The
 * difference is deliberately a RATIO on the same two knobs the footer ships
 * (0.62 base, 0.62 band) rather than a second set of shapes.
 *
 * ★ THE GROUND CHANGES THE NUMBERS, NOT THE REGISTER. Paper needs MORE opacity
 * for the same presence, not less, and that is the opposite of the instinct:
 * a tint at l 0.88 against a near-white page has far less contrast with its
 * ground than the same tint has against oklch(0.11), so the dark values read
 * as almost nothing on paper. Measured by eye on the board, both grounds side
 * by side. It is the same finding the paper register itself came from (sampled
 * light made a paper card "look dirty rather than lit"), one step further on.
 *
 * The cadence is the other half of the proposal and it is not the lamp's: a
 * field this large moving at a lamp's 8 to 11 seconds reads as a screensaver,
 * so the aurora's clock is a multiple of the lamp's. Part C shows all three.
 */
const REGISTER_VARS: Record<
  Ground | "dark",
  Record<Register, { base: string; strength: string }>
> = {
  dark: {
    accent: { base: "0.30", strength: "0.13" },
    identity: { base: "0.17", strength: "0.07" },
  },
  paper: {
    accent: { base: "0.52", strength: "0.24" },
    identity: { base: "0.30", strength: "0.13" },
  },
} as Record<
  Ground | "dark",
  Record<Register, { base: string; strength: string }>
>;

function registerVars(ground: Ground, register: Register) {
  return REGISTER_VARS[ground === "paper" ? "paper" : "dark"][register];
}

/** The media-less section the light has to make beautiful. No photograph, no
 *  screen, no plate: exactly the case bible 1 names ("a section without a
 *  picture is still beautiful, never bare"). */
function MediaLessChapter({ small }: { small: boolean }) {
  const steps = [
    {
      n: "1",
      t: "Share one code",
      d: "A QR on the table, a link in the chat.",
    },
    {
      n: "2",
      t: "Guests upload",
      d: "No app, no account, straight from the camera roll.",
    },
    {
      n: "3",
      t: "You curate",
      d: "Keep what you love. The link becomes the album.",
    },
  ];
  return (
    <div
      className={cn(
        "relative mx-auto flex h-full max-w-[880px] flex-col items-center justify-center text-center",
        small ? "gap-5 px-6" : "gap-7 px-10",
      )}
    >
      <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        How it works
      </p>
      <h3
        className={cn(
          "font-heading text-balance",
          small ? "text-[28px] leading-[1.1]" : "text-[44px] leading-[1.05]",
        )}
      >
        Every photo from the night, in one place
      </h3>
      <div
        className={cn(
          "grid w-full",
          small ? "grid-cols-1 gap-4" : "grid-cols-3 gap-8",
        )}
      >
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full border border-border text-[11px] tabular-nums">
              {s.n}
            </span>
            <p className="text-[13px] font-medium">{s.t}</p>
            <p className="max-w-[26ch] text-[12px] leading-relaxed text-muted-foreground">
              {s.d}
            </p>
          </div>
        ))}
      </div>
      <span
        className="inline-flex h-10 items-center bg-primary px-5 text-[13px] font-medium text-primary-foreground"
        style={{ borderRadius: "var(--radius-action)" }}
      >
        Create an event
      </span>
    </div>
  );
}

/** One lamp, positioned. The bottom band is the same seam flipped on its own
 *  axis: the engine has no bottom-seam shape, and it should not grow one, since
 *  a seam's geometry is identical and only its direction differs (law 2 is
 *  about a vector, and a vector can be turned by the caller). */
function Band({
  edge,
  height,
  vars,
}: {
  edge: "top" | "bottom";
  height: number;
  vars: GlowVars;
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0"
      style={{
        [edge]: 0,
        height,
        ...(edge === "bottom" ? { scale: "1 -1" } : {}),
      }}
    >
      <Glow
        shape="seam"
        vars={{ "--glw-h": `${height}px`, ...vars } as never}
      />
    </div>
  );
}

function Lit({
  candidate,
  ground,
  register,
  height,
  grain,
}: {
  candidate: Candidate;
  ground: Ground;
  register: Register;
  height: number;
  grain: boolean;
}) {
  const r = registerVars(ground, register);
  if (candidate === "none") return null;

  if (candidate === "seam") {
    // A: the footer's lamp verbatim. Its register is the SHIPPED one (0.62 /
    // 0.62 at 210px on the house cadence), not the aurora's, because the
    // candidate is "use the thing we already have" and re-tuning it would make
    // it a different candidate wearing its name.
    return (
      <Band
        edge="top"
        height={210}
        vars={{ "--glw-dur": "var(--spill-cadence)" }}
      />
    );
  }

  if (candidate === "aurora") {
    const band = Math.round(height * 0.42);
    const vars: GlowVars = {
      "--glw-base": r.base,
      "--glw-strength": r.strength,
      "--glw-dur": AURORA_CADENCE,
      // The blur scales with the band: 16px on a 210px seam is the same
      // softness as ~44px on a 560px one, and the engine's --glw-blur is a
      // literal, not a ratio.
      "--glw-blur": "38px",
    };
    return (
      <>
        <Band edge="top" height={band} vars={vars} />
        <Band edge="bottom" height={band} vars={vars} />
        {grain ? <div data-lgt-grain className="absolute inset-0" /> : null}
      </>
    );
  }

  // C: no boundary. `throw` has no shape rules of its own, so it is the base
  // engine: one radial field filling its wrapper, anchored by --glw-from-*.
  // Anchored low and centred, so the chapter sits on the light rather than
  // under it.
  return (
    <div aria-hidden className="absolute inset-0">
      <Glow
        shape="throw"
        vars={{
          "--glw-base": r.base,
          "--glw-strength": r.strength,
          "--glw-dur": AURORA_CADENCE,
          "--glw-blur": "48px",
          "--glw-from-x": "50%",
          "--glw-from-y": "88%",
          "--glw-reach": "120%",
        }}
      />
      {grain ? <div data-lgt-grain className="absolute inset-0" /> : null}
    </div>
  );
}

/** The footer seam as the model: a page, then the ink slab it meets. This is
 *  the shipped composition, not an approximation of it (the glow and the
 *  hairline are siblings, the slab is `relative isolate`, the content is
 *  `relative` so the light stays behind it). */
function TheModel({ mode, ground }: { mode: Mode; ground: Ground }) {
  const small = mode === "phone";
  return (
    <Stage mode={mode} ground={ground} height={small ? 380 : 400}>
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "flex flex-1 items-end justify-center pb-10",
            small ? "px-6" : "px-10",
          )}
        >
          <p className="max-w-[46ch] text-center text-[13px] leading-relaxed text-muted-foreground">
            The page above the slab. Nothing here is emitting.
          </p>
        </div>
        <div className="surface-ink relative isolate bg-background text-foreground">
          <Glow shape="seam" vars={{ "--glw-dur": "var(--spill-cadence)" }} />
          <div data-glw-seamline aria-hidden />
          <div
            className={cn(
              "relative flex flex-col gap-2",
              small ? "px-6 py-10" : "px-12 py-14",
            )}
          >
            <p className="font-heading text-[22px]">Partyreel</p>
            <p className="text-[12px] text-muted-foreground">
              The light is the boundary, not an object on it.
            </p>
          </div>
        </div>
      </div>
    </Stage>
  );
}

export function AuroraPart({ mode }: { mode: Mode }) {
  const [ground, setGround] = useState<Ground>("cinema");
  const [candidate, setCandidate] = useState<Candidate>("aurora");
  const [register, setRegister] = useState<Register>("accent");
  const [temp, setTemp] = useState<Temperature>("house");
  const [grain, setGrain] = useState(true);
  const small = mode === "phone";
  const height = small ? 620 : 600;

  return (
    <Part
      n="B"
      title="Lamps without media: the model, then the aurora"
      lede={
        <>
          <p>
            First the model, unedited: the footer seam, the one shipped lamp
            with nothing emitting. Its lamp is a place, the boundary between two
            grounds, and that is the correction law 1 needs. A rim on a button
            is still refused, because a rim is not a place.
          </p>
          <p>
            Then the question that opens: a chapter has boundaries of its own,
            so how big can an honest lamp be? Three candidates on one media-less
            section, at two registers, on the cinema room and on paper. The hue
            set is narrowed by the section itself through the engine{"'"}s own
            ancestor hook, so a temperature is five of the five, never a sixth
            colour.
          </p>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Ground"
          options={GROUNDS}
          value={ground}
          onChange={setGround}
        />
      </div>

      <Labeled
        name="The model"
        note="footer-glow.tsx as it ships: seam, 210px, 0.62 base and band, the house five, 11s."
      >
        <TheModel mode={mode} ground={ground} />
      </Labeled>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Toggle
          ariaLabel="Candidate"
          options={CANDIDATES}
          value={candidate}
          onChange={setCandidate}
        />
        <Toggle
          ariaLabel="Register"
          options={REGISTERS}
          value={register}
          onChange={setRegister}
        />
        <Toggle
          ariaLabel="Temperature"
          options={TEMPERATURES}
          value={temp}
          onChange={setTemp}
        />
        <Toggle
          ariaLabel="Grain"
          options={[
            { id: "on", label: "Grain" },
            { id: "off", label: "No grain" },
          ]}
          value={grain ? "on" : "off"}
          onChange={(v) => setGrain(v === "on")}
        />
      </div>

      <Labeled
        name={CANDIDATES.find((c) => c.id === candidate)?.label ?? ""}
        note={NOTES[candidate]}
      >
        <Stage mode={mode} ground={ground} height={height}>
          {/* The shipped composition's skeleton: `relative isolate` so the
              light has something to pin to and cannot escape the chapter, the
              lamp first, the content after it and positioned, so the light
              stays behind the copy without a z-index anywhere. */}
          <div
            className="relative isolate h-full"
            style={lampVars(ground, temp)}
          >
            <Lit
              candidate={candidate}
              ground={ground}
              register={register}
              height={height}
              grain={grain}
            />
            <MediaLessChapter small={small} />
          </div>
        </Stage>
      </Labeled>

      <Proposal>
        A lamp needs a place, not an object: an edge, a boundary, a screen, a
        plate, a horizon. The aurora is the largest honest one. It is a register
        (a low base, a band near zero, and higher numbers on paper than on
        cinema, because a tint has less contrast with a near white page than
        with a near black room), a placement grammar (the chapter{"'"}s own
        boundaries, never its middle, never centred on a card or a control, and
        never a fill: the copy lives in the clean band between them), and a
        clock several times slower than a lamp{"'"}s. Its colour is the house
        five narrowed to a temperature by the section above it, which is the one
        way marketing carries colour of its own without growing a sixth.
      </Proposal>
    </Part>
  );
}

const NOTES: Record<Candidate, string> = {
  none: "The control. This is the section bible 1 calls bare, and it is not wrong, only quiet.",
  seam: "The footer's lamp moved to a chapter's top edge, register untouched. Honest, and it reads as a footer.",
  aurora:
    "Both boundaries, 42 percent of the chapter each, 38px blur, a 33s drift. The copy sits in the clean middle.",
  room: "One field behind everything, anchored at 50 by 88 percent. The engine's own warning, tested rather than quoted.",
};
