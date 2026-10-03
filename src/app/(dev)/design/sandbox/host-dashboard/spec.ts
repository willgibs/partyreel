import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE HOST DASHBOARD, ROUND THREE: FROM ONE EVENT TO TWO HUNDRED.
 *
 * Will answered round two on 2026-10-03 (`docs/reviews/host-dashboard.json`):
 * `events=recent` with a new direction ("All of these still feel like they're
 * over-organizing ... a recent row as collapsible (keeps last few quickly
 * accessible), then simply a gallery/table/list with deep sort/filter/display
 * customization ... Another exploration please"), `lead=made` ("We should
 * ensure featured events with no uploaded media yet still look beautiful ...
 * Worth a dedicated exploration"), and `pick=kept` ("these could be more like
 * sort options, such as: newest, last opened, upcoming, etc.").
 *
 * ★ THREE DECISIONS, ONE PAGE, NOTHING STAGED. `events` is where a host shapes
 * one collection under a collapsible Recent row (a Display menu, a toolbar in
 * the open, saved views, one field that finds), drawn at 1, 3, 10, 40 and 200
 * events. `stage` is the stage of an event with no photographs, just made and
 * the week before. `rule` is where the stage's rule is chosen among four
 * sentences she can predict, never a list of her events. Each is drawn wearing
 * the board's answers to the other two (the recommendation until he answers).
 *
 * ★ EVERY FRAME IS PRODUCTION'S PAGE. The head, the week, the tile, the rows
 * view, the stage with photographs and every rule under them are production's,
 * composed by `buildHomeView` from fixtures in production's own shapes
 * (`model.ts`, `model.test.ts`); an option adds only its piece. Ranges of days
 * and the newest leading on a quiet day are drawn as settled (`event-dates`
 * wires both this round).
 *
 * Nothing here asks what another board asks: the atoms are `identity`'s, the
 * hub's head is `event-header`'s, the guest's screens are `the-wait`'s and
 * `identity`'s, and the event page Try it opens is a stand-in.
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
    n: 3,
    date: "2026-10-03",
    changed:
      "From your round two notes: your events for a host of one to ten that still scale to two hundred (Recent over one collection she shapes), the stage before its first photo, and the stage's rule as a choice.",
  },
  history: [
    {
      n: 2,
      date: "2026-10-03",
      changed:
        "Getting back to old events at forty, and which event leads the stage. You asked for Recent over one shaped collection, the newest leading, and a rule rather than a pick.",
    },
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "The dashboard rethought whole. You picked the party of the moment on its stage, this week's parties, your events grouped by when and the live wall; all four are built.",
    },
  ],
  context:
    "Round three, on the dashboard as it ships, for five hosts on Tuesday 10 November, a quiet day: Maya with one event, Nia with three (her wedding made last night), Ari ten, Jo forty and Rae two hundred. Every frame runs: press any event to open it, then come back. Ranges of days and the newest leading the stage are drawn as settled. The Screen knob draws a phone. Each caption is read off its frame.",
  opening: {
    about:
      "Round three: your events for a host of one to ten that scale to hundreds, the stage before its first photo, and the stage's rule as a choice.",
    settled: [
      "Your round one picks are built: the party of the moment on its stage, this week's parties and the live wall; grouped by when gives way.",
      "The newest event leads the stage on a quiet day, and a party on its own day always leads.",
      "An event may run over a range of days, no times; event-dates wires it and the newest lead this round, drawn here as settled.",
      "The tile, the lens and the search from nine events stay as built; the atoms are identity's.",
    ],
    earlier: [
      "On your events: 'All of these still feel like they're over-organizing the experience in one way or another.'",
      "'We should design for users with 1 to maybe 10 events in mind as the primary expectation, but ensure it scales up to dozens or hundreds'",
      "'A recent row as collapsible ... then simply a gallery/table/list with deep sort/filter/display customization'",
      "On the lead: 'Ensure featured events with no uploaded media yet still look beautiful as featured in the dashboard.'",
      "On the pick: 'Rather than directly selecting an event, these could be more like sort options, such as: newest, last opened, upcoming'",
    ],
  },
  terms: [
    {
      term: "Recent",
      means:
        "A row over your events holding the four you opened lately, newest first; it folds to one line.",
    },
    {
      term: "Display menu",
      means:
        "One menu over your events: the layout, the order, what shows, the groups and the cover size.",
    },
    {
      term: "view",
      means:
        "A saved way of seeing your events (its layout, order and filter), kept as a tab.",
    },
    {
      term: "stage",
      means:
        "The dark band leading the dashboard: one event, drawn from its own photographs.",
    },
    {
      term: "lamp",
      means:
        "One of the house's five colours of light; an event's own lights its stage until photos do.",
    },
    {
      term: "rule",
      means:
        "How the stage picks its event: Newest, Upcoming, Last opened or Latest photos.",
    },
    {
      term: "quiet day",
      means: "A day with no party on its own day or within a month of it.",
    },
    {
      term: "Try it",
      means:
        "A frame that is the dashboard running: press anything, open an event, then come back.",
    },
  ],
  carried: [
    {
      id: "kept",
      question: "Where are her choices kept?",
      taken:
        "On her account, so her phone opens the way her laptop left it: a column on her profile, the Orchestrator's migration.",
      overrule:
        "On this device, in a cookie, as the view toggle is kept today.",
    },
    {
      id: "default",
      question: "How do her events open before she shapes them?",
      taken:
        "Covers, the newest first, nothing grouped or filtered: a host with ten sees ten covers and nothing to set.",
      overrule: "Grouped by when, as the page ships today.",
    },
    {
      id: "recent",
      question: "From how many events does Recent show, and what does it hold?",
      taken:
        "From seven, the last four she opened, never the stage's or this week's: below seven every event fits her first screen.",
      overrule: "From her second event.",
    },
    {
      id: "newest",
      question: "What does Newest lead with when a party is near?",
      taken:
        "A party within a month first, as the quiet-day rule settled; the other rules say exactly what they name.",
      overrule: "The newest made, always, a party's own day aside.",
    },
    {
      id: "light",
      question: "Where does an empty event's colour come from?",
      taken:
        "One of the house's five lamps, picked by the event and never changing, as light only; its photos take over.",
      overrule: "Her pick of the five, in Settings.",
    },
  ],
  asks: [
    /* ── 1. Your events, one to two hundred ─────────────────────────────── */
    {
      id: "events",
      label: "Your events, 1 to 200",
      question:
        "How should a host shape her events, so ten read simply and two hundred still reach an old party in a press or two?",
      where: ["Host", "The dashboard", "Your events"],
      when: "Under the stage and this week: Maya's one, Nia's three, Ari's ten, Jo's forty and Rae's two hundred.",
      matters:
        "Most hosts have one to ten events and every one meets this list; a planner lives in it.",
      lands:
        "How your events lay out under Recent, where a host shapes them, and what the page keeps of her choice.",
      context:
        "Five frames scrolled to Your events: Maya (1), Nia (3), Ari (10, Try it), Jo (40, back from three 2025 weddings) and Rae (200, back to a 2023 wedding). Recent is the same in each; what moves is where her choices live.",
      options: [
        {
          id: "menu",
          label: "One Display menu",
          means:
            "Covers, the newest first; one Display button holds the layout, the order, what shows and the groups, and a line says what is set.",
          gains:
            "Quiet at ten, one button; deep at two hundred, every choice in one place.",
          costs:
            "What is set hides behind a press, said only in a small line under the head.",
        },
        {
          id: "bar",
          label: "Everything in the open",
          means:
            "The layout, the order and Filter stand in a row over her events, each filter a chip she can clear.",
          gains: "What is set is always in sight, one press each.",
          costs:
            "A row of controls even for three events, and chips that crowd a phone.",
        },
        {
          id: "views",
          label: "Her ways, saved as views",
          means:
            "All, Upcoming and Past as tabs, and any she saves (Weddings, by date); each view keeps its own layout, order and filter.",
          gains:
            "A planner keeps several ways at once and switches in one press.",
          costs: "A word to learn (view), and tabs that organize again.",
        },
        {
          id: "find",
          label: "One field that finds",
          means:
            "One wide field takes a name, a year or a word (2023, upcoming, waiting); the layout and the order sit beside it.",
          gains: "Any old party is a few letters away, with nothing to set.",
          costs:
            "Typing on a phone, and the words it knows have to be learned.",
        },
      ],
      recommended: "menu",
      because:
        "One quiet button for the host with ten; for the planner with two hundred every choice in one place, and what is set said in a line.",
      overrule: "If what is set should always show, everything in the open.",
      configs: [SCREEN],
    },

    /* ── 2. The stage before its first photo ────────────────────────────── */
    {
      id: "stage",
      label: "The stage before its first photo",
      question:
        "How should the stage draw an event with no photos yet, so it looks beautiful the night she makes it and the week before?",
      where: ["Host", "The dashboard", "The stage"],
      when: "Nia made her wedding last night, so it leads her dashboard as her newest event, and its album is still empty.",
      matters:
        "Every new host meets this stage first, and with the newest leading, most new events stand on it.",
      lands:
        "What the stage draws before photographs: the code, readiness, the event's own light and its one delight.",
      context:
        "Nia's dashboard, two frames: her wedding just made (no date, the code never opened) and the week before (Saturday to Sunday, the door set, opened 12 times). Each way says production's words, ticks and acts.",
      options: [
        {
          id: "lit",
          label: "The code, lit by its own lamp",
          means:
            "The code on its plate in the event's own light, Settings' five steps under the name: Create's last screen, carried here.",
          gains:
            "What guests need, beautiful, and one look from Create to here.",
          costs: "The code still leads, so it reads as setup until photos land.",
        },
        {
          id: "album",
          label: "The album, waiting",
          means:
            "The stage's own photo frames, empty and softly lit, the code in the first: the first photos land here.",
          gains: "Shows what the stage becomes; photos fill the very frames.",
          costs: "Empty frames can read as missing pictures.",
        },
        {
          id: "card",
          label: "Set like an invitation",
          means:
            "The name large and centred, its date set like an invitation's, lit from above; the code small beside readiness.",
          gains: "The party itself leads, beautiful with nothing in it.",
          costs:
            "The code is smaller, and the stage changes shape once photos land.",
        },
        {
          id: "guest",
          label: "What guests will see",
          means:
            "Her guests' first screen on a phone beside the code that opens it: the name, her welcome, Add photos.",
          gains: "The empty event made concrete, and a missing welcome shows.",
          costs:
            "A phone drawn in a page, a stand-in of another board's screen.",
        },
      ],
      recommended: "lit",
      because:
        "The code is what an empty event needs, so it leads, lit by its own lamp: one look from Create's last screen to the dashboard.",
      overrule: "If the party should lead before its setup, the invitation.",
      configs: [SCREEN],
    },

    /* ── 3. The stage's rule ────────────────────────────────────────────── */
    {
      id: "rule",
      label: "The stage's rule",
      question:
        "Where should a host choose the stage's rule (newest, upcoming, last opened, latest photos), so it stays hers without a list of events?",
      where: ["Host", "The dashboard", "The stage"],
      when: "Nia would rather see her next party than her newest; Jo, forty events in, wants the one she was in last.",
      matters:
        "The stage is the first thing the dashboard shows, and no one rule fits every host.",
      lands:
        "Where the rule is set and kept: on the stage, over it, in the page's head or in Settings.",
      context:
        "Two frames each: Nia's three with the control in use, and Try it on Jo's forty, where a rule moves the stage at once. Each rule says what it would lead with today; a party on its own day always leads.",
      options: [
        {
          id: "corner",
          label: "A menu in the stage's corner",
          means:
            "The rule's word on the stage's glass (Newest); its menu lists the four, each with what it would lead with today.",
          gains: "Set where it shows, one press from the stage.",
          costs: "A control on the stage, over its photograph.",
        },
        {
          id: "tabs",
          label: "The four over the stage",
          means:
            "Lead with: Newest, Upcoming, Last opened and Latest photos as a row over the stage, the one on pressed.",
          gains: "Every rule seen and one press away, nothing hidden.",
          costs: "A row of words over the stage on every visit.",
        },
        {
          id: "head",
          label: "In the page's Customize",
          means:
            "Customize in the page head, beside New event, holds the rule and the Recent row: the page's own preferences.",
          gains: "The stage stays pure; the page's preferences live together.",
          costs: "The rule sits away from the stage, so fewer hosts find it.",
        },
        {
          id: "settings",
          label: "In Settings",
          means:
            "Settings gains a Your dashboard section; the stage's corner names the rule and opens it.",
          gains: "Set once, out of sight, with the account's other choices.",
          costs: "Two pages away from the stage it changes.",
        },
      ],
      recommended: "corner",
      because:
        "Your pick on the stage, now a rule: set where it shows, one press away, and never a list of her events.",
      overrule: "If the stage should carry nothing, the page's Customize.",
      configs: [SCREEN],
    },
  ],
});
