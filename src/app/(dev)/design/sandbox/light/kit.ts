/**
 * THE LIGHT KIT (round four, 2026-09-15): the applicable takeaways, as data.
 *
 * Will's review of round three: "This currently feels more like a fun research
 * report without many applicable takeaways to carry into the platform. We have
 * so many beautiful designs from the spill doctrine and spill placements
 * explorations as well ... the three explorations set our future visual
 * identity that will be progressively infused into the new marketing site."
 *
 * So this file is the synthesis, and it is the first thing on the board rather
 * than the conclusion at the bottom of it. Three explorations, one kit:
 *
 *   glow-doctrine   named five SHAPES the engine can make (seam, throw, sweep,
 *                   bloom, halo) and proved them on production's real grounds.
 *   glow-moments    decided WHERE a light is earned (fourteen placements, four
 *                   shipped, four turned down with reasons) and wrote the beam's
 *                   four laws and the scarcity distance.
 *   light           asked what the whole system would be if designed today, and
 *                   answered: three JOBS, a lamp needs a place rather than an
 *                   object, and the aurora is the fill job at chapter scale.
 *
 * A shape is not a treatment. A treatment is a shape, at a place, at a
 * register, at a cadence, on a named kind of section, with a mount you can
 * paste. That is what the three become together, and it is what a wiring round
 * can actually cut from.
 *
 * ★ PURE DATA, NO JSX, so sections.tsx can import the ids without a cycle and
 * so the board, the composer and docs/specs/light.md are all reading one
 * source. If a number here disagrees with a stage, the stage is wrong.
 */

export type JobId = "separate" | "fill" | "mark";

export const JOBS: { id: JobId; name: string; is: string }[] = [
  {
    id: "separate",
    name: "Separate",
    is: "Achromatic, static, and it says one object is in front of another. This is the elevation contract, and it belongs inside the light doctrine rather than beside it.",
  },
  {
    id: "fill",
    name: "Fill",
    is: "Chromatic, slow, always behind content. It gives a room a temperature. Spill, and the aurora it grows into.",
  },
  {
    id: "mark",
    name: "Mark",
    is: "Chromatic, bounded, and it ends when its state ends. The beam, and a moment's beat.",
  },
];

export type TreatmentId =
  | "step"
  | "ring"
  | "lift"
  | "float"
  | "face"
  | "seam"
  | "throw"
  | "aurora"
  | "sweep"
  | "bloom"
  | "halo"
  | "beam";

export type Treatment = {
  id: TreatmentId;
  name: string;
  job: JobId;
  /** What it is, in one line. */
  is: string;
  /** Its PLACE: the thing that admits it. A lamp needs a place, not an object. */
  place: string;
  /** The section kinds it belongs on. */
  where: string;
  /** How often it is allowed to appear. */
  often: string;
  /** Where it comes from: which exploration named it. */
  from: string;
  /** The production call site, where one exists today. */
  ships?: string;
  /** The mount, as the paste a wiring round lands. */
  mount: string;
  /** The board anchor that shows it on a real section. */
  at: string;
};

const SEAM_MOUNT = `{/* The footer's own composition, generalised. The light and the
    hairline are SIBLINGS; the parent is the positioning context; the
    content comes after the lamp and is positioned, so the light stays
    behind it without a z-index anywhere. */}
<div className="surface-ink relative isolate bg-background">
  <Glow
    shape="seam"
    vars={{ "--glw-h": "210px", "--glw-dur": "var(--spill-cadence)" }}
  />
  <div data-glw-seamline aria-hidden />
  <div className="relative">{children}</div>
</div>`;

const THROW_MOUNT = `{/* Origin-anchored: the light is cast FROM a point on the object,
    which is what a rim has no answer for. --glw-from-* is the origin,
    --glw-reach is how far it carries. */}
<div className="relative isolate">
  <Glow
    shape="throw"
    colors={sampled ?? undefined}
    vars={{
      "--glw-from-x": "50%",
      "--glw-from-y": "100%",
      "--glw-reach": "95%",
      "--glw-strength": "0.5",
      "--glw-base": "0.5",
    }}
  />
  <div className="relative">{plate}</div>
</div>`;

const SWEEP_MOUNT = `{/* The comet AND the phase-locked edge ring: the half of the
    recipe the engine has and nothing ships. edge adds the ring,
    --glw-scale sizes it to the object rather than to the stage. */}
<Glow
  shape="sweep"
  edge
  vars={{
    "--glw-scale": "1.9",
    "--glw-radius": "16px",
    "--glw-dur": "6s",
  }}
/>`;

const BLOOM_MOUNT = `{/* A one-shot that decays to the BASE, never to zero, so the object
    stays lit afterwards. runId is the replay key: change it and the
    beat runs again (this codebase fires one-shots by remount, never
    by animationend). */}
<Glow
  shape="bloom"
  runId={publishedAt}
  vars={{
    "--glw-from-y": "50%",
    "--glw-reach": "120%",
    "--glw-strength": "0.85",
    "--glw-base": "0.25",
  }}
/>`;

const HALO_MOUNT = `{/* Lit from BEHIND: the mask clears its own centre, so colour creeps
    in from the rim and the object's face stays clean. A halo is sized
    by its OBJECT, never by its stage, and it is clipped by the
    object's own radius. */}
<span
  className="relative isolate inline-flex overflow-hidden rounded-[var(--radius-action)]"
  style={{ "--glw-radius": "var(--radius-action)" }}
>
  <Glow
    shape="halo"
    vars={{
      "--glw-blur": "8px",
      "--glw-core": "36%",
      "--glw-strength": "0.95",
      "--glw-base": "0.8",
      "--glw-dur": "5s",
    }}
  />
  <span className="relative">{label}</span>
</span>`;

const BEAM_MOUNT = `{/* The beam is not the engine: it is the vendored BorderBeam at the
    LIVE register of the same five hues. One wrapper, one subject per
    view, and theme is passed explicitly (never "auto", which reads the
    OS and not next-themes). The one production wrapper is
    pro-card-beam.tsx; a second subject gets a second wrapper beside
    it, never a raw <BorderBeam> at a call site. */}
<ProCardBeam>{card}</ProCardBeam>`;

const AURORA_MOUNT = `{/* THE COMPONENT A WIRING ROUND LANDS, modelled on screen-lamp.tsx:
    the placement grammar and the register live in ONE place, so a
    chapter asks for light rather than assembling it.
    src/components/marketing/system/section-light.tsx */}
<SectionLight placement="both" register="accent" temperature="house">
  <NoApp />
</SectionLight>

{/* And what it is made of: two seams at the chapter's own boundaries,
    the bottom one flipped on its own axis, each 42 percent of the
    chapter's height. The engine has no bottom-seam shape and should
    not grow one: the geometry is identical and only the vector
    differs, and a vector is the caller's to turn. */}
<div className="relative isolate">
  <div className="absolute inset-x-0 top-0" style={{ height: band }}>
    <Glow shape="seam" drive="transform" vars={AURORA_VARS} />
  </div>
  <div
    className="absolute inset-x-0 bottom-0"
    style={{ height: band, scale: "1 -1" }}
  >
    <Glow shape="seam" drive="transform" vars={AURORA_VARS} />
  </div>
  <div className="relative">{children}</div>
</div>`;

export const TREATMENTS: Treatment[] = [
  /* ── SEPARATE ─────────────────────────────────────────────────────────── */
  {
    id: "step",
    name: "The step",
    job: "separate",
    is: "A surface one token lighter than the one under it. The cheapest separation there is, and the only one that costs no paint.",
    place: "any surface that sits on another surface",
    where: "every card, panel and well, on every ground",
    often: "always, and first: nothing else is reached for until the step is not enough",
    from: "the elevation contract, as it already stands",
    ships: "--card on --background, everywhere",
    mount: `<div className="rounded-[var(--radius-card)] bg-card">{children}</div>`,
    at: "lgt-separate",
  },
  {
    id: "ring",
    name: "The ring",
    job: "separate",
    is: "A hairline that states an edge without implying height. The fourth depth technique, with 77 uses and, until this board, in no document at all.",
    place: "the edge of a surface or a media frame",
    where: "cards, panels, frames, plates, inputs",
    often: "always, beside the step",
    from: "the repo, unwritten: named by this board",
    ships: "ring-1 ring-foreground/5 on surfaces, /10 on media frames",
    mount: `<div className="rounded-[var(--radius-card)] bg-card ring-1 ring-foreground/5">
  {children}
</div>`,
    at: "lgt-separate",
  },
  {
    id: "lift",
    name: "Lift",
    job: "separate",
    is: "The smaller of the two shadows. It separates two objects of the SAME lightness that overlap: two photographs, a card over a card.",
    place: "an overlap between objects that are equally light",
    where: "media cards on a ground of their own lightness, stacked frames",
    often: "wherever the overlap exists, in both modes",
    from: "this board, the separate job",
    mount: `box-shadow: var(--shadow-lift);
/* the geometry is --shadow-float's, unchanged: blur = 2x offset, one
   top source. What changes per ground is only the ALPHA. */`,
    at: "lgt-separate",
  },
  {
    id: "float",
    name: "Float",
    job: "separate",
    is: "The same geometry at double the offsets. It detaches a LAYER from content that keeps living behind it.",
    place: "a layer over content: menu, dialog, sheet, popover, toast",
    where: "every floating primitive, in both modes",
    often: "only on a layer. A flat surface takes neither shadow, in either mode",
    from: "this board, the separate job, ruled once for the floating-surfaces board too",
    mount: `--tw-shadow: var(--shadow-layer);
/* ★ never box-shadow: Tailwind composes the ring and the shadow into
   one declaration, so writing box-shadow on a ringed panel silently
   deletes its ring. Write the slot Tailwind already reserved. */`,
    at: "lgt-separate",
  },
  {
    id: "face",
    name: "The lit face",
    job: "separate",
    is: "An inset hairline plus a one-pixel lip. It is not elevation at all: it is MATERIAL, a face that is catching light.",
    place: "a face that would catch light: a media frame, a screen, a plate",
    where: "the gallery canvas, the QR plate, a phone or browser frame",
    often: "on the three surfaces the doctrine names, and nowhere else",
    from: "glow-doctrine's lit surface, with the paper half this board added",
    mount: `[data-lit] {
  box-shadow:
    var(--tw-ring-shadow, 0 0 #0000),
    inset 0 0 0 1px color-mix(in oklab, var(--foreground) 9%, transparent),
    inset 0 1px 0 color-mix(in oklab, var(--foreground) 6%, transparent);
}
/* on paper the lip reads off the BOTTOM edge instead of the top: a
   ground changes what light means. */`,
    at: "lgt-separate",
  },

  /* ── FILL ─────────────────────────────────────────────────────────────── */
  {
    id: "seam",
    name: "The seam",
    job: "fill",
    is: "Spill across a boundary: a band at full strength where the edge is, falling away from it. The shipped footer, generalised.",
    place: "a boundary between two grounds, or an object's own bottom edge",
    where: "the footer cut, a media strip's bottom edge, a screen's bottom edge",
    often: "once or twice a page, a scarcity distance apart",
    from: "glow-doctrine shape 01, and the one lamp Will named as the model",
    ships: "footer-glow.tsx, film-strip-glow.tsx, screen-lamp.tsx",
    mount: SEAM_MOUNT,
    at: "lgt-t-seam",
  },
  {
    id: "throw",
    name: "The throw",
    job: "fill",
    is: "An origin-anchored cast, thrown outward from a point on the object. It replaces a rim, because a rim has no vector.",
    place: "a plate, a card or a screen sitting on open dark",
    where: "the QR plate, a card overhanging a dark field",
    often: "rare: one per page at most",
    from: "glow-doctrine shape 02",
    mount: THROW_MOUNT,
    at: "lgt-t-throw",
  },
  {
    id: "aurora",
    name: "The aurora",
    job: "fill",
    is: "The fill job at CHAPTER scale: the house light itself, at rest, in a section that has no media. A register, a placement grammar and a clock, not a lamp.",
    place: "a chapter's own two boundaries, never its middle",
    where: "a media-less chapter on either ground; a page's opening or closing band",
    often: "one chapter per page at the accent register; every chapter only at the identity register",
    from: "this board: the thing none of the three explorations had a name for",
    mount: AURORA_MOUNT,
    at: "lgt-composer",
  },

  /* ── MARK ─────────────────────────────────────────────────────────────── */
  {
    id: "sweep",
    name: "The sweep",
    job: "mark",
    is: "The comet plus the phase-locked edge ring: the half of the recipe we never adopted. It reads as something arriving from outside the frame.",
    place: "an object arriving, at the moment it arrives",
    where: "an upload landing, a frame joining a strip, a reel finishing",
    often: "a moment, never a state. It ends",
    from: "glow-doctrine shape 03",
    mount: SWEEP_MOUNT,
    at: "lgt-t-sweep",
  },
  {
    id: "bloom",
    name: "The bloom",
    job: "mark",
    is: "A one-shot that decays to the base and never to zero, so the object stays lit after the beat is over.",
    place: "a moment that just happened, on the object it happened to",
    where: "the publish beat, a review queue reaching zero, a first event created",
    often: "once per session at the very most, and never on a high-frequency action",
    from: "glow-doctrine shape 04, and glow-moments' publish beat",
    ships: "qr-hero.tsx (the plate's ignition, decaying to a resting 0.34)",
    mount: BLOOM_MOUNT,
    at: "lgt-t-bloom",
  },
  {
    id: "halo",
    name: "The halo",
    job: "mark",
    is: "An object lit from BEHIND: the mask clears its own centre, so colour creeps in from the rim and the face of the object stays clean.",
    place: "behind an object that has to stay legible while its surround lights",
    where: "a premium object at rest, an action at the end of a flow",
    often: "the standing exception: one per page, and it has to be argued",
    from: "glow-doctrine shape 05, ported from the get-pro mechanic",
    mount: HALO_MOUNT,
    at: "lgt-t-halo",
  },
  {
    id: "beam",
    name: "The beam",
    job: "mark",
    is: "An object lit BECAUSE IT IS the live subject. Not the engine: the vendored border beam at the live register of the same five hues.",
    place: "the object itself, while its state is running",
    where: "working, awaiting, uploading, publishing, live. And the one standing exception, Pro at rest",
    often: "one subject per view. It ends when the state ends",
    from: "glow-moments' beam laws, ruled and shipped",
    ships: "pro-card-beam.tsx",
    mount: BEAM_MOUNT,
    at: "lgt-t-beam",
  },
];

export function treatmentById(id: TreatmentId): Treatment {
  return TREATMENTS.find((t) => t.id === id) ?? TREATMENTS[0];
}

/**
 * THE FENCES. What is never done, and why each one is here. Every line is
 * either a law the three explorations ruled, or something a specimen on this
 * board falsified. A fence with no case behind it is an opinion, so each one
 * names its case.
 */
export const FENCES: { rule: string; because: string }[] = [
  {
    rule: "Never the middle of a section.",
    because:
      "The copy then sits IN the light instead of in the clean band between two of them. It is on the board as a specimen rather than as a warning, because this is the half of the grammar a wiring round is most likely to get wrong.",
  },
  {
    rule: "Never a fill behind everything.",
    because:
      "globals.css says it in its own words: a seam is a band, not a fill, and generalising that away is what turns spill into a wash sitting on the copy. The room is on the board so the warning can be tested rather than quoted.",
  },
  {
    rule: "Never a rim, a concentric halo, or an even ring.",
    because:
      "Law 2: light has a vector and every instance declares it. A rim declares none, which is why the container mask is origin-anchored and the engine has no even-rim mode to reach for.",
  },
  {
    rule: "Never on a nav panel, a dropdown, the storage meter near its cap, an upload error, a generic skeleton, a CtaBand, or anywhere in the admin portal.",
    because:
      "The moment spill can mean warning it is a state colour and the system is decoration. Failure is --destructive, full stop. A skeleton is an absence and spill needs a presence. The frequency doctrine forbids theatre on the most-used controls.",
  },
  {
    rule: "Never a house token and never a state colour, and never a sixth hue.",
    because:
      "Bible 3: the lamp set is light, never UI. A temperature is a re-ordering and a narrowing of the same five, which is how a chapter carries a mood without growing a second palette. A moment may lean the five toward the nearest hue (300 becomes 305); it may not introduce one.",
  },
  {
    rule: "Never a lamp inside an overflow-hidden ancestor.",
    because:
      "The blurred falloff clips to a hard rectangle, which reads as a grey box and got the album straddle reverted. The strip's lamp is a SIBLING of the conveyor for exactly this reason. Check for clipping ancestors before placing a lamp: this repo has several.",
  },
  {
    rule: "Never a light box that ends on screen.",
    because:
      "The five ellipses still have opacity at the field's left and right extremes, so a box that ends mid-viewport ends the light on a straight vertical cut. Go full-bleed, or pool it with a radial mask on the WRAPPER. The footer has never shown this only because it spans the viewport.",
  },
  {
    rule: "Never two lamps inside one viewport of scroll.",
    because:
      "Scarcity is a distance, not a count, and it was amended to a distance after a whole-page test falsified the count. It governs LAMPS; the aurora is a field and a chapter carrying one is not a lamp for this purpose, which is why the register matters so much.",
  },
  {
    rule: "Never a band without its base.",
    because:
      "A swept layer rests fully off-layer, so a band-only lamp is invisible whenever it is paused, which is its default state below the fold AND its reduced-motion state. The base is how a reduced-motion arrival still arrives.",
  },
  {
    rule: "Never the hero.",
    because:
      "Measured, not preferred: the reverted lamp round put a light on the hero and it failed three of the four things a lamp needs. A light needs a quiet ground to fall on, and the hero's ground is twenty four drifting photographs.",
  },
];

/**
 * WHAT A WIRING ROUND LANDS. The kit's bill of materials: the tokens, the one
 * engine line, and the one component. Nothing here is a research finding; each
 * row is a thing somebody types into a file.
 */
export const LANDS: {
  what: string;
  where: string;
  is: string;
  ask?: string;
}[] = [
  {
    what: "--shadow-lift and --shadow-layer",
    where: "globals.css, beside --shadow-float; theme.css maps them",
    is: "One geometry, two sizes, one alpha ramp per ground. Paper keeps today's bytes exactly; dark gains the ramp it never had (0.45 / 0.55 and 0.50 / 0.62).",
    ask: "Depth in dark",
  },
  {
    what: "[data-lit], with its paper half",
    where: "globals.css; the three surfaces the doctrine names take the attribute",
    is: "The lit face, promoted out of glow-lab.css, with the bottom-edge variant paper has always lacked.",
    ask: "The lit face",
  },
  {
    what: "--aurora-cadence",
    where: "globals.css, as calc(var(--spill-cadence) * 3)",
    is: "A SIBLING of the lamp's clock, not a replacement: a lamp keeps the lamp's clock and a field takes a multiple of it. The ratio is the proposal; the ruling on 8s or 11s picks what it multiplies.",
    ask: "The cadence",
  },
  {
    what: "--lamp-1..5 on .surface-paper",
    where: "globals.css, a second declaration of the same five hues",
    is: "The hand-tuned paper register. Same five hues; 85 and 155 lifted and desaturated, 255 and 305 left to carry the chroma.",
    ask: "The paper five",
  },
  {
    what: "glw-drift-x's from-keyframe, declared outside the reduced-motion block",
    where: "globals.css, the engine",
    is: "One line, and it is a law 4 fix rather than a feature: the transform drive's rest state is currently the comet parked dead centre at full strength. Nobody has seen it because no shipped lamp uses that drive, and the aurora is the first thing that should.",
    ask: "Part F, as pasted",
  },
  {
    what: "<SectionLight>",
    where: "src/components/marketing/system/section-light.tsx (new), beside screen-lamp.tsx",
    is: "The aurora's mount: placement, register and temperature in one place, so a chapter asks for light rather than assembling two bands and four custom properties. The composer on this board exports its exact call.",
    ask: "The aurora",
  },
  {
    what: "A grain tile",
    where: "public/design/, referenced by the aurora's own rule",
    is: "A field this large at this alpha bands in 8 bits; the engine's warp displaces the colour but adds no entropy. Requested from Will; the board ships a generated stand-in meanwhile.",
  },
];
