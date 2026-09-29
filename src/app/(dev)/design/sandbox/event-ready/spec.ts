import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * READY FOR GUESTS (the event-ready track, round one, cut 2026-09-29).
 *
 * His note, on event-settings r1's door drawn in steps: "Almost feels like a
 * mini wizard within settings to always ensure it's ready to go - wonder if we
 * could extend this concept. Could also be helpful to create an event checklist
 * for hosts so they know everything is ready." So the round asks how a host
 * knows her event is ready and what she does next, from production as it
 * stands: settings-wiring's four sentences and the door in steps, Create as
 * Name, Style and the beat, the hub's launch list, the pulse's first band.
 *
 * ★ ONE ANSWER UNDER EVERY DRAWING. What "ready" means is one pure function
 * (`readiness.ts`, tested), the lane's own proposal: every item is state the
 * app already holds, and ready waits only on what a guest needs. So the homes,
 * the walks, the hand-off and the band are compared on one checklist, and the
 * checklist's contents are a carried call he can overrule rather than an ask.
 *
 * ★ FIVE QUESTIONS, TWO ROOTS. `list` (where the checklist lives) opens, and
 * `guide` (a walk through Settings) waits on it, then `create` (Create's
 * hand-off) on that, because each is drawn in the world the one before it
 * picked. `needs` (What needs you, never empty) and `door` (the code as the
 * door) stand on their own.
 *
 * ★ `list` DECLARES `today`, AND SO DOES EVERY ASK THAT HAS ONE: the staged
 * asks are drawn wearing his answer once he gives it, and until then wearing
 * the recommendation the step opens on, never a stranger's pick.
 *
 * ★ NEVER ASKED HERE, SETTLED AS CARRIED CALLS: what the checklist holds, that
 * ready gates nothing and is never stored, and that the code ticks at its first
 * open. The one-way doors among them (a stored or guest-facing "ready") are
 * Questions in the manifest, never options.
 */

/** The width a host reads it at: her phone first (she sets events up on it), a laptop on the knob. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export const EVENT_READY = defineExploration({
  id: "event-ready",
  title: "Ready for guests",
  surface: "host",
  desk: 35,
  lives: [
    "docs/systems/host-app.md",
    "src/components/app/event-feed/launch-list.tsx",
    "src/app/(app)/dashboard/[eventId]/page.tsx",
    "src/components/app/event-settings/settings-rows.tsx",
    "src/components/app/event-settings/event-settings-sheet.tsx",
    "src/components/app/create-event-wizard.tsx",
    "src/lib/dashboard/next-step.ts",
    "src/components/app/dashboard/next-step-band.tsx",
    "src/components/app/event-card.tsx",
    "src/components/app/share/event-code-door.tsx",
    "content/help/day-of-checklist-for-hosts.mdx",
  ],
  round: {
    n: 1,
    date: "2026-09-29",
    changed:
      "From your event settings note: how a host knows her event is ready, where its checklist lives, a walk through Settings, Create's hand-off, a What needs you that is never empty, and the code as the door.",
  },
  context:
    "Maya's 30th is the party throughout: made an hour ago, then three photos in with the code never opened, then the night before with everything done. Her dashboard adds a wedding next month and last weekend's reunion. Every drawing reads one checklist, computed from the event's own state.",
  opening: {
    about:
      "How a host knows her event is ready for guests and what she does next: a checklist, a walk through Settings, Create's hand-off, the dashboard, the code.",
    settled: [
      "Every checklist item is state the app already holds, the code ticked at its first open; nothing asks her to tick a box, and nothing new is stored.",
      "Ready is for her eyes only: it gates nothing, and a guest never sees it.",
      "Create still asks for the name first and makes the event at once, as you picked.",
      "Settings keeps its four sentences and saves as she goes, as you picked.",
    ],
    earlier: [
      "'Almost feels like a mini wizard within settings to always ensure it's ready to go. Wonder if we could extend this concept.'",
      "'Could also be helpful to create an event checklist for hosts so they know everything is ready.'",
      "Your launch list: 'Three things the app already knows, as three things she can finish. The album takes the room back.'",
      "The pulse, approved on one worry: an app that feels empty and bland until things start to happen.",
    ],
  },
  terms: [
    {
      term: "checklist",
      means:
        "What an event needs before guests arrive, each item ticked by the app from the event's own state.",
    },
    {
      term: "launch list",
      means:
        "Today's list in the album's place before the first photo: set the date, write a note, print the cards.",
    },
    {
      term: "the hub",
      means:
        "An event's own page: its code beside the name, a row of cards into its rooms, then the album.",
    },
    {
      term: "the beat",
      means:
        "Create's last screen: the new event's code in a mat, with Print and Share, shown once.",
    },
    {
      term: "What needs you",
      means:
        "The first band on the dashboard: one next step per event, as chips.",
    },
    {
      term: "first open",
      means:
        "The first visit to the event's link, by a scan or a tap, the host's own test included.",
    },
    {
      term: "Only me",
      means:
        "An album only its host can open; its code leads guests to a closed album.",
    },
    {
      term: "gate",
      means:
        "What a Private album asks first: a password, the host's yes, or the invite list.",
    },
    {
      term: "pass",
      means:
        "A walk through setup in its own screens: one question at a time, with Back and Next.",
    },
  ],
  carried: [
    {
      id: "items",
      question: "What does the checklist hold?",
      taken:
        "Who can get in, what guests can add, the first photos, the welcome (the date and a note), the code opened once; room only when it runs short.",
      overrule:
        "Name an item to add or drop; each must be something the app can already see.",
    },
    {
      id: "ready",
      question: "Does ready wait on the note, the date and the first photos?",
      taken:
        "No: ready waits on what a guest needs (a door that lets her in, uploads open, the code opened once); the rest are worth doing.",
      overrule:
        "Hold ready until every item is done, and the note, the date and the photos become things a host must do.",
    },
    {
      id: "window",
      question:
        "How long does a party keep a job of its own once its date has passed?",
      taken:
        "A month: it offers Share the album, then it speaks only when something waits on it.",
      overrule:
        "Keep a job on every event for good, and years of parties fold into a long band.",
    },
    {
      id: "opened",
      question: "How does the app know the code is out?",
      taken:
        "Its first open: any visit to the link counts, a host's own test scan included, so scanning it once ticks it.",
      overrule:
        "Count only a guest's open, and a host's own test no longer ticks it.",
    },
  ],
  asks: [
    {
      id: "list",
      label: "Where the checklist lives",
      question:
        "Where should a host see what her event still needs before guests arrive?",
      where: ["Host", "The hub", "Before guests arrive"],
      when: "Maya made her 30th an hour ago; three days later she has added three photos; the night before, everything is done.",
      matters:
        "It is how she knows her event is ready; a list she never meets, or one that leaves too soon, lets her miss the code.",
      lands:
        "Where the checklist is drawn, what points to it, and when it steps aside.",
      context:
        "Three moments on Maya's 30th: an hour after Create, three photos in with the code never opened, and the night before. Each option draws the same checklist in its own home; today's is the launch list.",
      options: [
        {
          id: "album",
          label: "In the album's place, as today",
          means:
            "Today's launch list (the date, a note, print the cards) fills the album's place until the first photo lands, then steps aside, done or not.",
          gains:
            "Nothing new on the page: the list is the empty album's content.",
          costs:
            "Her first photo hides it, with the code never opened and the note unwritten.",
        },
        {
          id: "head",
          label: "At the head of the hub, until it's done",
          means:
            "The checklist sits under the cards on every visit, folds to one line once the album has photos, and leaves when everything is done.",
          gains: "She meets it on every visit, whatever the album holds.",
          costs: "One more block on the hub until she is done.",
        },
        {
          id: "settings",
          label: "Inside Settings, counted on its card",
          means:
            "Settings opens on the checklist above its four rows, and the hub's Settings card says how many are left until none are.",
          gains:
            "The list sits beside the controls that finish it; the hub keeps its shape.",
          costs:
            "On the hub she reads a count on a card; the list is one tap away.",
        },
      ],
      today: "album",
      recommended: "head",
      because:
        "She meets it on every visit until it's done, and it survives her first photo, the moment today's list leaves.",
      overrule:
        "If the hub should stay the code, the cards and the album, Settings holds the list and its card counts it.",
      configs: [SCREEN],
    },
    {
      id: "guide",
      label: "A walk through Settings",
      question:
        "Should Settings walk a host through her event in order, the way the door's steps do?",
      where: ["Host", "Settings", "Setting up an event"],
      when: "Maya opens Settings on her new 30th to get it ready; every setting sits at its default and nothing is ticked.",
      matters:
        "Your note on the door's steps: a mini wizard in Settings that makes sure the event is ready to go.",
      lands:
        "Whether Settings gains numbered steps with a Next on each page, a pass of its own, or stays four rows.",
      context:
        "Settings as it opens and one page in, on production's rows and pages, drawn in the checklist home you picked (a panel beside the hub at a desk, the whole screen on a phone).",
      options: [
        {
          id: "rows",
          label: "Four rows, as today",
          means:
            "Each sentence opens its own page under a back arrow; nothing leads from one page to the next, and nothing is ticked.",
          gains: "Nothing new to learn: every setting is one tap away.",
          costs:
            "Nothing walks her through it in order, or tells her she is done.",
        },
        {
          id: "steps",
          label: "The rows as steps, each page ending in Next",
          means:
            "The rows are numbered down one rail like the door's, each ticked when ready, the code a fifth; every page ends in Next.",
          gains:
            "The door's steps across the whole of Settings, with no new mode.",
          costs: "Numbers and ticks on every visit, long after setup is done.",
        },
        {
          id: "pass",
          label: "A pass of its own",
          means:
            "Set it up opens a pass: one question a screen with Back and Next, in a guest's order, ending on Ready.",
          gains: "A true wizard: one thing at a time, nothing else on screen.",
          costs:
            "A second way through the same settings, to build and keep in step.",
        },
      ],
      today: "rows",
      recommended: "steps",
      because:
        "It is your note taken whole: the door's steps run through all of Settings, and Next walks her to done.",
      overrule:
        "If Settings should stay four plain rows, a pass of its own gives setup screens of its own instead.",
      after: { ask: "list" },
      configs: [SCREEN],
    },
    {
      id: "create",
      label: "Create's hand-off",
      question: "How should Create hand a new event over to getting it ready?",
      where: ["Host", "Create an event", "Its last screen"],
      when: "Maya has just pressed Create: her 30th exists, its code is drawn, and nothing else is set.",
      matters:
        "Every host passes this screen once, right when the event most needs setting up.",
      lands:
        "What the beat offers after the code, and whether Create's own steps grow.",
      context:
        "Create's last screen for each option, beside what she meets next, drawn in the walk you picked.",
      options: [
        {
          id: "beat",
          label: "The beat, as today",
          means:
            "The code in its mat, Print the table cards and Share the link, then Go to your event.",
          gains: "One screen, one job: get the code out.",
          costs: "Nothing says what else is left before the party.",
        },
        {
          id: "hand",
          label: "The beat, handing over",
          means:
            "The same code first, then what is left, counted, and Get it ready leading into Settings' first step.",
          gains:
            "She leaves Create knowing what is left, one tap from finishing it.",
          costs: "The code shares its screen with a short list.",
        },
        {
          id: "share",
          label: "Create walks the first steps",
          means:
            "After Style, Create asks who can get in and adds the date and a note, then ends on the beat.",
          gains: "The event leaves Create nearly ready, in one sitting.",
          costs:
            "Two more screens before the beat; your first-event pick asked one field.",
        },
      ],
      today: "beat",
      recommended: "hand",
      because:
        "Create stays name-first, as you picked, and the one screen every host passes names what is left.",
      overrule:
        "If a new event should leave Create ready, Create walks the door and the welcome before the beat.",
      after: { ask: "guide" },
      configs: [SCREEN],
    },
    {
      id: "needs",
      label: "What needs you, never empty",
      question:
        "When nothing is waiting on an event, what should What needs you say about it?",
      where: ["Host", "Your dashboard", "What needs you"],
      when: "Maya hosts three: her 30th next week, a wedding next month, a reunion last weekend. Nothing waits on any of them.",
      matters:
        "It leads her dashboard, and today it goes quiet exactly when she could be getting ahead.",
      lands:
        "The one function behind the band and each event card, and what an event says when nothing waits.",
      context:
        "Her dashboard's first bands and her three event cards, each fed by one function, on two days: a quiet Friday, and the 30th's night with two at its door and twelve to review.",
      options: [
        {
          id: "quiet",
          label: "Nothing, as today",
          means:
            "An event with nothing waiting says nothing; with nothing waiting anywhere the band reads Nothing needs you right now.",
          gains: "Calm: the band speaks only when something waits.",
          costs:
            "A quiet week is one grey line: the bland start the pulse was meant to avoid.",
        },
        {
          id: "job",
          label: "Its next job, always",
          means:
            "Each event names one job: what waits first, else its checklist's next item, else Invite guests, or Share the album in the month after its date.",
          gains:
            "Every event offers one real thing to do, on the band and under its card.",
          costs: "The band always holds a chip per event, so it folds sooner.",
        },
        {
          id: "count",
          label: "How ready it is",
          means:
            "Each event says Ready or how many things are left, opening its checklist; what waits still comes first.",
          gains: "One steady word per event: ready, or not yet.",
          costs:
            "A count says how much, not what: one more tap to find the job.",
        },
      ],
      today: "quiet",
      recommended: "job",
      because:
        "A quiet week still names her next move on every event, and each job is real state, never filler.",
      overrule:
        "If the band should speak only when something waits, it stays quiet and the checklist carries the rest.",
      configs: [SCREEN],
    },
    {
      id: "door",
      label: "The code as the door",
      question:
        "How should the code beside an event's name show who can get in right now?",
      where: ["Host", "The hub", "The code beside the name"],
      when: "Maya's 30th in five states: Public, Private with her yes and two waiting, a password, Only me, and uploads paused.",
      matters:
        "The code is the door guests come through; she should read its state before a guest meets it.",
      lands: "What the hub's code wears for each door and for paused uploads.",
      context:
        "The hub's header in five frames, one door each. Today only paused uploads change the code, and the door is a word on the Settings card.",
      options: [
        {
          id: "today",
          label: "Dimmed when paused, as today",
          means:
            "Paused uploads dim the code under a Paused pill; a gate or Only me leaves the code looking exactly like a Public one.",
          gains: "One state to know, and the code stays plain.",
          costs:
            "An Only me code looks ready to scan, and leads guests to a closed album.",
        },
        {
          id: "mark",
          label: "A mark on the code's corner",
          means:
            "A small sign on the mat's corner: a lock for a gate, a closed eye for Only me, a count when people wait; paused still dims.",
          gains:
            "The door sits on the code at a glance, and the code still scans.",
          costs:
            "A glyph to learn per state; the gate's name waits for a hover.",
        },
        {
          id: "sign",
          label: "A line on the mat, in words",
          means:
            "The mat carries a line under the code: Public, Private: you let each in, 2 waiting, Only you, Uploads paused.",
          gains: "Plain words, nothing to learn, read at a glance.",
          costs: "The mat grows a line, so the header's block does too.",
        },
      ],
      today: "today",
      recommended: "sign",
      because:
        "The words say the door and who waits at it without a legend, on the one object a guest will scan.",
      overrule:
        "If the header must keep its height, the corner mark carries the door in a glyph instead.",
      configs: [SCREEN],
    },
  ],
});
