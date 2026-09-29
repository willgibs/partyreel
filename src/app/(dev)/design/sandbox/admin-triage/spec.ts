import { defineExploration } from "@/components/lab/exploration";

/**
 * THE OPERATOR'S ACT ON A REPORT, ROUND TWO (2026-09-28).
 *
 * Round one's answers (docs/reviews/admin-triage.json): `reason=marked`,
 * `verdict=note`, `closed=window`, `escalate=door`, `idiom=shape` and
 * `notice=deleted` (his note refining it: a reported removal is purged from
 * the event, never left in the host's Deleted). Those six leave the asks, and
 * `triage-wiring` builds them beside this round, so every frame here WEARS
 * them: a wordless report says "No reason provided.", Dismiss is one press
 * with Add a note beside it and Remove opens the portal's confirm, an item
 * carries Hold for forensics, and the filter bar is the shared one in
 * Reports' own words.
 *
 * ★ HIS NOTES ARE THIS ROUND'S DIRECTION. `look=split`, with: "I don't
 * believe these are our best ideas. I think some balance of this option plus
 * option 3's review queue grid, but reshaped for better speed workflows
 * (fast/batch handling) rather than slow, one at a time. Each report should
 * provide all the context needed to handle or make a decision." And: "we may
 * need some way to collect that proof (like email the reporter if needed).
 * Otherwise, we risk taking down real media because of fake reports ... The
 * report mechanism is truly meant for harmful content." `phone=?`: "Is this
 * simply the mobile version of the question I just answered?" It was not; it
 * asked what a phone is trusted with, and is reworded so it cannot read so.
 *
 * ★ FOUR QUESTIONS, ONE ROOT. `look` is the queue itself: four shapes that
 * balance the split row's words against the grid's speed, each carrying the
 * same facts, the host queue's keys and Undo, and a front for clear harm that
 * no sweep can take. The other three are drawn ON his queue, so each waits on
 * it: `harm` (what puts a report in front: his eye, as today, or a kind the
 * reporter picks), `proof` (how a reporter is asked to back a claim, and what
 * the form must keep for that), and `phone` (which acts a phone gets).
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The mail's wrapper is the emails board's,
 * and its answered `reporter=note` is the line `proof` rides: a report keeps
 * a confirmed address only, until it closes, for one closing note in the same
 * words (not drawn here); and his emails note holds every new automatic mail
 * for a later round, so Ask for proof is a mail sent by hand. The report
 * dialog's shape is `popups`' (settled); a per-photo Report control is its
 * own future board (ROADMAP). The doctrine is drawn, never redesigned: a
 * report never auto-hides, held media is never hard deleted, nothing anyone
 * is told tells a hold from a takedown, and no one is asked for proof of the
 * worst kind. The pins (`report.test.ts`,
 * `triage.test.ts`, `operator-actions.test.ts`, `escalation-guards.test.ts`,
 * `legal-hold.test.ts`) guard function and survive every shape here.
 */
export const ADMIN_TRIAGE = defineExploration({
  id: "admin-triage",
  title: "Acting on a report",
  round: {
    n: 2,
    date: "2026-09-28",
    changed:
      "From your round one notes: the queue drawn four ways for batch sweeps with every fact on every report, what puts clear harm in front, how an operator asks a reporter for proof, and phone reworded as what a phone may do.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-28",
      changed:
        "Eight decisions on the operator's act. You took marked, note, window, door, shape and deleted; look came back as split with a note to balance it with the grid for fast, batch work, and phone asked whether it was look's phone version.",
    },
  ],
  context:
    "Round two, from your notes. A Saturday night of 15 open reports on 14 things in the portal as it ships, wearing your six round one picks, which triage-wiring builds now. Most are not harm, so a shape is judged on how fast the rest is swept and how much a report says at a glance. One gap stands: a guest's Report names only the whole album today, so each photo here is a report the API takes but no control sends yet.",
  carried: [
    {
      id: "keys",
      question: "Which keys decide a report?",
      taken:
        "The review queue's, mapped: arrows move, X ticks, Enter dismisses (the photo stays, as Approve keeps it), Space opens it whole, H moves it to the front.",
      overrule:
        "If Enter should never close a report, Dismiss moves to D and Enter only opens.",
    },
    {
      id: "one-entry",
      question: "Is a photo reported twice one entry or two?",
      taken:
        "One, counted, with every reason inside it; a verdict answers all of its reports at once.",
      overrule:
        "If each reporter's words must be judged apart, each report keeps its own row.",
    },
    {
      id: "reporter",
      question: "What does a report show of who sent it?",
      taken:
        "Whether she was signed in, as one fact, never who: the confirmed address your emails pick keeps is only ever mailed, never printed.",
      overrule:
        "If even signed in or not is too much, the line goes and every report reads as anonymous.",
    },
    {
      id: "front",
      question: "Can a sweep ever take a report that is in front?",
      taken:
        "Never: the front has no ticks, so clear harm is always its own act, judged one at a time.",
      overrule:
        "If someone floods the front with false kinds, its reports gain ticks too.",
    },
  ],
  asks: [
    {
      id: "look",
      label: "The queue",
      question:
        "What shape should the reports queue take, so most reports are swept in a batch and each still says everything needed to decide it?",
      context:
        "Split balanced with the grid, fast and batch-first, as your note asked. Each shape carries the same facts, the host queue's keys and Undo, and a front no sweep can take. Mid-night: one moved to the front with H, seven ticked.",
      options: [
        {
          id: "rows",
          label: "A sheet, one row a report",
          means:
            "Every fact on its row beside a small 4:5 frame; tick many, one Dismiss. Every report's facts at once, the smallest picture, Space for it whole.",
        },
        {
          id: "pane",
          label: "A list beside the report, as Support reads",
          means:
            "The portal's own list and pane: the queue down the left, the report in focus whole on the right. Enter dismisses it and the next is already there.",
        },
        {
          id: "grid",
          label: "The review grid, words on every tile",
          means:
            "The host queue's 4:5 tiles and keys, the front as split cards; each reason, who reported and who sent it under its tile, and Space opens it whole.",
        },
        {
          id: "albums",
          label: "Grouped by album, swept an album at a time",
          means:
            "Reports gathered under their album, its facts said once, each a tile with its words; one party's junk dismissed in one press.",
        },
      ],
      recommended: "grid",
      because:
        "Your note's balance, literally: the front wears split's words beside its frame, and the sweep wears the host queue's grid, one grammar for both queues, the most reports on a screen with each reason under its tile and the rest one Space away.",
      overrule:
        "If judging each report whole matters more than sweeping many, the pane keeps the one in focus whole, as Support reads.",
      lands:
        "What /admin/reports draws, its keys and its batch bar, and which facts every report carries.",
    },
    {
      id: "harm",
      label: "Clear harm, in front",
      question:
        "How should a report of clear harm reach the front of the queue, ahead of everything a sweep can take?",
      context:
        "No report says what it is today, so only your eye sorts the night. Drawn on your queue and on two guests' Report at 375: the mother, and a guest who looks awful in a photo. What is in front is judged alone, never ticked.",
      options: [
        {
          id: "eye",
          label: "Your eye alone, as today",
          means:
            "The form keeps its one box. Reports arrive by time and H moves one to the front; the licence and the student wait in the sweep until you reach them.",
        },
        {
          id: "kinds",
          label: "The reporter says what it is",
          means:
            "The form asks one of five kinds or Something else. Harm arrives in front, worst first, the worst covered; Something else joins the sweep.",
        },
        {
          id: "steer",
          label: "Only harm is filed",
          means:
            "The same kinds, but Something else is not a report: the form sends her to the host, who removes a photo in one tap, or to Contact.",
        },
      ],
      today: "eye",
      recommended: "kinds",
      because:
        "One tap from a guest sorts the night before anyone reads it, and the worst kind arrives covered, as the runbook asks. Something else still reaches you, so nothing unforeseen is turned away at the door.",
      overrule:
        "If the queue should hold only harm, steer turns the rest away at the form, and the sweep all but ends.",
      lands:
        "Whether the Report form asks a kind, what the queue puts in front, and whether a report that is not harm is filed at all.",
      after: { ask: "look" },
    },
    {
      id: "proof",
      label: "Asking for proof",
      question:
        "Who should an operator be able to ask to back a claim, before acting on it?",
      context:
        "Your emails pick keeps a report's confirmed address until it closes, for its closing note. This asks who Ask for proof can reach with it, a mail you send by hand. Drawn on the mother's report: her form, her inbox, the report.",
      options: [
        {
          id: "none",
          label: "No one, as today",
          means:
            "Ask for proof does not exist. A claim stands on its words alone, and you dismiss what they cannot carry.",
        },
        {
          id: "account",
          label: "Only a guest already signed in",
          means:
            "No new field: the confirmed address a signed-in guest's report keeps is the one you can ask. Signed out, as the mother is, no one.",
        },
        {
          id: "confirm",
          label: "Anyone who confirms her email as she reports",
          means:
            "The form offers Confirm your email with the door's own code, so a signed-out guest can be asked too, on the address kept until it closes.",
        },
      ],
      today: "none",
      recommended: "confirm",
      because:
        "Most guests at a party are signed out, so only a confirm on the form reaches the mother at all. It is the door's own code and the one address your emails pick already keeps, and her answer lands on the report beside its photo.",
      overrule:
        "If a report form should never ask for a code, only guests already signed in can be asked.",
      lands:
        "Whether the Report form offers Confirm your email, who Ask for proof can reach, and where an answer lands.",
      after: { ask: "look" },
    },
    {
      id: "phone",
      label: "What a phone may do",
      question:
        "Away from a desk, which acts on a report should a phone be trusted with?",
      context:
        "Not the queue's phone layout: that follows your queue pick. This asks which acts a phone gets at all, drawn at 375 on that queue with the report in front open. Today nothing is withheld: a phone can do everything a laptop does.",
      options: [
        {
          id: "stop",
          label: "Take it down, nothing more",
          means:
            "One act: the photo leaves the album now. Sweeps, notes, proof and holds wait for a desk, and the report stays open until then.",
        },
        {
          id: "sweep",
          label: "Take it down, and sweep the rest",
          means:
            "The same, plus the sweep's ticks and one Dismiss, since a dismissal has its Undo. Notes, proof and holds wait for a desk.",
        },
        {
          id: "hold",
          label: "Take it down, and start a hold",
          means:
            "The same one act, plus Hold for forensics without its reason, so evidence cannot vanish first. The reason and the rest wait.",
        },
        {
          id: "all",
          label: "Everything a desk does, as today",
          means:
            "The sweep, Remove with its note, Ask for proof and the hold, all typed with a thumb at a party.",
        },
      ],
      today: "all",
      recommended: "stop",
      because:
        "The one thing that cannot wait is a photo that should not be up, and the thing not to do at a party is write a record someone may read in a courtroom. One act is the whole of what a phone is for.",
      overrule:
        "If junk piles up while you are out, sweep clears it from a phone, each Dismiss with its Undo.",
      lands:
        "Which acts a small screen gets, and whether a sweep or a hold is one of them.",
      after: { ask: "look" },
      tile: "phone",
    },
  ],
});
