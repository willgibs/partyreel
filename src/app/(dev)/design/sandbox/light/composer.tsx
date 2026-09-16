"use client";

import { Glow, type GlowVars } from "@/components/shared/glow";

import { type Ground } from "@/components/lab";

import { AURORA_DUR, type GlowDriveId } from "./shared";

/**
 * THE AURORA'S ENGINE (the composer, round four; all that is left of it after
 * the revamp, 2026-09-16).
 *
 * ★ WHAT LEFT, AND WHY THE ROUND IS BETTER FOR IT. Round four's composer was a
 * four-axis configurator (nine sections, four treatments, five placements, two
 * registers, a temperature, a clock and a drive), and Will's answer to the
 * question it was built to settle was that he could not tell what was being
 * asked: "am I being asked what aurora placement within the footer? Or what
 * aurora replacement looks better in general?" A machine with hundreds of
 * reachable states is not a question. So the machine is gone and its ONE useful
 * axis is a page-wide switch: Landing, four options, on the real chapter, with
 * the seam beside it in a two-way compare.
 *
 * What survives here is the light itself, because that part was never the
 * problem: the two bands, the register table, and the fact that a bottom seam
 * is a top seam flipped on its own axis. The engine has no bottom-seam shape
 * and should not grow one, since a seam's geometry is identical and only its
 * direction differs (law 2 is about a vector, and a vector can be turned by the
 * caller).
 *
 * ★ EVERY NUMBER THE PASTE PRINTS IS THE NUMBER THIS RENDERS. The register
 * table is read by the stage and by candidates.ts's block, so a caption on the
 * board can never drift from the light beside it.
 */
export type Treatment = "aurora" | "seam" | "throw" | "none";
export type Placement =
  | "both"
  | "top"
  | "bottom"
  | "middle"
  | "room"
  | "behind";
export type Register = "accent" | "identity";
export type Clock = "lamp" | "aurora";

/**
 * THE REGISTERS. Accent is one section on a page carrying the light; identity
 * is every section carrying it, which is only survivable much lower. The
 * difference is deliberately a RATIO on the same two knobs the footer ships
 * (0.62 base, 0.62 band) rather than a second set of shapes. Will ruled Accent
 * the global register (2026-09-16: "identity feels way too weak").
 *
 * ★ THE GROUND CHANGES THE NUMBERS, NOT THE REGISTER. Paper needs MORE opacity
 * for the same presence, not less, and that is the opposite of the instinct: a
 * tint at l 0.88 against a near-white page has far less contrast with its
 * ground than the same tint has against oklch(0.11), so the dark values read as
 * almost nothing on paper.
 */
const REGISTER_VARS: Record<
  "dark" | "paper",
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
};

function registerVars(ground: Ground, register: Register) {
  return REGISTER_VARS[
    ground === "paper" || ground === "app-light" ? "paper" : "dark"
  ][register];
}

/** One band, positioned. The bottom band is the same seam flipped on its own
 *  axis; the engine has no bottom-seam shape and should not grow one. */
function Band({
  edge,
  height,
  vars,
  drive = "mask",
  offset,
}: {
  edge: "top" | "bottom";
  height: number;
  vars: GlowVars;
  drive?: GlowDriveId;
  /** Used only by the middle: the band's distance from that edge. */
  offset?: number;
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0"
      style={{
        [edge]: offset ?? 0,
        height,
        ...(edge === "bottom" ? { scale: "1 -1" } : {}),
      }}
    >
      <Glow
        shape="seam"
        drive={drive}
        vars={{ "--glw-h": `${height}px`, ...vars } as never}
      />
    </div>
  );
}

/** The configuration's engine vars, built ONCE and used by the stage and the
 *  paste, so the two can never disagree. */
export function auroraVars(
  ground: Ground,
  register: Register,
  clock: Clock,
): GlowVars {
  const r = registerVars(ground, register);
  return {
    "--glw-base": r.base,
    "--glw-strength": r.strength,
    // ★ BOTH CLOCKS ARE TOKENS, AND BOTH HAVE TO BE DECLARED SOMEWHERE THIS
    // BOARD LOADS. This lands inline on the [data-glw] element, so it beats the
    // engine's own --glw-dur and there is nothing behind it: a token nothing
    // declares FREEZES the band instead of falling back (board.css section 6).
    // --spill-cadence is globals.css's; --aurora-cadence is board.css's until
    // the ruling lands it.
    "--glw-dur": clock === "lamp" ? "var(--spill-cadence)" : AURORA_DUR,
    // The blur scales with the band: 16px on a 210px seam is the same softness
    // as roughly 38px on a 560px one, and --glw-blur is a literal, not a ratio.
    "--glw-blur": "38px",
  };
}

export function Light({
  treatment,
  placement,
  ground,
  register,
  clock,
  height,
  grain,
  drive,
}: {
  treatment: Treatment;
  placement: Placement;
  ground: Ground;
  register: Register;
  clock: Clock;
  height: number;
  grain: boolean;
  drive: GlowDriveId;
}) {
  if (treatment === "none") return null;

  const grainNode = grain ? (
    <div data-lgt-grain className="absolute inset-0" />
  ) : null;

  if (treatment === "seam") {
    // The footer's lamp verbatim: the SHIPPED register (0.62 / 0.62 at 210px on
    // the house cadence), not the aurora's, because the card is "use the thing
    // we already have".
    return (
      <Band
        edge={placement === "bottom" ? "bottom" : "top"}
        height={210}
        vars={{ "--glw-dur": "var(--spill-cadence)" }}
      />
    );
  }

  const vars = auroraVars(ground, register, clock);

  if (treatment === "throw" || placement === "room" || placement === "behind") {
    // `throw` has no shape rules of its own, so it is the base engine: one
    // radial field filling its wrapper, anchored by --glw-from-*.
    const behind = placement === "behind";
    return (
      <div aria-hidden className="absolute inset-0">
        <Glow
          shape="throw"
          drive={drive}
          vars={{
            ...vars,
            "--glw-blur": "48px",
            "--glw-from-x": "50%",
            "--glw-from-y": behind ? "46%" : "88%",
            "--glw-reach": "120%",
          }}
        />
        {grainNode}
      </div>
    );
  }

  const band = Math.round(height * 0.42);

  if (placement === "middle") {
    return (
      <>
        <Band
          edge="top"
          height={band}
          vars={vars}
          drive={drive}
          offset={Math.round(height / 2 - band / 2)}
        />
        {grainNode}
      </>
    );
  }

  return (
    <>
      {placement !== "bottom" ? (
        <Band edge="top" height={band} vars={vars} drive={drive} />
      ) : null}
      {placement !== "top" ? (
        <Band edge="bottom" height={band} vars={vars} drive={drive} />
      ) : null}
      {grainNode}
    </>
  );
}
