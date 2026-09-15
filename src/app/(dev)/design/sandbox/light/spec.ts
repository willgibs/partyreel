import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE LIGHT BOARD, AS DATA (the kit round, 2026-09-15).
 *
 * Nothing here is new argument: every ask, candidate, departure and asset is the
 * round-four board's, moved out of `board.tsx` and out of `BoardMeta`'s prop
 * strings so that the template, the desk, the record and the review ledger read
 * ONE list. What changed is where a reviewer meets them: the verdict and the
 * nine one-word calls are now the first screen instead of the last.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 */
export const LIGHT = defineBoard({
  id: "light",
  title: "Light, shadow and lamp",
  question:
    "Light, shadow and lamp as one system: what the treatments are, where each belongs, what is never done, and the order the identity enters the site.",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. The verdict and the nine calls are the first screen, the arguments are folded under the evidence they belong to, and the review panel composes the ledger line. No candidate, number or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Turned inside out into a KIT with the arguments underneath it as evidence, after the round-three review: twelve treatments on the real sections, the composer, and the infusion order.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "The cost meter, the wipe and the paper five. Anything that decided nothing was cut.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed: "Apply to the site, so a candidate is judged on the real pages.",
    },
    {
      n: 1,
      date: "2026-09-14",
      changed: "Three columns: keep, tune, replace. Replace was withdrawn.",
    },
  ],
  context:
    "Three explorations set this identity: the spill doctrine named the shapes, the spill placements decided where a light is earned, and this board asked what the whole system would be if it were designed today. The doctrine as it stands is organised around where light comes FROM, which is why the footer seam, the one lamp named as the model, is illegal under the law that opens it, why dark has no shadow where two photographs need separating, and why the ring lift, with 77 uses, is written down nowhere.",

  verdict: {
    recommendation:
      "Organise the doctrine around what the light is DOING: separate, fill, mark. Land the kit as written and begin the infusion at phase 1.",
    because:
      "The same parts fall into three jobs that do not overlap, and the replacement for name-the-lamp falls out of the second one: a lamp needs a PLACE, not an object. An edge, a boundary, a screen, a plate, a horizon. The footer seam has one and a pill's rim does not, so the lamp everyone likes becomes legal without loosening anything.",
    overrule:
      "A shadow in dark is the one genuinely additive claim. If dark must stay shadowless, the family drops and the rest of the kit still stands.",
  },

  asks: [
    {
      id: "kit",
      question: "The kit, as written",
      options: ["land", "amend"],
      recommended: "land",
      because:
        "Three jobs, twelve named treatments, each with a place, a section list, a frequency and a mount. Amend means naming the one part to change rather than re-opening the shape.",
      evidence: "kit",
    },
    {
      id: "infusion",
      question: "Where the infusion begins",
      options: ["phase-1", "reorder"],
      recommended: "phase-1",
      because:
        "Phase 1 is the floor: it needs nothing from another board, it is already wearable from this board's Apply button, and its absence makes every later phase harder to judge.",
      evidence: "infusion",
    },
    {
      id: "aurora",
      question: "The aurora's placement",
      options: ["no", "seam", "both", "room"],
      recommended: "seam",
      because:
        "The footer seam is the lamp with a real place and the one already named as the model, so it is the cheapest honest first landing. Both boundaries and the room are the same grammar turned up.",
      overrule:
        "If a chapter-scale field reads as a screensaver at any clock, the answer is no rather than a slower one.",
      evidence: "composer",
    },
    {
      id: "register",
      question: "The aurora's register",
      options: ["accent", "identity"],
      recommended: "identity",
      because:
        "At the accent register the field is a glow on a section; at the identity register the page reads as a room with a temperature, which is the only version that is an identity claim.",
      evidence: "composer",
    },
    {
      id: "depth",
      question: "Depth in dark",
      options: ["family", "lift", "neither"],
      recommended: "family",
      because:
        "Lift separates objects of the same lightness that overlap; float detaches a layer from content still living behind it. On a light ground lift is today's shipped value to the byte, so paper does not move.",
      overrule:
        "The elevation contract still reads 'Dark: NO shadows anywhere'. Holding that line is a legitimate ruling; it costs the two overlapping photographs.",
      evidence: "separate",
    },
    {
      id: "lit-face",
      question: "The lit face",
      options: ["adopt", "adapt", "drop"],
      recommended: "adopt",
      because:
        "It is material rather than elevation, and it belongs to a face catching light: a media frame, a screen, a plate. It never lands on a card, a panel or a control, which is the line that stops it becoming a fifth technique.",
      evidence: "separate",
    },
    {
      id: "cadence",
      question: "The lamp's clock",
      options: ["8s", "11s"],
      recommended: "8s",
      because:
        "11 was the footer alone with nothing else moving. On a page with three lamps the slower clock reads as three things drifting rather than one room breathing.",
      evidence: "evidence",
    },
    {
      id: "paper",
      question: "The paper lamp set",
      options: ["hand-tuned", "flat", "dark"],
      recommended: "hand-tuned",
      because:
        "The failure is per hue: 85 and 155 go dirty against white long before 255 and 305 do, so one flat correction cannot fix five hues at once.",
      evidence: "evidence",
    },
    {
      id: "publish",
      question: "The publish beat",
      options: ["300", "house-five", "305"],
      recommended: "305",
      because:
        "It moves a ratified beat by five degrees to join the lamp set, and decays to a base instead of returning to nothing. Small, and it is a ratified value, so it is asked rather than taken.",
      evidence: "treatments",
    },
  ],

  candidates: [
    {
      id: "kit",
      name: "The kit",
      recommended: true,
      rationale:
        "One doctrine in three jobs with twelve named treatments under it, each carrying a place, a section list, a frequency and a mount. The elevation contract moves inside the light doctrine and stops being per mode; the aurora is named as the fill register at chapter scale and gets a component.",
    },
    {
      id: "tune",
      name: "Tune",
      rationale:
        "Keep SPILL and BEAM and their eight laws; amend law 1 so a boundary counts as a source, and let a shadow into dark for overlapping media. The smallest change that makes the footer legal. It leaves the ring undocumented, the five shapes unnamed, and nothing said about which section gets which.",
    },
    {
      id: "replace",
      name: "Replace (withdrawn in round three)",
      rationale:
        "The aurora becomes the primary layer and spill becomes an aurora anchored to an object. Two rounds of specimens took it apart: an anchored aurora is a spill with a different name. The half that survived is on the board as options rather than as a doctrine.",
    },
  ],

  departures: [
    {
      id: "dark-shadow",
      from: 10,
      text: "The kit proposes a shadow family in DARK. The elevation contract still reads 'Dark: NO shadows anywhere' and --shadow-float is zeroed in .dark. On a light ground lift is today's shipped value to the byte, so paper does not move.",
      evidence: "separate",
    },
    {
      id: "ring-lift",
      from: "precedent",
      text: "The ring lift has 77 uses across the app and appears in no document. Moving it into the contract makes a fourth technique official.",
      evidence: "separate",
    },
    {
      id: "per-section-temperature",
      from: 3,
      text: "The aurora lets a section retune --lamp-* for everything inside it. The engine documents the hook and bible 3 still holds (light, never UI), but a per-section temperature is a new licence and it is the aurora's whole identity claim.",
      evidence: "composer",
    },
    {
      id: "paper-lamps",
      from: "ruling",
      text: "A hand-tuned paper five declared on .surface-paper. design-system.md calls that an open design task; this is the first time --lamp-* would be re-declared per ground.",
      evidence: "evidence",
    },
    {
      id: "section-light",
      from: "precedent",
      text: "A new production component, SectionLight, beside screen-lamp.tsx: the first marketing-system component whose whole job is light. The composer exports its exact call for every configuration.",
      evidence: "composer",
    },
    {
      id: "engine-line",
      from: "precedent",
      text: "One line of the ENGINE, and it is a law 4 fix rather than a feature: glw-drift-x's from-keyframe must be declared outside the reduced-motion block, or a reduced-motion visitor gets the comet parked dead centre at full strength.",
      evidence: "evidence",
    },
    {
      id: "publish-violet",
      from: "ruling",
      text: "The publish flourish's oklch(0.62 0.2 300) becomes the lamp set's 305, and the beat decays to a base instead of returning to nothing. It is a ratified beat being moved.",
      evidence: "treatments",
    },
    {
      id: "qr-is-a-mark",
      from: 3,
      text: "The QR plate's shipped light is a MARK and not spill: a bloom centred at 50 by 50, with no vector at all. Under law 2 a vectorless field is the even rim the doctrine refuses; naming which job a light is doing is what makes it legal, and that naming is new.",
      evidence: "kit",
    },
  ],

  assets: [
    {
      what: "A grain tile, so the aurora stops banding",
      spec: "Seamless monochrome noise, 256x256 PNG-8, fine grain (one tile pixel), neutral, mean 50 percent grey, used at about 5 percent over the light AND laid out at 128 CSS px on a 2x screen (one tile pixel per device pixel; laid out at 256 it doubles and the band returns).",
      replaces: "the inline feTurbulence stand-in in board.css ([data-lgt-grain]).",
    },
    {
      what: "A worst-case pair of overlapping photographs for the separate job",
      spec: "Two images whose touching edges are both dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG, so the depth cue is judged against the case it exists for rather than a lucky one.",
      replaces: "the reception-hall and wedding-toast pair in depth.tsx.",
    },
  ],

  sections: [
    {
      id: "kit",
      title: "The kit",
      lede: "Twelve treatments across three jobs, each with its place, its sections, its frequency and its mount; the fences; and the seven things a wiring round types into files.",
      argument: [
        "The system today is organised around WHERE LIGHT COMES FROM. SPILL is light from a lit thing; BEAM is a lit thing; the elevation contract is a separate section about shadows and lives one mode at a time. Three consequences, all visible in the repo: the footer's seam, the lamp Will likes most, is illegal under the law that opens the doctrine; dark has no shadow even where two photographs plainly need one; and the ring lift, the fourth depth technique with 77 uses, is in no document at all.",
        "Organise it around what the light is DOING and the same parts fall into three jobs that do not overlap: SEPARATE (achromatic, static), FILL (chromatic, slow, behind everything) and MARK (chromatic, bounded, ends with its state). The rule that replaces 'name the lamp or there is no spill' falls out of the FILL job: a lamp needs a PLACE, not an object.",
      ],
    },
    {
      id: "treatments",
      title: "The treatments",
      lede: "Six of them on the real production sections that wear them, at 1:1, with the lamp card that admits each and the mount beside it. Three already ship.",
      wiring: [
        "Each treatment's mount is beside it as a paste. The publish beat is the only one that changes a shipped value, and it is asked rather than taken.",
      ],
    },
    {
      id: "composer",
      title: "The composer",
      lede: "Light for any section: nine real sections, four treatments, five placements, the register, the temperature and the clock, with the paste and the mount exported for every configuration.",
      argument: [
        "The aurora needs a COMPONENT, not a recipe. Two bands, a flipped axis, four custom properties and a grain layer is too much for a chapter to assemble correctly twice, and the placement grammar is exactly the kind of rule that survives in a component and dies in a comment.",
      ],
      wiring: [
        "SectionLight, beside screen-lamp.tsx, which already proves the shape: a wrapper that owns one light, takes children, and keeps the engine's invariants where a call site cannot break them.",
      ],
    },
    {
      id: "separate",
      title: "Separate",
      lede: "The depth cues: the achromatic half of the kit and the first phase of the plan, on a real pair of overlapping photographs rather than two grey rectangles.",
      argument: [
        "One shadow family, two sizes, one alpha ramp per ground. Lift separates objects of the same lightness that overlap; float detaches a layer from content that keeps living behind it; a flat surface takes neither, in either mode. The finding was only ever that DARK has no ramp, because 6 percent of black over a near black room is arithmetically invisible.",
      ],
    },
    {
      id: "evidence",
      title: "The evidence",
      lede: "The instruments that decided the numbers, each ending in the line it produced. Anything that decided nothing was cut.",
      argument: [
        "One register for a lamp, and it should be the engine's own 8 seconds: 11 was the footer alone with nothing else moving. The aurora is not a lamp and takes a multiple, so --spill-cadence stays one token and gains a sibling rather than a second opinion.",
      ],
    },
    {
      id: "infusion",
      title: "The infusion",
      lede: "The order the identity enters the site, and why that order and not another.",
      argument: [
        "Begin with the floor. Phase 1 is the only phase that needs nothing from any other board, it is already wearable on the real site from this board's Apply button, and it is the one phase whose absence makes every other phase harder to judge. Phase 2 is two call sites on one page, a deliberately small second step: the closer above the footer is the hardest test the scarcity distance has anywhere on the site, and it should be taken while the cost of being wrong is two lines.",
      ],
    },
    {
      id: "paste",
      title: "The ruling",
      lede: "The doctrine in design-system.md's own shape, so the ruling is a paste rather than a translation.",
    },
  ],

  controls: [
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    {
      id: "ground",
      label: "Ground",
      options: [
        { id: "cinema", label: "Cinema" },
        { id: "paper", label: "Paper" },
        { id: "app-dark", label: "App dark" },
      ],
      default: "cinema",
    },
    {
      id: "register",
      label: "Register",
      options: [
        { id: "accent", label: "Accent" },
        { id: "identity", label: "Identity" },
      ],
      default: "accent",
    },
    {
      id: "motion",
      label: "Motion",
      options: [
        { id: "live", label: "Live" },
        { id: "rest", label: "Rest" },
      ],
      default: "live",
    },
  ],

  lookFirst: [
    {
      section: "kit",
      note: "Three jobs and twelve treatments. If the shape is wrong, the rest of the walk is the wrong argument.",
    },
    {
      section: "composer",
      state: { register: "identity" },
      note: "The centrepiece, at the identity register. This is the aurora's actual claim; at accent it is only a glow.",
    },
    {
      section: "composer",
      state: { register: "accent" },
      note: "The same field one register down, for the comparison the ruling turns on.",
    },
    {
      section: "separate",
      state: { ground: "app-dark" },
      note: "The two photographs on the app's own dark, which is where a missing ramp shows first.",
    },
    {
      section: "evidence",
      state: { ground: "paper" },
      note: "The paper five against the house set. Judge the hues, not the brightness.",
    },
    {
      section: "infusion",
      note: "The order it lands in. Phase 1 is the only ask under this one.",
    },
  ],

  notes: [
    {
      section: "composer",
      state: { register: "identity", ground: "cinema" },
      text: "At identity on cinema the band is at the edge of perception on a bright screen and obvious on a dim one. That spread is the honest reason the register is an ask rather than a recommendation with a number.",
    },
    {
      section: "separate",
      state: { ground: "paper" },
      text: "Nothing moves on paper under any option here: lift on a light ground is the shipped value to the byte. If paper looks different, something else is applied.",
    },
  ],

  links: {
    bible: [3, 10, 11],
    spec: "docs/specs/light.md",
    pages: [
      { label: "The dashboard", path: "/dashboard", note: "the lift, on real event cards" },
      { label: "Pricing", path: "/pricing", note: "the float, on the plan band" },
      { label: "Home", path: "/", note: "the footer seam and the film strip" },
    ],
  },
});
