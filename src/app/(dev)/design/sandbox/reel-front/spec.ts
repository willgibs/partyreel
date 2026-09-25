import { defineExploration } from "@/components/lab/exploration";

/**
 * THE ALBUM'S LIVING TILE, ROUND TWO: HOW IT READS AS THE REEL (2026-09-24;
 * widened the same day: `signature` gains a mechanism the crossfade itself
 * never tried, now the recommendation, and `badge` a fourth reading of the
 * corner).
 *
 * Round one answered whole (docs/reviews/reel-front.json, verbatim): the tile
 * is a slow crossfade, no engine (`tile=crossfade`); it carries a corner
 * control for "Make your own" (`verbs=watch-make`); its empty slot before the
 * reel exists says nothing (`states=nothing`, dropped to a two-item minimum on
 * his own note); a moderated guest's first approval gets a toast
 * (`yours=toast`); a fully-unlocked door's backdrop stays the album's stills
 * (`door=stills`); the tile keeps playing once uploads close (`closed=plays`);
 * the hub's own Reel card stays text only (`hub=labelled`). `reel-front-wiring`
 * lands all seven on the real album and hub at this same cut; none of it is
 * reopened here, and every round-two preview below still wears all seven as
 * its own ground.
 *
 * His own note on `tile` and `verbs` (the fourth batch, verbatim) opened this
 * round: "The different images differentiate the reel vs album media stills.
 * However, I'd love to see other design ideas for this differentiation. This
 * could be very polished/refined or taken in a better direction." → `signature`.
 * "'The Reel' badge in top left could be replaced with something better." →
 * `badge`. And his heading and description (`verbs`'s own note) retired the
 * old meta line for good: the tile reads "Highlight reel" over "Make your own
 * clip to share", no style name, no moment count, a fact both asks below draw
 * as ground rather than ask again.
 *
 * ★ ROUND ONE'S SEVEN ASKS ARE GONE FROM `asks` ON PURPOSE (the `profile-page`
 * precedent: a round replaces its questions rather than accreting them). The
 * ledger keeps their answers for good; the board only ever carries what is
 * still open. `parts.tsx`'s `TileCard` now wears every one of the seven as its
 * own ground (the heading, the description, the corner control, the
 * album-context beneath it) and exposes only the two slots still asked:
 * `media` (`signature`) and `badge` (`badge`).
 *
 * ★ THE FIRST PASS DREW EVERY `signature` OPTION AS A DRESSING ON THE SAME
 * CROSSFADE (a wash, a letterbox, a stacked edge, a corner mark), which
 * answers "how should it look" without ever asking "does it have to move the
 * way an album photo does at all". `hardcut` is the answer that question was
 * missing: the same eight stills, the same zero-canvas cost, only the timing
 * function changes from a fade to a jump. Nothing here reopens round one's own
 * `tile` decision (the crossfade over the live engine, settled on first-paint
 * cost); `hardcut` stays exactly as cheap as the crossfade it varies, a
 * different edit of the same take rather than a different engine.
 *
 * Every option plays the reel's own curated take (never the album's newest,
 * which is what made round one's crossfade read identical to the grid beneath
 * it) through plain `<img>` tags and CSS, the only motion this board needs.
 */

const DRAFT = defineExploration({
  id: "reel-front",
  title: "The album's living tile",
  round: {
    n: 2,
    date: "2026-09-24",
    changed:
      "Widened the same day: `signature` gains a hard-cut option that varies the crossfade's own mechanism, not just its dressing, now the recommendation over `graded`; `badge` gains a duration mark, the camera-roll convention for length.",
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
        {
          id: "hardcut",
          label: "A hard cut, no dissolve at all",
          means:
            "The same eight moments, held full then jump-cut to the next, no fade at all: the plain edit of real footage, which an album never does. Only the timing changes.",
        },
      ],
      recommended: "hardcut",
      because:
        "A jump between held frames is something an album of photographs never does by itself, so it reads as the reel's own edit without a wash or a letterbox layered on top to argue for it; it costs the same take and zero extra script, only a different timing function on the same animation.",
      overrule:
        "If a calmer dissolve matters more than a sharp cut, the graded treatment is the strongest dressing; plain crossfade is the baseline if that grade is too much.",
      lands:
        "Whether the tile ever wears a grade or a frame, whether its stills may be the album's newest again, and whether it must move like a crossfade at all.",
      tile: "phone",
    },
    {
      id: "badge",
      label: "The corner mark",
      question:
        'What, if anything, should replace "The reel" chip in the tile\'s corner?',
      context:
        '"The reel" chip could be replaced with something better (his words). The tile\'s other corner already carries "Make your own"; this asks only the identity mark, drawn over the take\'s own signature treatment.',
      options: [
        {
          id: "none",
          label: "No mark at all",
          means:
            "The corner stays empty, matching the tile as it already draws: the heading and the line beneath it already say what this is.",
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
        {
          id: "duration",
          label: "A short duration mark, like a clip",
          means:
            'A small "0:08", the same convention a phone\'s camera roll uses on a video thumbnail: not a status, a length, the plainest proof this plays like footage.',
        },
      ],
      recommended: "none",
      because:
        'The heading already says "Highlight reel" and the line beneath it what to do next, so a text chip in the corner repeats work the card already does; with the take\'s own hard cut now carrying the footage cue in how it moves, the corner has nothing left to add.',
      overrule:
        "If the corner should still say this updates on its own, the Live pill is the smallest upgrade over silence; for a length over a status, duration is familiar.",
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
