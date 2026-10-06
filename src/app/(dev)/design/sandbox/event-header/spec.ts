import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * THE HUB'S DOORS, ROUND FOUR (the event-header-r4 track, cut 2026-10-04).
 *
 * Round three's answers: the strip for the cover's facts (wired by
 * `hub-strip-wiring`, so drawn here as settled), the guest row he loved sent
 * to a board of its own after the brand round (drawn nowhere here), and the
 * doors undecided: all three again, each to its best version, glass leading.
 *
 * ★ ONE DECISION. `doors` is what opens her rooms, at rest and in its sticky
 * form, each option refined whole in its own file (`glass.tsx`, `cards.tsx`,
 * `windows.tsx`) through one contract (`door-kit.tsx`). No option is
 * production (production's cards row is round one's), so none is `today`.
 *
 * ★ FORM AND BEHAVIOUR ONLY. The waiting light's hue is the brand's question
 * (brand-marks' status set), so every door wears today's light and adds none.
 *
 * ★ THE CALLS G1, G2 AND G4 ARE DRAWN IN EVERY OPTION (never asked here or
 * elsewhere): See it as a guest is a door opening an inert phone over the
 * dimmed hub; Review and Guests open in Settings' own panel (production's), a
 * room's link opens another room in it, the reel full screen; Settings' count
 * is plain, never amber, and paused uploads read Paused (the Moment knob's
 * week after, where the lane's call puts the word on Settings' door too).
 *
 * ★ EACH OPTION WAS DRAWN BY ITS OWN DESIGNER, THEN REFINED ONCE FROM A FRESH
 * PAIR OF EYES (the round's method): no door moves when a count comes or goes,
 * in any option, at either size.
 *
 * ★ EVERY FRAME IS PRODUCTION'S HUB, NOT A PICTURE OF IT: the app's bar, the
 * album's own head (`EventHead`, its photographs dissolving in the real
 * keyframes), the code (`EventCodeDoor`), the checklist, the album's section
 * header, the rooms' panel and every room are production's components on
 * identity's wired atoms; the doors are drawn beside them in those atoms.
 */

/** A host runs her party from her laptop first; the phone is on the knob. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Paper and the room: the page's two grounds (the cover is the room in both). */
const GROUND: Control = {
  id: "ground",
  label: "Ground",
  options: [
    { id: "room", label: "The room" },
    { id: "paper", label: "Paper" },
  ],
  default: "room",
};

/** Tonight every door has something in it; the week before Settings has steps left; the week after, uploads paused. */
const MOMENT: Control = {
  id: "moment",
  label: "The moment",
  options: [
    { id: "tonight", label: "Tonight, the party on" },
    { id: "before", label: "The week before" },
    { id: "after", label: "The week after, paused" },
  ],
  default: "tonight",
};

export const EVENT_HEADER = defineExploration({
  id: "event-header",
  title: "The event headers",
  surface: "host",
  desk: 20,
  lives: [
    "docs/systems/host-app.md",
    "src/app/(app)/dashboard/[eventId]/page.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/event-cards-row.tsx",
    "src/components/app/event-feed/room-card.ts",
    "src/components/app/event-feed/reel-card.tsx",
  ],
  round: {
    n: 4,
    date: "2026-10-04",
    changed:
      "Round four: the three doors again, each refined to its best version by its own designer, then once from fresh eyes: glass with its counts as badges and a phone's tab bar, cards owning the phone, windows lit where something waits.",
  },
  history: [
    {
      n: 3,
      date: "2026-10-03",
      changed:
        "The facts free of a timeline beside three new ideas, and each door refined with its sticky form. You picked the strip (wired) and asked for all three doors again, leaning glass.",
    },
    {
      n: 2,
      date: "2026-10-03",
      changed:
        "The hub's facts four ways, its doors three and how a room opens. You picked the strip on one condition, asked for each door again, and picked every room over the hub (wired).",
    },
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Both heads redrawn whole for Maya & Jay's wedding. You picked the cover for guests, the same cover for the hub, and the shutter, all built.",
    },
  ],
  context:
    "Round four, on the hub as built: the cover, its strip, the code, the album and every room are production's; only the doors are redrawn. Each option opens on Try it, the hub running; every caption is read off its frame.",
  opening: {
    about:
      "Round four of the hub's doors: glass, cards over the seam and windows, each refined to its best version, each with its sticky form.",
    settled: [
      "The cover's facts are the strip, your round-three pick, now wired: every frame here stands on it.",
      "Every room opens over the hub (wired): Review and Guests in Settings' panel, the reel full screen, As a guest an inert phone.",
      "In every option a room's link opens another room in its panel: in Settings, Who can get in, then Let them in from Guests.",
      "The waiting light's colour is the brand's question (its status set): every door here wears today's light and adds no hue.",
      "The atoms are identity's, wired: the camera's voice, the display's layers, every state a light.",
    ],
    earlier: [
      "Round three: 'all three are well-designed and stand on their own merits, but I'm currently leaning toward one glass capsule.'",
      "For glass, 'stacking the counts on the icons as badges', and 'total freedom' beyond it.",
      "'Cards over seam probably works best on mobile right now.'",
      "On the yellow: 'don't love our yellow color, makes the page feel dull' (the brand round asks it).",
      "'We're defining core experience here, if hosts have a bad UX using an event we'll lose them.'",
      "Round two, windows: they help 'visualize the idea of each card much better than the icons', but subtler.",
    ],
  },
  terms: [
    {
      term: "hub",
      means:
        "Maya's own page for her event: the cover, the doors into her rooms, the checklist and the album.",
    },
    {
      term: "cover",
      means:
        "The album's photographs dissolving edge to edge at the top of the hub, the event's name over them.",
    },
    {
      term: "doors",
      means:
        "What opens her rooms: the Highlight reel, Guests, Review, Settings and See it as a guest.",
    },
    {
      term: "sticky form",
      means:
        "What the doors become once she scrolls past the cover: held under the app's bar, one press away.",
    },
    {
      term: "seam",
      means: "The edge where the cover's photograph meets the page under it.",
    },
    {
      term: "capsule",
      means:
        "One rounded glass bar holding all five doors, the way a phone's tab bar holds its tabs.",
    },
    {
      term: "badge",
      means:
        "A count sitting on a door's icon's corner, the way an app's icon carries its unread number.",
    },
    {
      term: "Try it",
      means:
        "An option's first frame: the hub running. Scroll it, then press any door.",
    },
  ],
  carried: [
    {
      id: "glass-stuck",
      question: "Where does the glass capsule go once she scrolls?",
      taken:
        "At a desk it stops under the bar where it reached it, the code joining its end; on a phone it is a tab bar at the screen's foot from the first screen.",
      overrule:
        "A full-width band under the bar holds it, the cover's face leading, at both sizes, as the cards' band does.",
    },
    {
      id: "cards-phone",
      question: "How do the cards stand on a phone?",
      taken:
        "A two by two grid over the seam with As a guest the width under it: every door and its count in sight at rest.",
      overrule:
        "Round three's shelf: larger cards in a row she scrolls sideways, two and a half in sight.",
    },
    {
      id: "settings-paused",
      question: "What does Settings' door say while uploads are paused?",
      taken:
        "Paused, the uploads' own word, plain and never amber, in place of the door's word; the code's corner keeps its pause.",
      overrule:
        "The door's word stays (Private · You let in) and only the code's corner says paused, as production does now.",
    },
  ],
  asks: [
    {
      id: "doors",
      label: "The doors",
      question: "Which of the three refined doors should open her rooms?",
      where: ["Host", "Her event's hub", "The doors"],
      when: "Tonight 8 uploads wait in Review and 2 people at her door; the week before Settings has steps left; the week after, uploads paused.",
      matters:
        "She presses them all night, so they must read at a glance and stay one press away however far she scrolls.",
      lands:
        "The hub's doors at rest and in their sticky form, at a desk and in a hand.",
      context:
        "Two frames each: Try it, the hub running (scroll it and the doors take their sticky form; press any door and its room opens over the hub), then scrolled into the album. The Moment knob draws the week before and the week after.",
      options: [
        {
          id: "glass",
          label: "One glass capsule",
          means:
            "All five doors in one glass capsule, each count a badge on its icon: on the cover at a desk, stopping under the bar as she scrolls; on a phone, its tab bar.",
          gains:
            "One object that never jumps: under the bar at a desk, under her thumb on a phone.",
          costs:
            "Five doors share one bar, and on a phone it covers the album's foot all night.",
        },
        {
          id: "cards",
          label: "Cards over the seam",
          means:
            "The cover dissolves into the page and five cards stand across the seam, every one in sight on a phone; stuck, they fold into pills under the bar.",
          gains:
            "Every door and its count in sight at rest, phone included; a waiting count reads across the room.",
          costs:
            "The deepest row: on a phone the album starts lowest, and the band sits out of her thumb's reach.",
        },
        {
          id: "windows",
          label: "Quiet windows, lit where something waits",
          means:
            "Each door a small picture of its room on the page, in grey until something in it waits on her; stuck, the same windows shrink into the band.",
          gains:
            "The calmest middle: the cover and album stay the pictures, colour landing only where she is needed.",
          costs:
            "Five small pictures to learn, and a row of its own under the cover starts the album low.",
        },
      ],
      recommended: "glass",
      because:
        "Your lean, refined: one object that never moves, its counts on its icons, the album highest, and on a phone it waits under her thumb all night.",
      overrule:
        "If every door should be big and readable across the room at rest, the cards over the seam.",
      configs: [SCREEN, GROUND, MOMENT],
    },
  ],
});
