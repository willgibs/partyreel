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
    date: "2026-09-21",
    changed:
      "The overtaken audit's reshape: all eight questions reframed with admin r1, app-shape r2, guest-shape and guest-upload r1 folded in; reason narrows to the ranking half alone; notice now leans toward telling the host.",
  },
  context:
    "Three reports are open on a Saturday night. Each is a card titled with the event's name, a status badge, a timestamp, a 160 px square of the thing that was flagged, and two buttons that write a status and nothing else. A column for the operator's reasoning has existed since the founding migration and has never been read or written; no id renders anywhere, so a legal hold means finding a UUID on two other surfaces. Every picture here is that portal on that night, with one thing changed.",
  bible: [15, 19, 21, 22],
  asks: [
    {
      id: "look",
      label: "The first look",
      question:
        "What should a report look like, the one inbox where the thing judged is a picture?",
      context:
        "Admin r1 already draws every prose inbox as a list beside the message, a row each. Reports judges a picture, not prose, so what's open is whether it takes that ruled row, or breaks from it: a picture can lead a card full width.",
      options: [
        {
          id: "split",
          label: "The ruled shape: a row each",
          means:
            "The frame on the left at a size you can judge, the words and the verdict on the right, the same row every prose inbox now wears.",
        },
        {
          id: "frame",
          label: "The picture, full width, a caption",
          means:
            "The card becomes the reported frame with a caption. One report fills most of a screen, so the queue is scrolled rather than scanned.",
        },
      ],
      recommended: "split",
      because:
        "The portal's other inboxes already wear this row; a report reusing it costs nothing new and still puts the frame at a size an operator can judge, which is the one thing the ruling did not have to invent twice.",
      overrule:
        "If a report is almost always decided on the picture alone, breaking from the ruled row for a full-width frame is the one inbox that earns it.",
      lands:
        "What /admin/reports draws, and whether Reports keeps the ruled row or becomes the one exception to it.",
      configs: [SCREEN],
    },
    {
      id: "reason",
      label: "Nothing said",
      question:
        "Once a wordless report draws nothing, should it rank under reports with words, or keep its place?",
      context:
        "A report's reason is optional, and app-shape r2 rules an empty block absent, never hollow: a wordless report draws nothing either way. What's open is only its place: ranked under words, or left in the queue's own order.",
      options: [
        {
          id: "last",
          label: "Ranked under every report with words",
          means:
            "Wordless reports fall to the foot of the queue and say so. The queue sorts by how much a stranger typed.",
        },
        {
          id: "chrono",
          label: "Keeps its place",
          means:
            "No reordering: a wordless report sits exactly where its timestamp puts it, same as one that said plenty.",
        },
      ],
      recommended: "chrono",
      because:
        "A report with nothing typed is not necessarily a lesser one; a panicked stranger often has no words at all, and sorting the queue on that risks teaching operators to skip past the report that needed the fastest look.",
      overrule:
        "If wordless reports turn out to be mostly griefing, sorting them down is the cheapest triage the queue can do.",
      lands: "Whether OPEN_REPORTS ever reorders on whether a reason was typed.",
      after: { ask: "look" },
      configs: [SCREEN],
    },
    {
      id: "verdict",
      label: "The verdict",
      question:
        "What should pressing a verdict cost, now a permanent act already opens its own sheet?",
      context:
        "Admin r1 already reserves typing for the permanent act: a destructive act opens one sheet sized to the damage, so Remove has a form to write into. What's open is Dismiss: two wordless buttons, or a verdict with an optional note beside it.",
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
            "The same two verbs with Add a note beside them. Dismiss stays a press; Remove's own note lives in the sheet admin r1 already opens.",
        },
      ],
      recommended: "note",
      because:
        "Admin r1 already makes the destructive verb write a line before it commits, so this is really just Dismiss's question: an optional note costs nothing on the ones that took no thought and still fills resolution_note on the ones that do.",
      overrule:
        "If even Dismiss should leave a record every time, require the line there too and let the sheet be the only place it was ever truly needed.",
      lands:
        "What Dismiss does, and whether resolution_note is ever written outside the destructive sheet.",
      configs: [SCREEN],
    },
    {
      id: "closed",
      label: "Once it is closed",
      question:
        "What should a closed report leave, now the portal's data lives in a table?",
      context:
        "Admin r1 already rules the portal's data into a table, which is what history draws once All is pressed. What's left is whether a way back rides along: a line in the log, or the same line with a day's Undo.",
      options: [
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
        "A takedown reaches into a stranger's album, and the log admin r1 already gives history is the only place a day's way back could live.",
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
      question:
        "How should an operator reach the hold, now the preserve panel is a sheet of its own?",
      context:
        "Admin r1 already sizes the preserve panel as a destructive sheet, so it exists regardless of the answer here. What's open is the distance from a report to it: nothing on the card, ids copyable, or a control opening it directly.",
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
        "The worst step of the runbook happens under the most pressure, and admin r1 already gives it a sheet sized to the damage; a report with no way to open that sheet leaves the worst step exactly as far away as it is today.",
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
      question:
        "Now the portal's own bar reaches a phone, what should an operator be trusted to do there?",
      context:
        "Admin r1 already measures the portal's bar for a thumb at 44 px, so the shell reaches 375 regardless of the answer here. What's open is how much of the act a small screen is trusted with. Drawn at 375 on every option.",
      options: [
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
      lands: "Which acts a small screen is trusted with, now the shell itself is ruled.",
      after: { ask: "look" },
    },
    {
      id: "idiom",
      label: "One language",
      question:
        "Now every inbox shares one control, should Reports also speak the others' status words?",
      context:
        "Admin r1 shares one control and filter bar across every inbox; the album folds its own behind one button too (app-vocabulary r2). Furniture settled; what's open is the words: Reports' own, the others', or none.",
      options: [
        {
          id: "three",
          label: "Apart from the ruling: three controls",
          means:
            "Reports keeps its own filter bar and badge, unlike the shared picker admin r1 already gives Support and Applicants. The one inbox that still looks apart.",
        },
        {
          id: "shape",
          label: "One control, each its own words",
          means:
            "The shared picker and filter bar; Reports still says Open, Dismissed, Actioned while the others say New, In progress, Closed.",
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
        "Admin r1 and app-vocabulary r2 already settle the furniture: one control, one filter bar, everywhere. Generalising it still costs one prop, while merging the words costs the difference between dismissed and actioned.",
      overrule:
        "If the home already ranks everything waiting, one inbox under it is the surface that ranking implies.",
      lands:
        "The filter and status control on four surfaces, and whether Reports' own words survive the merge.",
      configs: [SCREEN],
    },
    {
      id: "notice",
      label: "Who is told",
      question:
        "Should the portal tell anyone, now a host already lives with one silent gap?",
      context:
        "A guest may delete any upload for good; a host meets that gap in the album (guest-shape r1). Guest-upload r1 refuses any gap a person notices themselves. The two leans: stay silent, by doctrine, or tell the host one line.",
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
      recommended: "host",
      because:
        "Two rulings now argue against a second silent gap: a host already absorbs one when a guest deletes their own upload, and guest-upload r1 states the case against a gap nobody is told about. One line keeps a hold indistinguishable from an ordinary removal.",
      overrule:
        "If telling a hold apart from an ordinary removal is the greater risk, the doctrine's silence is the only shape that guarantees it.",
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
