import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * THE HUB'S HEAD, ROUND TWO (the event-header-r2 track, cut 2026-10-02).
 *
 * His r1 picks are built (`header-wiring`): every album opens on its cover,
 * the hub wears the same cover with the code on its white mat, and the sticky
 * band takes the doors once she scrolls. His note on `host=shared` is this
 * round: the metadata under the title, the doors that each do something
 * different ("some actions open a sheet, some are a new page, some (reel)
 * seems to flash a guest album"), the trip into a guest's page and back, and
 * "a better way to redesign the action cards to pair with this new host head
 * direction". And his banked line from disposable-mode r3: "The night on a
 * dial was super cool, wonder if that could be banked and used as a cool
 * analytics UI or something for hosts?"
 *
 * ★ THREE DECISIONS, TOP TO BOTTOM OF THE HUB, NONE STAGED. `facts` is what
 * the cover says beside the name, `doors` what the row under it looks like,
 * `rooms` what a door does when pressed. Each is drawn in what the board holds
 * for the other two (his pick once made, today until then: every ask declares
 * the option that IS production, so "today" is always today), and none waits
 * on another (`after`), so a note on one never holds the rest out of his walk.
 *
 * ★ EVERY FRAME IS PRODUCTION'S HUB, NOT A PICTURE OF IT: the app's bar, the
 * album's own head (`EventHead`, its photographs dissolving in the real
 * keyframes), the code (`EventCodeDoor`), today's facts in their real atoms,
 * the Reel card, the checklist and the album's section header are production's
 * components; what a decision redraws is drawn beside them in today's atoms.
 *
 * ★ NEVER ASKED HERE: the atoms (`identity`'s, among them the live mark's
 * colour), the dashboard (`host-dashboard`'s), a held or developing album's
 * cover (`the-wait`'s), how photographs leave (`take-home`'s), and the
 * guest's cover and the shutter (answered in round one).
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
    "src/app/(app)/dashboard/[eventId]/review/page.tsx",
    "src/app/(app)/dashboard/[eventId]/guests/page.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/event-cards-row.tsx",
    "src/components/app/event-feed/room-card.ts",
    "src/components/app/event-feed/reel-card.tsx",
    "src/components/app/share/event-sheets.tsx",
    "src/components/app/share/event-share-provider.tsx",
    "src/lib/event/sections.ts",
  ],
  round: {
    n: 2,
    date: "2026-10-02",
    changed:
      "Round two, from your note on the hub: its facts four ways (three with no line under the name), its doors three ways to pair with the cover, and one way every room opens and closes, three ways, each drawn tonight and the week before.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Both heads redrawn whole for Maya & Jay's wedding. You picked the cover for guests, the same cover for the hub, and the shutter, all built; this round answers your note on the hub.",
    },
  ],
  context:
    "Round two, on the hub as it ships for Maya & Jay's wedding: the cover, the sticky band and the album are production's own, and only the cover's facts, the doors and how a room opens are redrawn. Tonight the party is live (214 photos, 8 in Review, 2 at the door); the week before, nothing is in it and the checklist stands at the head. Each rooms option opens on Try it, a live hub whose doors work in that option's way. Every caption is read off its frame.",
  opening: {
    about:
      "The hub's head on the cover it now wears: how it carries its facts, what its doors look like, and one way every room opens from it and closes back.",
    settled: [
      "The hub wears the album's cover with the code on its white mat, and the sticky band takes the doors once she scrolls: round one's picks, built.",
      "The album, its count and its actions stay as built; the checklist stands at the hub's head until the event is ready.",
      "Every door is drawn in today's atoms; how a button, a chip or a card looks is the identity board's.",
      "The guest's cover and the shutter are answered; a guest's album shows here only as what See it as a guest opens.",
    ],
    earlier: [
      "On the hub: 'Still don't love how we're presenting some of the metadata under the title (item counts, date, live, etc).'",
      "'Love how they're captured into a sticky menu on scroll for page-wide access.'",
      "'Currently hate how some actions open a sheet, some are a new page, some (reel) seems to flash a guest album as it loads the slideshow.'",
      "'Very unpredictable handling across actions stemming from the same row. Annoying that I have to go all the way into and all the way back.'",
      "'Wonder if there's a better way to redesign the action cards to pair with this new host head direction?'",
      "On disposable-mode: 'The night on a dial was super cool, wonder if that could be banked and used as a cool analytics UI or something for hosts?'",
      "On create: a host explores her event as a guest from her finished hub, 'a final payoff, not mid-point distraction.'",
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
        "The row under the cover that opens her rooms: the Highlight reel, Guests, Review, Settings and See it as a guest.",
    },
    {
      term: "rooms",
      means:
        "What a door opens: Review's held uploads, Guests and who waits at the door, Settings, the reel, and the guests' album.",
    },
    {
      term: "the night",
      means:
        "The party's photographs at the minutes they landed, from the first one to now.",
    },
    {
      term: "panel",
      means:
        "A surface standing in from the screen's right edge with the hub behind it, the way Settings opens at a desk today.",
    },
    {
      term: "Try it",
      means:
        "A decision's first frame: the hub live in that option. Press any door, then close it.",
    },
    {
      term: "See it as a guest",
      means:
        "Her album exactly as a guest meets it, opened from her hub and closed back to it.",
    },
    {
      term: "glass",
      means:
        "The see-through material every control on a photograph wears, as a guest's Invite does on her cover.",
    },
  ],
  carried: [
    {
      id: "guest-door",
      question: "Where does See it as a guest live on the hub?",
      taken:
        "As the last door, after Settings: her album in a guest's phone, the payoff at the end of the row, never offered mid-setup.",
      overrule:
        "On the cover as her own white button, the way Add photos stands on a guest's cover.",
    },
    {
      id: "fact-homes",
      question: "Where does each fact go once the line under the name goes?",
      taken:
        "Onto what it counts: guests onto Guests, the album's count onto its label, the date over the name, and the link under the code as its address.",
      overrule:
        "Keep the counts on the cover beside the name, as glyphs, whatever else changes.",
    },
  ],
  asks: [
    {
      id: "facts",
      label: "The facts",
      question: "How should the hub's head carry its facts?",
      where: ["Host", "Her event's hub", "The cover"],
      when: "Maya opens her event tonight: 214 photos from 31 guests, her code opened 486 times, the album live.",
      matters:
        "It is the first thing she reads each time she checks on her party, so it has to read at a glance.",
      lands:
        "What the hub's cover says beside the name: the counts, the date, the live mark and the link, at a desk and in a hand.",
      context:
        "Two frames each: the hub tonight, and the week before with nothing in it. A fact that leaves the line under the name moves onto what it counts (a carried call).",
      options: [
        {
          id: "today",
          label: "Today's line",
          means:
            "The date, the album's, guests' and views' glyphs and the live mark in one line under the name, the link under that.",
          gains:
            "Built: every fact in one place, its words on hover and a tap.",
          costs:
            "Two lines of small glyphs and numbers that read as metadata over her photographs.",
        },
        {
          id: "dial",
          label: "The night on a dial",
          means:
            "The night as a clock face beside the code: its photographs marked around the hours, the busiest tallest, the count at its heart, now lit while live.",
          gains:
            "Her party's size, rhythm and liveness in one glance; the one fact that moves all night looks alive.",
          costs:
            "A new instrument to learn, and a party of several days needs a dial of days.",
        },
        {
          id: "strip",
          label: "The night along the foot",
          means:
            "The night as a line of marks along the cover's foot, edge to edge under the name: the busiest tallest, the count at its end, now lit.",
          gains:
            "The night's shape at full width, read left to right like a timeline, roomy on a phone.",
          costs:
            "Thin marks over a photograph, read across rather than at a glance.",
        },
        {
          id: "name",
          label: "The name alone",
          means:
            "Only the date and the live mark over the name; every count moves onto what it counts, and the link under the code.",
          gains:
            "The calmest head: her party and its name, with nothing under it to read.",
          costs:
            "No number on the cover: how big and how busy the night is waits on the doors.",
        },
      ],
      recommended: "dial",
      today: "today",
      because:
        "The one fact that moves all night becomes a living thing: how big her party is, when it peaked, and that it is live, without a word.",
      overrule:
        "If the cover should say nothing but the name, the name alone moves every count onto its door.",
      configs: [SCREEN],
    },
    {
      id: "doors",
      label: "The doors",
      question: "What should the doors into her rooms look like?",
      where: ["Host", "Her event's hub", "Under the cover"],
      when: "Tonight 8 uploads wait in Review and 2 people at her door; the week before nothing waits and Settings has steps left.",
      matters:
        "She presses them all night, and they should read as her party rather than a settings page.",
      lands:
        "The hub's doors at rest and folded into the sticky band, at a desk and in a hand.",
      context:
        "Two frames each: the hub as she opens it, then scrolled into the album with the doors in the sticky band. The Moment knob draws the week before.",
      options: [
        {
          id: "cards",
          label: "Today's cards",
          means:
            "Outlined cards under the cover, each its glyph, its name and one line, a fifth for See it as a guest; pills in the band.",
          gains: "Built, and every door says its state in words.",
          costs:
            "Plain tiles under a photograph: they read as a settings page, not her party.",
        },
        {
          id: "windows",
          label: "Windows into each room",
          means:
            "Each door shows what is inside it: the reel playing, the faces at the door, the uploads waiting, Settings' steps, her album in a phone.",
          gains:
            "Her party is the colour of every door, and each shows its state without a word.",
          costs:
            "Five small pictures under a big one: the busiest row on the page.",
        },
        {
          id: "glass",
          label: "On the cover, in glass",
          means:
            "The doors stand on the photograph at the cover's foot in glass, each its glyph and its count (its name too at a desk), as a guest's Invite does.",
          gains:
            "One object: the cover is her control surface, and the album starts higher.",
          costs:
            "Small targets on a moving photograph, and the cover carries more.",
        },
      ],
      recommended: "windows",
      today: "cards",
      because:
        "Each door is a window onto its room, so the hub reads as her party from the cover down, and what waits shows on its own picture.",
      overrule:
        "If the album should start higher, the doors stand on the cover in glass.",
      configs: [SCREEN, MOMENT],
    },
    {
      id: "rooms",
      label: "The rooms",
      question: "How should every room open from the hub?",
      where: ["Host", "Her event's hub", "Opening a room"],
      when: "Tonight she clears Review, lets 2 people in, watches the reel, then sees it all as a guest.",
      matters:
        "Today one row does three things (two pages, a panel, a trip to the guests' album); one way in and out makes it predictable.",
      lands:
        "How Review, Guests, Settings, the reel and See it as a guest open from the hub and close back to it, at a desk and in a hand.",
      context:
        "Four frames each: Try it, the hub live in that option (press any door, then close it), then Review, the reel and See it as a guest opened. The Moment knob draws the week before.",
      options: [
        {
          id: "today",
          label: "Today's mix",
          means:
            "Review and Guests are pages, Settings a panel over the hub, and the reel and a guest's view are a trip to the guests' album.",
          gains: "Built, and Review and Guests each get a whole page.",
          costs:
            "One row, three behaviours, and the guests' album is a trip there and back.",
        },
        {
          id: "over",
          label: "Every room over the hub",
          means:
            "Each door opens its room over the hub, a panel at a desk and the whole screen in a hand; the reel and her guests' album open over everything.",
          gains:
            "One way in and one way out, and the hub, its album and its band never leave.",
          costs:
            "A working room gets a panel's width at a desk, not the page's.",
        },
        {
          id: "under",
          label: "Every room under the band",
          means:
            "The doors become the band's tabs: a door swaps the album under it for its room, the reel plays in the cover, a guest's view takes the hub.",
          gains:
            "Nothing stacks, and every room is one press from every other.",
          costs:
            "A room starts under the cover, and the cover changes job for the reel and a guest's view.",
        },
      ],
      recommended: "over",
      today: "today",
      because:
        "Every room opens the same way over the hub and closes back to it, so the album she left is exactly where she left it.",
      overrule:
        "If she should hop room to room without closing one, the doors become the band's tabs.",
      configs: [SCREEN, MOMENT],
    },
  ],
});
