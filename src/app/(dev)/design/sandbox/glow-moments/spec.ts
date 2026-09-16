import { defineBoard } from "@/components/lab/board-spec";

/**
 * SPILL PLACEMENTS, AS DATA (the migration wave, 2026-09-15).
 *
 * The placement half of the glow round: the doctrine board proposed the rule,
 * this one argued the cases, and thirteen of them carry a verdict. Nothing here
 * is new argument. Every candidate, ruling and correction is read out of
 * `touchpoints.ts`, out of `docs/design/rulings.md` and
 * out of the board's own moments; what changed is that the one unruled item,
 * the publish beat's violet, is now the FIRST thing a reviewer meets instead of
 * moment 07 of fourteen.
 *
 * ★ THE REJECTS STAY BUILT, WHICH IS WHY THE EVIDENCE IS ONE SECTION. The
 * board's whole method is that a placement you have SEEN and turned down stays
 * turned down, where one you only read about comes back next quarter. Cutting
 * the killed moments into a tidier shape would spend the thing the round paid
 * for. The migration moves the argument; it does not move the furniture.
 *
 * ★ AND THE OPEN ITEM IS THE LIGHT BOARD'S NOW. Violet is a ratified STATE
 * colour for reel curation, so law 3 forbids it as light, and this board's
 * answer was a split rather than a ruling: violet on the controls, the sampled
 * spill outside the frame. The light board asks the same beat with an option
 * this board never had, so the single ask here is WHERE it closes.
 *
 * ★ THE ASK IS WRITTEN FOR A STRANGER (the clarity round, 2026-09-15). Will
 * answered three asks on the light board and stopped at two that were labels
 * with token options, so the one ask here says what the publish flourish IS,
 * where to look at it, and what each of the two answers would do; the exemplar
 * is `sandbox/light/spec.ts`. The ids never changed (`light`, `here`): the
 * review ledger joins on them and a reworded label must not orphan an answer.
 * The board's question, verdict and section lede were rewritten the same way.
 * No placement, verdict, correction or recommendation moved.
 *
 * ★ THE EVIDENCE CARRIES NO OPTION LABELS, AND THAT IS NOT AN OMISSION. The
 * clarity rule that a specimen wears its option's words applies to an ask
 * judged BY a specimen; this ask is procedural (which board rules it), so
 * there is nothing to relabel. `look` points at the specimens the item is
 * about, which are named Sampled spill and Today and stay that way.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the boards' sheet would drag a client tree into a server render.
 */
export const GLOW_MOMENTS = defineBoard({
  id: "glow-moments",
  title: "Spill placements",
  question:
    "Where on the site is a glow earned: thirteen places argued against the rules for light, which ship, which are killed, and may the flourish when a host publishes keep the reel's violet?",

  round: {
    n: 4,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template, then its one open call was rewritten in plain words: a real question, what the publish flourish is, where to look, and each answer labelled in words rather than as a token. No placement or verdict changed.",
  },
  history: [
    {
      n: 3,
      date: "2026-09-01",
      changed:
        "The promotion. The shipped light went into design-system.md and the turbulence field moved to the root layout, so the board stopped hosting one: two #glw-warp filters on a page is the duplicate-id failure the primitive exists to prevent.",
    },
    {
      n: 2,
      date: "2026-08-31",
      changed:
        "Reviewed and merged, with two items the record wrongly listed as closed: the publish beat's violet, still open, and the help-palette beam, which came off the shipping list and took the reel-render beam with it.",
    },
    {
      n: 1,
      date: "2026-08-28",
      changed:
        "Thirteen moments built against the doctrine, each naming its lamp, its direction, its colour source and the law that admits it, with the rejects built rather than described. Moment 13 put three recommended lamps on one scroll and counted.",
    },
  ],
  context:
    "One round, two boards: the doctrine proposed the rule and this one argued the cases. The ruling merged on 2026-08-31 and the shipped light is written into design-system.md, so ten placements, three kills and two ruled-to-something-else are settled facts rather than proposals. The doctrine's future is the light board's: its round-four synthesis reorganises the same parts around what the light is DOING, and it carries the publish beat as an ask of its own, which is the only thing this board still has outstanding.",

  verdict: {
    recommendation:
      "Keep this board as the record of the thirteen places a glow was argued for, and rule its one open item, the colour of the flourish when a host publishes, on the light board rather than here.",
    because:
      "Ten places ship, three are killed and two were ruled to something else, and all of it is written into the design system doc. The colour of the publish flourish is what is left, and the light board asks the same beat with an answer this board never had: move the violet five degrees onto the lamp set's own colours, and let it fade to a soft glow instead of to nothing.",
    overrule:
      "If the beat belongs to the reel canvas that argued it rather than to a sheet of light treatments, say here and this board reopens with item 07 as its ask.",
  },

  asks: [
    {
      id: "publish-violet",
      question:
        "Where should the colour of the flourish that fires when a host publishes be ruled?",
      context:
        "When a host publishes an event, the reel's frame flashes a violet glow and fades out. Violet is a ratified colour for reel curation, and a colour that means something may not be used as light, so this board could only split it: violet on the controls, sampled light outside the frame. The light board asks about the same flourish in its own ask, What colour should the publish flourish be?",
      look: "This board's one evidence section, the item numbered 07 inside it, The publish beat: press Publish under the pair and compare the specimen labelled Sampled spill with the one labelled Today, which is what ships now. Both replay together.",
      options: [
        {
          id: "light",
          label: "On the light board",
          means:
            "The light board's publish ask decides it, and it offers an answer this board never had: move the violet five degrees onto the lamp set.",
        },
        {
          id: "here",
          label: "Here, on this board",
          means:
            "This board reopens with item 07 as its ask, judged on the sampled light beside today's flat violet.",
        },
      ],
      recommended: "light",
      because:
        "A colour that means something is not allowed to be used as light, so all this board could do was split it. The light board frames the same flourish as a move onto the lamp set's own colours, which is the version with somewhere to go.",
      overrule:
        "If the sampled light beside today's flat violet at item 07 already answers it, that specimen is the cheaper place to rule it.",
      evidence: "record",
    },
  ],

  candidates: [
    {
      id: "hero-underlight",
      name: "The hero underlight",
      rationale:
        "The whole wall of photographs as the lamp, lighting the page under it, sampled from all of them rather than from one tile. Ships first.",
    },
    {
      id: "locked-door",
      name: "The locked door",
      rationale: "The password gate lit by the event behind it. Ships.",
    },
    {
      id: "doorbell-arrival",
      name: "The doorbell arrival",
      rationale:
        "A guest's upload announcing itself at the gallery's edge. Ships, with its lap softened to light: a 1px rounded stroke read as chrome on a gallery that has no border.",
    },
    {
      id: "awaiting-media",
      name: "Awaiting media",
      rationale:
        "The empty gallery lit by what is about to fill it, and what it fills into. Ships.",
    },
    {
      id: "album-straddle",
      name: "The album straddle",
      rationale:
        "One lamp across the seam between two album sections, so the boundary reads as a room rather than a rule. Ships.",
    },
    {
      id: "qr-plate",
      name: "The QR plate switching on",
      rationale:
        "Ruled to something else: the plate takes OUR own light rather than the beam, which reads too faintly on a white plate. The first sighting of the rule the merge later stated outright.",
    },
    {
      id: "publish-beat",
      name: "The publish beat, rebuilt",
      rationale:
        "The best lamp in the product: a real canvas playing real frames, once per event, at the host's biggest moment. The sampled spill ships; the violet on the controls is the one thing still open.",
    },
    {
      id: "cta-rim",
      name: "The CTA rim",
      rationale:
        "Killed 2026-08-31, and not because it was wrong: border-beam arrived and does this job better on the object that actually wanted it, a premium button.",
    },
    {
      id: "paper-probe",
      name: "The paper probe",
      rationale:
        "Ships, and it corrected the sampler: a single-quadrant photograph composites to mud, so hues are forced at least a fifth of the wheel apart and paper takes a lighter register than a dark ground does.",
    },
    {
      id: "upload-as-light",
      name: "The upload, as light",
      rationale:
        "Ruled to NO light at all: the opacity climb and the bar already say it, and the sweep read as forced. It leaves the engine's scalar drive exercised but unplaced.",
    },
    {
      id: "scan-through",
      name: "The scan-through",
      rationale:
        "Killed, with its own ground-up round to come. The POUR it was built on is kept and parked as a working technique with no placement.",
    },
    {
      id: "beam-surfaces",
      name: "Where a beam is allowed",
      rationale:
        "Get Pro at rest ships. The merge took the help palette off the list (production forces surface-paper on it, the near-white ground that got the QR plate's beam rejected) and moved the reel-render beam onto the reel surface's own round.",
    },
    {
      id: "whole-page",
      name: "The whole page",
      rationale:
        "Ships, and it is the only specimen that tests scarcity: three recommended lamps on one scroll with a lights switch. It caught two of them sharing a view at 40 and 62 percent.",
    },
  ],

  departures: [
    {
      id: "state-colour",
      from: 3,
      text: "Moment 07 keeps a ratified STATE colour, reel violet, breathing on the frame, while bible 3 and law 3 both forbid a state colour as light. The round's answer was a split rather than a ruling: violet stays on the controls, the sampled spill stays outside the frame.",
      evidence: "record",
    },
    {
      id: "scarcity-is-a-distance",
      from: "ruling",
      text: "Moment 13 falsified the doctrine's own one-lamp-per-view count: two recommended lamps shared a view at 40 and 62 percent. Scarcity became a distance instead, roughly a viewport of unlit page between lamps, with a tail under a quarter visible reading as a doorway rather than a second room.",
      evidence: "record",
    },
    {
      id: "ground-picks-the-sibling",
      from: "ruling",
      text: "The merge's correction is worth more than the placement it removed: the GROUND picks the sibling. Ink takes the beam, paper takes spill in the paper register. It retired the help-palette beam and moved the reel-render beam onto the reel surface's own round.",
      evidence: "record",
    },
    {
      id: "built-rejects",
      from: "precedent",
      text: "The killed placements are BUILT rather than described, which costs the round the build time and the page its length. It buys what a description never does: a placement you have seen and turned down stays turned down.",
      evidence: "record",
    },
  ],

  assets: [],

  sections: [
    {
      id: "record",
      title: "The thirteen places, as the round argued them",
      lede: "The board as the round built it, in fourteen numbered items: ten places that ship, three killed, two ruled to something else, where a lit rim is allowed, the whole-page test of how far apart two glows must sit, and the rest listed.",
      argument: [
        "Fourteen numbered moments in the order the round argued them. Every one names its lamp, its direction, its colour source and the law that admits it, and carries a verdict pill, so a specimen can be judged without scrolling back to the doctrine. The fourteenth is not a placement: it is the catalogue of what was earned but not built and what was turned down with reasons, so the ruling had the whole field without the round spending itself on it.",
        "Two moments are instruments rather than proposals. Moment 09, the paper probe, is why the sampler forces a fifth of the wheel between hues and gives paper a lighter register. Moment 13, the whole page, is the only specimen that tests scarcity, and it is the one that falsified the doctrine's own count and turned it into a distance.",
        "The rejects are the point, not the residue. The pointer lamp, the CTA rim and the scan-through are all built and all dead; the first two because the beam arrived and did their job better on the object that wanted it, the third because it earned a ground-up round of its own. The POUR it was built on survives as a technique with no placement.",
      ],
      wiring: [
        "Nothing on this board is left to wire: the shipped placements are in design-system.md#the-shipped-light and live on the real surfaces. Two things are carried rather than open. Moment 04's frame counter needs a foreground window, and the upload's ruling leaves the engine's scalar drive exercised but unplaced.",
      ],
    },
  ],

  lookFirst: [
    {
      section: "record",
      note: "Item 13 inside, The whole page, with a lights switch. It is the only specimen that tests how far apart two glows must sit, the one that falsified the round's own count, and the closest thing on either board to the would-this-hold-up bar.",
    },
  ],

  notes: [
    {
      section: "record",
      text: "Item 04's frame counter needs a FOREGROUND window. A background tab throttles it to nothing, so the cost of the three sweep drives is the one number neither glow board could ever take.",
    },
  ],

  links: {
    bible: [1, 3, 4, 10, 11, 12],
    track: "docs/tracks/glow-specs.md",
    pages: [
      {
        label: "Home",
        path: "/",
        note: "the hero underlight and the footer seam, on the real page",
      },
      {
        label: "Pricing",
        path: "/pricing",
        note: "Get Pro at rest, the one beam surface that survived the merge",
      },
    ],
  },
});
