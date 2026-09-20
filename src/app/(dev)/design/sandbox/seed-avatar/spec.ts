import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE SEEDED DEFAULT AVATAR, ROUND TWO: IS THE DIAGONAL THE RICHEST LOOK
 * HASHVATAR HAD TO OFFER? (2026-09-20)
 *
 * Round one answered whole (docs/reviews/seed-avatar.json; verbatim in
 * docs/design/rulings.md, the sixth batch): the bug fixed (the disc now clips
 * with no seam), `look=diagonal` (overrules the recommended `orb`), full
 * colour on every guest, the whole wheel, the initial always, the account id
 * as seed, the colour waiting under a photograph, no motion. `avatar-wiring`
 * landed six of the seven on the real `Avatar`; this round drops all seven
 * and asks the one he left open, on his own words: "This is my favorite of
 * these options, but is this the best that hashvatar had to offer? The
 * preview ones on https://www.hashvatar.com/ and
 * https://github.com/medhychabour/hashvatar felt much more alive and rich."
 *
 * ★ WHAT HASHVATAR'S GRADIENT MODE ACTUALLY DRAWS (read from its source this
 * round: `gradient.ts`, `color.ts`, `index.ts`, `demo/index.html`, GitHub via
 * `gh api` and WebFetch). The brief guessed "several hue stops, not two"; the
 * source says otherwise, worth correcting rather than building on. Its
 * `hashToColors(hash, tones, 4)` draws four colours, and with no `tones`
 * supplied — the demo's own default state, and what all four of its gallery
 * samples render — every one of the four shares ONE hue: a bright primary
 * (L 0.55-0.77) and three darker, desaturated secondaries (L 0.18-0.38) at
 * that identical hue, never rotated. `renderGradient` fills a canvas with the
 * primary, then draws six blurred, irregular polygons in the secondaries,
 * composited back with `source-over`, `overlay` and `soft-light` at varying
 * alpha. So the richness he saw is one hue read at several DEPTHS, diffused
 * and layered, not several hues in one avatar. `mesh` (`looks.ts`) reproduces
 * exactly that register in pure CSS: layered `radial-gradient`s and
 * `background-blend-mode`, no canvas, still server-renderable. `throw` and
 * `lit-seam` are two further readings the brief asked for that do not come
 * from hashvatar at all.
 *
 * ★ EVERY OPTION IS MEASURED, NOT ASSERTED, across a thousand deterministic
 * UUID-shaped seeds, against the SAME three floors the production generator
 * holds (`FLOOR.letter` 4.5:1, `FLOOR.ground` 3:1 on both grounds,
 * `FLOOR.ring` 3:1) — the numbers are on every frame (`looks.ts`,
 * `captionFor`). The measurement itself found a real, previously untested gap
 * shared by ALL FOUR options, including the wired control: `orb.lit` (and by
 * construction `mesh`'s `primary`, `throw`'s glows) is a highlight bright
 * enough that it cannot clear 3:1 against the near-white paper ground while
 * still reading as lit — gradient.test.ts already knew this and holds `lit`
 * to a much looser `> 1.3` there on purpose, never the 3:1 `FLOOR.ground`
 * every other colour clears. The disc's own ring (`after:border-border`)
 * keeps it a findable circle regardless; this is named on the board rather
 * than hidden, and it is not a reason to prefer one option over another,
 * since none of the four differ on it.
 */

/**
 * THE SCREEN, the knob the one decision here still shares with round one's
 * shape (unchanged: a spec is what a SERVER page reads, so this stays pure
 * data rather than imported from the board's own client stage).
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

const DRAFT = defineExploration({
  id: "seed-avatar",
  title: "The colour a new account is",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round one's seven decisions are ruled and avatar-wiring landed six on the real Avatar; this round drops all seven and asks the one he left open: is the wired diagonal the richest look hashvatar has to offer, three readings measured against the generator's own floors, the numbers on every frame.",
  },
  context:
    "His question on the wired diagonal: is it the best hashvatar had to offer, its own preview felt more alive and rich. Read from hashvatar's source this round: its default register is one identity hue at four tonal depths, diffused and layered, never several hues at once; mesh reproduces exactly that in pure CSS. throw and lit-seam are two further readings. Every option is the real Avatar, sized 24 to 80 with the initial, on the guest list, the user menu and a profile, at 375 with 1440 on the knob.",
  bible: [1, 4, 19, 22],
  asks: [
    {
      id: "look",
      label: "The look",
      question:
        "Is the diagonal the richest look hashvatar had to offer, or does one of these three read as more alive?",
      context:
        "look=diagonal is wired. mesh is hashvatar's own register: one hue at four depths, read from its source. throw is a two-pool wash; lit-seam adds a bright crease at the seam. Measured against the generator's floors, on every frame.",
      options: [
        {
          id: "diagonal",
          label: "The diagonal, as wired",
          means:
            "Today's two-hue ramp, corner to corner: the control the other three are measured against.",
        },
        {
          id: "mesh",
          label: "hashvatar's own register",
          means:
            "One identity hue at four tonal depths, diffused and blended with overlay and soft-light: what hashvatar's own default view actually draws.",
        },
        {
          id: "throw",
          label: "Two pools of light",
          means:
            "Two brighter throws over a dark radial base, held clear of the initial: a moodier reading than round one's aurora.",
        },
        {
          id: "lit-seam",
          label: "A lit seam on the ramp",
          means:
            "The same diagonal with a bright crease where its two hues already meet.",
        },
      ],
      recommended: "mesh",
      because:
        "It is the literal answer to his question: read from hashvatar's own source this round, it is what the site's default view actually draws, and it measures better than the wired control under the initial across a thousand seeds (100% clearing 4.5:1 against the control's 76%).",
      overrule:
        "If the blurred layering reads as noise at 24px, throw clears the same floor almost as cleanly with two plain pools instead of hashvatar's texture.",
      lands:
        "The background every seeded avatar in the product paints, until a photograph replaces it.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

export const SEED_AVATAR: typeof DRAFT = DRAFT;
