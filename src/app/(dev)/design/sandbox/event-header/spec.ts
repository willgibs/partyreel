import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * THE HUB'S HEAD, ROUND THREE (the event-header-r3 track, cut 2026-10-03).
 *
 * Round two's picks: the facts' strip, on his condition that nothing spanning
 * the cover leans on a timeline; every room over the hub (wired by
 * `rooms-wiring`, so this round draws the hub as it now is and asks nothing of
 * the rooms); and a second iteration of each of the three doors before he
 * decides. The dial is banked as an analytics idea and drawn nowhere here.
 *
 * ★ TWO DECISIONS, NEITHER STAGED. `facts` is what the cover says under the
 * name, `doors` what opens her rooms, at rest and in its sticky form. Neither
 * ask has an option that is production any more (`today` is undeclared on
 * both), so each is drawn wearing the other's recommendation until he picks,
 * and his pick from then on (`exploration.ts`'s `Decision.today`).
 *
 * ★ EVERY FACTS OPTION STANDS ON SIX ALBUMS AT ONCE (`fixtures.ts`): the
 * wedding tonight and the week before, then his four shapes: a weekend over a
 * range of days, a morning, an album with no date, and a slow trickle. A fact
 * that breaks on one of them shows it in the same view as the five it holds
 * on.
 *
 * ★ EVERY FRAME IS PRODUCTION'S HUB, NOT A PICTURE OF IT: the app's bar, the
 * album's own head (`EventHead`, its photographs dissolving in the real
 * keyframes), the code (`EventCodeDoor`), the checklist, the album's section
 * header and every room are production's components on identity's wired
 * atoms; what a decision redraws is drawn beside them in those atoms.
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

/** Tonight every door has something in it; the week before, every room is empty. */
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
  surface: "host",
  desk: 50,
  lives: [
    "docs/systems/host-app.md",
    "src/app/(app)/dashboard/[eventId]/page.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/event-cards-row.tsx",
    "src/components/app/event-feed/room-card.ts",
    "src/components/app/event-feed/reel-card.tsx",
    "src/components/app/event-feed/edge-fade-scroller.tsx",
  ],
  round: {
    n: 3,
    date: "2026-10-03",
    changed:
      "Round three: the facts made free of a timeline (your strip, laid photo by photo, beside three new ideas, each on six albums), and round two's three doors refined as you asked, each with its sticky form.",
  },
  history: [
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
    "Round three, on the hub as rooms-wiring left it: the cover, the code and the album are production's, and only the facts and the doors are redrawn. Each facts option stands on six albums at once; each doors option opens on Try it, the hub running. Every caption is read off its frame.",
  opening: {
    about:
      "Round three of the hub's head: its facts made free of a timeline, beside three new ideas, and each of round two's doors refined with its sticky form.",
    settled: [
      "Every room opens over the hub (your rooms=over, wired): one panel for Review, Guests and Settings, the reel full screen, See it as a guest a phone.",
      "The cover, the code on its white mat and the album stay as built; the checklist stands at the hub's head until the event is ready.",
      "The dial is banked as an analytics idea: it is drawn nowhere on the hub.",
      "An event gets an optional end date, a range of days with no times (event-dates wires it); the board draws ranges as settled.",
      "The atoms are identity's, wired: the camera's voice, the display's layers, every state a light.",
    ],
    earlier: [
      "Round two: the strip, 'super cool... more alive while reducing the crowded UI', if nothing spanning the card leans on a timeline.",
      "The cases you named: a multi-day trip with a slow trickle, an event with no date set, a morning whose uploads all land early.",
      "Today's line and the name alone 'felt too bland'; the dial had 'a weird sundial feel in that spot', though you love it as analytics.",
      "On the doors: 'a second-round iteration of each before deciding', and the reel card no longer filled with stills: 'this crowds it too much.'",
      "Cards: 'a very apple tv UI-esque way... gradient overlay fades, cards covering seams, beautiful almost app store display.'",
      "Windows 'helps visualize the idea of each card much better than the icons', but subtler, the reel's card in line with its own design.",
      "Glass on the cover, 'my favorite safe option': minimal, good info conveyance, and it slides right into the sticky menu. Polish it.",
      "For every door option, its own version of sliding cleanly into the sticky band on scroll.",
      "Rooms over the hub: 'phenomenally more fluid, natural, and intuitive. As a guest screen is a really cool idea.'",
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
      term: "sticky band",
      means:
        "The slim bar the doors fold into once she scrolls past the cover, the code's chip at its end.",
    },
    {
      term: "doors",
      means:
        "What opens her rooms: the Highlight reel, Guests, Review, Settings and See it as a guest.",
    },
    {
      term: "strip",
      means:
        "A line of marks along the cover's foot, one for each stretch of the album, tallest where most landed together.",
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
      term: "glass",
      means:
        "The see-through material every control on a photograph wears, as a guest's Invite does on her cover.",
    },
    {
      term: "lit",
      means:
        "Photos landing now (the newest within a quarter of an hour): its mark, face or colour held bright.",
    },
    {
      term: "Try it",
      means:
        "A doors option's first frame: the hub running. Scroll it, then press any door.",
    },
  ],
  carried: [
    {
      id: "strip-axis",
      question: "What does the strip lay out, if not the night's hours?",
      taken:
        "The album's own order, photo by photo: its first photo at the left, the newest at the right, each mark as tall as how many landed with it.",
      overrule:
        "One mark per drop (a guest's one press of Add), in the order they came.",
    },
    {
      id: "glass-dock",
      question: "Where does the glass capsule go once she scrolls?",
      taken:
        "It floats on under the bar itself, the cover's face leading it and the code's chip closing it, over the album.",
      overrule: "A full-width sticky band holds it, as the cards' band does.",
    },
  ],
  asks: [
    {
      id: "facts",
      label: "The facts",
      question: "What should carry the cover's facts, for any shape of event?",
      where: ["Host", "Her event's hub", "The cover's foot"],
      when: "She checks her hub: a wedding tonight and the week before, a weekend on its third day, a morning, no date, a trickle.",
      matters:
        "It is the first thing she reads each visit, and it must read true for every kind of event, not one night.",
      lands:
        "What the cover says under the name on every hub: the album's count, whether photos are landing now, and its shape.",
      context:
        "Six frames each, the same six albums: the wedding tonight and the week before, a weekend over three days, a morning, no date set and a slow trickle, each the top of the hub, its doors the doors' pick.",
      options: [
        {
          id: "strip",
          label: "The strip, photo by photo",
          means:
            "Your strip with no clock under it: the album laid photo by photo along the foot, each mark as tall as how many landed with it, the newest end lit.",
          gains:
            "Your pick kept whole: alive, roomy, and true for a morning, a weekend, no date or a trickle.",
          costs:
            "An abstract line: what a mark means waits for a hover, and a small album fills only its end.",
        },
        {
          id: "faces",
          label: "The faces along the foot",
          means:
            "Everyone who added, as faces in a row under the name, the newest first and lit while they add, then the album's count.",
          gains:
            "Her party as its people: warm at a glance, and true for any event's shape.",
          costs:
            "A guest with no photo of themselves is a colour and an initial, and a crowd past a dozen is a count.",
        },
        {
          id: "latest",
          label: "The newest, in a line",
          means:
            "The photo that landed last as a small print, who sent it and how long ago, then the totals in a few words.",
          gains:
            "Says what just happened in plain words: a trickle's 3 days ago reads as true as tonight's just now.",
          costs:
            "Words where the others draw: the least to look at, and it changes with every arrival.",
        },
        {
          id: "colours",
          label: "The album's colours",
          means:
            "One ribbon along the foot made of every photo's own colour, in the order they landed, the count at its end.",
          gains:
            "The cleanest head: the album's own light, distilled, with nothing to read but the count.",
          costs:
            "Says the least, and needs each photo's colour read as it is made (a field the album would carry).",
        },
      ],
      recommended: "strip",
      because:
        "It keeps what you loved in the strip and fixes what you named: laid by the album, never the clock, it fills true for every event.",
      overrule:
        "If the cover should say what just happened in words, the newest in a line.",
      configs: [SCREEN, GROUND],
    },
    {
      id: "doors",
      label: "The doors",
      question: "Which of the three refined doors should open her rooms?",
      where: ["Host", "Her event's hub", "The doors"],
      when: "Tonight 8 uploads wait in Review and 2 people at her door; the week before nothing waits and Settings has steps left.",
      matters:
        "She presses them all night, so they must read at a glance and stay one press away however far she scrolls.",
      lands:
        "The hub's doors at rest and in their sticky form, at a desk and in a hand.",
      context:
        "Two frames each: Try it, the hub running (scroll it and the doors take their sticky form; press any door and its room opens over the hub), then scrolled into the album. The Moment knob draws the week before.",
      options: [
        {
          id: "cards",
          label: "Cards over the seam",
          means:
            "The cover fades into the page and the cards stand over that seam on a soft lift, the reel's card like the rest; stuck, pills under a band that fades.",
          gains:
            "App Store depth: the cover and its doors read as one composition, each card roomy and calm.",
          costs:
            "The tallest row, so the album starts lowest, and a phone's shelf of cards scrolls sideways.",
        },
        {
          id: "windows",
          label: "Quiet windows",
          means:
            "Each door a small inset picture of its room in grey, taking its colour under the pointer, the reel's a small player; stuck, the picture is the pill's glyph.",
          gains:
            "Each door shows what is inside it, and the row stays quiet between the cover and the album.",
          costs:
            "Five small pictures to read, and a photo in grey is a step from the real one.",
        },
        {
          id: "glass",
          label: "One glass capsule",
          means:
            "All five doors in one glass capsule at the cover's foot, the waiting counts as amber lights; stuck, the same capsule floats on under the bar.",
          gains:
            "The calmest hub: one object on the cover, the album highest, and the capsule docks as itself.",
          costs:
            "Doors on a moving photograph, and a phone's capsule is five small segments.",
        },
      ],
      recommended: "glass",
      because:
        "One object holds every door on the cover and docks as itself under the bar: your safe favourite, polished, with the album highest.",
      overrule:
        "If the doors should feel like a shelf of their own, the cards over the seam.",
      configs: [SCREEN, GROUND, MOMENT],
    },
  ],
});
