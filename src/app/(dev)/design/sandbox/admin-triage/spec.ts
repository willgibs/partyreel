import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE OPERATOR'S ACT ON A REPORT, ROUND ONE (2026-09-19).
 *
 * Will (2026-09-18): the admin portal "could likely be
 * rethought from the ground up", carrying over a foundational identity and
 * otherwise free to be "an on-brand devtool". The `admin` board asked him for
 * the portal's SHAPE (answered and wired, retired at 290bbd3e); this one owns
 * what happens after its home's "reports are open" row is clicked, from a
 * stranger tapping Report at a wedding to the record the night leaves behind.
 *
 * ★ THE SHELL IS NOT A VARIABLE HERE: it was `admin`'s own board, asked and
 * answered there. Every picture wears the rail and the 44 px devtool bar as
 * they shipped (see `shell.tsx` for the one piece that did not ship as drawn).
 * Nothing below re-asks them, and the health band is absent because tonight
 * the backend is fine and the reports are not. The security seam is never a
 * design variable either: no preview imports a server action, mounts the admin
 * shell or sits behind `requireAdmin`.
 *
 * ★ THE BOARDS REFRESH (2026-09-24): five of the eight asks held one shape
 * against a single alternative; each gains a genuine third, on its own case
 * rather than as a wall the shell's own picks stand behind. `look` gains a bolder
 * queue shape (many thumbnails, not another one-report layout); `reason`,
 * `verdict`, `closed` and `phone` each gain the honest middle their own
 * `overrule` line already named or implied.
 *
 * ★ THE STAGING IS TWO ROOTS AND TWO LOOSE PIECES. What a report IS on screen
 * unlocks three questions that only exist once it has a shape (a report with
 * nothing said, the door to a legal hold, the same act in a hand); what a
 * verdict COSTS unlocks what is left of a closed one. The shared vocabulary of
 * four inboxes and the question of who is told depend on neither and can be
 * taken in any order.
 *
 * ★ THE PRODUCTION REFRESH (2026-09-28). A read-only audit found five asks
 * drawn on a product that no longer existed, and each was redrawn on the code
 * at its base: `look` draws the People section the page lists first and
 * redraws `grid` in the host review queue's picked grammar (`host-curation`'s
 * `queue=uniform`, `peek=verdict`, `keys=arrows`); `reason`'s today is the
 * muted "No reason provided." `ReportCard` has always printed, not a blank;
 * `verdict` no longer leans on a sheet Remove never opened (it acts at once,
 * and nothing writes `resolution_note`); `escalate`'s door opens the portal's
 * one confirm, the centred dialog only Release hold opens today; `notice`
 * draws the uploader as already told and asks only about the host, since
 * mailing the reporter moved to `emails`' `guest`. `closed` and `idiom` had
 * their words corrected; `phone` is exactly as it was. The refresh also found
 * a gap no ask here decides, and the context says it: the guest's Report
 * (`report-dialog.tsx`) has only ever named the whole album, so the item
 * reports every picture draws are ones `/api/reports` accepts but no control
 * sends yet.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The guest's report dialog is `guest-shape`'s
 * (`dialogs`); the portal's home, nav, density, colour, destructive grammar and
 * bar were the `admin` board's, answered and shipped; the album seen from the
 * guest's side is not this, and the words her uploads list uses are
 * `voice-guest`'s. The doctrine is drawn, never redesigned: a report never
 * auto-hides, held media is never hard deleted, nothing any party is told ever
 * tells a hold from a takedown, and the reporter is anonymous by construction.
 * The pins (`report.test.ts`, `triage.test.ts`, `operator-actions.test.ts`,
 * `escalation-guards.test.ts`, `legal-hold.test.ts`) guard function and
 * survive every shape below; none of them renders a card.
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
    date: "2026-09-28",
    changed:
      "The production refresh: look draws the People section and redraws grid in the host queue's picked grammar; reason and verdict are reframed on what ships; escalate's door is the portal's own confirm; notice asks only about the host, with a third answer in her Deleted; closed and idiom's words fixed.",
  },
  context:
    "A Saturday night of reports as /admin/reports draws them: any reported person first, then albums and items, each card titled with its event, a badge, a time, a 160 px square of what was flagged and two buttons that act at once. The operator's reasoning column has never been written, and no id renders anywhere. One gap sits under every picture: a guest's Report names only the whole album today, so each photograph here is a report the API takes but no control sends yet. Every picture is that portal on that night, with one thing changed.",
  asks: [
    {
      id: "look",
      label: "The first look",
      question:
        "What should a report look like, the one inbox where the thing judged is a picture?",
      context:
        "Support and Applicants read as a list beside the message, and the host's review queue, as he picked it, is a 4:5 grid with its verdict on a peek. Reports lists people first, then what was flagged: a row each, the frame whole, or that grid.",
      options: [
        {
          id: "split",
          label: "One row each, as the other inboxes",
          means:
            "The frame on the left at a size you can judge, the words and the verdict on the right, the same row every prose inbox now wears.",
        },
        {
          id: "frame",
          label: "The picture, full width, a caption",
          means:
            "The card becomes the reported frame with a caption. One report fills most of a screen, so the queue is scrolled rather than scanned.",
        },
        {
          id: "grid",
          label: "The review queue's 4:5 grid, judged on a peek",
          means:
            "Every report a 4:5 tile, as he picked the host's queue. A tap opens it large with its words and the verdict on it; the arrows step and Escape closes.",
        },
      ],
      recommended: "split",
      because:
        "A report is a picture and a sentence, and the sentence is half the judgement: a row keeps both in one glance, three to a screen. The host's queue has no words to read, which is why its grid works there and hides too much here.",
      overrule:
        "If busy nights bring dozens of reports and most are easy, the host's own grid and peek get an operator past them fastest, one grammar for both queues.",
      lands:
        "What /admin/reports draws, and whether judging one report or scanning many is the more common night.",
      configs: [SCREEN],
    },
    {
      id: "reason",
      label: "Nothing said",
      question:
        "A report with no reason says so in its place today: should it keep that line, draw nothing there, or sink under the ones with words?",
      context:
        "A reason is optional. Today a wordless report keeps its place in time order and prints a muted 'No reason provided.' where the sentence would sit; app-shape r2 rules an empty block absent, never hollow.",
      options: [
        {
          id: "last",
          label: "Ranked under every report with words",
          means:
            "Wordless reports fall to the foot of the queue and say so. The queue sorts by how much a stranger typed.",
        },
        {
          id: "chrono",
          label: "Keeps its place, draws nothing",
          means:
            "No reordering and no line: the row simply has no sentence, as app-shape r2's absent block would have it, so nothing marks the silence out.",
        },
        {
          id: "marked",
          label: "Keeps its place and says so, as today",
          means:
            "No reordering; a muted 'No reason provided.' sits where the sentence would, which is what every wordless report says now.",
        },
      ],
      recommended: "marked",
      // What `ReportCard` has printed since 734133d9. The board drew `chrono`'s
      // blank as today until the production refresh read the card.
      today: "marked",
      because:
        "Nothing typed is not nothing wrong: a panicked stranger often has no words at all. Saying so in place tells an operator the silence is the reporter's and not a page that failed to load, without teaching the queue that a wordless report can wait.",
      overrule:
        "If wordless reports turn out to be mostly griefing, sorting them down is the cheapest triage the queue can do.",
      lands:
        "Whether a wordless report ever reorders, and whether its card says so or draws nothing.",
      after: { ask: "look" },
      configs: [SCREEN],
    },
    {
      id: "verdict",
      label: "The verdict",
      question:
        "What should a verdict cost, and what should it leave on the record?",
      context:
        "Both verbs act at once with a toast today. Remove skips the portal's one confirm, which every other destructive act opens (Albums' own Remove included), and nothing has ever written resolution_note.",
      options: [
        {
          id: "two",
          label: "Two presses and no words, as today",
          means:
            "One press each and nothing typed; Remove acts at once with a toast, and a year later the record of a takedown is a status and a time.",
        },
        {
          id: "note",
          label: "Remove confirms; a note if you want one",
          means:
            "Remove opens the portal's one confirm, as Albums' Remove does, with an optional note in it; Dismiss stays a press with Add a note beside it.",
        },
        {
          id: "always",
          label: "A note every time, Dismiss included",
          means:
            "The same with the line required: Remove's confirm and Dismiss's field both wait for it, so resolution_note is never empty.",
        },
      ],
      recommended: "note",
      today: "two",
      because:
        "The portal's own rule is that a destructive act opens its one confirm, and this is the one that skips it. Letting that confirm carry an optional line, one prop at its source, fills resolution_note where a verdict took thought and costs nothing where it did not.",
      overrule:
        "If every verdict should leave a record a year on, 'always' requires the line, Dismiss included.",
      lands:
        "Whether Remove opens the portal's confirm, whether that confirm can carry a note, and whether resolution_note is ever written.",
      configs: [SCREEN],
    },
    {
      id: "closed",
      label: "Once it is closed",
      question:
        "What should a closed report leave, now All draws each one as its read-only card?",
      context:
        "Once All is pressed, history is still every report as its card, the answered ones read-only with a status and a time. What's left is whether a way back rides along: a line in the log, or the same line with a day's Undo.",
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
            "The same log, with an Undo for twenty-four hours that restores the item and reopens the report. A held item has none.",
        },
        {
          id: "window",
          label: "A line, undoable while the copy exists",
          means:
            "The same log, but Undo lasts as long as a removed item would anyway: the product's own 30-day Trash, not a separate clock.",
        },
      ],
      recommended: "window",
      because:
        "A day is an arbitrary line the moment a removed item's real lifespan is 30 days elsewhere in the product; matching the two means one lifecycle rule instead of two clocks that can disagree.",
      overrule:
        "If a portal-side act should always close faster than the product's own recovery window, a day keeps Undo tight and deliberate.",
      lands:
        "The All view, whether the portal keeps an operator's own log, and how long a misfire stays fixable.",
      after: { ask: "verdict" },
      configs: [SCREEN],
    },
    {
      id: "escalate",
      label: "The legal hold",
      question:
        "How should an operator reach a legal hold from the report in front of them?",
      context:
        "Setting a hold is an inline form on /admin/forensics that takes a pasted media id and a reason; only releasing one opens the portal's confirm. What's open is a report's distance from it: nothing on the card, ids to copy, or one control.",
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
            "One control on the report opens the portal's own confirm, filled in: what the hold touches, this photo and what else this guest sent here, and its reason.",
        },
      ],
      recommended: "door",
      today: "retype",
      because:
        "The worst step of the runbook happens under the most pressure, and today it starts with a UUID read off one surface and retyped into another. The portal already has a confirm that lists what an act touches; a report that opens it, filled in, takes the distance away.",
      overrule:
        "If the hold must stay a deliberate, separate act so it is never pressed casually, showing the ids is the whole improvement.",
      lands:
        "Whether a report and Forensics are one act, and what the confirm says before a hold commits.",
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
        {
          id: "hold",
          label: "Stop it, and flag it for the record",
          means:
            "The one verb of 'act', plus a single Preserve tap that opens the hold untyped; its note waits for a desk.",
        },
      ],
      recommended: "act",
      because:
        "The only thing that cannot wait is a photograph that should not be up, and the only thing that should not be done at a party is writing a record somebody may read in a courtroom. One verb is the whole of what a phone is for here.",
      overrule:
        "If evidence a party keeps deleting cannot wait for a desk either, 'hold' starts the preservation now and leaves only its note for later.",
      lands:
        "Which acts a small screen is trusted with, and whether preservation is one of them.",
      after: { ask: "look" },
    },
    {
      id: "idiom",
      label: "One language",
      question:
        "Now every inbox but Reports shares one control, should Reports also speak the others' status words?",
      context:
        "Admin r1 shares one control and filter bar across every inbox but Reports; the album folds its own behind one button too (app-vocabulary r2). What's open is Reports: its own words, the others', or none.",
      options: [
        {
          id: "three",
          label: "Keep Reports apart: three controls",
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
        "Admin r1 and app-vocabulary r2 already settle the furniture: one control, one filter bar, everywhere but Reports. Generalising it still costs one prop, while merging the words costs the difference between dismissed and actioned.",
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
        "The uploader is already told Not in the album: should the host be told anything when an operator removes a photo?",
      context:
        "The uploader's list says Not in the album for a Reject, a takedown and a hold alike. The host is sent nothing, and the photo waits in her Deleted with a Restore that answers only 'That item is no longer available.'",
      options: [
        {
          id: "silence",
          label: "Nothing to the host, as today",
          means:
            "The photo leaves the album and waits in her Deleted, where Restore answers only 'That item is no longer available.', the line a missing row gives.",
        },
        {
          id: "deleted",
          label: "Said where she looks, in Deleted",
          means:
            "Nothing is sent. In her Deleted the photo reads Removed by Partyreel, with no Restore to fail, in the same words for a takedown and a hold.",
        },
        {
          id: "host",
          label: "One plain line to the host",
          means:
            "A notice: Partyreel removed an item from your album. No reason, no reporter, no appeal, the same words whatever the removal was; Deleted says the same.",
        },
      ],
      recommended: "deleted",
      today: "silence",
      because:
        "His own direction on voice-guest is to tell people where they already are, without interruption, if at all. A host who never misses the photo loses nothing; one who goes looking finds a line instead of a Restore that fails, in words that never tell a hold from a takedown.",
      overrule:
        "If a host should never find a gap in her own album before she is told, the plain line reaches her first, in the same words for a hold.",
      lands:
        "Whether the portal ever sends a host anything, and what her Deleted says about an operator's removal.",
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
