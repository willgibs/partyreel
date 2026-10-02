import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE HOST DASHBOARD, ROUND TWO: ON THE PAGE AS IT NOW SHIPS.
 *
 * Will answered round one on 2026-10-02 (`docs/reviews/host-dashboard.json`):
 * `purpose=stage`, `needs=week`, `events=seasons`, `arrivals=live`, and
 * `dashboard-wiring` built all four. His two open notes are this round:
 *  - on `events=seasons`: a host "may have custom preferences on (such as
 *    filter, sort, gallery vs table/list, etc)", and at forty "the host isn't
 *    always having to scroll to the very bottom if they're trying to bounce
 *    between old events back-to-back"; "likely some Frankenstein across all
 *    three";
 *  - on `purpose=stage`: "We'll have to decide which one gets featured in
 *    different cases, such as no dates on multiple events."
 *
 * ★ THREE DECISIONS, ONE PAGE, NOTHING STAGED. `events` is the collection at
 * forty, four ways (as built, a Recent row, a Display menu, a list for the
 * past), each with what it remembers. The stage's question is two: `lead`, the
 * rule on a quiet day (as built, the newest event, where she left off), and
 * `pick`, whether she can choose it herself (no, a pick she keeps, a step
 * through its contenders). Each is drawn in what the board holds for the
 * others: as built until he answers (`today`), his pick after.
 *
 * ★ EVERY FRAME IS PRODUCTION'S PAGE. The head, the stage, the week, the tile,
 * the rows view and `EventsSection` are production's components, composed by
 * production's `buildHomeView` over production's rules from fixtures in its
 * own shapes (`model.ts`, `model.test.ts`); an option adds only its piece. Try
 * it frames run: press any event to open its page, come back.
 *
 * Nothing here asks what another board asks: the atoms are `identity`'s, the
 * hub's head is `event-header`'s, saving photographs is `take-home`'s and the
 * waiting album is `the-wait`'s; the event page Try it opens is a stand-in.
 */
export const HOST_DASHBOARD = defineExploration({
  id: "host-dashboard",
  title: "The host dashboard",
  surface: "host",
  desk: 25,
  lives: [
    "src/app/(app)/dashboard/page.tsx",
    "src/app/(app)/dashboard/actions.ts",
    "src/components/app/dashboard/",
    "src/lib/dashboard/",
    "docs/systems/dashboard.md",
  ],
  round: {
    n: 2,
    date: "2026-10-02",
    changed:
      "From your round one notes, on the dashboard as it ships: your events made quick at forty, four ways to try (press an event, come back), which event leads the stage on a quiet day, and whether a host can choose it herself.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "The dashboard rethought whole. You picked the party of the moment on its stage, this week's parties, your events grouped by when and the live wall; all four are built.",
    },
  ],
  context:
    "Round two, on the dashboard as it ships: every frame is production's page (its head, stage, week and events) for three hosts on Tuesday 10 November, a quiet day with no party on it: Maya with one event, Nia with three and none dated, and Jo with forty. Try it frames run: press any event to open its page, then Your events to come back. The Screen knob draws a phone. Each caption is read off its frame.",
  opening: {
    about:
      "The dashboard as it ships, round two: getting back to an old event fast at forty, and which event the stage leads with when time cannot say.",
    settled: [
      "Your four picks are built: the party of the moment on its stage, this week's parties, your events grouped by when, the live wall.",
      "A party on its own day always leads the stage; of two on one night the busier, the other first in This week.",
      "The tile and its marks, the lens and the search from nine events stay as built; the atoms are identity's.",
      "The hub's head is event-header's and saving photos is take-home's; the event page in Try it is a stand-in.",
    ],
    earlier: [
      "On grouped by when: 'This feels like something a host may have custom preferences on (such as filter, sort, gallery vs table/list, etc).'",
      "'Ideally it's a bit customizable, so in a layout with 40 events as you presented, the host isn't always having to scroll to the very bottom'",
      "'...if they're trying to bounce between old events back-to-back (like saving old photos from old events).'",
      "'Best selection is likely some Frankenstein across all three, but if that fails, we can always revert back to an option here.'",
      "On the stage: 'We'll have to decide which one gets featured in different cases, such as no dates on multiple events.'",
      "The wiring found Create asks no date, so several undated events is every new host's case, not an edge.",
    ],
  },
  terms: [
    {
      term: "stage",
      means:
        "The dark band leading the dashboard: one event, drawn from its own photographs.",
    },
    {
      term: "quiet day",
      means: "A day with no party on its own day or within a month of it.",
    },
    {
      term: "Try it",
      means:
        "A frame that is the dashboard running: press any event to open its page, then come back.",
    },
    {
      term: "Recent",
      means:
        "A row over your events holding the ones you opened lately, newest first.",
    },
    {
      term: "Display menu",
      means:
        "One menu over your events: covers or a list, how they group, and their order.",
    },
    {
      term: "lens",
      means:
        "The row of counts over your events: All, Hosting, Guest, Deleted.",
    },
  ],
  carried: [
    {
      id: "kept",
      question: "Where does the page keep what it remembers of her?",
      taken:
        "On her account, so her phone opens the way her laptop left it: a column on her profile, the Orchestrator's migration.",
      overrule:
        "On this device, in a cookie, as the view toggle is kept today.",
    },
    {
      id: "back",
      question: "Does Back bring her to the page as she left it?",
      taken:
        "Yes, in every new option: her scroll and a year she opened come back with her.",
      overrule:
        "As built: the page draws fresh after Back, a year she opened folded again.",
    },
    {
      id: "nine",
      question: "From how many events do the new pieces show?",
      taken:
        "From nine, with the search: below that every event fits a screen or two.",
      overrule: "From her first event.",
    },
  ],
  asks: [
    /* ── 1. Your events at forty ─────────────────────────────────────────── */
    {
      id: "events",
      label: "Your events at forty",
      question:
        "How should forty events work, so she can bounce between old ones without scrolling to the foot?",
      where: ["Host", "The dashboard", "Your events"],
      when: "Jo, forty events in, is saving the photos of three 2025 weddings, one after another, from her dashboard.",
      matters:
        "Grouped by when folds old years at the foot, so each old party is a scroll and a press, again after every Back.",
      lands:
        "How your events lay out at forty, what sits at their top, and what the page remembers of her choice.",
      context:
        "Three frames each: Try it on Jo's forty (press any event, then Your events to come back), the page as she comes back from Theo & Ana's 2025 wedding, and Maya with her one event. The stage is as built.",
      options: [
        {
          id: "built",
          label: "Grouped by when, as built",
          means:
            "As it ships: coming up, just past, this year, then each year folded into a line, the list one toggle away.",
          gains:
            "The parties near today draw large, and there is nothing new to learn.",
          costs:
            "An old party is a scroll and a fold away, folded again after every Back.",
        },
        {
          id: "recent",
          label: "Recent on top",
          means:
            "The events she opened lately ride one row over the groups by when, a press each; a year she opened stays open.",
          gains:
            "Bouncing between old events is a press each, with nothing to set up.",
          costs: "One more row, and what she opens is kept on her account.",
        },
        {
          id: "display",
          label: "Shown her way",
          means:
            "A Display menu: covers or a list, grouped by when, by year or not at all, in her order, kept for her account.",
          gains:
            "Each host shapes it once: covers for a wedding, a list by year for a planner.",
          costs: "A menu to learn, and an old party is still a scroll away.",
        },
        {
          id: "index",
          label: "Covers near, a list for the past",
          means:
            "What is coming and just past stay covers; everything older is one list, its years as tabs, sorted by any column.",
          gains:
            "Every old event sits in one short list, sortable, never folded.",
          costs: "Two looks on one page, and the past reads as a tool.",
        },
      ],
      recommended: "recent",
      today: "built",
      because:
        "Bouncing is a working set: the page keeps the events she opened on top, and the groups by when stay as you picked them.",
      overrule: "If she should shape the page herself, shown her way.",
      configs: [SCREEN],
    },

    /* ── 2. The stage on a quiet day ─────────────────────────────────────── */
    {
      id: "lead",
      label: "The stage on a quiet day",
      question:
        "On a quiet day, with no party on its day or within a month, what should the stage lead with?",
      where: ["Host", "The dashboard", "The stage"],
      when: "Nia has three events and dated none; Jo's forty are in a November lull, her next party 32 days away.",
      matters:
        "Create asks no date, so most hosts meet this case first, and the stage is the first thing the dashboard shows.",
      lands:
        "The stage's rule for a quiet day: which event leads when time cannot pick, or whether it rests.",
      context:
        "Two frames each: Nia's three undated events (a wedding she made last night, still empty, and two older albums), and Try it on Jo's forty: open an old wedding, come back, and see what the stage does.",
      options: [
        {
          id: "time",
          label: "The next party, else the latest photos",
          means:
            "As built: the next dated party however far, else the album photos last landed in, else the newest made.",
          gains:
            "Nothing new: the stage follows the calendar, then the camera.",
          costs:
            "Nia's new wedding waits behind an old album until it has photos.",
        },
        {
          id: "made",
          label: "The newest event",
          means:
            "On a quiet day the event she made last leads, dated or not: the one she is setting up.",
          gains: "What she is setting up leads the moment she makes it.",
          costs: "A test event made after the real one takes the stage.",
        },
        {
          id: "left",
          label: "Where she left off",
          means:
            "A party within a week still leads; otherwise the event she last opened, a new one counting as opened.",
          gains:
            "The stage is whatever she is working on, with nothing to set.",
          costs: "The stage changes each time she comes back from an event.",
        },
        {
          id: "rest",
          label: "The stage rests",
          means:
            "From nine events, a quiet day's stage folds to one line (the next party and its act), and her events lead the page.",
          gains:
            "On a quiet day a planner's events reach the first screen, even on a phone.",
          costs:
            "Quiet days lose the photograph, and under nine events today's rule stays.",
        },
      ],
      recommended: "made",
      today: "time",
      because:
        "Every new host meets undated events first, and the one she just made is the one she needs next.",
      overrule: "If the calendar should always decide, the next party.",
      configs: [SCREEN],
    },

    /* ── 3. Her own choice ───────────────────────────────────────────────── */
    {
      id: "pick",
      label: "Her own choice",
      question:
        "Should a host be able to choose which event leads the stage herself?",
      where: ["Host", "The dashboard", "The stage"],
      when: "The stage leads with the rule's pick, and she would rather see another of her events there.",
      matters:
        "No rule fits every host: a test album after the real one, an anniversary, a party she is planning.",
      lands:
        "Whether the stage carries a control, and whether her choice is kept.",
      context:
        "Two frames each: Nia's three undated events with the control open, and Try it on Jo's forty, where the stage's top corner works.",
      options: [
        {
          id: "none",
          label: "The rule alone",
          means:
            "No control: the stage leads with the rule's pick on every visit.",
          gains: "Nothing to learn, and nothing on the stage but the party.",
          costs: "When the rule picks wrong for her, she cannot fix it.",
        },
        {
          id: "kept",
          label: "Hers, until she lifts it",
          means:
            "Change in the stage's corner lists her events; the one she picks leads until she lifts it, a party's own day aside.",
          gains: "One press fixes any misfire, and it stays fixed.",
          costs: "A control on the stage, and a pick can outlive its reason.",
        },
        {
          id: "step",
          label: "Step through, nothing kept",
          means:
            "Arrows in the stage's corner step through its next two contenders; every visit opens on the rule's pick.",
          gains: "She sees the alternatives in place, with nothing to undo.",
          costs: "Arrows on the stage, and her choice is gone next visit.",
        },
      ],
      recommended: "kept",
      today: "none",
      because:
        "The rule is right most days; when it is not, she says so once, on the stage itself, and it stays said.",
      overrule: "If the stage should stay pure, the rule alone.",
      configs: [SCREEN],
    },
  ],
});
