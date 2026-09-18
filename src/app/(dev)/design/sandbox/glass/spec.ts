import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * GLASS, ROUND ONE: THE APP'S CHROME OVER PHOTOGRAPHS (2026-09-18).
 *
 * Will banked this by name when he declined a one-off glass panel on the
 * floating layer: "I prefer not to create a one-off instance of glass here.
 * Rather, let's bank a near-term agent for a dedicated Glass exploration across
 * marketing and app so it feels more infused to our product. Glass + aurora
 * atmospheric feels like a beautifully complementary identity for a
 * media-forward product" (2026-09-17). His steer the next evening set this
 * round's shape: the app's media chrome first (the lightbox's pills, the
 * masonry's chips, the reel overlay), marketing in round two, and glass drawn
 * on both grounds and asked separately, never as a package.
 *
 * So the material is decided ONCE, on the one surface that holds every kind of
 * chrome at once, and then each surface is asked what it does with the winner.
 * Six of the seven wait on the recipe and nothing else, so after the first
 * question they can be taken in any order.
 *
 * ★ EVERY NUMBER ON THIS BOARD IS MEASURED. The contrast figures come from
 * screenshotting the rendered pill over each photograph and reading its pixels;
 * the cost figures come from Chrome's own compositor trace over a three second
 * scroll of forty tiles at 375, DPR 3, with the CPU throttled four times. The
 * method and the harness are named in the frame captions, and where the words
 * and a caption disagree the caption is the truth.
 */

/**
 * THE GROUND, one knob every decision shares: the photograph the chrome sits
 * on. Glass is easy over a dark photograph and hard over a bright one, and the
 * repo's twelve stills run from a mean luminance of 50 to 176, so the same
 * recipe has to be seen on both ends. The dark one is the darkest the repo
 * holds; ASSETS row 14 (the low-key menu ground) is still parked for the
 * Higgsfield month.
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

const DRAFT = defineExploration({
  id: "glass",
  title: "Glass",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round, on the app's chrome over photographs: the material itself on the lightbox's pill, then what each media surface does with it, with the light ground asked on its own step.",
  },
  context:
    "There is no translucent surface in the system today: the one that existed was retired when the card went opaque, and the floating layer refuses a backdrop filter until this round rules. What the app does have is faint glass nobody decided: a 55 percent black behind the lightbox's pills, 40 percent behind every tile chip, 12 percent white behind the reel's controls. This board makes it one material and asks where it goes.",
  bible: [1, 4, 10, 15],
  asks: [
    {
      id: "recipe",
      label: "The recipe",
      question: "How much glass should a surface you press be?",
      context:
        "The lightbox's action pill over a photograph at 1440. Today it is a flat 55 percent black with an 8px blur. Each option is named in its numbers; the caption under the frame says what its white text measured at.",
      lands:
        "The material every glass surface in the app wears, and the quiet grade derived from it.",
      options: [
        {
          id: "today",
          label: "Today: 8px blur, 55 percent black",
          means:
            "The shipped pill. Legible over anything, and the photograph behind it goes dark and flat.",
        },
        {
          id: "veil",
          label: "Veil: 16px blur, the backdrop at 0.62",
          means:
            "Darkened rather than painted over, so the photograph's colour survives. Reads as tinted air more than as a pane.",
        },
        {
          id: "frost",
          label: "Frost: 26px blur, 0.55, a bright top edge",
          means:
            "A wide blur, more saturation and a 16 percent highlight on the upper lip, so the pill reads as a physical pane.",
        },
        {
          id: "crystal",
          label: "Crystal: 42px blur, 4 percent black, two edges",
          means:
            "Almost no tint, and a hairline all the way round. The most photograph, and the one that loses its small text.",
        },
      ],
      recommended: "frost",
      because:
        "It is the most glass of the four that keeps its text. Measured on the preview itself, its worst twelfth reads 5.2 to 1 over the middling photograph where Veil reads 4.6 and Crystal falls to 3.7, under the 4.5 small text asks for.",
      overrule:
        "If the pane should be felt rather than seen, Veil costs a little less and reads as tinted air rather than as glass.",
      configs: [GROUND],
    },
    {
      id: "grades",
      label: "The grades",
      question: "One grade of glass, or two?",
      after: { ask: "recipe" },
      context:
        "The same lightbox, wearing the recipe you picked. The action pill is pressed; the attribution pill, the close and the two arrows are only read. Two grades halves the blur on everything read-only and drops its edges.",
      lands:
        "Whether the system carries one glass material or two, on every surface that wears it.",
      options: [
        {
          id: "two",
          label: "Two: a quiet grade for anything read-only",
          means:
            "Half the blur, no edges, a little more tint. Derived from the recipe, so picking a recipe moves both at once.",
        },
        {
          id: "one",
          label: "One: every surface wears the full recipe",
          means:
            "One material to hold and one line in the Library. Every badge on a page of photographs becomes a pane.",
        },
      ],
      recommended: "two",
      because:
        "A badge you read and a pill you press are different jobs, and drawing both as full panes turns an album into a stack of glass. The quiet grade also measured about 5 percent cheaper across a phone scroll.",
      overrule:
        "If the two read as an inconsistency rather than as a hierarchy, one material is the simpler system to hold.",
      configs: [GROUND],
    },
    {
      id: "behind",
      label: "Behind the photograph",
      question: "What should sit behind the photograph in the lightbox?",
      after: { ask: "recipe" },
      context:
        "Opening a photograph drops a 90 percent black wall over the album today, so the room it came from disappears. Glass keeps the album, blurred, underneath. Drawn at 1440 with the album really there.",
      lands:
        "The lightbox's overlay on both galleries, and any full-screen media takeover after it.",
      options: [
        {
          id: "album",
          label: "The album, blurred, at half brightness",
          means:
            "The room stays, softened, so a photograph reads as lifted out of the album rather than as a new screen.",
        },
        {
          id: "dim",
          label: "The album, blurred and taken down further",
          means:
            "The same pane at 28 percent brightness, so the album is a texture behind the photograph rather than a picture.",
        },
        {
          id: "wall",
          label: "Today: a 90 percent black wall",
          means:
            "The album goes. Nothing competes with the photograph, and opening one feels like leaving the page.",
        },
      ],
      recommended: "album",
      because:
        "It is the glass moment the whole identity is for, and it costs almost nothing: one full-screen pane measured a seventh of what the tile chips already pay. At half brightness the album is soft colour beside the photograph and never pulls at it.",
      overrule:
        "If a busy album still pulls at the photograph, the dimmed pane keeps its texture without its colour and the wall is the honest fallback.",
      configs: [GROUND],
    },
    {
      id: "tiles",
      label: "The tiles",
      question: "What should the chips over gallery tiles be, on a phone?",
      after: { ask: "recipe" },
      tile: "phone",
      context:
        "The host's grid at 375: a like and a save over every tile, a play badge on videos, a like count. The guest's album carries the same family. This is where a phone pays for glass, forty tiles at a time.",
      lands:
        "Every chip over a gallery tile: the guest album's, the host's grid, the review queue, Uploads.",
      options: [
        {
          id: "quiet",
          label: "The quiet grade",
          means:
            "Half the blur and no edges. Still glass, and the chips stay chips rather than becoming the album's texture.",
        },
        {
          id: "full",
          label: "The full recipe on every chip",
          means:
            "One material everywhere, at its full strength, on the surface a guest sees more than any other.",
        },
        {
          id: "flat",
          label: "Flat: the tint, no blur at all",
          means:
            "No backdrop filter on a tile. Measured about seventeen times cheaper than any glass, and it gives up the material here.",
        },
      ],
      recommended: "quiet",
      because:
        "Every chip is its own blurred region and a phone scrolls hundreds of them: the quiet grade drew 169ms of compositor work over a three second scroll where the full recipe drew 177 and today's chip drew 127.",
      overrule:
        "If a real phone drops frames on this screen, flat is the only option that costs nothing and the tiles leave the glass system.",
    },
    {
      id: "reel",
      label: "The reel's controls",
      question:
        "Over a playing reel, should the controls be dark glass or white?",
      after: { ask: "recipe" },
      tile: "phone",
      context:
        "The guest's reel at 375. Its Share button and its close are the only white chrome in the product (a 12 percent white with an 8px blur), sitting beside a solid white Download. The backdrop moves every frame.",
      lands:
        "The reel overlay's controls, and any chrome over playing video after it.",
      options: [
        {
          id: "dark",
          label: "The recipe, as everywhere else",
          means:
            "One material across the app. The row reads as two weights of the same button rather than as two materials.",
        },
        {
          id: "white",
          label: "White glass, as today",
          means:
            "The recipe's filter with a white tint, so the pair reads as one solid white button beside one you can see through.",
        },
        {
          id: "flat",
          label: "Flat: 12 percent white, no blur",
          means:
            "Today's tint without its blur. Nothing is filtered over a moving backdrop, which is the cheapest thing a reel can do.",
        },
      ],
      recommended: "dark",
      because:
        "Bible 1 keeps the chrome achromatic and every other surface in the app is dark; one white material here is an exception with no reason behind it, and beside a solid white Download the two read as a pair.",
      overrule:
        "If Share and Download should read as one family of buttons rather than as two weights, white keeps them together.",
    },
    {
      id: "row",
      label: "The host's row",
      question:
        "On the host's grid, three panes over a photograph or one bar holding three?",
      after: { ask: "recipe" },
      context:
        "The host's gallery at 1440, every tile's action row drawn as if hovered, which is how the product reveals it. Three controls: like, save, hide.",
      lands:
        "The host's tile row, and the shape any group of glass controls takes over a photograph.",
      options: [
        {
          id: "bar",
          label: "One bar holding three glyphs",
          means:
            "One pane per tile. It reads as one control with three jobs, and it is one blurred region instead of three.",
        },
        {
          id: "chips",
          label: "Three separate panes",
          means:
            "The shape the product ships, in the new material: three discs, each its own pane over the photograph.",
        },
        {
          id: "today",
          label: "Today: three chips at 40 percent black",
          means:
            "The shipped row untouched, so the grid is the one surface that does not join the glass system.",
        },
      ],
      recommended: "bar",
      because:
        "Measured over a scroll of the host's grid, one bar drew 40 percent less compositor work than three discs of the same material, and three panes stacked over one photograph is the thing that makes glass look applied rather than designed.",
      overrule:
        "If the three actions need to read as three separate targets, the discs keep them apart.",
      configs: [GROUND],
    },
    {
      id: "paper",
      label: "On paper",
      question:
        "On the app's light theme, what should chrome over a photograph be?",
      after: { ask: "recipe" },
      context:
        "The dashboard's event cards over their covers, with a gallery under them, on the light token set. One control there already follows the theme (the card's remove button); every other chip over a photograph stays dark.",
      lands:
        "Every glass surface over media on the app's light theme, and the rule the wiring writes for it.",
      options: [
        {
          id: "dark",
          label: "Dark glass, whatever the theme",
          means:
            "Chrome over a photograph belongs to the photograph, not to the page, so it never changes when the theme does.",
        },
        {
          id: "paper",
          label: "Paper glass, following the theme",
          means:
            "A white pane that lifts the photograph rather than sinking it, with ink glyphs and a hairline instead of a bright edge.",
        },
        {
          id: "edge",
          label: "Dark glass with a brighter edge",
          means:
            "The dark material, its highlight taken up so the pane still separates from a pale photograph on a pale page.",
        },
      ],
      recommended: "dark",
      because:
        "A control sitting on a photograph reads against the photograph, not against the page behind it, and the album is the one surface the system already keeps dark in both themes. The dashboard's remove button is the exception that proves it, not a precedent.",
      overrule:
        "If dark chrome on a pale page reads as a hole punched in the card, paper glass is the answer and the remove button was right.",
      configs: [GROUND],
    },
  ],
});

/**
 * ★ ONE GROUND KNOB, NOT FIVE. `defineExploration` flattens every decision's
 * `configs` into the board's controls, so a knob five decisions share arrives
 * five times: the dock would draw it five times and React would warn about the
 * duplicate key. Each decision keeps it on its strip, which is what `configs`
 * is for; the board declares it once. The gallery-width board found this first
 * and left the same note: a finding for the constructor, which could dedupe by
 * id itself.
 */
export const GLASS: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
