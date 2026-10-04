import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE HOST DASHBOARD, ROUND FOUR: CHOOSING WHAT LEADS THE STAGE, AGAIN.
 *
 * Will answered round three on 2026-10-04 (`docs/reviews/host-dashboard.json`):
 * `events=menu` and `stage=lit`, both being built now by `dashboard-wiring`,
 * and `rule=corner` with his note "I'd like to see another exploration of the
 * design of this UI." We read "this UI" as the stage's corner menu, so this
 * round draws choosing what leads three ways, each on the whole lit stage, and
 * says that reading in its opening so he can say if he meant more.
 *
 * ★ TWO DECISIONS, NOTHING STAGED. `chooser` is how a host chooses what leads
 * her stage: the corner refined, the stage's own words, and a deck she turns.
 * `details` is the call H6 folded in: four details the dashboard was built
 * with and never drawn for him, each shown as built and the other way.
 *
 * ★ EVERY FRAME IS PRODUCTION'S PAGE. The head, the stage with its
 * photographs (`photo-stage.tsx`, production's copied with its slots), the
 * week and every rule under them are production's, composed by
 * `buildHomeView` from fixtures in production's own shapes (`model.ts`,
 * `model.test.ts`); round three's picks are drawn as they are being built.
 *
 * Nothing here asks what another board asks: the atoms are `identity`'s, the
 * hub's head is `event-header`'s, and the event page Try it opens is a
 * stand-in.
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
    n: 4,
    date: "2026-10-04",
    changed:
      "From your round three note on the corner: choosing what leads the stage, drawn again three ways on the whole lit stage, and the dashboard's details as built (H6).",
  },
  history: [
    {
      n: 3,
      date: "2026-10-03",
      changed:
        "Your events from one to two hundred, the stage before its first photo, and the stage's rule. You picked one Display menu, the code lit by its own lamp, and the corner, asking for its design again.",
    },
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
    "Round four, on the dashboard as it is being built, for hosts on Tuesday 10 November, a quiet day: Nia with three events (her wedding made last night), Ari ten, Jo forty, Maya one on an Event Pass and Lena five with a full week. Every frame runs: press any event to open it, then come back. The Screen knob draws a phone. Each caption is read off its frame.",
  opening: {
    about:
      "Round four: how a host chooses what leads her stage, drawn again on the whole lit stage. We read your note as the corner; say if you meant the dashboard whole.",
    settled: [
      "One Display menu over your events, and the code lit by its own lamp, are being built now and are drawn here as they will ship.",
      "Her choices are kept on her account; her events open as covers, the newest first; Recent shows from seven events.",
      "Newest puts a party within a month first; an empty event is lit by its own lamp; a party on its own day always leads.",
      "Until your pick, the stage keeps today's rule: the newest leads.",
    ],
    earlier: [
      "On the stage's rule you picked the corner: 'I'd like to see another exploration of the design of this UI.'",
      "Round two, on the pick: 'these could be more like sort options, such as: newest, last opened, upcoming'",
    ],
  },
  terms: [
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
      term: "deck",
      means:
        "The four leads stacked behind the stage, each rule a tab she turns to.",
    },
    {
      term: "Try it",
      means:
        "A frame that is the dashboard running: press anything, open an event, then come back.",
    },
  ],
  asks: [
    /* ── 1. Choosing what leads ─────────────────────────────────────────── */
    {
      id: "chooser",
      label: "Choosing what leads",
      question:
        "How should a host choose what leads her stage, so the choice feels part of the stage and never a settings panel?",
      where: ["Host", "The dashboard", "The stage"],
      when: "A host with more than one event on a day without a party: Nia's three, Ari's ten, Jo's forty.",
      matters:
        "The stage is the first thing the dashboard shows, and most hosts never change its rule, so its control must stay quiet.",
      lands:
        "Where the rule's control lives on the stage, how it opens at a desk and a phone, and how the stage moves when it changes.",
      context:
        "Three frames each, at the Screen knob's width: Nia choosing over her lit wedding, Ari's ten with Latest photos kept (the control on a photograph), and Try it on Jo's forty, where a rule moves the stage at once.",
      options: [
        {
          id: "corner",
          label: "The corner, refined",
          means:
            "The rule on the stage's glass at its top right, opening a menu of the four, each previewing the stage it would draw.",
          gains: "Your pick, made clearer: set where it shows, one press away.",
          costs: "A control on the stage's picture.",
        },
        {
          id: "words",
          label: "The stage's own words",
          means:
            "The rule is the stage's first words, saying why this event leads; pressing them turns the stage to choose.",
          gains: "Nothing over the picture, and the stage explains itself.",
          costs: "A control that reads as words may be missed.",
        },
        {
          id: "deck",
          label: "A deck she turns",
          means:
            "The four leads stacked behind the stage, each rule a tab; turning to one brings its event forward and keeps it.",
          gains: "Every rule in sight, and choosing is seeing.",
          costs: "Four tabs on every visit, for a choice most never make.",
        },
      ],
      recommended: "corner",
      because:
        "Your pick, refined: set where it shows, one press away, quiet at rest and clear when open.",
      overrule: "If nothing should sit on the picture, the stage's own words.",
      configs: [SCREEN],
    },

    /* ── 2. The dashboard's details (H6) ────────────────────────────────── */
    {
      id: "details",
      label: "The dashboard's details",
      question:
        "Do the dashboard's four small details read right as built, or should one of them go the other way?",
      where: ["Host", "The dashboard", "Its head, stage and week"],
      when: "Every visit: Maya's one event on an Event Pass, and Lena's week with an album she never dated.",
      matters:
        "Each was decided while building and never drawn for you; every host reads them every day.",
      lands:
        "This week's rule, the album count's word, the head's line and where the storage ring stands at a phone.",
      context:
        "Two phone frames each: Maya's one event (the head, the ring, her stage the week after her party) and Lena's week (her 40th, Thursday's lunch, and Sunday's pancakes, never dated).",
      options: [
        {
          id: "built",
          label: "All four as built",
          means:
            "The week holds dated parties only; the count says in the album; the head says no limit; the ring sits under the day.",
          gains: "Quiet and true: nothing the host did not set is dated.",
          costs: "An undated album from this week is not in This week.",
        },
        {
          id: "week",
          label: "Undated albums join This week",
          means:
            "An album nobody dated whose photos landed this week joins This week, said by its photos' day.",
          gains: "This week holds everything that happened this week.",
          costs: "The week dates an album its host never dated.",
        },
        {
          id: "count",
          label: "The count says photos and videos",
          means:
            "The stage and the week say 128 photos and videos, where they say 128 in the album.",
          gains: "Names what the number holds.",
          costs: "Three words where two did.",
        },
        {
          id: "limit",
          label: "The head says the plan's limit",
          means:
            "A plan with a cap on events says it in the head: 1 of 1 event, Event Pass.",
          gains: "The limit is known before Create refuses.",
          costs: "A line counting down on every visit.",
        },
        {
          id: "ring",
          label: "The ring beside New event",
          means:
            "At a phone the storage ring stands in the first row beside New event, where it sits under the day.",
          gains: "Storage in the same place at a desk and a phone.",
          costs: "The day's name has less room in the first row.",
        },
      ],
      recommended: "built",
      because:
        "Each as built is the quieter true one: a day the host never set is never said, and the cap is the ring's to say.",
      overrule: "If This week should hold what happened this week, undated albums join it.",
      tile: "phone",
    },
  ],
});
