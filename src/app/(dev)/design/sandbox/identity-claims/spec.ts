import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * PHOTOS WAITING FOR YOU, ROUND THREE: WHERE SHE FIRST MEETS THE REVIEW
 * (2026-09-27).
 *
 * Round two's answers settled the review itself (docs/reviews/identity-claims.json):
 * `save=once` (a decision is written the moment she makes it), `confirm=card`
 * (the dialog at the card that says Not mine; his note: "Individual, immediate
 * handling 1 by 1 is likely best for claims here"), and `next=both` (Open album
 * on every claimed row, a quieter Follow beside it). `pointer` came back unclear
 * a second time, and not as confusion this time: "Coming off of some of my prior
 * selections, I just wanted to flag this to be sure we have our best options on
 * the table."
 *
 * ★ SO THIS ROUND IS `pointer` ALONE, WITH THE WIDEST GOOD SET. Round two's
 * three options (nothing, a line to the dashboard, a line opening the review in
 * place) are two more now: the moment card naming the four, and a standing
 * count on her avatar and the bell (the notification). Each option is a whole
 * strategy, drawn three ways so its consequence for her four other events is on
 * the tile rather than in the words: the moment at the album, where she sorts
 * them, and her dashboard a week on if she never does.
 *
 * ★ THE QUESTION IS REWRITTEN AROUND "ONE REVIEW" (his round one reading, "am I
 * visiting a separate follow up confirmation page for each event I claim?"): it
 * says the four wait in one review and asks only where she first meets it, and
 * every button that opens it names them all ("Review all 4").
 *
 * ★ THE GROUND IS HIS. Round two's asks left `asks` (the ledger keeps their
 * answers) and their picks are drawn in every frame: the review saves as it
 * goes, a Not mine asks at its card, a claim offers its album and a quieter
 * Follow. It opens where `popups`' `lists=panel` puts a list (a side panel at a
 * desk, its own screen under a back arrow in a hand), which `claims-wiring`
 * builds once `popups-wiring` lands the panel.
 *
 * ★ OUT OF THIS ROUND: which moments send an email is the `emails` board's
 * `moments` (its overrule already waits on this answer, the mail as the echo
 * of a bell or a banner); the door's You're in and a toast are carried calls,
 * as round two carried them.
 */

const IDENTITY_CLAIMS_DRAFT = defineExploration({
  id: "identity-claims",
  title: "Photos waiting for you",
  round: {
    n: 3,
    date: "2026-09-27",
    changed:
      "Pointer alone, a third time, with five answers on the table: each a whole strategy, drawn as the moment at the album, where she sorts the 4, and her dashboard a week on if she never does. His round two picks are the ground, in popups' side panel.",
  },
  history: [
    {
      n: 2,
      date: "2026-09-27",
      changed:
        "One batch, as his notes leaned. He took saving each decision the moment she makes it, the dialog at the Not mine card, and Open album with a quieter Follow; pointer came back asking for the best options on the table.",
    },
    {
      n: 1,
      date: "2026-09-24",
      changed:
        "Five decisions on the plain claim ticket: its home, the album's pointer, working through more than one, the warning before a deletion, what Finish leaves. He took the banner, one card at a time, the dialog and the profile toast.",
    },
  ],
  context:
    "Priya confirmed her email this morning at Maya and Jay's wedding, and four older events wait under it: Tom's Leaving Do, Ana's 30th (a password event) and Quiz Night were hers; a beach bonfire was someone else typing her email. Every frame wears your picks: the banner's review, one event at a time, each decision saved as she makes it, the dialog at the Not mine card, Open album with a quieter Follow, in popups' side panel (its own screen in a hand).",
  carried: [
    {
      id: "line-place",
      question: "Where does an option's row sit in the moment card?",
      taken:
        "Right under what she keeps, above the host's row: her photos lead and Follow follows, the order your guest-capture note gave the card.",
      overrule:
        "If the card's order should hold as it ships, the row goes last, under Claim a handle, where round two drew it.",
    },
    {
      id: "by-itself",
      question: "Does the review ever open by itself?",
      taken:
        "Never: she opens it, from a line, a count or the banner, so she sorts the 4 when she likes, as your banner note asked.",
      overrule:
        "If the moment should lead straight into it, the review opens over the album as the door closes.",
    },
    {
      id: "toast-mail",
      question: "Is a toast or an email one of the ways to point?",
      taken:
        "No toast: the confirmation is one beat, and a toast would stack on it. No mail here: which moments send one is the emails board's.",
      overrule:
        "If a mail should point, it joins this ask and the emails board's moments drops it.",
    },
    {
      id: "door-beat",
      question: "Does the door's You're in point to the waiting events too?",
      taken:
        "No: it is a held beat of about a second while the album loads, with nothing to press, so a line there goes unread.",
      overrule:
        "If the door should point too, its beat waits with the line and a Continue, which is identity-door's to draw.",
    },
    {
      id: "unreached",
      question: "What happens to an event she never sorts?",
      taken:
        "It waits: only a Not mine deletes, and the banner keeps counting it. The moment card says it once and is gone on her next visit.",
      overrule:
        "If walking away should count as not mine, the review asks before deleting what is left.",
    },
  ],
  asks: [
    {
      id: "pointer",
      label: "Where she meets the review",
      question:
        "Priya just confirmed at Maya & Jay's album, and 4 older events wait under her email in one review. Where should she first meet it?",
      context:
        "Your note asked for the best options on the table: here are five, each a whole strategy opening the same one review. Each is drawn three ways: now at the album, where she sorts the 4, and her dashboard a week on if she never does.",
      options: [
        {
          id: "quiet",
          label: "Nothing here; sorted from her dashboard",
          means:
            "The moment stays about Maya & Jay. The 4 wait behind the banner on her dashboard, whenever she next goes there; no album mentions them.",
        },
        {
          id: "line",
          label: "A line here; sorted on her dashboard",
          means:
            "A line under what she keeps says the 4 wait on her dashboard; Review all 4 takes her there with the review open, and its Back returns to the dashboard.",
        },
        {
          id: "here",
          label: "A line here; sorted over this album",
          means:
            "A line under what she keeps opens the review over the album, its own screen in a hand whose Back returns to Maya & Jay. The banner keeps the rest.",
        },
        {
          id: "named",
          label: "All 4 named here; sorted over this album",
          means:
            "The moment card lists the 4 with a photo each (a lock for Ana's) and one Review all 4 that opens the review over the album. A taller card.",
        },
        {
          id: "bell",
          label: "A count on her avatar and bell",
          means:
            "Nothing in the moment. Her avatar on any album, and the bell in the app, count the 4 until all are sorted; either opens the review on her dashboard.",
        },
      ],
      today: "quiet",
      recommended: "here",
      because:
        "She meets it the moment she has proven the email, and your picks make sorting right there safe: each decision saves as she makes it, so she can do one and stop, and in a hand the panel's Back returns her to the party. The banner keeps the rest.",
      overrule:
        "If the album should stay Maya's, the line sends her to her dashboard; if nothing should touch the moment, the count on her avatar holds the 4.",
      lands:
        "What the moment card says about the 4, whether the review opens over an album or only on the dashboard, and whether her avatar and the bell count them.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/** One knob per id: the ask declares the SCREEN control (`defineExploration`
 *  dedupes too; deduping twice is deduping once). */
export const IDENTITY_CLAIMS: typeof IDENTITY_CLAIMS_DRAFT = {
  ...IDENTITY_CLAIMS_DRAFT,
  controls: IDENTITY_CLAIMS_DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
