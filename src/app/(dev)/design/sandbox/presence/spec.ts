import { defineExploration } from "@/components/lab/exploration";

import { DESK, GROUND, SCREEN } from "./knobs";

/**
 * THE PARTY'S FACES, ROUND ONE (the presence-r1 track, cut 2026-10-07 from
 * Will's event-header r3 note on the old `faces` option: "I absolutely love
 * the guest row design ... Would love an exploration on potential ways to
 * include (anywhere across app, marketing open as well)", with
 * transitions.dev's avatar-group hover): the guest row, the newest ringed in
 * light, drawn where it earns a place, and the hashvatar as the light of a
 * party with no photograph yet, in Aperture (brand r2's pick).
 *
 * ★ THE GUEST RULES ARE THE FRAME, NEVER ASKED: a face is the one guest
 * list's (`getEventGuests`: an approved photograph makes a guest; never the
 * host, a nameless row or someone the host blocked), and it shows only where
 * the album already shows its Guests list (full access, never a teaser, a
 * lock or the demo). So no option draws a face anywhere a guest could not
 * already see it, and the marketing site waits for its own round with
 * fixtures (a carried call). "Who is here now" is a question with its
 * Realtime cost in the manifest; the ring means "added last", read from the
 * album's own photographs.
 *
 * ★ FIVE ASKS, THE GUEST'S FIRST: where the row stands on her album; how the
 * newest is ringed and how the row answers a pointer (both drawn in the album
 * answer, so they wait on it); where the faces stand on the host's hub; and
 * what lights a party's cover before its first photograph. The Guests room's
 * rows and a person's card are the guests-room board's, the marks and tokens
 * brand-marks', where the light lives signature's.
 *
 * ★ EVERY FRAME IS PRODUCTION'S SURFACE: the cover's head, the album's rows,
 * the hub's doors, its strip and its code are production's components (two
 * covers recomposed from their own markup, since neither has a slot for a
 * row); an option draws only its row, its ring, its lift or its ground.
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
      "A new board from your event-header r3 note: the guest row, the newest ringed in light, placed where it earns a place on a guest's album and a host's hub, with transitions.dev's hover, and a party's own colour before its first photograph.",
  },
  opening: {
    about:
      "Your guest row, wherever it earns a place: her party's faces, the newest ringed in light, and a party's own colour before its first photograph.",
    settled: [
      "A face is the guest list's: one approved photograph makes a guest; never the host, a nameless row or anyone the host blocked.",
      "Faces show only where the album shows its Guests: past every door, never at a teaser, a lock or in the demo, where a count stands alone.",
      "The row names nobody until asked and never carries an address; a guest with only a typed name wears her own colour, no photograph.",
      "Aperture: light from the photographs, then the event's seed, then the house ember; one light to a screen, still until something happens.",
      "The Guests room and a person's card are the guests-room board's; the marks and where the light lives are brand-marks' and signature's.",
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
      term: "hashvatar",
      means:
        "A face with no photograph: one colour from a person's own seed, read at several depths.",
    },
    {
      term: "seed",
      means:
        "The private string a colour is drawn from: a person's (her face) or a party's (its light before photos).",
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
      id: "order",
      question: "Which faces does a row show, and in what order?",
      taken:
        "The newest first, each guest by her own newest photograph; six at a phone, eight at a desk, then the count in words.",
      overrule:
        "The list's own order, names A to Z, the newest ringed wherever she falls.",
    },
    {
      id: "colours",
      question: "What colour is each face in a row?",
      taken:
        "Her own: the mesh from her seed, from the whole wheel (seed-avatar r2), so a party reads as many people.",
      overrule:
        "Every face drawn from one warm arc, so a crowd reads as one gathering.",
    },
    {
      id: "here-now",
      question: "Does the ring say someone is looking now?",
      taken:
        "No: the newest is who added last, read from the album; 'here now' needs a live presence channel (its cost is your question).",
      overrule:
        "Ring whoever has the album open now, on Realtime's presence, at its cost.",
    },
    {
      id: "empty",
      question: "Before anyone adds, what stands where the row will be?",
      taken:
        "Nothing on a guest's cover (its Add asks for the first photo); on Maya's hub, five empty seats: 'Faces land here.'",
      overrule: "Nothing on either until the first face lands.",
    },
    {
      id: "marketing",
      question: "Does the marketing site draw the row now?",
      taken:
        "Not yet: it waits for the marketing round (your order to launch), drawn from fixtures only, never a real face.",
      overrule: "Draw it now on the home's demo album, fixtures only.",
    },
  ],
  asks: [
    {
      id: "album",
      label: "Where on her album",
      question: "On a guest's album, where should her party's faces stand?",
      where: ["Guest", "Maya & Jay's album", "Her first screen, then its end"],
      when: "Priya is past the door; 38 guests have added, Theo adding now; she looks at the cover, then scrolls to the album's end.",
      matters:
        "The album is where a guest spends the party; faces there make it a gathering, not a folder of photos.",
      lands:
        "Where a guest's album draws its guest list as faces: under the cover's byline, beside the album's count, or at its end.",
      context:
        "Maya & Jay's album at a phone or a laptop (Screen), the album's bar and end in the room or on paper (Ground): its first screen, then scrolled to its end. The row wears your newest and pointer answers.",
      options: [
        {
          id: "foot",
          label: "As today: a list at the album's end",
          means:
            "Under the album, names as chips to twelve, then a row of faces that opens the list; at a desk the cover counts guests with a glyph.",
          gains: "Built: the photographs lead, and the people close the album.",
          costs:
            "Most guests never reach the end, so the party's people go unseen.",
        },
        {
          id: "cover",
          label: "Under the name, on the cover",
          means:
            "The row stands under the byline: the newest faces, the newest ringed, then the count; it opens the list, which leaves the album's end.",
          gains:
            "Her party is the first thing she sees: an album made by people, alive.",
          costs:
            "One more line on the cover, and small faces on a moving photograph.",
        },
        {
          id: "bar",
          label: "Beside the album's count",
          means:
            "The row stands in the album's bar after its count (its own line at a phone); it opens the list, which leaves the album's end.",
          gains:
            "The faces sit with the photographs they made, on the page's quiet ground.",
          costs:
            "It scrolls away with the bar, and shares a phone's bar with Select and View.",
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
      id: "colour",
      label: "A face's colour",
      question: "In a row, how should a face with no photograph be coloured?",
      where: ["Shared", "Every face", "With no photograph"],
      when: "Most guests never set a photograph: a typed name at the door is a colour, so a party's row is mostly colours.",
      matters:
        "Six colours side by side are the brightest thing on a cover; they can read as a party or as a rainbow.",
      lands:
        "Every face with no photograph, everywhere a face is drawn (one colour a person): the row, the list, a credit, her header.",
      context:
        "The row at a phone on Maya & Jay's cover (a photograph) and in the album's bar on paper, beside Priya's own face at its largest, as her page draws it.",
      options: [
        {
          id: "wheel",
          label: "As today: her own colour, any hue",
          means:
            "The mesh from her seed, its hue from the whole wheel (seed-avatar r2): six faces, six hues.",
          gains: "Built, and every guest is distinct at a glance.",
          costs:
            "Six saturated discs side by side read as paint, the loudest thing on a cover.",
        },
        {
          id: "warm",
          label: "Her own colour, from one warm arc",
          means:
            "The same mesh, its hue drawn from the generator's warm arc (coral to gold), so a crowd reads as one gathering.",
          gains: "A party in the house's own warmth, never a rainbow.",
          costs:
            "Neighbours can look alike, and some of the arc sits near brown.",
        },
        {
          id: "lit",
          label: "Lit: a lamp in her own colour",
          means:
            "A face is a disc of the room with her hue as light inside it, from the top-left, her initial in that light.",
          gains:
            "Aperture's light, never paint, and the same on a photograph and on paper.",
          costs: "Darker faces, and every face in the product changes with it.",
        },
      ],
      recommended: "lit",
      today: "wheel",
      because:
        "Light, never paint, at the source: one row of lamps rather than six discs of paint, the same on every ground.",
      overrule:
        "If every guest should stay her own bright colour, as today; if a party should feel warm, the arc.",
    },
    {
      id: "newest",
      label: "The newest's ring",
      question: "When a guest adds, how should the row ring the newest face?",
      where: ["Guest", "The guest row", "As photos land"],
      when: "Theo's run of photos lands at the toast; an hour passes with nobody adding; then Priya's own first photo lands.",
      matters:
        "The ring is the row's life: it says someone is adding now, and it must never become a second light.",
      lands:
        "The newest face's ring in every row: its colour, how long it holds, at rest and as photos land, in the room and on paper.",
      context:
        "The row in your album answer at a phone, in the room or on paper (Ground): playing, then held at three beats: Theo's photos landing, an hour later, Priya's first photo landing.",
      options: [
        {
          id: "white",
          label: "A white ring, while they add",
          means:
            "As the row was first drawn: the newest ringed in white with a soft glow while their photos land (a quarter hour), then no ring.",
          gains: "The row as you loved it; white reads on any photograph.",
          costs:
            "A light with no source in the photographs, and the row rests unmarked.",
        },
        {
          id: "photo",
          label: "Their photograph's light, while they add",
          means:
            "The ring is lit in the light of the photograph they just added, held while their photos land, then no ring.",
          gains: "Light from the photographs: the face glows in what it made.",
          costs:
            "A second coloured light on a cover that may already hold one.",
        },
        {
          id: "lands",
          label: "Lit as it lands, then a fine ring",
          means:
            "The ring flares in their photograph's light as each photo lands, settling over two seconds into a fine ring that marks the newest.",
          gains: "Still until something happens, and the newest always marked.",
          costs:
            "A glance between arrivals sees the fine ring, never the glow.",
        },
      ],
      recommended: "lands",
      because:
        "Aperture's own motion: light only as a photo lands, so one light holds at rest and the newest stays marked.",
      overrule:
        "If the newest should glow the whole time they are adding, their photograph's light, held.",
      after: { ask: "album" },
      configs: [GROUND],
    },
    {
      id: "hover",
      label: "The pointer",
      question: "At a desk, how should the row answer her pointer?",
      where: ["Guest", "The guest row", "A pointer on the faces"],
      when: "At a laptop, Priya runs her pointer along her party's faces, wondering who is here.",
      matters:
        "A row of faces invites a touch; how it answers is the difference between a picture and people.",
      lands:
        "How every row of faces answers a pointer at a desk (a tap on a phone opens the list in each), and stills for less motion.",
      context:
        "The row in your album answer at a laptop: playing, a pointer drifting along it; then held with the pointer on Theo, the newest, and on a face mid-row.",
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
            "The face under the pointer lifts and grows, its neighbours less by distance; leaving, all spring back past rest.",
          gains: "Your find, whole: playful and physical.",
          costs: "Its spring overshoots: the loudest motion on the page.",
        },
        {
          id: "named",
          label: "The comb, settled, with a name",
          means:
            "The same lift, eased home with no overshoot; the face comes to the front and shows its name above it.",
          gains: "It answers 'who is that?' as it moves, at the house's pace.",
          costs: "Less play than the spring, and a name tag over the cover.",
        },
      ],
      recommended: "named",
      today: "still",
      because:
        "It answers 'who is that?' as it lifts, then settles like the rest of the house: alive, never bouncing.",
      overrule: "If the spring's play is the point, the comb as published.",
      after: { ask: "album" },
    },
    {
      id: "hub",
      label: "Where on her hub",
      question: "On her hub, where should her guests' faces stand?",
      where: ["Host", "Her event's hub", "The cover and the doors"],
      when: "Maya checks her hub during the party: 38 guests in, Theo adding now, two people waiting at her door.",
      matters:
        "The hub is where a host runs her party; faces say who is there at a glance, which a number never does.",
      lands:
        "Where the hub draws its guests as faces: the cover's line beside the date, or the Guests door, at rest and folded.",
      context:
        "Maya's hub at a laptop or a phone (her screen): her cover with your strip and its doors at rest, then scrolled, the doors folded into pills under the bar.",
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
            "The line under her party's name carries the newest faces, the newest ringed, then the count, in the people glyph's place.",
          gains:
            "Your strip says how busy, the faces say who: the cover you picked, with its people.",
          costs:
            "Small faces on a moving photograph, and the line grows a little.",
        },
        {
          id: "door",
          label: "Faces on the Guests door",
          means:
            "The Guests door's glyph becomes its newest three faces, the newest ringed, the waiting count on their shoulder; folded, two.",
          gains:
            "The door to her people shows them, and the cover keeps your strip alone.",
          costs: "Tiny faces on a card, beside four doors that wear a glyph.",
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
        "Before a party's first photograph, how should its own colour light its cover?",
      where: ["Shared", "A new party's cover", "Before anyone adds"],
      when: "Maya made her party last night and nobody has added yet: the first guest's album, and Maya's own hub.",
      matters:
        "Every party starts here; with no photograph yet, the cover's light is the party's first impression.",
      lands:
        "What lights every cover with no photograph to show (a guest's album, a host's hub): the house, or the party's seed.",
      context:
        "A new party before anyone adds: the first guest's album at a phone and Maya's hub at a laptop, each cover the room in both themes.",
      options: [
        {
          id: "house",
          label: "As today: the house ember",
          means:
            "Every new party's cover stands on the same warm house light until its first photograph.",
          gains:
            "Built, warm and calm; the first photograph is the first colour.",
          costs: "Every new party looks the same, and its seed is never seen.",
        },
        {
          id: "lamp",
          label: "The party's seed, as a lamp",
          means:
            "The party's own seed lights its cover: its orb whole, one hue at three depths, glowing in the dark like a lamp.",
          gains:
            "Each party has its own colour from its first minute, lit like light.",
          costs: "A colour no one chose, until the photographs take over.",
        },
        {
          id: "field",
          label: "The seed's mesh, edge to edge",
          means:
            "The hashvatar's own mesh, one hue at several depths, spread under the whole cover and dimmed into the room.",
          gains:
            "The party's colour as a whole field: the avatar's look at a screen's size.",
          costs:
            "A field of colour reads as paint, and competes with the first photograph.",
        },
      ],
      recommended: "lamp",
      today: "house",
      because:
        "Aperture's order made visible: the party's seed before its first photograph, a light in the dark, never paint.",
      overrule:
        "If every new party should start warm and alike, the house ember as today.",
    },
  ],
});
