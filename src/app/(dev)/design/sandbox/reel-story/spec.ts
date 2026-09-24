import { defineExploration } from "@/components/lab/exploration";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE MARKETING STORY OF THE REEL (THE REEL ROUND, wave 2; Will, 2026-09-22;
 * "the reel, reconceived"). Every marketing surface today sells a
 * host-made, post-event, stored reel: "Every event ends with a reel.", "From
 * the first scan to the final cut", "Pick a style. The reel cuts itself,
 * ready to share.", "Every guest can take the reel home." None of that is
 * true any more. The reel is alive from the second photo (dropped from three,
 * ruled), on the venue's wall as a first-class screen, and a cut is anyone's,
 * made on-device, never stored. Seven asks retell it: the thesis line, the
 * /reel page's arc, the home's teaser and the hero film's role, the pricing
 * rows' words, the how-it-works steps, the event pages' reel column, and the
 * help category's name.
 *
 * ★ RE-CUT UNDER BATCH ONE (2026-09-24): `help` gains "Highlight reel" as an
 * option, since it is now also the album tile's own heading and was missing
 * from the three; `steps` and `pricing` draw his "clip" beside "cut", never
 * replacing it; `teaser` gains the tile's own crossfade as a fourth option,
 * over the tile's live take, not a recorded stand-in.
 *
 * DECIDED, NOT ASKED (this board takes them as given): the /reel page's live
 * style switcher stays, as the engine's proof; the tier rows become the cut's
 * length and mark, never the live reel's; the words below are the seven
 * asks' to settle, and nothing here pins a final string. His standing site
 * rulings bind throughout: no page ends the same way with the reel ("that
 * will feel incredibly repetitive"), no centred portrait video leaving blank
 * space on a desktop, the demo door as the event pages' own proof, the hero
 * film parked (ASSETS row 1).
 *
 * ★ EVERY OPTION IS THE REAL COPY, IN THE REAL PIECE. Nothing here is
 * described in the abstract: the close is the real CtaBand under the real
 * SectionLight, the feature entry wears the real card scrim and the real
 * poster, the pricing rows read MAX_REEL_SECONDS off tiers.ts, the steps
 * borrow the walkthrough's own numbered rail, and the events column stands
 * beside the real demo door (event-door.tsx), unchanged, exactly as ruled.
 * The `teaser` ask's "real engine" option plays gallery-fixtures.ts's shared
 * wedding album (the same stand-in every reel-round board plays) through the
 * same `buildReelProps` the shipped Studio and the live player call.
 *
 * Nothing here overlaps `site-chrome` (the nav and footer's structure) or
 * `press-page` (the fact sheet is the sweep's alone).
 */

const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

const DRAFT = defineExploration({
  id: "reel-story",
  title: "The marketing story of the reel",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "Re-cut under his batch-1 answers: help gains Highlight reel as an option; steps and pricing draw clip beside cut; teaser gains the tile's own crossfade; the minimum drops to two, so every third photo becomes second.",
  },
  context:
    "The reel is reconceived: live from the second photo, a first-class screen, a cut anyone renders on-device. Every marketing surface still sells the old host-made, stored reel. Seven asks retell it; nothing here pins a final word, and nothing wires production.",
  asks: [
    {
      id: "thesis",
      label: "The thesis line",
      question: "Which one line should replace \"Every event ends with a reel\"?",
      context:
        "The retired line is drawn in two real places today: the home's own close (CinemaClose's subhead) and the feature hub's reel door (its line). Both read one constant; every option here is that one line, reused in both.",
      options: [
        {
          id: "grows",
          label: "\"Every event has a reel.\"",
          means: "Keeps the retired line's rhythm and swaps the one word that stopped being true: the reel no longer ends anything.",
        },
        {
          id: "verbs",
          label: "\"Scan. Add. Watch it grow.\"",
          means: "Three beats naming what a guest actually does, before the reel itself is mentioned at all.",
        },
        {
          id: "auto",
          label: "\"The reel that makes itself.\"",
          means: "Leads with the one fact that is entirely new: no host action creates it.",
        },
      ],
      recommended: "grows",
      because:
        "It keeps the site's one ratified rhythm and changes only the word that broke: \"ends\" promised a finish line the new reel does not have. The smallest true rewrite beats a fresh line for a fact this load-bearing.",
      overrule:
        "If the round wants to sell the mechanism over the promise, the three-beat imperative names the guest's own act before the reel exists.",
      lands: "The one sentence carried into marketing-voice.ts's GOLDEN_LINES and quoted on both surfaces.",
      configs: [SCREEN],
    },
    {
      id: "arc",
      label: "The /reel page's arc",
      question: "What order should the /reel page's three chapters run in?",
      context:
        "/reel runs hero, style switcher, then four sections built for a host-made stored reel. The switcher stays as the engine's proof; these three chapters replace the rest, in one of three orders.",
      options: [
        {
          id: "live-first",
          label: "The live reel, the screen, then the cut",
          means: "Opens on the thing that needs no action, builds to the wall, closes on the one personal step.",
        },
        {
          id: "cut-first",
          label: "The cut first, as the thing people post",
          means: "Opens on the shareable payoff, then explains the always-on reel and the screen as how it got made.",
        },
        {
          id: "screen-first",
          label: "The screen first, as the flagship moment",
          means: "Opens on the boldest proof, a wall of guests watching live, before narrowing to the reel and a cut.",
        },
      ],
      recommended: "live-first",
      because:
        "It matches how a reader actually meets the product: the reel is alive before a host does anything, the screen is what a host adds, and a cut is the last, most personal step. Any other order explains an effect before its cause.",
      overrule:
        "If /reel exists mainly to be linked and shared, leading on the cut is the stronger hook for a reader arriving cold.",
      lands: "The section order the sweep builds render-section.tsx, tier-section.tsx and guest-share-section.tsx into.",
      configs: [SCREEN],
    },
    {
      id: "teaser",
      label: "The home's teaser",
      question: "What should the home's reel section actually show playing?",
      context:
        "reel-teaser.tsx plays a stored render today (hero-candidate-02) to sell a style catalog. Its job changed: it now has to prove the reel is alive, or lean on the graded hero film (ASSETS row 1, parked), or ask nothing of the network at all.",
      options: [
        {
          id: "engine",
          label: "The demo album's live reel, real engine",
          means: "The same canvas engine a guest's phone runs, over the shared album: the actual pixels, not a recorded stand-in.",
        },
        {
          id: "film",
          label: "The hero film, landscape",
          means: "The graded, produced film (hero-candidate-02) stays the section's centrepiece rather than the canvas engine.",
        },
        {
          id: "poster",
          label: "A still poster with a play mark",
          means: "One graded frame and a play affordance; no motion until a reader asks for it.",
        },
        {
          id: "crossfade",
          label: "The album tile's own crossfade",
          means: "The same slow, gentle cycle the album's own tile wears now (ruled): no canvas, no lazy chunk, one motion language between the marketing site and the product.",
        },
      ],
      recommended: "crossfade",
      because:
        "The album's own tile settled on exactly this (reel-front, ruled): no canvas, no lazy chunk, one consistent motion language between the marketing site and the product a guest actually uses.",
      overrule:
        "If the section is closer to a hero moment than a proof point, the graded film reads more cinematic than any crossfade of stills, live engine included.",
      lands: "Whether the home ships a second live engine mount, or keeps the section to a produced asset and zero extra bytes.",
      configs: [SCREEN],
    },
    {
      id: "pricing",
      label: "The pricing rows",
      question: "How should the pricing table talk about the reel now that it is free and unlimited everywhere?",
      context:
        "comparison-table.tsx's \"The reel\" group carries Reel length and Reel watermark. Those numbers now describe the CUT alone; the live reel and the screen carry no cap or mark on any tier.",
      options: [
        {
          id: "renamed",
          label: "Two rows, renamed to the cut",
          means: "\"Cut length\" and \"Cut watermark\" replace the old labels; same shape, same numbers, the right noun.",
        },
        {
          id: "clip-renamed",
          label: "Two rows, renamed to the clip",
          means: "\"Clip length\" and \"Clip watermark\": the same two rows, his own word for the guest-facing object, never a second row beside cut's.",
        },
        {
          id: "one-row",
          label: "\"Your reel\" as one combined row",
          means: "One row states the cut's length and mark together per plan, since a host compares them as one lever.",
        },
        {
          id: "footnote",
          label: "Off the table; the mark is a footnote",
          means: "The group leaves the matrix entirely; the free cut's small mark becomes a footnote under it instead.",
        },
      ],
      recommended: "renamed",
      because:
        "The two numbers still differ by plan, so a row still does work; only the noun was wrong. Renaming costs nothing and keeps every row's promise that it names a real difference.",
      overrule:
        "If a matrix exists to show what is gated, and nothing about the reel is gated any more, the footnote says that more honestly than two rows shaped like a limit.",
      lands: "Whether \"the reel\" survives as a matrix group at all, and where the free cut's mark is read.",
      configs: [SCREEN],
    },
    {
      id: "steps",
      label: "The how-it-works steps",
      question: "How should the loop's six-step walkthrough name the reel's two beats now?",
      context:
        "how-it-works.ts's host step 6 is \"Cut the reel\" (one tap, publish); the guest step 6 is \"Get the reel\" (it lands in the album). Both describe an act that no longer exists.",
      options: [
        {
          id: "grow-cut",
          label: "\"Watch the reel grow\" / \"Make your cut\"",
          means: "The host's step turns ambient (nothing to do); the guest's step becomes the one real action left, a cut.",
        },
        {
          id: "grow-clip",
          label: "\"Watch the reel grow\" / \"Make your clip\"",
          means: "The same shape as the option beside it, with his own guest-facing word: a clip, not a cut.",
        },
        {
          id: "screen-step",
          label: "\"Put it on a screen\" as the host's step",
          means: "The host's one remaining lever is opening the venue screen, not making anything.",
        },
        {
          id: "folded",
          label: "Folded into the share step",
          means: "The reel stops being its own numbered step on either side; it rides inside \"Take it all home\" instead.",
        },
      ],
      recommended: "grow-cut",
      because:
        "It keeps six steps on both sides, the contract loop-wiring built, and gives each side an honest verb: nothing is left for a host to DO, but a guest still has one real action.",
      overrule:
        "If the walkthrough should name the one real new lever, the screen is a truer sixth step than an ambient description of something already true by step three.",
      lands: "Whether the host and guest walkthroughs keep six parallel steps or drop to five.",
      configs: [SCREEN],
    },
    {
      id: "events",
      label: "The events pages' reel column",
      question: "What should the event pages' reel column say and show now?",
      context:
        "event-door.tsx pairs the ruled demo door with a column naming each type's own angle (\"cut into one highlight reel you can send the same night\") beside a stored poster. The door stays exactly as ruled.",
      options: [
        {
          id: "wall",
          label: "The live reel, on the wall, for each type",
          means: "The angle line describes the venue screen at that kind of event; the poster becomes the real engine over the shared album.",
        },
        {
          id: "cut",
          label: "The cut a guest posts",
          means: "The angle line reframes around a guest's own shareable clip from that kind of event, kept personal and social.",
        },
        {
          id: "gone",
          label: "The column gone; the demo door stands alone",
          means: "The section keeps only the ruled door, centred and widened; nothing about the reel runs beside it.",
        },
      ],
      recommended: "wall",
      because:
        "It is the one new fact every type page can now say that was not true before, the reel playing AT this kind of event as it happens, and it keeps the section's two-object rhythm the door ruling protects.",
      overrule:
        "If the column always existed to make the page personal rather than to describe the product, a guest's own cut keeps that register truer than a wall description.",
      lands: "Whether all five reelAngle lines and the column's poster survive, change register, or retire.",
      configs: [SCREEN],
    },
    {
      id: "help",
      label: "The help category's name",
      question: "What should the reel's help category and its nav entry be called?",
      context:
        "Today's category is \"Highlight reel\" (strip label \"Reel\"); the header panel calls the same link \"The highlight reel\" while the footer already calls it \"The reel\": one feature, two names.",
      options: [
        {
          id: "highlight-reel",
          label: "Highlight reel",
          means: "Today's shipped name, kept: it is now also the album tile's own heading, so a guest meets one word in both places.",
        },
        {
          id: "the-reel",
          label: "\"The reel\"",
          means: "The plainest name, already live in the footer today, folded across the category, its strip label and the header panel.",
        },
        {
          id: "reels-cuts",
          label: "\"Reels and cuts\"",
          means: "Names both objects a reader meets in the category, at the cost of a longer label everywhere it appears.",
        },
        {
          id: "live-reel",
          label: "\"The live reel\"",
          means: "Leads with the one word that changed, so a reader never mistakes the always-on reel for a personal cut.",
        },
      ],
      recommended: "highlight-reel",
      because:
        "It is already live as the tile's own heading (reel-front, ruled) as well as the footer, so keeping it doubles as the clearest thread from the album to a help article.",
      overrule:
        "If a reader's first confusion is mixing the always-on reel up with a personal cut, naming the live reel explicitly heads that off before the first article does.",
      lands: "The slug redirect (highlight-reel to its successor), the strip label, and the header panel's entry text.",
      configs: [SCREEN],
    },
  ],
});

export const REEL_STORY: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
