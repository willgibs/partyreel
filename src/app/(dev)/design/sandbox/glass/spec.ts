import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * GLASS, ROUND TWO: THE ONE MATERIAL (2026-09-20).
 *
 * Round one answered whole (docs/reviews/glass.json; verbatim in
 * docs/design/rulings.md, the fifth batch). Six of its seven asks are ruled and
 * wire after this round: `grades=one`, `behind=album`, `tiles` by his own rule,
 * `reel=white`, `row=bar`, `paper=dark`. Only the recipe comes back, and it
 * comes back joined to the reel's answer, because two of his notes are really
 * one question:
 *
 *  - `recipe=frost`: "It was between this and Crystal. This one because it's a
 *    bit darker and keeps an active icon a bit more visible, but I also liked
 *    the Crystal's double edge for more contrast in any situation. Maybe worth
 *    a second round of exploration to clarify, so we can nail our glass from
 *    the start."
 *  - `reel=white`: "May be worth exploring making this the standard - I don't
 *    want to have separate glass treatments and would prefer to find a global
 *    that works everywhere... It probably would have looked better on the
 *    mobile media card icon background glass as well."
 *
 * ★ SO THE ROUND ASKS ONE MATERIAL ON EVERY GLASS SURFACE AT ONCE. Round one's
 * shape (a question per surface) is what let white win on one screen and never
 * be drawn on the others; a global cannot be judged a screen at a time. Every
 * option is the six surfaces in one frame, and flipping between three materials
 * in the same position is the instrument, which is why no `tile` is declared:
 * the step's flip mode is the comparison.
 *
 * ★ THE BODY AND THE EDGE ARE TWO DECISIONS, BECAUSE HIS NOTE WAS TWO
 * JUDGEMENTS. "A bit darker" is the body; "the Crystal's double edge" is the
 * edge. Folded into one set of options they force the compromise he has already
 * said he does not want, so the bodies are drawn with their native edges (what
 * he actually saw in round one) and `edge` then re-asks the hairlines on the
 * winner. Frost's darkness wearing Crystal's double edge is two presses away.
 *
 * ★ AND THE ACTIVE ICON IS MEASURED FOR THE FIRST TIME. His first reason for
 * picking Frost was that it "keeps an active icon a bit more visible", and no
 * round has drawn an active icon, let alone read one off a screen. `measured.ts`
 * now carries the rose `--like` mark's contrast against each material on each
 * photograph, beside white's first contrast and cost figures. Where the words
 * above a frame and the caption under it disagree, the caption is the truth.
 *
 * ★ ROUND ONE'S SEVEN ASKS ARE GONE FROM `asks` ON PURPOSE (the `privacy-hero`
 * and `profile-page` precedent: a round replaces its questions rather than
 * accreting them). The ledger keeps their answers for ever, the RULINGS row
 * names them as ruled, and the board carries only what is still open.
 */

/**
 * THE GROUND, one knob both decisions share: the photograph the chrome sits on.
 * Glass is easy over a dark photograph and hard over a bright one, and the
 * repo's twelve stills run from a mean luminance of 50 to 176, so the same
 * material has to be seen on both ends. The bright one is where the three
 * separate, and it is the one to look at first; the dark one opens the board
 * because it is the world he judged round one in.
 */
const GROUND: Control = {
  id: "ground",
  label: "The photograph",
  options: [
    { id: "dark", label: "The darkest" },
    { id: "mid", label: "A middling one" },
    { id: "bright", label: "The brightest" },
  ],
  default: "dark",
};

/**
 * THE SCREEN. Declared here as pure data rather than imported from the board's
 * scene: a spec is what a SERVER page reads, and a control lifted out of a
 * client module drags that module's tree along with it. 375 opens the board
 * because the two surfaces his notes named by hand (the mobile card, the reel)
 * are phone surfaces, and because a phone is what pays for a backdrop filter.
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
  id: "glass",
  title: "Glass",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Six of round one's seven asks are ruled and wire after this. Only the recipe returns, with the reel's white folded into it: one material, drawn on all six glass surfaces in one frame, because you asked for a global that works everywhere rather than separate treatments.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-18",
      changed:
        "Seven decisions on the app's chrome over photographs: the recipe on the lightbox's pill, one grade or two, what sits behind the photograph, the chips over tiles, the reel's controls, the host's row, and the light ground.",
    },
  ],
  context:
    "You picked Frost, said it was between that and Crystal for its double edge, then picked the reel's white pane and asked whether white should be the standard everywhere. Nothing has ever measured the thing your first reason names: how visible an active icon stays on each pane. This round measures it on three photographs, beside white's first contrast and cost numbers.",
  bible: [1, 4, 9, 10, 15],
  carried: [
    {
      id: "sheet",
      question:
        "One frame holding all six surfaces, instead of round one's six screens?",
      taken:
        "One sheet: a material that wins on the lightbox and loses on a card is not a global.",
      overrule:
        "A screen per surface again, and the comparison happens in your memory between steps.",
    },
    {
      id: "add-pill",
      question: "Should the guest's Add photos pill join the glass system?",
      taken:
        "Drawn in the material in every option, so the pane is judged carrying the app's loudest action.",
      overrule:
        "It stays a solid primary pill and the sixth cell is a reference the material never has to survive.",
    },
  ],
  asks: [
    {
      id: "material",
      label: "The material",
      question: "Which one material should every glass surface in the app be?",
      context:
        "Six surfaces in one frame: the lightbox's action pill over the blurred album, a mobile card's three permitted marks, the reel's controls over playing video, the host's row as a bar, a chip on paper, and the guest's Add pill.",
      lands:
        "The one --glass-* token set and the single utility every glass surface in the app wears.",
      options: [
        {
          id: "frost",
          label: "Frost: 12 percent black, as ruled",
          means:
            "The one you picked, unchanged: a wide blur over a backdrop taken to 0.55, and one bright lip along the top.",
        },
        {
          id: "crystal",
          label: "Crystal: 4 percent black, two edges",
          means:
            "Almost no tint and a hairline all the way round, so the pane separates by its edges rather than by its darkness.",
        },
        {
          id: "white",
          label: "White: Frost's filter, a white tint",
          means:
            "The reel's class everywhere. The same blur, the same backdrop, the same alpha, its colour turned white, so the pane lifts the photograph instead of sinking it.",
        },
      ],
      recommended: "frost",
      because:
        "Your first reason, measured: the rose active mark on a card reads 5.3:1 on Frost, 4.4 on Crystal and 3.6 on White. All three carry white text on every photograph, and all three cost the same to scroll, so legibility is the only axis left.",
      overrule:
        "White never darkens a photograph and still reads 10.6:1 on the reel: pick it if the active mark can be redrawn rather than lit by the pane.",
      configs: [GROUND, SCREEN],
    },
    {
      id: "edge",
      label: "The edge",
      question: "How should a pane separate from the photograph under it?",
      after: { ask: "material" },
      context:
        "The material you just picked, wearing three edges on the same six surfaces. Your note kept two judgements apart: Frost because it is darker, Crystal for its double edge. This is the second one, on whichever body won.",
      lands:
        "The hairlines on every glass surface, and whether the material carries one at all.",
      options: [
        {
          id: "lip",
          label: "One bright lip along the top",
          means:
            "Frost's edge: a 16 percent highlight where light would land on the pane's upper lip, and nothing else.",
        },
        {
          id: "double",
          label: "The lip taken up, and a hairline all round",
          means:
            "Crystal's edge on the body that won: a 28 percent lip plus a 10 percent hairline, so the pane has an outline wherever it sits.",
        },
        {
          id: "none",
          label: "No hairline at all",
          means:
            "The material separates by its own darkness or lightness. The quietest pane, and the one that can disappear into a bright photograph.",
        },
      ],
      recommended: "double",
      because:
        "Your reason for looking twice at Crystal, measured: over the middling photograph a pane with no hairline loses 41 percent of its outline into the picture, one lip recovers it to 81 percent, and the double edge holds 97.",
      overrule:
        "If two hairlines read as a drawn outline rather than as light on a pane, the single lip holds 81 percent and is the quieter one.",
      configs: [GROUND, SCREEN],
    },
  ],
});

/**
 * ★ ONE GROUND KNOB, NOT FOUR. `defineExploration` dedupes a shared config by
 * id since `lab-tides` (2026-09-19), so this filter is now belt and braces:
 * deduping twice is deduping once, and the board keeps it because the
 * constructor's guarantee is the kind of thing a refactor takes away quietly.
 */
export const GLASS: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
