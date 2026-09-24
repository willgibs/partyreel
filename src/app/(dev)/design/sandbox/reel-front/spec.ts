import { defineExploration } from "@/components/lab/exploration";

/**
 * THE ALBUM'S LIVING TILE, ROUND TWO: HOW IT READS AS THE REEL (2026-09-24).
 *
 * Round one answered whole (docs/reviews/reel-front.json, verbatim): the tile
 * is a slow crossfade, no engine (`tile=crossfade`); it carries a corner
 * control for "Make your own" (`verbs=watch-make`); its empty slot before the
 * reel exists says nothing (`states=nothing`, and his own note dropped the
 * minimum to two); a moderated guest's first approval gets a toast
 * (`yours=toast`); a fully-unlocked door's backdrop stays the album's stills
 * (`door=stills`); the tile keeps playing once uploads close (`closed=plays`);
 * the hub's own Reel card stays text only (`hub=labelled`). `reel-front-wiring`
 * lands all seven on the real album and hub at this same cut; none of it is
 * reopened here.
 *
 * His own note on `tile` and `verbs` (the fourth batch, verbatim) left two
 * threads this round is: "The different images differentiate the reel vs
 * album media stills. However, I'd love to see other design ideas for this
 * differentiation. This could be very polished/refined or taken in a better
 * direction." → `signature`. "'The Reel' badge in top left could be replaced
 * with something better." → `badge`. And his heading and description
 * (`verbs`'s own note) retired the old meta line for good: the tile reads
 * "Highlight reel" over "Make your own clip to share", no style name, no
 * moment count, a fact both asks below draw as ground rather than ask again.
 *
 * ★ ROUND ONE'S SEVEN ASKS ARE GONE FROM `asks` ON PURPOSE (the `profile-page`
 * precedent: a round replaces its questions rather than accreting them). The
 * ledger keeps their answers for ever; the board only ever carries what is
 * still open. `parts.tsx`'s `TileCard` now wears every one of the seven as
 * its own ground (the heading, the description, the corner control, the
 * album-context beneath it) and exposes only the two slots still asked:
 * `media` (`signature`) and `badge` (`badge`).
 *
 * ★ THE ENGINE IS GONE WITH `tile`'s OWN VERDICT. Round one drew a `live`
 * option through the real canvas engine to let a true comparison happen;
 * crossfade won, so `engine.ts` and every fixture that fed it left with it
 * (git holds them). Every option below is a variation ON the crossfade,
 * never a re-litigation of it: `signature` plays the reel's own curated take
 * (never the album's newest, which is what made round one's crossfade read
 * identical to the grid beneath it) through plain `<img>` tags and CSS, the
 * only motion this board needs.
 */

const DRAFT = defineExploration({
  id: "reel-front",
  title: "The album's living tile",
  round: {
    n: 2,
    date: "2026-09-24",
    changed:
      "Round one's seven asks retired to the ledger, carried here as ground (the heading, description, corner control, two-item minimum). Two new asks: signature (how the tile reads as the reel over its own take, not the album's newest) and badge (what replaces \"The reel\" chip, if anything).",
  },
  context:
    "Round one settled what the tile IS; this round asks how it reads as the reel rather than the album, and what its other corner says. Every option plays the reel's own eight-moment take, at 375 and 1440, over the same album (twelve items, newest first) round one used.",
  asks: [
    {
      id: "signature",
      label: "The tile's signature",
      question:
        "How should the tile read as the reel rather than the album, over its own take?",
      context:
        "The crossfade won round one, but its six stills came from the album's newest, indistinguishable from the grid beneath it. Every option here plays the reel's own curated take instead, never a photo the album happens to have just gained.",
      options: [
        {
          id: "plain",
          label: "The same crossfade, on its own take",
          means:
            "Round one's winner, corrected: the same slow crossfade, now drawing the reel's eight curated moments instead of the album's newest six.",
        },
        {
          id: "graded",
          label: "A graded, letterboxed frame",
          means:
            "The same crossfade through a held-back wash and two thin black bars, so it reads as footage cut from the reel, not a photo the album already has.",
        },
        {
          id: "stacked",
          label: "A small stack of moments",
          means:
            "Two held-back edges sit behind the crossfade, so the tile reads as a handful of moments rather than one flat photograph.",
        },
        {
          id: "frame",
          label: "A quiet recording mark",
          means:
            "The same crossfade wears one small pulsing mark, the universal cue for footage rather than a photograph.",
        },
      ],
      recommended: "graded",
      because:
        "Every still already comes from the reel's own take, not the album's newest, which was the real gap round one's crossfade left; the grade and the letterbox cost one CSS filter and two bars, the cheapest way to say this is footage rather than another photo.",
      overrule:
        "If the album's material alone should carry the difference, the plain crossfade wins as long as it draws only the take, not the newest upload.",
      lands:
        "Whether the tile ever wears a grade or a frame of its own, and whether its stills may ever be the album's newest again.",
      tile: "phone",
    },
    {
      id: "badge",
      label: "The corner mark",
      question:
        'What, if anything, should replace "The reel" chip in the tile\'s corner?',
      context:
        '"The reel" chip could be replaced with something better (his words). The tile keeps its OTHER corner for "Make your own" (ruled); this asks only the identity mark, drawn over the take\'s own plain crossfade.',
      options: [
        {
          id: "none",
          label: "No mark at all",
          means:
            "The corner stays empty, matching the tile as it already draws (ruled): the heading and the line beneath it already say what this is.",
        },
        {
          id: "live",
          label: "A quiet Live pill",
          means:
            'A small dot and "Live", the hub\'s own language for an updating reel, borrowed rather than invented.',
        },
        {
          id: "glyph",
          label: "A minimal glyph, no words",
          means:
            "One small icon in the corner, no label at all: present without competing with the heading for the first read.",
        },
      ],
      recommended: "none",
      because:
        'The heading already says "Highlight reel" and the line beneath it what to do next, so a text chip in the corner repeats work the card already does; the given already draws the tile bare there.',
      overrule:
        "If the corner should still say the one thing a badge always could, that this updates on its own, the quiet Live pill is the smallest true upgrade over silence.",
      lands:
        'Whether the tile\'s corner ever names anything once the heading already does, and what replaces "The reel" chip everywhere it appeared.',
      tile: "phone",
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls; kept for parity with every other board over this world even
 * though round two declares none of its own.
 */
export const REEL_FRONT: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
