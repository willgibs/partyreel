import { defineExploration } from "@/components/lab/exploration";

import { GROUND, MOMENT, SIDE } from "./knobs";

/**
 * THE EVENT PAGE, ROUND ONE (the event-page-r1 track, cut 2026-10-07 from
 * Will's desk 8): the event page redrawn from the ground up as ONE WHOLE,
 * host and guest alike, after six rounds that improved its head piece by
 * piece (event-header r1 to r6, then presence, signature and after-party each
 * slotting a part in). His words for why: "attempting redesigns as the
 * ultimate sum total synergy of potential event head components working
 * together, rather than how each individual component next slots in".
 *
 * ★ ONE ASK, ITS OPTIONS WHOLE DESIGNS (PROGRAM's "Fast, focused rounds",
 * zoomed out): his favourite (the head with no slideshow, its UI on a glow
 * sampled from the album's media, the gallery teasing the scroll) drawn three
 * ways, pushed apart by where the glow is born (`rise`: the album's edge;
 * `sky`: the page's top; `corner`: one key from the top-right), his second and
 * third directions whole beside them (`quiet`: the cover kept, its light given
 * to the empty page; `featured`: the slideshow as a featured card), and today
 * as the reference. The rounds after this one settle the parts it sweeps in.
 *
 * ★ EVERY DESIGN IS ONE `Kit` (`kit.ts`) DRAWN IN THE SAME FRAMES
 * (`whole.tsx`): the knobs pick the moment (before the first photo, photos
 * landing, after her close, beyond the page), whose page and the ground, so
 * the stage stays a few frames large enough to judge, and two designs differ
 * exactly where their parts do. Beyond the page is one frame each: the card
 * (at 68 px in Create's link and in a chat, an open album's and a Private
 * one's), the dashboard's tiles, the door's sheet, the Add at rest and as her
 * photo lands.
 *
 * ★ PRESENCE, SIGNATURE AND AFTER-PARTY RETIRE INTO THIS BOARD: their answers
 * are its inputs, composed into every whole (the faces under the name, the
 * Ring that answers, the door's one light, Close adding offered, the reel
 * leading a keepsake, Make one like this out of scope here), and what it
 * reuses of their drawings is carried into this folder (`fixtures.ts`,
 * `light.tsx`, `scene.tsx`, `parts.tsx`), never imported.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the faces
 * production's hashvatar for people who do not exist, the counts the board's,
 * and every press is inert. A light here is read from the stills' sampled
 * hues (`fixtures.ts`), never chosen by hand.
 */
export const EVENT_PAGE = defineExploration({
  id: "event-page",
  title: "The event page",
  surface: "shared",
  desk: 4,
  lives: [
    "docs/systems/guest-flow.md",
    "docs/systems/host-app.md",
    "docs/systems/design-system.md",
    "src/components/guest/event-experience-head.tsx",
    "src/components/guest/event-experience.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/event-cards-row.tsx",
    "src/components/app/event-feed/event-hub-head-light.tsx",
    "src/components/app/event-feed/checklist.tsx",
    "src/app/(guest)/e/[token]/card/route.tsx",
    "src/components/app/dashboard/event-tile.tsx",
    "src/components/ui/shutter.tsx",
  ],
  round: {
    n: 1,
    date: "2026-10-07",
    changed:
      "A new board, presence, signature and after-party retired into it: the event page as one whole design, host and guest alike, led by your favourite, a calm head on its album's glow.",
  },
  opening: {
    about:
      "The event page redrawn whole, host and guest alike: your favourite three ways beside your other two and today. Pick the whole; its parts settle next round.",
    settled: [
      "Faces under the name on both sides, in their own colours, the comb at a desk; each fact said once: the guests are the faces' count.",
      "One light to a view, still until something happens; on paper it lives in a piece of the room. The Add's Ring answers each photo of hers.",
      "Closing adding is offered, never done for her; no date reshapes an album; a new event is ready from its first minute.",
      "A card never carries a Private album's photo, nor a face; the album stays one gallery, no dividers drawn for her (your X10).",
      "The guestbook (your X12) is a quiet door under the surface, its board designs it; no mail is drawn (X11), and each option says what that costs.",
    ],
    earlier: [
      "Your favourite: 'removed the slideshow & media background from the head completely ... filling the bg more with a sampled glow from the media'.",
      "'... to allow the head UI to take center stage without background conflict ... and let the media in the gallery below tease that scroll'.",
      "'keep this general head shape but remove the seam from an event page with media ... reshape it to enhance the empty state'.",
      "'turning the slideshow into more of a featured card above the action stack, similar to how a featured post on a blog page may present'.",
      "Presence r1: the counts 'feel very scattered, not a clean presentation, repeated info'; 'Whole head can be redesigned to fit.'",
      "Create r5: a new event 'still feels like a lot going on'; after-party r1: one 'everything is ready!' moment once we know.",
    ],
  },
  terms: [
    {
      term: "glow",
      means:
        "Light read from the album's own photos filling the head behind its words, with no point of focus.",
    },
    {
      term: "seed",
      means:
        "The party's own colour, drawn from a number only it has: its light before it has a photo, never chosen by hand.",
    },
    {
      term: "Seam",
      means:
        "Light born where a photo ends, in that edge's own colours: the hub's light under its cover today.",
    },
    {
      term: "Ring",
      means:
        "The Add's ring of light at the screen's foot, lit by the album's key light, lifting as her photo lands.",
    },
    {
      term: "one moment",
      means:
        "Shown once, to Maya as she closes adding and to each guest on their next visit; then the page as before.",
    },
    {
      term: "piece of the room",
      means:
        "On paper, a dark band, puck or plate the page holds, with the light inside it, so light never touches paper.",
    },
  ],
  carried: [
    {
      id: "private-light",
      question: "Where does a Private album's card take its light?",
      taken:
        "From its link alone, so a private album and a missing one look alike; never its event's seed, which takes a lookup a stranger could probe.",
      overrule:
        "From the event's own seed, as its page wears it, accepting that the card then says an album stands behind the link.",
    },
    {
      id: "guest-moment",
      question: "When does a guest meet the one moment?",
      taken:
        "On a guest's next visit after Maya closes adding, once on that device; Maya's the instant she closes; then the page as before.",
      overrule:
        "Never: the moment is Maya's alone, and guests meet the album as it was.",
    },
    {
      id: "live",
      question: "When does her page say Live?",
      taken:
        "Only while photos are landing (the newest within a quarter hour); an open album gone quiet says Open, in Ready's green.",
      overrule:
        "Whenever her page is connected and listening, as production says it today.",
    },
  ],
  asks: [
    {
      id: "page",
      label: "The whole page",
      question:
        "Which event page should every party have, whole, on both sides?",
      where: ["Shared", "The event page", "Its whole life"],
      when: "Every party's life on its one page: just made, photos landing, closed and kept by her, and wherever its link travels.",
      matters:
        "It is the product: a guest's whole party and a host's whole event; every later round settles its parts.",
      lands:
        "Both sides of the event page: its head and light, the one moment, its card, the dashboard's tile, the door's light, the Add.",
      context:
        "Maya & Jay's wedding, whole, in the moment, the side and the ground the knobs pick, at a phone and a laptop; beyond the page, its card, tiles, door and Add. Stand-in photos, every press inert.",
      options: [
        {
          id: "today",
          label: "As today",
          means:
            "The reel's photos edge to edge under the name; the hub's cards on its foot and the Seam below; the checklist at its head.",
          gains: "Built, and the photos lead from the first screen.",
          costs:
            "The slideshow fights the words over it, the counts repeat, and nothing presents a closed album.",
        },
        {
          id: "rise",
          label: "The album's light, rising",
          means:
            "No photo in the head: the album's own colours rise from just above it like a dusk, warm light born pale, and fill the head to its top.",
          gains:
            "A calm head on one left line; the light leads the eye down into the album.",
          costs:
            "Photos wait a glance lower; a guest who never returns misses the one moment (no mail).",
        },
        {
          id: "sky",
          label: "A sky of the album's light",
          means:
            "No photo in the head: the album's own colours lie across the page's top like a dusk, over a centred title page; her tools a quiet row under her acts.",
          gains:
            "The calmest head: each party in its own light, no point of focus, so the name and the Add lead.",
          costs:
            "Its bar's words need a breath of shadow; a guest who never returns misses the moment (no mail).",
        },
        {
          id: "corner",
          label: "One key light from a corner",
          means:
            "The head as a poster on the room's dark: the album's light enters at its top-right corner, where the reel (or her code) stands, and falls across the name.",
          gains:
            "Lit like the Ring: one source, its focus earned (the reel, her code); Create's lit code lands in it.",
          costs:
            "The corner takes the eye before the name; a guest who never returns misses the one moment (no mail).",
        },
        {
          id: "quiet",
          label: "The cover kept, lit only while empty",
          means:
            "Today's cover, nothing glowing beside its photos; before the first photo its seed's light rises from the foot, then lives on in the Add's ring.",
          gains:
            "The photos lead with nothing glowing against them; a new party's page starts in its own light.",
          costs:
            "The slideshow still stands under the words; a guest who never returns misses the moment.",
        },
        {
          id: "featured",
          label: "The photos as a featured card",
          means:
            "The reel plays in one enclosed card above the name and acts, at a phone and a desk alike; before a photo the card is a window, its light rising from its foot.",
          gains:
            "Photos and words never overlap, nothing edge to edge; one calm shape at every width.",
          costs:
            "Photos read smaller, the page unlit once they land; a guest who never returns misses the moment.",
        },
      ],
      recommended: "sky",
      today: "today",
      because:
        "Your edge-to-edge light from presence, now read from the album itself: the calmest head, no light against the photos, one page on both sides.",
      overrule:
        "If the light should rise from the photos below, rising; if the photos should stay in the head, the cover kept or the featured card.",
      configs: [MOMENT, SIDE, GROUND],
    },
  ],
});
