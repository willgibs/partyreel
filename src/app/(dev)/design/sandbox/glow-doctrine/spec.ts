import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE SPILL DOCTRINE, AS DATA (the migration wave, 2026-09-15).
 *
 * Nothing here is new argument. The doctrine, its laws, its five shapes and the
 * corner A/B are the round's, read out of `touchpoints.ts`, out of
 * `docs/decisions/design-record.md#glow-doctrine` and out of the board's own
 * sections; what changed is where a reviewer meets them. The board was a
 * fourteen-section wall that opened with "if you have ten minutes" and left the
 * one unruled item at section 05, halfway down; the template puts the answer and
 * the single open call on the first screen and keeps the wall as the evidence
 * under it.
 *
 * ★ THE BOARD'S EVIDENCE IS DELIBERATELY ONE SECTION. Everything on it but one
 * line is ruled, promoted and shipped, so re-cutting fourteen sections into the
 * kit's parts would be re-arguing a settled round at the price of the record
 * that makes the ruling readable later. The migration moves the argument; it
 * does not move the furniture inside it.
 *
 * ★ AND THE ONE OPEN ITEM IS NOT THIS BOARD'S TO CLOSE ANY MORE. The lit
 * surface carve-out amends the elevation contract, and that contract is the
 * light board's round-four synthesis: it holds the same two inset shadows as
 * `lit-face` and `depth`, under bible 10, on a worse pair of photographs than
 * this board ever put them on. So the single ask here is WHERE it closes, and
 * the answer block says the board is otherwise waiting on nothing.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the boards' sheet would drag a client tree into a server render.
 */
export const GLOW_DOCTRINE = defineBoard({
  id: "glow-doctrine",
  title: "The spill doctrine",
  question:
    "How light becomes core to the identity without turning up everywhere: what SPILL is, what BEAM is, what admits each, and whether a lit surface may carry a shadow in dark.",

  round: {
    n: 4,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. The verdict and the one open call are the first screen, the fourteen sections are the evidence under them, and the review panel composes the ledger line. No law, shape, number or verdict changed.",
  },
  history: [
    {
      n: 3,
      date: "2026-09-01",
      changed:
        "The promotion. The engine went to globals.css, the primitive to components/shared/glow.tsx, the rules to design-system.md, and the turbulence field to the root layout, since two #glw-warp filters on one page is the duplicate-id failure the primitive exists to prevent.",
    },
    {
      n: 2,
      date: "2026-08-31",
      changed:
        "The corner ruled the rounder one, and across the system rather than on these cards, which became the rounding round. The lit surface trimmed to hairline and lip with the air blur gone. The placements board falsified law 1's count, so scarcity became a distance.",
    },
    {
      n: 1,
      date: "2026-08-28",
      changed:
        "The doctrine proposed and first reviewed: the four laws, the NEVER list, the five shapes, the register and the legibility ceiling. Law 3 ruled (sampled where there is media, the fixed five where there is none), the palette ruled ours, the engine cleared.",
    },
  ],
  context:
    "The round asked for the footer's shimmer to become core to the identity without turning up everywhere. Everything it produced is now elsewhere: the laws and the lamp set in design-system.md, the engine in globals.css, the primitive in components/shared/glow.tsx. The doctrine's FUTURE is elsewhere too. The light board's round-four synthesis reorganises the same parts around what the light is DOING, and bible 11 already says the source-and-direction law retires when that lands. What is left here is the record, and one carve-out the round wrote down as closed when it was not.",

  verdict: {
    recommendation:
      "Keep the board standing as the record of how the shipped light was reached, and close its one open item, the lit surface carve-out, on the light board rather than here.",
    because:
      "The cue set was ruled in the second review (the hairline and the lip at 9 percent, the air blur gone) but the contract it amends was not, and that contract is now the light board's: its kit holds the same two inset shadows as the lit face and the depth family, under bible 10, on a worst-case pair of overlapping photographs. Ruling them twice writes two contracts for one shadow.",
    overrule:
      "If the carve-out belongs to the four dressed cards that argued it, say here and this board reopens with the elevation contract's line as its ask.",
  },

  asks: [
    {
      id: "lit-surface",
      question: "The lit surface carve-out",
      options: ["light", "here"],
      recommended: "light",
      because:
        "The light board asks the same two inset shadows as lit-face (adopt, adapt, drop) and depth (family, lift, neither), and it asks them beside the depth ramp they would share. One ruling, on the better evidence, in the doc that will carry it.",
      overrule:
        "If section 05's dressed card beside today's is the surface the carve-out is actually for, it is cheaper to rule it there.",
      evidence: "record",
    },
  ],

  candidates: [
    {
      id: "seam",
      name: "Seam",
      rationale:
        "Spill across a boundary: the shipped footer, generalised. The lamp Will named as the model, and the calibration every other shape is judged against (section 09 puts the engine at the footer's own values beside no light at all).",
    },
    {
      id: "throw",
      name: "Throw",
      rationale:
        "An origin-anchored cast from --glw-from-x and -y. It replaces a rim, because a rim has no vector and law 2 refuses one.",
    },
    {
      id: "sweep",
      name: "Sweep",
      rationale:
        "The comet plus the phase-locked edge beam: the half of the recipe we never adopted, driven across the surface once. Its frame cost is the one number the round could not take, since a background tab throttles the counter to nothing.",
    },
    {
      id: "bloom",
      name: "Bloom",
      rationale:
        "A one-shot that decays to the base and never to zero, so the lamp stays lit after the beat. Law 4's whole claim, built rather than asserted.",
    },
    {
      id: "halo",
      name: "Halo",
      rationale:
        "An object lit from behind: the mask clears its own centre so colour creeps in from the rim and the object itself stays clean. The Get Pro mechanic, ported.",
    },
    {
      id: "corner",
      name: "Corner A/B",
      rationale:
        "The same beamed card at our rounding and at the library's 16px, in phase, so the only difference is colour. Ruled 2026-08-31: the rounder one, and across the system rather than on these cards, which became the rounding round.",
    },
  ],

  departures: [
    {
      id: "lit-surface-shadows",
      from: 10,
      text: "[data-lit] adds two inset box-shadows in dark, against the elevation contract's 'Dark: NO shadows anywhere'. It is already applied to three of four specimens in section 05 including the Get Pro card, while the board and the boards' sheet both still say lab-local until you rule.",
      evidence: "record",
    },
    {
      id: "source-and-direction",
      from: 11,
      text: "Laws 1 and 2 ARE the source-and-direction law bible 11 is retiring. Stated as written they forbid the footer seam, the one lamp named as the model, because it emits from nothing. The board keeps them as the round recorded them; the light board writes what replaces them.",
      evidence: "record",
    },
    {
      id: "vendored-beam",
      from: "precedent",
      text: "BEAM is not ours. border-beam is vendored exactly, after three hand-ports missed it in the same direction, and it keeps its own driver: eighteen oscillators plus the hue revolution on one loop keyed to absolute page time. A vendored visual primitive is a first for this system.",
      evidence: "record",
    },
    {
      id: "beam-at-rest",
      from: "precedent",
      text: "Beam law 3 says a beam ends when its state ends, and beam law 4 is one standing exception to it: a premium object at rest, named so it stays an exception rather than a precedent. The reference is Get Pro on the pricing page, whose card already carries stacked photographs.",
      evidence: "record",
    },
  ],

  assets: [],

  sections: [
    {
      id: "record",
      title: "The doctrine, as the round argued it",
      lede: "The board unchanged: the thesis, the four laws and the NEVER list, the sampled-against-fixed experiment, the five shapes, spill beside beam, the lit surface, the register, the states, the legibility ceiling and the calibration.",
      argument: [
        "Nine numbered sections in the order the round argued them, kept as they were built. The numbering inside is the board's own: 01 the four laws, 02 the experiment that could have falsified law 3, 03 the five shapes on production's real grounds, 04 spill beside beam with the corner A/B, 05 the lit surface, 06 the register, 07 the states the engine has to survive, 08 what a wash costs in legibility, 09 the calibration against the one glow already ruled beautiful.",
        "The RULES left in the promotion round and are not here to be read as law. The four SPILL laws, the four BEAM laws, the NEVER list, the LampCard's four questions and the lamp set's three registers live in design-system.md, which is the thing to cite. The constants on the board are its own copy, kept in sync by hand; where they disagree with the doc, the doc wins.",
        "One number on the board is a ceiling and not a measurement. Section 08 stacks peak-stop times layer-opacity times mask-coverage and still ignores each blob's radial falloff and the 16px blur, both of which only ever reduce what a text run meets. Read it as a budget: a lamp may sit near a heading and not near a caption, and the ink slab has roughly a tenth of full strength to spend before muted text is at risk.",
      ],
      wiring: [
        "Nothing on this board is left to wire. The engine is in globals.css, the primitive in components/shared/glow.tsx, the filter host in the root layout, the placements shipped off the moments board. The one open item is a single line in the elevation contract, and it closes with the light board's kit.",
      ],
    },
  ],

  lookFirst: [
    {
      section: "record",
      note: "Section 05 inside, the lit surface: the dressed card beside today's. It is the only thing on this board still open, and the ask above is only about where it gets ruled.",
    },
  ],

  notes: [
    {
      section: "record",
      text: "Do not un-apply data-lit from the section 05 specimens to re-judge them. They are bare divs with no ring, so removing the 9 percent hairline puts them further from the shipped Card, not closer.",
    },
  ],

  links: {
    bible: [1, 3, 8, 9, 10, 11],
    track: "docs/tracks/glow-specs.md",
    pages: [
      {
        label: "Home",
        path: "/",
        note: "the footer seam, the shipped lamp this board is calibrated against",
      },
      {
        label: "Pricing",
        path: "/pricing",
        note: "Get Pro at rest, the one standing beam exception",
      },
    ],
  },
});
