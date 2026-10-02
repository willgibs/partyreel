import { defineExploration } from "@/components/lab/exploration";

import { MOMENT, SCREEN } from "./knobs";

/**
 * THE HOST DASHBOARD, RECONCEIVED (the host-dashboard track, cut 2026-10-02).
 *
 * Will answered event-ready's `needs` (quiet, one job per event, a ready
 * count) with "not clear to me" and a note that is this board's brief: a
 * planner with forty events gets forty "next" items, which flags everything
 * and so nothing; the bell already says some of it; and "the 'next items',
 * 'your events' and 'just arrived' aren't cutting it for me, individually or
 * as a sum total". So the board starts over from what the page is FOR.
 *
 * ★ FOUR QUESTIONS, PROGRESSIVE: what it is for first, then (each drawn
 * inside his pick) what asks for attention, how forty events present, and
 * what takes Just arrived's place. Every option is the whole page in
 * production's shell, at one event (Maya) and at forty (Jo), on a day the
 * Day knob moves; the composition is `dashboard.tsx`, the rules are
 * `model.ts` (tested), and readiness is production's own function.
 *
 * ★ TIME IS THE BOARD'S IDEA. An event has phases (before its date, its day,
 * the month after, the years after), and what deserves attention follows
 * them; forty events are mostly past, and a party long over speaks only when
 * someone waits at its door or in its queue. Each option answers the at-forty
 * problem its own way; this is the recommendation's way.
 *
 * Nothing here asks what another board asks: the atoms are `identity`'s (the
 * board names the two it needs: the event tile and the storage ring), the
 * hub's head is `event-header`'s, Create is `create-wizard`'s.
 */
export const HOST_DASHBOARD = defineExploration({
  id: "host-dashboard",
  title: "The host dashboard",
  surface: "host",
  desk: 25,
  lives: [
    "docs/systems/host-app.md",
    "docs/systems/notifications-analytics-growth.md",
    "src/app/(app)/dashboard/page.tsx",
    "src/components/app/dashboard/",
    "src/lib/dashboard/",
    "src/components/app/event-card.tsx",
    "src/components/app/notification-bell.tsx",
    "src/lib/notifications/build.ts",
  ],
  round: {
    n: 1,
    date: "2026-10-02",
    changed:
      "The dashboard rethought whole from your event-ready note: what it is for, what asks for attention at 1 event and at 40, how 40 events present, and what takes Just arrived's place.",
  },
  context:
    "Every frame is the whole dashboard in production's shell, drawn twice: Maya with her one event (her 30th, Friday 2 October, on an Event Pass) and Jo, a planner on Pro with forty since New Year's Day 2025. The Day knob opens both a week before, on the night or the morning after; the Screen knob draws a phone. Each caption is read off its frame.",
  opening: {
    about:
      "The host dashboard reconceived: what it is for, what asks for attention at 1 event and at 40, how 40 events present, and what replaces Just arrived.",
    settled: [
      "Readiness is production's one function (the hub's checklist and Settings' steps): every tick and step here reads it, never a copy.",
      "The bell stays in the bar on every host page, and its words for a queue stay as they are: 2 people at the door, 18 uploads to review.",
      "The grace banner, the claims review and the page invite keep their places and words; the New event door stays live at the cap.",
      "Buttons, chips and cards are the identity board's; the hub's head is event-header's; Create is create-wizard's.",
    ],
    earlier: [
      "Your note on event-ready's needs, where you answered not clear to me, word for word across the next lines:",
      "\"May warrant another exploration. For users who create lots of events, I don't want this section to get super stacked with 40 'next' items for 40 events.",
      "In that case, this feature loses most of its value because it's flagging 40 things to do, not just the ones which are actually important.",
      "We already have notifications for some things like this - I'd like to rethink this section on the dashboard, from its purpose/benefit to its UI",
      "to what the absolute best thing overall to include in this space is.",
      "As a broader note, I'm also curious about redesigning the host dashboard and anything around it in general to better rethink the best UX/UI",
      "now that we're getting closer to a more full feature set. The 'next items', 'your events' and 'just arrived' aren't cutting it for me,",
      'individually or as a sum total."',
      "event-ready's needs had drawn three: say nothing, one job per event, and a ready count; it recommended one job per event.",
      "This round's direction: bespoke and experiential, sleek and modern, never tilted or playful, minimal yet high-information, far less text.",
    ],
  },
  terms: [
    {
      term: "stage",
      means:
        "The dark band leading the page that holds one event, drawn from its own photographs.",
    },
    {
      term: "party of the moment",
      means:
        "The event that leads: the one on its day, else the nearest within a month, else the next coming.",
    },
    {
      term: "mark",
      means:
        "A small label on an event's cover: Live, a count waiting, or a step to do.",
    },
    {
      term: "live wall",
      means:
        "A party's newest photographs on its night, landing on the stage as they arrive.",
    },
    {
      term: "lens",
      means:
        "The row over your events that shows all of them, the ones you host, the ones you added to, or deleted.",
    },
  ],
  carried: [
    {
      id: "head",
      question: "What heads the page?",
      taken:
        "The day, then the storage ring and New event in one slim row; the Dashboard title and the full-width storage line go.",
      overrule:
        "Keep the Dashboard title, its X of N used line and the full-width storage line.",
    },
    {
      id: "tile",
      question: "What does an event's cover carry?",
      taken:
        "Its photograph (its date before it has one), its name and when, and at most a mark in each top corner; the QR chip and the pills move off.",
      overrule:
        "Today's card: the QR chip, and the date, item and Open or Paused pills on every cover.",
    },
    {
      id: "finished",
      question: "Does a party long over ever ask for anything?",
      taken:
        "Only when someone waits at its door or in its queue; a paused album there is how a host finishes a party, never a step.",
      overrule: "Paused uploads ask on any event, as the band asks today.",
    },
    {
      id: "busier",
      question: "Which event leads when two share a night?",
      taken:
        "The busier: people waiting first, then photographs landing; the other comes first among the rest.",
      overrule: "The one made first, so the stage never swaps mid-evening.",
    },
  ],
  asks: [
    /* ── 1. What it is for ───────────────────────────────────────────────── */
    {
      id: "purpose",
      label: "What it is for",
      question: "What should the dashboard be for?",
      where: ["Host", "The dashboard", "Every visit"],
      when: "A host opens Partyreel: the first page after sign-in, and where every event's Back lands.",
      matters:
        "It decides what a host meets first, and every other question on this board is drawn inside it.",
      lands:
        "What leads the dashboard, what follows it in what order, and what leaves the page.",
      context:
        "Each drawn whole at 1440: Maya with her one event and Jo with forty, on the same Friday night (the Day knob moves it). The other three questions wear their recommendations until you answer them.",
      options: [
        {
          id: "stage",
          label: "The party of the moment",
          means:
            "One event leads on a stage made of its own photographs: tonight's party, else the nearest, else the next. Everything else follows, quieter.",
          gains:
            "At 1 event the page is that party; at 40, time picks the one that leads.",
          costs:
            "With three parties this weekend, one leads and the other two sit in a row below it.",
        },
        {
          id: "shelf",
          label: "Every event, in its place",
          means:
            "The page is your events: covers that each wear their own state as a mark (Live, a count waiting, a step), in one collection that scales.",
          gains:
            "The calmest page: one collection that scales, each state marked on its own event.",
          costs:
            "At 1 event it is one cover and a lot of room; at 40 she scans the covers for marks.",
        },
        {
          id: "desk",
          label: "What needs you, first",
          means:
            "A list of what waits across your events leads, each step with its act in place (Let them in, Print, Review); your events follow.",
          gains:
            "A busy host clears what waits without opening a single event.",
          costs:
            "Its list repeats much of the bell's, and on a quiet day the page leads with an empty list.",
        },
      ],
      recommended: "stage",
      because:
        "At 1 event the page is that party's own front; at 40 time picks what leads, so forty events never stack forty things.",
      overrule:
        "If a planner's many parties matter more than any one, every event in its place.",
      configs: [MOMENT, SCREEN],
    },

    /* ── 2. What asks for attention ──────────────────────────────────────── */
    {
      id: "needs",
      label: "What asks for attention",
      question:
        "What should ask for your attention on the dashboard, at 1 event and at 40?",
      where: ["Host", "The dashboard", "When something waits"],
      when: "Jo's Friday night: 2 people at tonight's door, a wedding tomorrow, 25 uploads waiting on review, and 32 parties asking nothing.",
      matters:
        "At 40 events one step per event is 40 things; the page has to flag only what is important.",
      lands:
        "Which states reach the dashboard, the most it ever shows, and what the bell holds, so one never repeats the other.",
      context:
        "Drawn in the dashboard you picked (the party of the moment until you do): Maya and Jo on the night, and at 1440 Jo's bell drawn open beside her page, holding what the rule leaves to it.",
      options: [
        {
          id: "bell",
          label: "The bell holds it all",
          means:
            "No list on the page: each event wears a mark, and the bell lists every step there is, setup included, in one order.",
          gains:
            "One home for every step; the page stays calm at 1 event and at 40.",
          costs:
            "To learn what a mark wants she opens the bell; the page never says it.",
        },
        {
          id: "week",
          label: "This week's parties",
          means:
            "Every party within a week of its date, before or after, each with its one step or its Ready; older queues stay in the bell.",
          gains:
            "What is near in time asks, and parties long over stay quiet, however many.",
          costs:
            "A planner's busy week can show five or six, and a far party's setup waits.",
        },
        {
          id: "three",
          label: "The three that matter most",
          means:
            "Every step ranked by how soon it matters, people waiting first; the page shows three, the bell the rest in the same order.",
          gains: "Never more than three on the page, whatever she hosts.",
          costs:
            "The fourth is one press away in the bell, and the three repeat its first rows.",
        },
      ],
      recommended: "week",
      because:
        "Importance is time: the parties around today each say their one step, and a planner's past years never ask.",
      overrule:
        "If even a week's row is too much, the bell holds it all and the page only marks.",
      after: { ask: "purpose" },
      configs: [MOMENT, SCREEN],
    },

    /* ── 3. Events at forty ──────────────────────────────────────────────── */
    {
      id: "events",
      label: "Events at forty",
      question: "How should your events present when there are forty of them?",
      where: ["Host", "The dashboard", "Your events"],
      when: "Jo scrolls past the top of the page to find an event: 40 she hosts, 1 she added to, 1 deleted.",
      matters:
        "Most hosts have a few events; a planner has dozens, and a wall of equal covers stops reading past twenty.",
      lands:
        "How the events list groups, sizes and orders forty events, and what a cover says.",
      context:
        "Each frame opens scrolled to the events list, in the dashboard you picked: Maya's (her own party and a friend's wedding she added photos to) and Jo's forty, with one she added to and one deleted.",
      options: [
        {
          id: "covers",
          label: "Covers, newest first",
          means:
            "One wall of equal covers by date, newest first, each wearing at most a mark; the lens and a search above it.",
          gains: "The simplest and closest to today: every event a photograph.",
          costs:
            "At 40 it is rows on rows of equal covers, old parties as loud as tonight's.",
        },
        {
          id: "seasons",
          label: "Grouped by when",
          means:
            "Coming up, just past, earlier this year, then each year folded into a line: the freshest albums draw largest, old years as thumbnails.",
          gains:
            "The parties near today stay large; each year before folds into one line.",
          costs:
            "An old event is one press deeper, and the covers change size down the page.",
        },
        {
          id: "index",
          label: "A list you can sort",
          means:
            "One row per event: a thumbnail, its date, photos, guests and state, sortable and searchable; no wall of covers.",
          gains: "Forty events on two screens, every number at a glance.",
          costs:
            "The photographs shrink to thumbnails, and the page reads as a tool.",
        },
      ],
      recommended: "seasons",
      because:
        "It keeps the parties near today as photographs and folds the years, so forty reads like a calendar, not a wall.",
      overrule: "If a planner works her events as a list, a list you can sort.",
      after: { ask: "purpose" },
      configs: [MOMENT, SCREEN],
    },

    /* ── 4. What replaces Just arrived ───────────────────────────────────── */
    {
      id: "arrivals",
      label: "What replaces Just arrived",
      question: "What should take the place of Just arrived?",
      where: ["Host", "The dashboard", "While photos land"],
      when: "On the night: 86 photos have landed at Jo's rehearsal dinner, and 23 more across three other parties since yesterday.",
      matters:
        "Today's strip shows the newest from every event, which at 40 events is mostly noise.",
      lands:
        "Whether the dashboard shows photographs as they arrive, and on which days.",
      context:
        "Drawn in the dashboard you picked, on the night (the Day knob shows the morning after): Maya's party live, and Jo's rehearsal dinner live while three other albums fill.",
      options: [
        {
          id: "none",
          label: "Nothing: the events carry it",
          means:
            "No strip: the stage and the covers show each party's photographs, and nothing on the page is about what is new.",
          gains:
            "The calmest page, with nothing changing under her while she reads it.",
          costs:
            "A photograph landing at the party is seen only on the event's own page.",
        },
        {
          id: "live",
          label: "Only a party that is live",
          means:
            "On a party's own day its newest photographs land on the page as they arrive, a live wall; every other day, nothing.",
          gains:
            "The page comes alive exactly while a party is on, and only then.",
          costs:
            "Last weekend's late arrivals show only on that party's own page.",
        },
        {
          id: "since",
          label: "New since you last looked",
          means:
            "One strip of what arrived since your last visit, grouped by event with each one's count; gone when nothing is new.",
          gains:
            "Catches up on every event at a glance, the morning after or a week later.",
          costs:
            "Needs the time of her last visit kept, which the app does not keep yet.",
        },
      ],
      recommended: "live",
      because:
        "Arrivals matter while a party is on; after that the event's own page holds them, so the dashboard stays calm.",
      overrule:
        "If catching up after a weekend is the job, new since you last looked.",
      after: { ask: "purpose" },
      configs: [MOMENT, SCREEN],
    },
  ],
});
