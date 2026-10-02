import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * THE EVENT HEADERS, ROUND ONE (the event-header track, cut 2026-10-02).
 *
 * His note on `event-ready`'s `door` (answered `mark`, wired that night): "the
 * mark keeps the header from getting too crowded with text where icons will
 * likely work 99% of the time ... As a broader note, I'd like to explore
 * redesigning the event headers for both hosts and guests entirely." So the
 * two heads an event opens with are redrawn whole: the guest album's (past the
 * door, `event-experience.tsx`, `guest-header.tsx`, `guest-action-dock.tsx`)
 * and the host hub's (`dashboard/[eventId]/page.tsx`: the code, the room row,
 * the checklist).
 *
 * ★ THREE QUESTIONS, ONE ROOT. `guest` is the album's head, four ways (today,
 * the cover, the doorway left open, the name filled with the party). `host`
 * waits on it, because one of its options IS the album's head with Maya's
 * tools on it: that is how this board asks "whether the two share one
 * grammar" without asking it twice, and the option is drawn in whatever head
 * he picks for guests. `stays` (what stays once she scrolls) waits on it too
 * and is drawn under his pick.
 *
 * ★ `guest` DECLARES NO `today`, ON PURPOSE (locked-door's `family`, the same
 * reason): its control's default is what `host` and `stays` are drawn in
 * before he answers it, and drawn in today's head the shared option would be
 * today's hub, one picture under two names. Once `guest` is answered every
 * later step wears his answer.
 *
 * ★ EVERY OPTION KEEPS THE ALBUM BYTE FOR BYTE (`album.tsx`): the same rows,
 * the same count and Download all, so two frames differ only in the head. The
 * hub's checklist stays production's own component (`list=head` is settled).
 *
 * ★ NEVER ASKED HERE: the atoms (buttons, chips, cards, tooltips, avatars:
 * `identity`'s); the dashboard (`host-dashboard`'s); the door's reveal into
 * this head (`locked-door` r3's: it lands on whichever head `guest` picks).
 */

/** A guest meets the album on the phone she scanned the code with first. */
const GUEST_SCREEN: Control = {
  id: "guest-screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** A photo-led head owes an answer for the first guest of the night. */
const ALBUM: Control = {
  id: "album",
  label: "The album",
  options: [
    { id: "full", label: "214 photos" },
    { id: "empty", label: "Empty, the first guest" },
  ],
  default: "full",
};

/** A host runs her party from her laptop first; the phone is on the knob. */
const HOST_SCREEN: Control = {
  id: "host-screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Tonight every signal is lit; the week before, the checklist stands at the head. */
const MOMENT: Control = {
  id: "moment",
  label: "The moment",
  options: [
    { id: "tonight", label: "Tonight, the party on" },
    { id: "before", label: "The week before" },
  ],
  default: "tonight",
};

export const EVENT_HEADER = defineExploration({
  id: "event-header",
  title: "The event headers",
  surface: "shared",
  desk: 50,
  lives: [
    "docs/systems/guest-flow.md",
    "docs/systems/host-app.md",
    "src/components/guest/event-experience.tsx",
    "src/components/guest/guest-header.tsx",
    "src/components/guest/guest-action-dock.tsx",
    "src/components/guest/guest-share.tsx",
    "src/app/(app)/dashboard/[eventId]/page.tsx",
    "src/components/app/share/event-code-door.tsx",
    "src/components/app/share/event-link-row.tsx",
    "src/components/app/event-feed/event-cards-row.tsx",
    "src/components/app/event-feed/room-card.ts",
  ],
  round: {
    n: 1,
    date: "2026-10-02",
    changed:
      "Round one, from your note on the code's mark: the album's head and the hub's head redrawn whole, four ways each, and what stays once a guest scrolls.",
  },
  context:
    "Maya and Jay's wedding, the party the door boards stand at, so the head a guest walks into is the album behind that door. The guest is Priya, who typed her name at the door; the host is Maya, tonight (2 at her door, 8 in Review) or the week before. Every album under every head is the same rows: only the head moves.",
  opening: {
    about:
      "The heads an event opens with: the album's head a guest walks into past the door, and the hub's head Maya opens her event to.",
    settled: [
      "The album under every head stays as built: the same rows, its count, Download all and View.",
      "The checklist stays at the hub's head until the event is ready (event-ready's pick), drawn as built.",
      "The code keeps its corner mark: the door as a glyph, its words on hover and a tap.",
      "Every head is drawn in today's atoms; how a button or a card looks is the identity board's.",
    ],
    earlier: [
      "On the code's mark: 'the mark keeps the header from getting too crowded with text where icons will likely work 99% of the time.'",
      "'I'd like to explore redesigning the event headers for both hosts and guests entirely.'",
      "'We're getting much closer to the final feature set, so we can be more confident in more bespoke polished design now.'",
      "This round's bar: bespoke like the disposable camera's boards, sleek, sophisticated, and far less text.",
    ],
  },
  terms: [
    {
      term: "head",
      means:
        "Everything above an album: its name, who hosts it, its counts and its actions.",
    },
    {
      term: "hub",
      means:
        "Maya's own page for her event: the code, the room cards, the checklist and the album.",
    },
    {
      term: "cover",
      means:
        "The reel's own photographs, edge to edge under the head, dissolving one into the next.",
    },
    {
      term: "doorway",
      means:
        "The door a guest walks through into the album, drawn with the party's light behind it.",
    },
    {
      term: "room cards",
      means:
        "The hub's four cards into the Highlight reel, Guests, Review and Settings.",
    },
    {
      term: "dock",
      means:
        "Today's bar at the foot with Invite and Add photos, once the head has scrolled away.",
    },
    {
      term: "shutter",
      means:
        "One round Add photos button at the foot's centre, ringed in the album's light.",
    },
    {
      term: "album's light",
      means:
        "The colours of the album's newest photos: the light the door already wears.",
    },
  ],
  carried: [
    {
      id: "reel",
      question: "Where does the Highlight reel live in a new head?",
      taken:
        "Inside the head: the cover's stills, the door's view, a numeral. The reel's tile above the album goes.",
      overrule: "Keep the reel's tile above the album under any head.",
    },
    {
      id: "glyphs",
      question: "Does a new head count in words or in glyphs?",
      taken:
        "Glyphs with their words on hover and a tap, from your note on the mark. Today keeps its words.",
      overrule: "Keep '214 photos & videos from 31 guests' in words.",
    },
    {
      id: "header",
      question: "Is the guest's header part of the head?",
      taken:
        "Yes: over the cover it stands on the photograph in white with no rule; elsewhere it is today's.",
      overrule: "Keep today's header, rule and all, above every head.",
    },
  ],
  asks: [
    {
      id: "guest",
      label: "The album's head",
      question: "Which head should a guest's album open with?",
      where: ["Guest", "The album", "Past the door"],
      when: "Priya scanned Maya and Jay's code and came through the door: the album is open, 214 photos from 31 guests.",
      matters:
        "It is the first screen every guest sees past the door, and where she decides to add hers.",
      lands:
        "The album's head on every event: its name, host, counts and note, its actions, and where the reel lives.",
      context:
        "Two frames each: the album as Priya lands on it, and scrolled into it. The knobs: a phone or a laptop, and the album full or empty (the first guest of the night).",
      options: [
        {
          id: "today",
          label: "Today's head",
          means:
            "The name, Hosted by and the date, the stats line and the note, Add photos over Invite, then the Highlight reel's tile.",
          gains: "Built and familiar: every fact in words, nothing to learn.",
          costs:
            "Text first and a column of buttons; at a desk, a narrow column beside empty space.",
        },
        {
          id: "cover",
          label: "The cover",
          means:
            "The reel's own stills dissolve edge to edge under the name; Add photos stands white on them, the reel and Invite beside it.",
          gains:
            "The party is the first thing she sees, and the reel's tile folds into it.",
          costs:
            "The tallest head; an empty album has only the house light to show.",
        },
        {
          id: "doorway",
          label: "The doorway, left open",
          means:
            "The door she walked through stays open as the album's emblem, the newest photos through it and its light on the head. It plays the reel.",
          gains:
            "The door carries on into the album, and the photos start halfway down a phone.",
          costs:
            "A small emblem to read at a phone; the light changes with the album's colours.",
        },
        {
          id: "masthead",
          label: "The name, filled with the party",
          means:
            "The name set as large as the column takes, its letters windows onto the reel's stills; the counts as numerals under a rule.",
          gains:
            "A typographic statement in the album's own photos, on calm paper.",
          costs:
            "Photo-filled letters read softer than ink, and it says the most words.",
        },
      ],
      recommended: "cover",
      because:
        "The door opens onto the party itself: the reel's photos carry the name, and Add photos stands on them.",
      overrule:
        "If the door should carry on past the reveal, the doorway keeps it as the album's emblem.",
      configs: [GUEST_SCREEN, ALBUM],
    },
    {
      id: "host",
      label: "The hub's head",
      question: "Which head should Maya's hub open with?",
      where: ["Host", "Her event's hub", "Opening her event"],
      when: "Maya opens her event from the dashboard tonight: 214 photos, 2 people at her door and 8 in Review.",
      matters:
        "She keeps it open all night: what needs her, and the code guests scan, must be in reach.",
      lands:
        "The hub's head and its room cards at a desk and in a hand, and whether it wears the album's head.",
      context:
        "Two frames each: the hub as she opens it, and scrolled into the album. The knobs: a laptop or a phone, and tonight or the week before, when the checklist stands at the head.",
      options: [
        {
          id: "today",
          label: "Today's head",
          means:
            "The code beside the title, a line of counts and the link, then the four room cards; the checklist under them until ready.",
          gains: "Built, and the code is scannable at rest.",
          costs:
            "Two rows of chrome in small type before the album; her party never shows in it.",
        },
        {
          id: "shared",
          label: "The album's head, hers",
          means:
            "The head you pick for guests, worn by her hub: her counts and link on it, the code on its white mat, the room cards under it.",
          gains:
            "She sees her album as her guests do; one design is built and polished once.",
          costs: "Taller than today, so the album starts lower.",
        },
        {
          id: "numbers",
          label: "The numbers are the doors",
          means:
            "One band: the code, the name, and five live numbers that open their rooms (photos, guests, Review, the reel, Settings).",
          gains:
            "Every count she checks all night at a glance, in one row instead of two.",
          costs:
            "The room cards go, and a number reads as a stat before it reads as a door.",
        },
        {
          id: "line",
          label: "The album first",
          means:
            "One slim line that sticks: a code chip, the name, and the rooms as pills with their counts. The album starts under it.",
          gains:
            "The album fills the first screen; nothing stands before her photos.",
          costs:
            "The code is a chip, not scannable at rest, and the hub loses its presence.",
        },
      ],
      recommended: "shared",
      today: "today",
      because:
        "One design on both sides of the code: Maya sees her party as her guests do, and her code stands on it like the room's screen.",
      overrule:
        "If the hub should be a working page first, the numbers put every count in one row.",
      after: { ask: "guest" },
      configs: [HOST_SCREEN, MOMENT],
    },
    {
      id: "stays",
      label: "What stays",
      question:
        "Once a guest scrolls into the album, what should stay with her?",
      where: ["Guest", "The album", "Deep in it"],
      when: "Priya is two screens into the album, then sends three of hers from there.",
      matters:
        "Add photos has to stay in reach however deep she goes, without covering the photos.",
      lands:
        "What stands at the screen's edge once the head has scrolled away, on every album.",
      context:
        "Drawn under the album head you pick: deep in the album, then with three of her photos on their way.",
      options: [
        {
          id: "dock",
          label: "The dock, as today",
          means:
            "A bar at the foot with Invite and Add photos over a soft fade, arriving as the head leaves.",
          gains: "Built: both actions in words, in the thumb's reach.",
          costs: "A full-width bar over the album's last row.",
        },
        {
          id: "shutter",
          label: "One shutter",
          means:
            "One round Add at the foot's centre in the album's light, Invite small beside it; while hers send, the ring is their progress.",
          gains: "The least over the photos, and a camera's gesture.",
          costs:
            "Add loses its word once she scrolls; she read it in the head.",
        },
        {
          id: "bar",
          label: "The head, as a bar",
          means:
            "The head folds into a slim bar at the top: the album's emblem, its name, Invite and Add photos.",
          gains:
            "The album's name stays in view, and nothing stands at the foot.",
          costs: "Add moves to the top, far from a phone's thumb.",
        },
      ],
      recommended: "shutter",
      today: "dock",
      because:
        "Add stays in the thumb's reach with the least over the photos, and its ring says hers are on their way without a word.",
      overrule:
        "If Add should never lose its word, the dock keeps both actions in words.",
      after: { ask: "guest" },
      configs: [GUEST_SCREEN],
    },
  ],
});
