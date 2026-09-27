import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * PHOTOS WAITING FOR YOU, ROUND TWO: THE BATCH HIS NOTES LEAN TO (2026-09-27).
 *
 * Round one answered (docs/reviews/identity-claims.json): the banner above the
 * feed opens the review (`ticket=banner`), one event at a time with its own
 * small preview (`pass=cards`), a dialog before any deletion (`confirm=dialog`),
 * and the finish toast points to her page (`after=profile`). His note under
 * all of it: "we need a consensus - batch handling with in-batch confirmations,
 * or separate handling? Likely batch, with an action to 'enter'/follow up on
 * each claimed event as you go." And `pointer` came back as a question: "I
 * have 4 claimable events - am I visiting a separate follow up confirmation
 * page for each event I claim?"
 *
 * ★ SO THIS ROUND DRAWS ONE BATCH AND ASKS WHAT MAKES IT A GOOD ONE. The four
 * picks are ground in every frame; round one's five asks are gone from `asks`
 * (a round replaces its questions; the ledger keeps the answers). Three asks
 * shape the batch and one rewrites `pointer`:
 *   - `save`: whether a choice waits for Finish (today) or is written as she
 *     makes it;
 *   - `confirm`, after `save`: whether his dialog stops her at the card that
 *     says Not mine, or once at the end (today);
 *   - `next`, after `save`: what a claimed event offers as she goes, carrying
 *     `guest-capture`'s follow note ("needs to work within any multi-claim
 *     handling. Follow doesn't have to be pushed as hard");
 *   - `pointer`: one review, never a page per event, and where it opens.
 *
 * ★ `confirm` AND `next` ARE DRAWN IN THE WORLD OF HIS `save`. The dialog
 * belongs where its deletion happens, and a follow-up needs a written claim, so
 * both look different under the two answers; staging them (`after`) means he
 * is asked each in the world he chose. `save`'s own two options are each drawn
 * with the dialog where it naturally sits (Finish's at the end, as-you-go's at
 * the card), which its option lines say.
 *
 * ★ OUT OF THIS ROUND: where the review opens (a side sheet here, as round one
 * drew it) is the `popups` board's question; the toast's page line is being
 * wired by `profile-setup`; the door's "You're in" words are `identity-door`
 * round three's. Nothing here asks any of them.
 */

const IDENTITY_CLAIMS_DRAFT = defineExploration({
  id: "identity-claims",
  title: "Photos waiting for you",
  round: {
    n: 2,
    date: "2026-09-27",
    changed:
      "One batch, as his notes lean: the banner's review, one event at a time, each claimed event followed up as she goes. Three asks shape it (when a choice is saved, where the deletion's dialog sits, what a claim offers); pointer is rewritten as one review.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-24",
      changed:
        "Five decisions on the plain claim ticket: its home, the album's pointer, working through more than one, the warning before a deletion, what Finish leaves. He took the banner, one card at a time, the dialog and the profile toast.",
    },
  ],
  context:
    "Priya confirmed her email this morning at Maya and Jay's wedding, and four older events wait under it: Tom's Leaving Do, Ana's 30th (a password event) and Quiz Night were hers; a beach bonfire was someone else typing her email. His round one picks are ground: the banner above Your events opens the review in round one's side sheet, one event at a time with its own photos, a dialog before any deletion, and a finish toast that points to her page.",
  carried: [
    {
      id: "decided-list",
      question: "Where does an event go once she decides it?",
      taken:
        "Into a list under the card, with its follow-up, while the next card comes up: four events are four taps, never a stop per event.",
      overrule:
        "If each claim deserves a beat of its own, the card turns to Yours now with its follow-up and a Next.",
    },
    {
      id: "unreached",
      question: "What happens to an event she never reaches?",
      taken:
        "It waits: only a Not mine deletes, and the banner keeps counting it. Today's Finish reads an untouched row as not mine.",
      overrule:
        "If walking away should count as not mine, closing the review asks before deleting what is left.",
    },
    {
      id: "gated-photos",
      question: "What does a password event's card show?",
      taken:
        "No photos, as its date is already withheld (QA #40): a lock and the count, so a gated album never shows itself to an address.",
      overrule:
        "If she needs to see them to decide, the card asks for that event's password before showing any.",
    },
    {
      id: "door-beat",
      question: "Does the door's You're in point to the waiting events too?",
      taken:
        "No: it is a held beat of about a second while the album loads, with nothing to press, so a line there goes unread; she meets the banner instead.",
      overrule:
        "If the door should point too, its beat waits for her with the line and a Continue, which is identity-door's to draw.",
    },
    {
      id: "no-toast",
      question: "Is a toast still a way to point from the album?",
      taken:
        "No: the confirm return is becoming one beat (guest-door is building it), and a toast would stack on top of it.",
      overrule:
        "If a toast should point, it replaces the moment card's line rather than joining it.",
    },
  ],
  asks: [
    {
      id: "save",
      label: "When a choice is saved",
      question:
        "When Priya decides an event in the review, when should her choice be saved?",
      context:
        "Claim adds an event's photos to her account; Not mine deletes them. Today one Finish writes every choice at once. Drawn after two (Tom's claimed, the bonfire not hers): her dashboard if she stops there, then the review.",
      options: [
        {
          id: "finish",
          label: "Kept in the review until Finish",
          means:
            "Every choice waits with an Undo, and Finish writes them all, as today, one dialog there covering the deletions. Closed early, nothing is saved yet.",
        },
        {
          id: "once",
          label: "Saved the moment she decides",
          means:
            "A claim is added as she taps it and joins Your events; a Not mine is deleted once its dialog says so. Closed early, what she did stays done.",
        },
      ],
      today: "finish",
      recommended: "once",
      because:
        "It makes his three notes one flow: each event handled is done for good, so the stack truly shrinks; she can stop and come back; and a claimed event can be entered as she goes. A deletion still waits for its dialog.",
      overrule:
        "If a mis-tapped claim must be undoable, keeping choices until Finish gives each an Undo, and the follow-ups wait for Finish.",
      lands:
        "Whether the review is a form sent at the end or a queue that saves as it goes.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "confirm",
      label: "Where the deletion's dialog sits",
      question:
        "Where should the dialog before a deletion appear in the review?",
      context:
        "Your pick is a dialog before any deletion. It can stop her at the card that says Not mine, or wait and cover every Not mine at once at the end. Drawn with your answer on saving.",
      options: [
        {
          id: "card",
          label: "At the card, when she says Not mine",
          means:
            "Not mine opens the dialog for that one event while its photos are still in view; she confirms it there and the next card comes up.",
        },
        {
          id: "end",
          label: "Once at the end, for every Not mine",
          means:
            "Not mine marks the card and moves on; after the last card one dialog names every marked event and deletes them together, as today's Finish does.",
        },
      ],
      today: "end",
      recommended: "card",
      because:
        "She confirms a deletion while she is looking at the photos it deletes, never a list of names to recall at the end, and with choices saved as she goes it sits exactly where the deletion happens.",
      overrule:
        "If several Not mines should cost one confirmation, the end's single dialog covers them all.",
      lands:
        "Whether a deletion is confirmed one event at a time or in one sweep at the end.",
      after: { ask: "save" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "next",
      label: "What a claimed event offers",
      question:
        "What should each event Priya claims offer her right there in the review?",
      context:
        "Your note: a way to enter or follow up on each claimed event as she goes; your guest-capture note: follow works in a batch without being pushed. A claimed event's row in the review offers it once the claim is saved.",
      options: [
        {
          id: "album",
          label: "Open its album",
          means:
            "Every claimed row carries Open album, so she can step into Tom's Leaving Do now or keep going. Nothing here follows a host.",
        },
        {
          id: "host",
          label: "Follow its host",
          means:
            "Every claimed row carries its host's face and Follow, as the moment card does. A host with no page (Quiz Night's) leaves the row empty.",
        },
        {
          id: "both",
          label: "Its album, with a quieter Follow",
          means:
            "Open album on every row, and a small Follow beside it where the host has a page: entering leads, following is there when she wants it.",
        },
      ],
      recommended: "both",
      because:
        "Open album answers 'enter as you go' on every row, even where the host has no page, and a quiet Follow keeps follow inside the batch without pushing it, as your guest-capture note asks.",
      overrule:
        "If one action per row is calmer, Open album alone keeps the list quiet; a host is followed from their own page.",
      lands:
        "What a claim turns into on the spot: a way into the event, a person to follow, or both.",
      after: { ask: "save" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "pointer",
      label: "Pointing from the album",
      question:
        "When Priya confirms at one album and 4 more events wait under her email, what should the album say?",
      context:
        "Your question: with 4 waiting, is each claim a page of its own? Never: every option points to one review holding all 4, one card at a time. Drawn where each option lands, then at the album's moment card.",
      options: [
        {
          id: "quiet",
          label: "Nothing; her dashboard's banner",
          means:
            "The moment card names this event only. All 4 wait behind one banner on her dashboard, in one review, whenever she next goes there.",
        },
        {
          id: "line",
          label: "One line: Review all 4 on her dashboard",
          means:
            "The moment card gains one line counting the 4; Review all 4 takes her to her dashboard with the one review open at 1 of 4.",
        },
        {
          id: "here",
          label: "One line: the review opens right here",
          means:
            "The same line, but Review all 4 opens that one review over this album, so she sorts all 4 without leaving the party.",
        },
      ],
      recommended: "line",
      because:
        "She is reading the moment card anyway, so one line costs nothing to notice, and landing on her dashboard shows her where claimed events live from now on.",
      overrule:
        "If the party should keep her, the review opens over the album; if the moment should stay about Maya, say nothing.",
      lands:
        "Whether confirming at one album surfaces the rest at once, and where she sorts them.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/** One knob per id: every ask declares the same SCREEN control
 *  (`defineExploration` dedupes too; deduping twice is deduping once). */
export const IDENTITY_CLAIMS: typeof IDENTITY_CLAIMS_DRAFT = {
  ...IDENTITY_CLAIMS_DRAFT,
  controls: IDENTITY_CLAIMS_DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
