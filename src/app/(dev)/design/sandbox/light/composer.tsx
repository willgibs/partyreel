"use client";

import { type CSSProperties, useState } from "react";

import { Stage, Toggle, type Ground, type Mode } from "@/components/dev/board";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { Glow, type GlowVars } from "@/components/shared/glow";
import { cn } from "@/lib/utils";

import { PAPER_FIVE_VALUES } from "./candidates";
import { SECTIONS, sectionById, type SectionId } from "./sections";
import {
  Knob,
  KnobNote,
  Labeled,
  Part,
  Paste,
  Takeaway,
  WipeControl,
  type GlowDriveId,
} from "./shared";

/**
 * THE SECTION COMPOSER (round four, 2026-09-15): the board's centrepiece.
 *
 * Will's review: "the section configurator for aurora placements looks super
 * promising." Round three's version was a chapter picker with four lights on
 * it. This is the tool that composes light for ANY marketing section: pick the
 * section type, pick the treatment and where it sits, pick the register, the
 * temperature and the clock, and the real production component wears it at 1:1
 * with the unlit version of itself on the other side of a wipe. Every
 * configuration exports both halves of what a wiring round needs: the CSS
 * paste, and the JSX mount.
 *
 * ── WHY A CONFIGURATOR AND NOT A ROW OF SPECIMENS ──
 *
 * A placement grammar is a set of RULES about combinations, and a row of
 * specimens can only show the combinations its author thought of. The grammar
 * here has four axes (nine sections, four treatments, five placements, two
 * registers) and most of the interesting knowledge is in which combinations are
 * ILLEGAL and why. So the composer enforces the grammar rather than describing
 * it: a treatment that a section refuses says so in the section's own words,
 * a placement that a treatment cannot take is not offered, and the two
 * diagnostics (the middle, the room) are kept selectable on purpose, because
 * "never the middle" is the half of the grammar a wiring round is most likely
 * to get wrong and it should be possible to SEE it go wrong.
 *
 * ★ EVERY NUMBER THE EXPORT PRINTS IS THE NUMBER THE STAGE IS RENDERING. The
 * vars object is built once and used twice, so a paste can never drift from
 * the specimen above it. Three rounds of this board have caught two captions
 * that had.
 */
export type Treatment = "aurora" | "seam" | "throw" | "none";
export type Placement = "both" | "top" | "bottom" | "middle" | "room" | "behind";
export type Register = "accent" | "identity";
export type Temperature = "house" | "warm" | "cool";
export type Clock = "lamp" | "aurora";

const TREATMENTS: { id: Treatment; label: string }[] = [
  { id: "aurora", label: "The aurora" },
  { id: "seam", label: "The seam" },
  { id: "throw", label: "The throw" },
  { id: "none", label: "Unlit" },
];

/** The grammar, as data: what each treatment can legally be. A placement that
 *  is not offered cannot be chosen, which is a stronger statement of a rule
 *  than a sentence under the stage. */
const PLACEMENTS_FOR: Record<Treatment, Placement[]> = {
  aurora: ["both", "top", "bottom", "middle", "room"],
  seam: ["top", "bottom"],
  throw: ["behind"],
  none: [],
};

const PLACEMENT_LABEL: Record<Placement, string> = {
  both: "Both boundaries",
  top: "The top edge",
  bottom: "The bottom edge",
  middle: "The middle: the error",
  room: "The room: the warning",
  behind: "Behind the media",
};

const PLACEMENT_NOTE: Record<Placement, string> = {
  both: "The proposal. 42 percent of the section's height at each boundary, the copy in the clean band between them.",
  top: "One boundary. Honest where a section has copy sitting low, and half the light for it.",
  bottom: "One boundary, at the bottom. The same seam flipped on its own axis: the geometry is identical and only the vector turns.",
  middle:
    "The placement ERROR, demonstrated rather than asserted. Same light, same register, same clock, at the section's middle: the copy is now sitting IN the light instead of in the clean band between two of them.",
  room: "The engine's own warning, tested rather than quoted. globals.css: a seam is a band, not a fill, and generalising that away is what turns spill into a wash sitting on the copy.",
  behind:
    "A field behind the media rather than at a boundary. The one placement a media strip can take, and it is the weaker of the two lights a strip can have, because the strip's own bottom edge is a real boundary and this is not.",
};

const TREATMENT_NOTE: Record<Treatment, string> = {
  aurora:
    "The fill job at chapter scale: a register, a placement grammar and a clock. Not a lamp, so the scarcity distance does not count it.",
  seam: "The footer's lamp verbatim: 210px, 0.62 base and band, the site cadence, the shipped mask drive. The register, temperature and clock knobs do not move it, and that is the candidate rather than an omission. Re-tune any of them and it is a different candidate wearing its name.",
  throw:
    "An origin-anchored cast rather than a band. Anchored low and centred, so the section sits ON the light rather than under it.",
  none: "The section exactly as it ships today.",
};

const REGISTER_NOTE: Record<Register, string> = {
  accent:
    "Accent: one section on a page carries the light, so it can be seen. Base 0.30 on cinema, 0.52 on paper.",
  identity:
    "Identity: every section carries it, which is only survivable much lower. Base 0.17 on cinema, 0.30 on paper.",
};

const TEMPERATURE_NOTE: Record<Temperature, string> = {
  house: "House five: the lamp set in its own order, nothing narrowed.",
  warm: "Warm: coral, amber and violet take all five slots. Green and blue drop out of the field.",
  cool: "Cool: blue, violet and green take the slots. A narrowing, never a sixth hue.",
};

/**
 * THE REGISTERS. Accent is one section on a page carrying the light; identity
 * is every section carrying it, which is only survivable much lower. The
 * difference is deliberately a RATIO on the same two knobs the footer ships
 * (0.62 base, 0.62 band) rather than a second set of shapes.
 *
 * ★ THE GROUND CHANGES THE NUMBERS, NOT THE REGISTER. Paper needs MORE opacity
 * for the same presence, not less, and that is the opposite of the instinct: a
 * tint at l 0.88 against a near-white page has far less contrast with its
 * ground than the same tint has against oklch(0.11), so the dark values read as
 * almost nothing on paper. It is the same finding the paper register itself
 * came from (sampled light made a paper card "look dirty rather than lit"), one
 * step further on.
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
  return REGISTER_VARS[ground === "paper" || ground === "app-light" ? "paper" : "dark"][
    register
  ];
}

/** A temperature is a re-ORDERING and narrowing of the five, never a new hue:
 *  the warm section drops green and blue out of the field and lets coral, amber
 *  and violet take their slots. Written from the literals in lamp-set.ts rather
 *  than as var(--lamp-n) aliases, so a slot can reference a slot this same
 *  block is also rewriting without a resolution cycle. */
const PICK: Record<Temperature, number[]> = {
  house: [0, 1, 2, 3, 4],
  warm: [0, 1, 4, 0, 1],
  cool: [3, 4, 2, 3, 4],
};

export function lampVars(
  ground: Ground,
  temp: Temperature,
  paperRow: readonly string[] = PAPER_FIVE_VALUES,
): CSSProperties {
  const base = ground === "paper" ? paperRow : LAMP_SET;
  const out: Record<string, string> = {};
  PICK[temp].forEach((src, i) => {
    out[`--lamp-${i + 1}`] = base[src];
  });
  return out as CSSProperties;
}

/** One band, positioned. The bottom band is the same seam flipped on its own
 *  axis: the engine has no bottom-seam shape and should not grow one, since a
 *  seam's geometry is identical and only its direction differs (law 2 is about
 *  a vector, and a vector can be turned by the caller). */
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

/** The current configuration's engine vars, built ONCE and used by both the
 *  stage and the two exports. */
export function auroraVars(
  ground: Ground,
  register: Register,
  clock: Clock,
): GlowVars {
  const r = registerVars(ground, register);
  return {
    "--glw-base": r.base,
    "--glw-strength": r.strength,
    "--glw-dur": clock === "lamp" ? "var(--spill-cadence)" : "var(--aurora-cadence)",
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
    // The footer's lamp verbatim. Its register is the SHIPPED one (0.62 / 0.62
    // at 210px on the house cadence), not the aurora's, because the candidate
    // is "use the thing we already have".
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
    // radial field filling its wrapper, anchored by --glw-from-*. Anchored low
    // and centred for the room, mid-height for a media strip.
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

/* ────────────────────────────  THE TWO EXPORTS  ─────────────────────────── */

const COMPONENT_NAME: Record<SectionId, string> = {
  hero: "CinemaHero",
  trust: "TrustStrip",
  guests: "NoApp",
  strip: "FilmStrip",
  album: "Album",
  privacy: "Privacy",
  pricing: "PricingTeaser",
  closer: "CinemaClose",
  footer: "MarketingFooter",
};

/** The JSX a wiring round writes for this exact configuration. */
export function mountFor(c: {
  section: SectionId;
  treatment: Treatment;
  placement: Placement;
  register: Register;
  temp: Temperature;
  clock: Clock;
  ground: Ground;
  drive: GlowDriveId;
  grain: boolean;
}): string {
  const Component = COMPONENT_NAME[c.section];
  if (c.treatment === "none") {
    return `{/* ${sectionById(c.section).label}, unlit: exactly as it ships today. */}\n<${Component} />`;
  }
  if (c.treatment === "seam") {
    return `{/* ${sectionById(c.section).label}, with the footer's own lamp at its ${
      c.placement === "bottom" ? "bottom" : "top"
    } edge.
    A seam keeps the LAMP's clock and the shipped register: re-tune either
    and it is a different treatment wearing the seam's name. */}
<div className="relative isolate">
  <div className="absolute inset-x-0 ${c.placement === "bottom" ? "bottom-0" : "top-0"}" style={{ height: 210${
    c.placement === "bottom" ? ', scale: "1 -1"' : ""
  } }}>
    <Glow shape="seam" vars={{ "--glw-h": "210px", "--glw-dur": "var(--spill-cadence)" }} />
  </div>
  <div className="relative"><${Component} /></div>
</div>`;
  }
  const vars = auroraVars(c.ground, c.register, c.clock);
  const varLines = Object.entries(vars)
    .map(([k, v]) => `    "${k}": "${v}",`)
    .join("\n");
  const tempLine =
    c.temp === "house"
      ? ""
      : `\n  temperature="${c.temp}"   {/* the five, re-ordered: a narrowing, never a sixth hue */}`;
  return `{/* ${sectionById(c.section).label}: the aurora, ${PLACEMENT_LABEL[
    c.placement
  ].toLowerCase()}, at the ${c.register} register on ${
    c.ground === "paper" ? "paper" : "cinema"
  }. */}
<SectionLight placement="${c.placement}" register="${c.register}"${tempLine}>
  <${Component} />
</SectionLight>

{/* What <SectionLight> is made of, for this configuration. Two seams at the
    section's own boundaries, the bottom one flipped on its own axis, each 42
    percent of the section's height; the drive is ${c.drive}${
      c.drive === "transform"
        ? " (the cheap one: a field at\n    chapter scale should not repaint every frame)"
        : ""
    }. */}
const AURORA_VARS = {
${varLines}
} as const;

<div className="relative isolate"${
    c.temp === "house" ? "" : ` style={TEMPERATURE.${c.temp}}`
  }>
  <div className="absolute inset-x-0 top-0" style={{ height: band }}>
    <Glow shape="seam" drive="${c.drive}" vars={AURORA_VARS} />
  </div>
  <div className="absolute inset-x-0 bottom-0" style={{ height: band, scale: "1 -1" }}>
    <Glow shape="seam" drive="${c.drive}" vars={AURORA_VARS} />
  </div>
${c.grain ? '  <div data-aurora-grain className="absolute inset-0" />\n' : ""}  <div className="relative">{children}</div>
</div>`;
}

/** The CSS a wiring round lands for this exact configuration: the register, its
 *  ground scope, and the clock it multiplies. Real selectors only. */
export function pasteFor(c: {
  register: Register;
  temp: Temperature;
  clock: Clock;
  grain: boolean;
}): string {
  const dark = REGISTER_VARS.dark[c.register];
  const paper = REGISTER_VARS.paper[c.register];
  const tempBlock =
    c.temp === "house"
      ? ""
      : `

/* The ${c.temp} temperature: the same five hues, re-ordered and narrowed by the
   section itself. The engine documents the hook ("an ancestor can retune
   these"), so a section setting --lamp-* recolours every lamp inside it.
   ★ Written as LITERALS, never as var(--lamp-n): this block rewrites the very
   slots it would be reading, and a slot cannot reference a slot the same
   declaration is replacing. */
[data-section-light="${c.temp}"] {
${PICK[c.temp]
  .map((src, i) => `  --lamp-${i + 1}: ${LAMP_SET[src]};`)
  .join("\n")}
}`;
  return `/* THE AURORA, at the ${c.register} register (light board, the composer).
   A register, not a lamp: a low base with a band near zero, so the section
   reads as a room with a temperature rather than as something glowing.
   ★ Paper takes HIGHER numbers than cinema, not lower: a tint at l 0.88
   against a near-white page has far less contrast with its ground than the
   same tint has against oklch(0.11). */

:root,
.surface-paper {
  /* A SIBLING of the lamp's clock, never a replacement: a lamp keeps the
     lamp's clock and a field takes a multiple of it. --spill-cadence is
     untouched, so every shipped lamp keeps the number it has. */
  --aurora-cadence: calc(var(--spill-cadence) * 3);
}

[data-section-light] {
  --glw-base: ${dark.base};
  --glw-strength: ${dark.strength};
  --glw-blur: 38px;
  --glw-dur: var(--${c.clock === "lamp" ? "spill" : "aurora"}-cadence);
}

.surface-paper [data-section-light],
.surface-paper[data-section-light] {
  --glw-base: ${paper.base};
  --glw-strength: ${paper.strength};
}${
    c.grain
      ? `

/* The dither. A field this large at this alpha bands in 8 bits: the engine's
   warp displaces the colour but adds no entropy, so the steps survive it.
   ★ The tile is sized in DEVICE pixels: laid out at its own pixel size on a
   2x screen it doubles and the band comes back. */
[data-aurora-grain]::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.055;
  mix-blend-mode: overlay;
  background-image: url("/design/aurora-grain.png");
  background-size: 256px 256px;
}
@media (min-resolution: 2dppx) {
  [data-aurora-grain]::after { background-size: 128px 128px; }
}`
      : ""
  }${tempBlock}`;
}

/* ──────────────────────────────  THE BOARD  ─────────────────────────────── */

export function ComposerPart({
  mode,
  ground,
  register,
  rules,
}: {
  mode: Mode;
  ground: Ground;
  register: Register;
  rules: string[];
}) {
  const [section, setSection] = useState<SectionId>("guests");
  const [treatment, setTreatment] = useState<Treatment>("aurora");
  const [placement, setPlacement] = useState<Placement>("both");
  const [temp, setTemp] = useState<Temperature>("house");
  const [clock, setClock] = useState<Clock>("aurora");
  const [drive, setDrive] = useState<GlowDriveId>("transform");
  const [grain, setGrain] = useState(true);
  // The wipe opens at half, which is the whole point of it: the first frame a
  // reviewer sees already has the unlit section and the lit one touching.
  const [wipe, setWipe] = useState(50);

  const current = sectionById(section);
  const legal = PLACEMENTS_FOR[treatment];
  // ★ THE GRAMMAR SNAPS THE CONTROL RATHER THAN LETTING IT LIE. Switching to a
  // treatment that cannot take the current placement would otherwise leave the
  // toggle reading "Both boundaries" while the stage renders one band, which is
  // the exact class of defect round three spent itself removing (a control that
  // says something the page does not show).
  const place: Placement = legal.includes(placement) ? placement : legal[0];
  const refusal = current.refuses?.[treatment === "aurora" ? "aurora" : "seam"];
  // The section's own ground unless the dock is asking for the other one; the
  // footer is ink either way, because ink IS the footer's boundary.
  const stageGround: Ground =
    current.ships === "ink" ? "ink" : ground === "paper" ? "paper" : current.ships;
  const height = current.h[mode];

  const lit = (
    <Light
      treatment={treatment}
      placement={place}
      ground={stageGround}
      register={register}
      clock={clock}
      height={height}
      grain={grain && treatment !== "seam"}
      drive={drive}
    />
  );

  const config = {
    section,
    treatment,
    placement: place,
    register,
    temp,
    clock,
    ground: stageGround,
    drive,
    grain: grain && treatment !== "seam",
  };

  return (
    <Part
      n="03"
      id="composer"
      title="The composer: light for any section"
      rules={rules}
      lede={
        <>
          <p>
            Pick a section type, a treatment and where it sits, and the real
            production component wears it at 1:1, with the unlit version of
            itself on the other side of the wipe. Nine sections: a hero, four
            chapters, two media strips, the pricing band and the footer, each at
            the ground the page actually gives it.
          </p>
          <p>
            The composer enforces the grammar rather than describing it. A
            placement a treatment cannot take is not offered; a section that
            refuses a treatment says so in its own words and still renders it,
            because the refusals are the most useful thing here. Two placements
            are kept selectable on purpose and neither is a candidate: the
            middle is the placement error and the room is the engine{"'"}s own
            warning, both worth seeing go wrong once.
          </p>
          <p>
            Every configuration exports both halves of what a wiring round
            needs, below the stage: the CSS a ruling lands, and the JSX a
            section is wrapped in.
          </p>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Knob label="Section">
          <Toggle
            ariaLabel="Section"
            options={SECTIONS.map((s) => ({ id: s.id, label: s.label }))}
            value={section}
            onChange={setSection}
          />
        </Knob>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Knob label="Treatment">
          <Toggle
            ariaLabel="Treatment"
            options={TREATMENTS}
            value={treatment}
            onChange={setTreatment}
          />
        </Knob>
        {legal.length > 1 ? (
          <Knob label="Placement">
            <Toggle
              ariaLabel="Placement"
              options={legal.map((p) => ({ id: p, label: PLACEMENT_LABEL[p] }))}
              value={place}
              onChange={setPlacement}
            />
          </Knob>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Knob label="Temperature">
          <Toggle
            ariaLabel="Temperature"
            options={[
              { id: "house" as Temperature, label: "House five" },
              { id: "warm" as Temperature, label: "Warm" },
              { id: "cool" as Temperature, label: "Cool" },
            ]}
            value={temp}
            onChange={setTemp}
          />
        </Knob>
        <Knob label="Clock">
          <Toggle
            ariaLabel="Clock"
            options={[
              { id: "aurora" as Clock, label: "Aurora (3 laps)" },
              { id: "lamp" as Clock, label: "The lamp's" },
            ]}
            value={clock}
            onChange={setClock}
          />
        </Knob>
        <Knob label="Drive">
          <Toggle
            ariaLabel="Drive"
            options={[
              { id: "transform" as GlowDriveId, label: "Transform" },
              { id: "mask" as GlowDriveId, label: "Mask" },
            ]}
            value={drive}
            onChange={setDrive}
          />
        </Knob>
        <Knob label="Grain">
          <Toggle
            ariaLabel="Grain"
            options={[
              { id: "on", label: "On" },
              { id: "off", label: "Off" },
            ]}
            value={grain ? "on" : "off"}
            onChange={(v) => setGrain(v === "on")}
          />
        </Knob>
      </div>

      <KnobNote>
        <span className="font-medium text-foreground">{current.label}</span>{" "}
        ships on {current.ships === "paper" ? "paper" : current.ships === "ink" ? "the ink slab" : "the cinema room"}.{" "}
        {current.note}
        {current.carries ? (
          <span className="mt-1 block">
            <span className="text-foreground">It already carries </span>
            {current.carries}
            <span className="text-foreground">
              {" "}
              , so anything added here is a second light inside one scarcity
              distance.
            </span>
          </span>
        ) : null}
        <span className="mt-1 block">{TREATMENT_NOTE[treatment]}</span>
        {treatment !== "none" ? (
          <span className="block">{PLACEMENT_NOTE[place]}</span>
        ) : null}
        {treatment === "aurora" ? (
          <>
            <span className="block">{REGISTER_NOTE[register]}</span>
            <span className="block">{TEMPERATURE_NOTE[temp]}</span>
          </>
        ) : null}
      </KnobNote>

      {refusal && treatment !== "none" ? (
        <p className="max-w-2xl rounded-lg border border-foreground/30 bg-card px-3.5 py-3 text-xs leading-relaxed text-foreground">
          <span className="font-medium">
            {current.label} refuses this treatment.{" "}
          </span>
          {refusal}
        </p>
      ) : null}

      <WipeControl value={wipe} onChange={setWipe} />

      <Labeled
        name={`${current.label}: ${
          treatment === "none" ? "unlit" : PLACEMENT_LABEL[place].toLowerCase()
        }`}
        note="Left of the handle is the section exactly as it ships. Everything else on both sides is identical."
      >
        <Stage mode={mode} ground={stageGround} height={height}>
          {/* The shipped composition's skeleton: `relative isolate` so the
              light has something to pin to and cannot escape the section, the
              lamp first, the content after it and positioned, so the light
              stays behind the copy without a z-index anywhere. */}
          <div
            className="relative isolate flex h-full flex-col justify-center"
            style={lampVars(stageGround, temp)}
          >
            <div
              data-lgt-wipe
              style={{ "--lgt-wipe": `${100 - wipe}%` } as CSSProperties}
            >
              {lit}
            </div>
            <div
              data-lgt-wipe-line
              aria-hidden
              style={{ "--lgt-wipe": `${100 - wipe}%` } as CSSProperties}
            />
            {/* ★ shrink-0: the wrapper is a column flex box, and a section
                taller than its canvas would otherwise COMPRESS to fit rather
                than overflow it. That is worse than a clip, because a squashed
                section renders at a layout the real page never gives it and
                nothing says so: the footer measured 1414 here and 1642 in a
                stage that let it be itself. Let it overflow; the height is the
                thing to fix, and a clip is visible. */}
            <div className="relative shrink-0">{current.render()}</div>
          </div>
        </Stage>
      </Labeled>

      <div className="grid gap-4 lg:grid-cols-2">
        <Paste
          label="The paste: what a ruling lands in globals.css"
          css={pasteFor(config)}
          lines={8}
        />
        <Paste
          label="The mount: what a section is wrapped in"
          css={mountFor(config)}
          lines={8}
        />
      </div>

      <Takeaway lands="src/components/marketing/system/section-light.tsx, beside screen-lamp.tsx.">
        The aurora needs a COMPONENT, not a recipe. Two bands, a flipped axis,
        four custom properties and a grain layer is too much for a chapter to
        assemble correctly twice, and the placement grammar is exactly the kind
        of rule that survives in a component and dies in a comment.{" "}
        <span className="font-medium">
          {"<SectionLight placement register temperature>"}
        </span>{" "}
        is the mount, modelled on screen-lamp.tsx, which already proves the
        shape: a wrapper that owns one light, takes children, and keeps the
        engine{"'"}s invariants where a call site cannot break them.
      </Takeaway>
    </Part>
  );
}
