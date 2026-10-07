import { defineExploration } from "@/components/lab/exploration";

import { DESK, GROUND, SCREEN } from "./knobs";

/**
 * THE PARTY'S FACES, ROUND ONE (the presence-r1 track, cut 2026-10-07 from
 * Will's event-header r3 note on the old `faces` option: "I absolutely love
 * the guest row design ... Would love an exploration on potential ways to
 * include (anywhere across app, marketing open as well)", with
 * transitions.dev's avatar-group hover): the guest row, the newest ringed,
 * drawn where it earns a place, the hashvatar (the seeded face) in Aperture's
 * colour, and a new party's own light before its first photograph.
 *
 * ★ THE GUEST RULES ARE THE FRAME, NEVER ASKED: a face is the one guest
 * list's (`getEventGuests`: an approved photograph makes a guest; never the
 * host, a nameless row or someone the host blocked), and it shows only where
 * the album already shows its Guests list (full access, never a teaser, a
 * lock or the demo). So no option draws a face anywhere a guest could not
 * already see it (the cover at the door is drawn with its count alone), and
 * the marketing site waits for its own round with fixtures (a carried call).
 * "Who is here now" is a question with its Realtime cost in the manifest; the
 * ring means "added last", read from the album's own photographs.
 *
 * ★ FIVE ASKS, THE COLOUR FIRST (every other frame wears it): how a face with
 * no photograph is coloured; where the row stands on her album; how it answers
 * a pointer (drawn in the album answer, so it waits on it); where the faces
 * stand on the host's hub; and what lights a new party's cover. How the
 * newest is ringed is carried, not asked (the creative director's pass:
 * Aperture's "still until something happens" already decides it, and a held
 * ring and a landing differ in time, which a still cannot show). The Guests
 * room's rows and a person's card are the guests-room board's, the marks and
 * tokens brand-marks', where the light lives signature's.
 *
 * ★ EVERY FRAME IS PRODUCTION'S SURFACE: the cover's head, the album's rows,
 * the hub's doors, its strip and its code are production's components (two
 * covers recomposed from their own markup, since neither has a slot for a
 * row); an option draws only its row, its faces, its lift or its ground. Where
 * the deciding detail is a few pixels, a frame shows it closer, and says so.
 */
export const PRESENCE = defineExploration({
  id: "presence",
  title: "The party's faces",
  surface: "shared",
  desk: 10,
  lives: [
    "docs/systems/profiles-social.md",
    "docs/systems/guest-flow.md",
    "src/components/social/guest-list.tsx",
    "src/components/ui/avatar.tsx",
    "src/lib/avatar/gradient.ts",
    "src/components/guest/event-experience-head.tsx",
    "src/app/(guest)/e/[token]/page.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/room-card-door.tsx",
  ],
  round: {
    n: 1,
    date: "2026-10-07",
    changed:
      "A new board from your event-header r3 note: the guest row, the newest ringed, placed where it earns a place on a guest's album and a host's hub, with transitions.dev's hover, its faces in Aperture's colour, and a new party's own light.",
  },
  opening: {
    about:
      "Your guest row, wherever it earns a place: her party's faces, the newest ringed, in Aperture's colour, and a new party's light before its first photo.",
    settled: [
      "A face is the guest list's: one approved photograph makes a guest; never the host, someone with no name, or anyone the host blocked.",
      "Faces show only where the album shows its Guests: past every door, never at a teaser, a lock or the demo, where a count stands alone.",
      "The row names nobody until asked and never shows an email; a guest with only a typed name wears her own colour, never a photograph.",
      "Aperture: light from the photographs, then the event's seed, then the house ember; one light to a screen, still until something happens.",
      "The Guests room and a person's card are the guests-room board's; the marks, and where the light lives, are brand-marks' and signature's.",
    ],
    earlier: [
      "Event-header r3: 'I absolutely love the guest row design... adds an alive feeling... more social/community, less old album of photos.'",
      "'Would love an exploration on potential ways to include (anywhere across app, marketing open as well).'",
      "'transitions.dev has a great effect that stacks with it here (avatar-group-hover)... even if we go with the strip.'",
      "Seed-avatar r2: you picked the mesh, one hue read at several depths, from the whole wheel, never animated.",
      "Desk 4: 'not like a junior designer was told to build a rainbow app. We are world-class tastemakers.'",
    ],
  },
  terms: [
    {
      term: "guest row",
      means:
        "Her party's faces in a line, the newest first, each over the next, then how many guests there are.",
    },
    {
      term: "newest",
      means:
        "The guest whose photograph landed in the album last; never who is looking at it now.",
    },
    {
      term: "seed",
      means:
        "The hidden code a colour is drawn from: a person's (her face) or a party's (its light before photos).",
    },
    {
      term: "comb",
      means:
        "transitions.dev's hover: the face under the pointer lifts, its neighbours a little less.",
    },
    {
      term: "house ember",
      means:
        "The light where there is no photograph and no seed: one warm glow, amber to coral.",
    },
  ],
  carried: [
    {
      id: "newest",
      question: "How does the row ring the newest face?",
      taken:
        "As each photo lands, a flare in its light, spent in two seconds into a fine ring that always marks the newest; still otherwise.",
      overrule:
        "A white ring and glow held a quarter hour while they add, as you first loved it.",
    },
    {
      id: "order",
      question: "Which faces does a row show, and in what order?",
      taken:
        "The newest first, each guest by her own newest photograph; six at a phone, eight at a desk, then the count in words.",
      overrule:
        "The list's own order, names A to Z, the newest ringed wherever she falls.",
    },
    {
      id: "here-now",
      question: "Does the ring say someone is looking now?",
      taken:
        "No: it marks who added last, read from the album. 'Here now' needs Realtime presence, about $0.50 to $5 a wedding, and shows who is watching.",
      overrule:
        "Ring whoever has the album open now, on Realtime presence, at its cost (the manifest's question).",
    },
    {
      id: "empty",
      question: "Before anyone adds, what stands where the row will be?",
      taken:
        "Nothing until the first face lands: the cover's Add asks for the first photo, and the hub's count says 0.",
      overrule: "Five empty seats on her hub: 'Faces land here as guests add.'",
    },
    {
      id: "marketing",
      question: "Does the marketing site draw the row now?",
      taken:
        "Not yet: it waits for the marketing round (you asked for the app first), drawn from fixtures only, never a real face.",
      overrule:
        "Draw it now on the marketing site's showcase album, fixtures only.",
    },
  ],
  asks: [
    {
      id: "colour",
      label: "A face's colour",
      question:
        "How should a face with no photograph be coloured, in the row and everywhere?",
      where: ["Shared", "Every face", "With no photograph"],
      when: "Most guests never set a photograph: a typed name at the door is a colour, so a party's row is mostly colours.",
      matters:
        "Six colours side by side are the brightest thing on a cover; they can read as a party or as a rainbow.",
      lands:
        "Every face with no photograph, everywhere a face is drawn (one colour a person): the row, the list, a credit, her header.",
      context:
        "The row closer (twice its size) and at a phone on Maya & Jay's cover, in the album's bar on paper, all 38 as the list opens them, and Priya's own face at its largest.",
      options: [
        {
          id: "wheel",
          label: "As today: her own colour, any hue",
          means:
            "The mesh from her seed, its hue from the whole wheel (seed-avatar r2): the faces of the row you loved.",
          gains:
            "Built, the row as you loved it, and every guest distinct at a glance.",
          costs:
            "Six saturated discs side by side read as paint, the loudest thing on a cover.",
        },
        {
          id: "warm",
          label: "Her own colour, from one warm arc",
          means:
            "The same mesh, its hue from the house ember's arc, wine through coral to pale apricot, so a crowd reads as one gathering.",
          gains:
            "A party in the house's own warmth, never a rainbow, every initial as legible as today.",
          costs:
            "Close neighbours part only by depth and initial; every face's colour changes from today's.",
        },
        {
          id: "lit",
          label: "Her colour at dusk, deeper and quieter",
          means:
            "A disc of the room with her own hue as light falling in from the top-left, deeper and quieter than paint; her initial stands in that light.",
          gains:
            "Aperture's light, never paint: calm at any size, the same on a photograph and on paper.",
          costs:
            "Darker faces, still a hue each, and every face in the product changes with it.",
        },
      ],
      recommended: "lit",
      today: "wheel",
      because:
        "Light, never paint, at the source: the calmest row at any size, the same disc on every ground.",
      overrule:
        "If every guest should stay her own bright colour, as today; if a party should feel warm, the arc.",
    },
    {
      id: "album",
      label: "Where on her album",
      question: "On a guest's album, where should her party's faces stand?",
      where: ["Guest", "Maya & Jay's album", "Her first screen, then on"],
      when: "Priya is past the door; 38 guests have added, Theo adding now; she looks at the cover, then scrolls on into the album.",
      matters:
        "The album is where a guest spends the party; faces there make it a gathering, not a folder of photos.",
      lands:
        "Where a guest's album draws its guest list as faces: under the cover's byline, beside the album's count, or at its end.",
      context:
        "Maya & Jay's album at a phone or a laptop (Screen), the bar and the end in the room or on paper (Ground); the cover also on a bright photo, and at the door, where a count stands alone. The faces wear your colour answer.",
      options: [
        {
          id: "foot",
          label: "As today: a list at the album's end",
          means:
            "Up to twelve guests as names under the album; more, a row of faces that opens the list; at a desk the cover counts guests.",
          gains: "Built: the photographs lead, and the people close the album.",
          costs:
            "Most guests never reach the end, so the party's people go unseen.",
        },
        {
          id: "cover",
          label: "Under the name, on the cover",
          means:
            "The row stands under the byline: the newest faces, the newest ringed, then '38 guests'; tapped, it opens the list, which no longer closes the album.",
          gains:
            "Her party is the first thing she sees: an album made by people, alive.",
          costs:
            "One more line on the cover, and small faces on a moving photograph.",
        },
        {
          id: "bar",
          label: "Beside the album's count",
          means:
            "The row stands in the album's bar after its count (the line under it at a phone); tapped, it opens the list, which no longer closes the album.",
          gains:
            "The faces sit with the photographs they made, on the page's quiet ground.",
          costs:
            "It scrolls away with the bar, and adds a second line to a phone's bar.",
        },
      ],
      recommended: "cover",
      today: "foot",
      because:
        "Every guest sees the cover first: her party stands there under the host's name, before a single scroll.",
      overrule:
        "If the cover should stay the photograph and the name, the row beside the album's count.",
      configs: [SCREEN, GROUND],
    },
    {
      id: "hover",
      label: "The pointer",
      question: "At a desk, how should the row answer her pointer?",
      where: ["Guest", "The guest row", "A pointer on the faces"],
      when: "At a laptop, Priya runs her pointer along her party's faces, wondering who these people are.",
      matters:
        "A row of faces invites a touch; how it answers is the difference between a picture and people.",
      lands:
        "How every row of faces answers a pointer at a desk (a tap on a phone opens the list in each), and stills for less motion.",
      context:
        "The row in your album answer, closer (twice its size) at a laptop: playing, a pointer drifting along it; then held on Theo, the newest, and on a face mid-row.",
      options: [
        {
          id: "still",
          label: "As today: the row presses as one",
          means:
            "Nothing moves under the pointer: the faces are one button that gives a little as it is pressed.",
          gains: "The calmest: nothing competes with the photographs.",
          costs: "The faces read as a picture of a list, never as people.",
        },
        {
          id: "comb",
          label: "transitions.dev's comb, as published",
          means:
            "The face under the pointer lifts to the front, its neighbours less, all springing back past rest; '38 guests' turns to its name.",
          gains: "Your find, whole: playful and physical, and it says who.",
          costs: "Its spring overshoots: the liveliest motion on the page.",
        },
        {
          id: "settled",
          label: "The comb, settled",
          means:
            "The same lift and the same name in the count's place, eased home with no overshoot, at the house's pace.",
          gains:
            "It says who as it lifts, then settles like the rest of the house.",
          costs: "Less play than the spring you found.",
        },
      ],
      recommended: "comb",
      today: "still",
      because:
        "Your find, whole, and it answers 'who is that?' in the count's own place: delight that costs nothing in clarity.",
      overrule:
        "If nothing on the page should spring, the comb settled; if the faces should stay still, as today.",
      after: { ask: "album" },
    },
    {
      id: "hub",
      label: "Where on her hub",
      question: "On her hub, where should her guests' faces stand?",
      where: ["Host", "Her event's hub", "The cover and the doors"],
      when: "Maya checks her hub during the party: 38 guests in, Theo adding now, two people waiting at her door.",
      matters:
        "The hub is where a host runs her party; faces say who has added at a glance, which a number never does.",
      lands:
        "Where the hub draws its guests as faces: the cover's line beside the date, or the Guests door, at rest and folded.",
      context:
        "Maya's hub at a laptop or a phone (her screen): closer, the cover's line and the doors at rest and folded; then the hub whole, its doors at rest.",
      options: [
        {
          id: "count",
          label: "As today: a count on the cover",
          means:
            "A people glyph and its number on the cover's line; the Guests door says how many wait at her door.",
          gains: "Built; the cover stays your strip and its numbers.",
          costs: "Her party is a number until she opens the room.",
        },
        {
          id: "line",
          label: "Faces on the cover's line",
          means:
            "The people glyph becomes her newest faces at the line's own height, the newest ringed, then the count; the cover keeps its rhythm.",
          gains:
            "Your strip says how busy, the faces say who, and the line keeps its height.",
          costs:
            "Small faces on a moving photograph, and a phone's line a hair taller.",
        },
        {
          id: "door",
          label: "Faces on the Guests door",
          means:
            "The Guests door's glyph becomes its newest three, grouped in the glyph's own place, the waiting count on their shoulder; folded, two.",
          gains:
            "The door to her people shows them, and the cover keeps your strip alone.",
          costs:
            "Its faces are guests already in, beside a count of people still waiting.",
        },
      ],
      recommended: "line",
      today: "count",
      because:
        "Your strip and your faces together, on the line she reads every visit: how busy, and who.",
      overrule:
        "If the cover should stay numbers, the faces on the Guests door.",
      configs: [DESK],
    },
    {
      id: "atmosphere",
      label: "Before the first photo",
      question:
        "Before its first photograph, what should light a new party's cover?",
      where: ["Shared", "A new party's cover", "Before anyone adds"],
      when: "Maya made her party last night and nobody has added yet: the first guest's album at a phone, and Maya's hub.",
      matters:
        "Every party starts here; with no photograph yet, the cover's light is the party's first impression.",
      lands:
        "What lights every cover with no photograph to show, the guest's and the host's: the house's warmth, or the party's own seed.",
      context:
        "A new party before anyone adds: the first guest's album at a phone and Maya's hub at a laptop, each cover the room in both themes; the seed's colour follows your colour answer.",
      options: [
        {
          id: "house",
          label: "As today: the house ember",
          means:
            "Every new party's cover stands on the same warm house light until its first photograph.",
          gains:
            "Built, warm and calm; the first photograph is the first colour.",
          costs: "Every new party starts in the same light, whoever's it is.",
        },
        {
          id: "lamp",
          label: "The party's seed, as a lamp",
          means:
            "The party's own seed lights its cover as a small lamp, its light pooled behind the name; on the hub, the Seam alone carries it.",
          gains:
            "Each party has its own light from its first minute, and its first photo will outshine it.",
          costs:
            "A colour no one chose, and a cover that is mostly dark until the first photo.",
        },
        {
          id: "field",
          label: "The seed's colour, edge to edge",
          means:
            "The party's seed spread under the whole cover, one hue at several depths, dimmed into the room, strongest above the words.",
          gains:
            "The party's colour as a whole sky: rich, and unmistakably its own.",
          costs:
            "A field of colour reads as paint, and competes with the first photograph.",
        },
      ],
      recommended: "lamp",
      today: "house",
      because:
        "Aperture's order made visible: the party's seed before its first photograph, a light in the dark, never paint.",
      overrule:
        "If a new party should start in the house's warmth, as today; if its colour should fill the cover, the field.",
    },
  ],
});
