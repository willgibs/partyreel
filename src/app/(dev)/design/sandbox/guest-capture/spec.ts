import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * KEEPING WHAT SHE JUST ADDED, ROUND ONE (2026-09-21).
 *
 * A NEW BOARD ON HIS WORD (docs/design/rulings.md, "the identity reshape",
 * approval verdict, verbatim): "You can wire it now as you recommended, but
 * I'd like to get this in the lab for refinement." The capture flow shipped
 * the round before this one (`verified-email-guest`): a name-only guest who
 * has not confirmed an email adds photographs under a typed name, and the
 * first time she does, a card offers to keep them (`save-account-prompt.tsx`,
 * `claim-handle-prompt.tsx`, `follow-moment-card.tsx`, `unverified-mark.tsx`).
 * Nothing here is a one-way door: the flow is live and this board is its
 * refinement catalog, lab-only, no production byte.
 *
 * ★ ONE GUEST, THE WHOLE BOARD. Every option is Priya, the guest
 * `media-viewer`'s own board already marked unproven on its `who.face` tile,
 * at Maya and Jay's wedding. A reader who has just answered that board meets
 * her again here, on her own side of the mark.
 *
 * ★ THE ORDER IS HER OWN PATH THROUGH IT: when the ask first reaches her,
 * what it looks like, whom she can follow once she confirms, where she is
 * standing afterward, and what becomes of the name she typed in a hurry. All
 * five are roots — he can take them in any order — because each one holds
 * the other four at today's shape and moves only its own piece.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. Whether an event requires a verified
 * email at all is ruled (the identity reshape); a name-only guest existing is
 * the premise this board stands on, not a question inside it. The unverified
 * mark's own material, the album's column rule and the guest header's shell
 * are `guest-shape`/`gallery-width`'s and worn here as law. The claim's
 * mechanics (`claimAnonymousUploads`, the capability session, one email one
 * identity) are unmoved; every option changes only what a screen says and
 * where it says it.
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
  id: "guest-capture",
  title: "Keeping what she just added",
  round: {
    n: 1,
    date: "2026-09-21",
    changed:
      "New board, cut from the shipped capture flow on his word for its refinement.",
  },
  context:
    "Every option is the same guest at the same wedding, Priya at Maya and Jay's (media-viewer's own world), with only the piece being asked moved. The capture flow shipped the round before this one: a name-only guest confirms an email, her photographs and the event land on a fresh profile, and a beat offers a follow. This board asks five things about that beat: when it opens, what it looks like, whom it offers to follow, where she ends up, and what becomes of the name she typed in a hurry.",
  bible: [4, 14, 15, 19, 22],
  asks: [
    {
      id: "moment",
      label: "The moment",
      question:
        "When should the offer to keep what she added first reach Priya?",
      context:
        'Today it appears the instant a first upload finishes and stays until she acts or dismisses it, counting up as more land: "Keep your photo", then "Keep your 7 photos." Every option below moves only the trigger.',
      options: [
        {
          id: "first",
          label: "After the first photo, as shipped",
          means:
            'The instant she has sent anything at all: her first photo already reads "Keep your photo."',
        },
        {
          id: "tenth",
          label: "Held until the tenth photo",
          means:
            'Nothing appears until ten have landed; the same offer arrives heavier, "Keep your 10 photos," once she is invested.',
        },
        {
          id: "yours",
          label: "The moment she taps Yours",
          means:
            "The album's own filter to her own tiles is the trigger: the instant she asks to see what is hers, the offer meets her there.",
        },
      ],
      recommended: "first",
      because:
        "A guest who adds one or two photographs and never returns is the common case; waiting for a tenth or a tap she may never make means the offer never reaches most of the people it exists for.",
      overrule:
        "If the count does the persuading, ten is a heavier sentence than one, and a guest mid-party has more to add than to lose by waiting.",
      lands:
        "Whether the flow reaches every contributing guest once, or a smaller, more invested slice.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "shape",
      label: "The offer's shape",
      question:
        "Should the ask sit in its own card, ride the photo it is about, or become the sheet's last screen?",
      context:
        "Today it is a bordered card in the album's own slot: a heading, a sentence that counts what just landed, a button, a quiet way to dismiss it. Drawn here the instant her first photo has sent.",
      options: [
        {
          id: "card",
          label: "A card in the album's slot, as shipped",
          means:
            "A self-contained card in the words column above the grid, exactly where the offer sits today.",
        },
        {
          id: "inline",
          label: "A line under her own tile",
          means:
            "The caption sits directly beside the tile it is about, with nothing built around it.",
        },
        {
          id: "sheet-step",
          label: "The upload sheet's last screen",
          means:
            "The sheet she just sent from does not close onto the album; its last screen is the ask, on the visit the Moment above names.",
        },
      ],
      recommended: "inline",
      because:
        'The unverified mark already proved a small dot can carry a full explanation on tap; a line under the tile she just added says "this one" without new chrome, the restraint bible 4 already asks of a guest surface.',
      overrule:
        "A caption inside a grid she is scrolling past is easiest of the three to miss; a card is the only shape certain to be seen once.",
      lands:
        "How much new surface the ask gets, and whether it reads as part of the album or apart from it.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "follow",
      label: "The follow surface",
      question:
        "Once she confirms, where should Priya actually be offered a follow, and of whom?",
      context:
        "The moment card carries its own row for Maya today, because the host is the one person this page's Guests list does not already name. Drawn here the instant her email confirms, with Tom, Sam and five more already listed below.",
      options: [
        {
          id: "card",
          label: "The moment card's own row, as shipped",
          means:
            "The card keeps its own host row with its own Follow button, the one follow surface on the page.",
        },
        {
          id: "list",
          label: "Folded into the Guests list",
          means:
            "Maya joins the Guests section as its first, marked entry; the card drops its row and points down instead.",
        },
        {
          id: "jump",
          label: "A link to her profile",
          means:
            "The card's host line is a link to Maya's own page, where the real Follow button lives, rather than a button here.",
        },
      ],
      recommended: "list",
      because:
        "One follow surface reads as a feature; two is a seam the card and the list will eventually disagree about. Marking the host inside Guests is the move Will already asked for on the profile page.",
      overrule:
        "The moment card is the one place she is certainly looking right after she confirms; a row she must scroll to find is one some guests never see.",
      lands:
        "Whether the album carries one follow surface or two, and whether the host is a card row or a marked list entry.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "landing",
      label: "The landing",
      question:
        "Once everything is confirmed, should Priya still be looking at the album, or somewhere new?",
      context:
        "Today nothing moves: the moment card simply replaces the offer in the same slot and the album underneath is untouched. Drawn here at the instant her email confirms.",
      options: [
        {
          id: "album",
          label: "The album, as shipped",
          means:
            "Nothing moves. The moment card stands where the offer stood; the album is exactly as she left it.",
        },
        {
          id: "profile",
          label: "Her own new profile",
          means:
            "She lands on /u/priya, already carrying this one event as its first card.",
        },
        {
          id: "dashboard",
          label: "The dashboard's Saved list",
          means:
            "She lands in the full app, where this event now sits among Saved.",
        },
      ],
      recommended: "album",
      because:
        "Priya came for the party, not for an app; a redirect the second she confirms is the interruption this flow was built to avoid.",
      overrule:
        "If confirming should prove something real happened, only a landing that shows the new page or the dashboard does that; staying put asks her to trust it.",
      lands:
        "Whether confirming an email is a small unlock inside the party she is at, or the door to the wider product.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "name",
      label: "What the name becomes",
      question:
        "Should the name Priya typed at the door become her profile silently, or does she get a say?",
      context:
        "Today the typed name is written the instant the claim runs, with no chance to change it; a handle is offered afterward, its own line on the moment card. Drawn here right after her email confirms.",
      options: [
        {
          id: "silent",
          label: "Silent, as shipped",
          means:
            "Named the instant she confirms, from whatever she typed at the door; the handle is asked separately, after.",
        },
        {
          id: "confirm",
          label: "A quick confirm step",
          means:
            '"Is Priya right?", one editable field, stands between confirming and the name being written anywhere.',
        },
        {
          id: "together",
          label: "Name and handle, together",
          means:
            "One small step asks for both at once, replacing the silent write and the separate handle line with a single settled step.",
        },
      ],
      recommended: "together",
      because:
        "A name typed in the dark at a door is not always the one worth keeping for good, and the handle nudge already exists as a second touch; folding the name into it settles both at no extra cost.",
      overrule:
        "If the typed name is right often enough that asking again reads as pedantic, the silent take with a handle offered after costs her nothing extra.",
      lands:
        "Whether a guest's permanent name is ever chosen on purpose, and how many separate asks the handle costs.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ONE KNOB PER ID (`media-viewer`'s own finding, still standing): every ask
 * declares the same SCREEN control on its own strip, so the constructor
 * would draw it five times without this dedupe.
 */
export const GUEST_CAPTURE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
