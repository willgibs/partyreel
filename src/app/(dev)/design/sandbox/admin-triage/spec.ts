import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE OPERATOR'S ACT ON A REPORT, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-18): the admin portal "could likely be
 * rethought from the ground up", carrying over a foundational identity and
 * otherwise free to be "an on-brand devtool". The `admin` board is asking him
 * for the portal's SHAPE; this one owns what happens after its home's "3
 * reports are open" row is clicked, from a stranger tapping Report at a wedding
 * to the record the night leaves behind.
 *
 * ★ THE SHELL IS SETTLED LAW HERE, NOT A VARIABLE. Every picture wears the
 * `admin` board's own recommendations: the rail, the 44 px devtool bar, the
 * four-hue state chip. Nothing below re-asks them, and the health band is
 * absent because tonight the backend is fine and the reports are not (see
 * `shell.tsx`). The security seam is never a design variable either: no preview
 * imports a server action, mounts the admin shell or sits behind `requireAdmin`.
 *
 * ★ THE STAGING IS TWO ROOTS AND TWO LOOSE PIECES. What a report IS on screen
 * unlocks three questions that only exist once it has a shape (a report with
 * nothing said, the door to a legal hold, the same act in a hand); what a
 * verdict COSTS unlocks what is left of a closed one. The shared vocabulary of
 * four inboxes and the question of who is told depend on neither and can be
 * taken in any order.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The guest's report dialog is `guest-shape`'s
 * (`dialogs`); the portal's home, nav, density, colour, destructive grammar and
 * bar are the `admin` board's, on the desk; the album seen from the guest's
 * side is not this. The doctrine is drawn, never redesigned: a report never
 * auto-hides, held media is never hard deleted, the removal's own copy stays
 * vague enough that a host cannot learn a hold exists, and the reporter is
 * anonymous by construction. The pins (`report.test.ts`, `triage.test.ts`,
 * `operator-actions.test.ts`, `escalation-guards.test.ts`, `legal-hold.test.ts`)
 * guard function and survive every shape below; none of them renders a card.
 */

/**
 * THE SCREEN, the knob the desk decisions share, so one real viewport is on the
 * stage at a time. 1440 by 900 by default, which is a laptop and where an
 * operator is; 375 is there because a report arrives at eleven at night and the
 * portal has no phone layout at all, which is what `phone` asks about.
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
  id: "admin-triage",
  title: "Acting on a report",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what a report is on screen, what a wordless one does, what pressing a verdict costs, how a legal hold is reached, whether four inboxes speak one language, what a closed report leaves, the act in a hand, and who is told.",
  },
  context:
    "Three reports are open on a Saturday night. Each is a card titled with the event's name, a status badge, a timestamp, a 160 px square of the thing that was flagged, and two buttons that write a status and nothing else. A column for the operator's reasoning has existed since the founding migration and has never been read or written; no id renders anywhere, so a legal hold means finding a UUID on two other surfaces. Every picture here is that portal on that night, with one thing changed.",
  bible: [15, 19, 21, 22],
  asks: [
    {
      id: "look",
      label: "The first look",
      question: "What should a report look like when the queue is opened?",
      context:
        "Three open reports, as they draw today: the event's name is the headline, the reported frame is a 160 px square under a timestamp, and the reason is body text beneath it. The picture is the smallest thing on the card.",
      options: [
        {
          id: "card",
          label: "The event's name and a badge, as today",
          means:
            "A card per report, titled with an album the operator has never seen, and the thing being judged at 160 px near its foot.",
        },
        {
          id: "frame",
          label: "The picture, full width, the reason under it",
          means:
            "The card becomes the reported frame with a caption. One report fills most of a screen, so the queue is scrolled rather than scanned.",
        },
        {
          id: "split",
          label: "The picture beside the reason, a row each",
          means:
            "A 200 px frame on the left, the words and the verdict on the right. An album report keeps the row and takes the width.",
        },
      ],
      recommended: "split",
      because:
        "The operator's job is to look at a photograph and read one sentence, and today the photograph is the smallest thing on the page while the album's name is the largest. The row is the only answer that makes the frame judgeable and still fits the night on one screen.",
      overrule:
        "If a report is almost always decided on the picture alone, the full-width frame is the honest card and 200 px is a compromise.",
      lands:
        "What /admin/reports draws, and how much of a night's queue an operator sees at once.",
      configs: [SCREEN],
    },
    {
      id: "reason",
      label: "Nothing said",
      question: "What should a report with no reason at all do?",
      context:
        "The reason is optional and capped at 2,000 characters, so a report can arrive carrying only a timestamp. Tonight one of the three does. Today it reads No reason provided, in the place and at the size of a sentence somebody wrote.",
      options: [
        {
          id: "same",
          label: "No reason provided, as today",
          means:
            "A sentence saying nothing was said, in the reason's own slot, so an empty report is as tall as a full one.",
        },
        {
          id: "quiet",
          label: "Nothing said, so nothing drawn",
          means:
            "The reason's block is simply absent and the card is visibly shorter. What was reported still shows; the silence is the signal.",
        },
        {
          id: "last",
          label: "Ranked under every report with words",
          means:
            "Wordless reports fall to the foot of the queue and say so. The queue sorts by how much a stranger typed.",
        },
      ],
      recommended: "quiet",
      because:
        "A line saying nothing was said is the loudest thing on a report that said nothing, and it makes an empty one look as considered as a written one. Ranking on whether a stranger typed anything puts the panicked report last.",
      overrule:
        "If wordless reports turn out to be mostly griefing, sorting them down is the cheapest triage the queue can do.",
      lands:
        "What every report without a reason draws, and whether the queue's order means anything.",
      after: { ask: "look" },
      configs: [SCREEN],
    },
    {
      id: "verdict",
      label: "The verdict",
      question: "What should pressing a verdict cost, and what should it record?",
      context:
        "Two buttons on an open report, Dismiss and Remove item and action. Each writes a status, an operator id and a time. The resolution_note column has been there since the founding migration and nothing reads or writes it.",
      options: [
        {
          id: "two",
          label: "Two buttons and no words, as today",
          means:
            "One press, nothing to type, and a year later the record of a takedown is a status and a timestamp.",
        },
        {
          id: "note",
          label: "A verdict, and a note if you want one",
          means:
            "The same two verbs with Add a note beside them. The unused column finally gets written, on the reports somebody bothers.",
        },
        {
          id: "required",
          label: "A verdict, and the note is the record",
          means:
            "Pressing either verb opens one line before it commits. Every closed report reads back as a sentence, and nothing closes without one.",
        },
      ],
      recommended: "required",
      because:
        "The site tells every guest that every report is reviewed before anything comes down, and the only proof we keep of that is an enum value. One line costs about five seconds on three reports a week, and it is the only thing that answers why this came down a year from now.",
      overrule:
        "If most reports are obvious griefing, a required sentence taxes a decision that took no thought and the optional note still fills the column when it matters.",
      lands:
        "What both verbs do, whether resolution_note is finally written, and what a closed report can say.",
      configs: [SCREEN],
    },
    {
      id: "closed",
      label: "Once it is closed",
      question: "What should a report look like after it has been answered?",
      context:
        "A closed report draws the same full card as an open one, forever, in the All view: the picture, the reason, the badge, no buttons. There is no way back from here; a removal can only be undone from Albums, a surface with its own words.",
      options: [
        {
          id: "card",
          label: "The same full card forever, as today",
          means:
            "History is as tall as the queue. Six reports is about two screens, and the three that need an answer are somewhere in it.",
        },
        {
          id: "line",
          label: "A closed report is one line",
          means:
            "The verdict, the note it left, the album and when, in a row under the open queue. History reads as a log.",
        },
        {
          id: "undo",
          label: "A line, and a way back for a day",
          means:
            "The same log, with an Undo for twenty-four hours that restores the item and reopens the report. A held item has none, by law.",
        },
      ],
      recommended: "undo",
      because:
        "A takedown is the one act here that reaches into a stranger's album, and today the only way back is a different surface with a different vocabulary. A day is well inside the seven the removal already sits in before anything is really gone.",
      overrule:
        "If undoing a takedown must always be a deliberate second act on the Albums surface, the log alone is the whole gain.",
      lands:
        "The All view, whether the portal keeps an operator's own log, and where a misfire is fixed.",
      after: { ask: "verdict" },
      configs: [SCREEN],
    },
    {
      id: "escalate",
      label: "The legal hold",
      question: "How should an operator put a reported item under legal hold?",
      context:
        "The runbook's second step is to paste a media UUID and a reason into Forensics. No id renders on a report, so that means leaving it, finding the same frame in Albums and retyping 36 characters into a third surface, at speed, at night.",
      options: [
        {
          id: "retype",
          label: "The ids live elsewhere, as today",
          means:
            "Nothing on the card is an id. Forensics takes a UUID the operator has to go to another surface and find.",
        },
        {
          id: "copy",
          label: "The ids on the card, one click each",
          means:
            "The report reference and the media id sit on the report, copyable. Forensics still asks for them to be pasted in.",
        },
        {
          id: "door",
          label: "Hold for forensics, from the report",
          means:
            "One control on the report opens the preserve panel already filled, listing what the hold touches: this frame, and everything else this guest sent.",
        },
      ],
      recommended: "door",
      because:
        "The worst step of the runbook is the one performed under the most pressure, and a hand-typed UUID is where the wrong photograph gets preserved. A hold set from the report writes the report reference into its own reason for free.",
      overrule:
        "If the hold must stay a deliberate, separate act so it is never pressed casually, showing the ids is the whole improvement.",
      lands:
        "Whether a report and Forensics are one act, and what the preserve panel says before it commits.",
      after: { ask: "look" },
      configs: [SCREEN],
    },
    {
      id: "phone",
      label: "In a hand",
      question: "What should an operator be able to do about a report from a phone?",
      context:
        "Nothing in the portal has a phone layout. Reports arrive on Saturday nights, which is exactly when nobody is at a laptop. Drawn at 375 on every option, whatever the screen knob says elsewhere.",
      options: [
        {
          id: "none",
          label: "No phone layout at all, as today",
          means:
            "Whatever the desk draws, folded into 375 by accident: a frame beside a 120 px column, one word a line, the verbs below the fold.",
        },
        {
          id: "act",
          label: "See it and stop it, nothing else",
          means:
            "The frame, the reason and one verb: take it down now. The report stays open until the record is written at a desk.",
        },
        {
          id: "all",
          label: "The whole act at 375",
          means:
            "Both verbs, the note, the ids and the hold door in a phone column. Everything the desk does, typed with a thumb.",
        },
      ],
      recommended: "act",
      because:
        "The only thing that cannot wait is a photograph that should not be up, and the only thing that should not be done at a party is writing a record somebody may read in a courtroom. One verb is the whole of what a phone is for here.",
      overrule:
        "If the operator is as often on a phone as at a desk, a surface that can only half finish the job is a surface they will resent.",
      lands:
        "Whether the portal gets a phone layout at all, and which acts a small screen is trusted with.",
      after: { ask: "look" },
    },
    {
      id: "idiom",
      label: "One language",
      question: "Should the inboxes in one nav group speak one language?",
      context:
        "Support and Applicants share a status control and a filter on New, In progress and Closed. Reports hand-rolls Open and All over a four-value enum whose Reviewed nothing writes. Albums, one row down, spells a fifth set.",
      options: [
        {
          id: "three",
          label: "Three vocabularies, as today",
          means:
            "Each surface keeps its own words, its own filter bar and its own control. Two of the four share a component; the others do not.",
        },
        {
          id: "shape",
          label: "One control, each surface's own words",
          means:
            "The shared control and filter take their statuses from the surface, so Reports gains both and keeps the outcome a report needs.",
        },
        {
          id: "one-inbox",
          label: "One inbox, filtered by kind",
          means:
            "Everything an operator answers becomes one list on one vocabulary. A report's outcome stops being a status and becomes its closing line.",
        },
      ],
      recommended: "shape",
      because:
        "The complaint is that one gesture looks different on four pages, not that a report and a job application are the same thing. Generalising the control costs one prop; merging the surfaces costs the difference between dismissed and actioned.",
      overrule:
        "If the home already ranks everything waiting, one inbox under it is the surface that ranking implies and four pages are three too many.",
      lands:
        "The filter and the status control on four surfaces, and whether Reports joins the shared triage.",
      configs: [SCREEN],
    },
    {
      id: "notice",
      label: "Who is told",
      question: "Should anyone outside the portal be told a report was answered?",
      context:
        "Nobody is told anything today. The reporter gets a thank you and never hears again; the host finds the photograph gone, and restoring it gives the same vague line a deleted row does, so a hold cannot be told from a deletion.",
      options: [
        {
          id: "silence",
          label: "Silence, as today and by doctrine",
          means:
            "No notice ever. The host learns from the gap in the album, and the runbook's do-not-tip-off step needs no exception.",
        },
        {
          id: "host",
          label: "One plain line to the host",
          means:
            "An operator removed an item from your album. No reason, no reporter, no appeal, and the same words whatever the removal was.",
        },
        {
          id: "both",
          label: "A line to the host and to the reporter",
          means:
            "That, and a closing note to whoever reported it. It needs an address, so the anonymous dialog grows an optional email field.",
        },
      ],
      recommended: "silence",
      because:
        "A notice that fires on an ordinary takedown and stays quiet on a held one is itself a way to learn a hold exists, which is the thing the trigger and the grant work exist to prevent. This is a ruling to make, not a default to pick.",
      overrule:
        "If a host is entitled to know when a stranger's complaint changed their album, one identical line on every removal is the only safe shape.",
      lands:
        "Whether the portal sends anything at all, and whether the report dialog ever asks who is reporting.",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob five decisions share arrives five times: the dock would
 * draw it five times and React would warn on the duplicate key. Each decision
 * keeps it on its own strip (that is what `configs` is for); the board declares
 * it once. `guest-upload` found this and left the finding for the constructor,
 * which could dedupe by id itself; it still stands.
 */
export const ADMIN_TRIAGE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
