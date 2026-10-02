import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DEMO'S STORY, ROUND FOUR (his round three answers, 2026-10-02).
 *
 * His words. `stage`, none picked: "None of these are perfect, but I think two
 * directions have potential. First, for options 1 and 2, the link and QR
 * don't feel like a beautiful, cohesive item for the photos to stream from.
 * The code rising out doesn't feel very premium, and the code opening on its
 * invite leaves a very bland big card in the center when fully open, doesn't
 * feel polished at all. If we could nail this switching center item, both of
 * these directions could lead to something nice. Second, for option 3, I do
 * like keeping the link more minimal under a more prominent QR that adjusts.
 * However, the QR itself looks pretty bad, and a far more well designed
 * mini-event card that updates off the slug typing would feel much more
 * beautiful. I also don't like the streaming *into* the QR ... However, if you
 * have any brand new home hero ideas, I'd also love to see those so we aren't
 * knocking our head against a wall on one idea in a world of infinite."
 * `door=brand`: the demo's door stays as today, met through the regular
 * experience first.
 *
 * ★ ONE DECISION. `stage` is his two directions, each nailed, beside new
 * heroes of the lane's own, each the whole home's first screen. The door is
 * answered (`brand`) and is no longer drawn.
 *
 * ★ SETTLED AND DRAWN IN EVERY HERO, NEVER ASKED: the address `our-party`;
 * the arrow after it and its hover (the object lifts, the arrow nudges); no
 * eyebrow; the turns (never both motions at full force); a credit inside
 * every photograph's corner; the address a size down from round two's stage;
 * the demo's door as today.
 *
 * ★ EVERY LOOP IS ONE TABLE (`typing.ts`): the frames run it, the captions read
 * the addresses it holds, and the score under each hero is drawn from it, so
 * the words, the motion and the score cannot disagree.
 */
export const DEMO_FRAMING = defineExploration({
  id: "demo-framing",
  title: "The demo's story",
  surface: "marketing",
  desk: 90,
  lives: [
    "docs/systems/marketing-content.md",
    "src/components/marketing/sections/home/cinema-hero.tsx",
    "src/components/marketing/sections/home/cinema-hero-card.tsx",
    "src/components/marketing/sections/home/hero-stream.ts",
    "src/lib/constants/qr-presets.ts",
    "src/lib/demo.ts",
    "src/lib/constants/reserved-slugs.ts",
    "scripts/seed-demo-event.mjs",
  ],
  round: {
    n: 4,
    date: "2026-10-02",
    changed:
      "From your round three notes: your two directions nailed (the code and its link as one pane, and a mini event card over a minimal link) beside three new heroes of mine; every stream leaves each address at lightspeed.",
  },
  history: [
    {
      n: 3,
      date: "2026-10-02",
      changed:
        "From your round two answers: your hybrid in three takes (the code over a smaller address as one group the album leaves, a credit in every photograph, the turns kept), and the demo's door in three identities.",
    },
    {
      n: 2,
      date: "2026-09-29",
      changed:
        "From your round one notes: the demo's address in a host's own words, a typewriter of hosts' addresses drawn three ways against the stream, and four touches that say the card opens, in place of the eyebrow.",
    },
    {
      n: 1,
      date: "2026-09-29",
      changed:
        "The demo's story, drawn on the home hero's card at 1440 and 375 and at the head of the album it opens: five parties, five ways to name one, and three ways for the card to reach its album.",
    },
  ],
  context:
    "Round four, from your round three notes. Every photograph is a stand-in from the band's twelve stills and every guest a persona: the kit is replaced before launch, so judge the object, the motion and the words. Each code is the real code of the address beside it, and each frame's caption says what the browser's own barcode reader read off it.",
  opening: {
    about:
      "The home's first screen: your two directions for the object the album leaves, each nailed, and three new heroes of mine beside them.",
    settled: [
      "The demo's address is partyreel.com/e/our-party, and every address the hero types is reserved to the demo, so each one opens it.",
      "An arrow after the address says it opens; under a pointer the object lifts and the arrow nudges toward where it goes.",
      "No eyebrow over the headline, and the typing and the stream take turns, never both at full force.",
      "Every photograph carries its guest's credit, a face and a first name, inside its corner; the address is a size down from round two's.",
      "The demo's door stays as today (your pick), so the demo is met through the regular experience first.",
    ],
    earlier: [
      "'The link and QR don't feel like a beautiful, cohesive item for the photos to stream from.'",
      "'The code opening on its invite leaves a very bland big card in the center when fully open.'",
      "'A far more well designed mini-event card that updates off the slug typing would feel much more beautiful.'",
      "'I also don't like the streaming into the QR' next to 'the lightspeed tunnel the stream out version creates'.",
      "'If you have any brand new home hero ideas, I'd also love to see those.'",
    ],
  },
  terms: [
    {
      term: "slug",
      means:
        "The part of an event's link its host names, after partyreel.com/e/: our-party in partyreel.com/e/our-party.",
    },
    {
      term: "code",
      means:
        "The QR code: the square a phone's camera reads to open a link. Each address here has its own.",
    },
    {
      term: "stream",
      means:
        "The photographs flowing out along one line across the home's first screen, from behind the object.",
    },
    {
      term: "lightspeed",
      means:
        "The stream jumping to six times its pace as an address lands, sweeping the last party out, then settling.",
    },
    {
      term: "credit",
      means:
        "The guest's face and first name inside a photograph's corner: who added it.",
    },
    {
      term: "turns",
      means:
        "The typing and the stream taking turns: one moves while the other rests, then they swap.",
    },
    {
      term: "pane",
      means:
        "One piece of the product's own glass, the album seen blurred through it as it passes behind.",
    },
    {
      term: "reduced motion",
      means:
        "A visitor's setting asking for less motion: they see the demo's own address and code, and the stream at rest.",
    },
  ],
  carried: [
    {
      id: "codes",
      question: "What does each address's code open?",
      taken:
        "The address standing with it: each address is its own real code, and every one is reserved to the demo, so any scan opens it.",
      overrule:
        "One code for every address (the short /demo door), drawn anew each time for the look alone.",
    },
    {
      id: "heart",
      question: "What does a code carry at its heart?",
      taken:
        "Its party's own picture, the in-app designer's dots preset round it: the share studio would print it so.",
      overrule:
        "A plain designed code (the dots alone), or the classic square one the designer opens on.",
    },
    {
      id: "card-name",
      question: "What does the event card call its party?",
      taken:
        "The address read as words, typed along with it: our-wedding is Our wedding, our-party is Our party.",
      overrule:
        "The event's own name (Partyreel Demo for the demo's), set once the address lands.",
    },
    {
      id: "lamp",
      question: "Whose colour is the light behind the object?",
      taken:
        "The standing party's, read off its cover, crossfading as each address lands (the light takes its colour from what it lights).",
      overrule: "The house lamp for every address, as the shipped card has it.",
    },
    {
      id: "credit-words",
      question: "What does a photograph's credit say?",
      taken:
        "The guest's face and first name, nothing else: Ruby, never Added by Ruby or a time.",
      overrule: "A fuller credit (Ruby, 9:41 pm), or the face alone.",
    },
    {
      id: "pours",
      question: "Whose photographs does each address pour?",
      taken:
        "Its own party's, credited to its own guests; the stand-ins lean on the nearest still until the month makes each party's set.",
      overrule:
        "The demo's own album for every address, so only the address and its object change.",
    },
  ],
  asks: [
    {
      id: "stage",
      label: "The home's hero",
      question: "Which hero should the home's first screen run?",
      where: ["Marketing", "The home's first screen", "Its object and motion"],
      when: "Anyone arriving at partyreel.com: the object over the headline is the demo's door, and the first thing on the page that moves.",
      matters:
        "It is every visitor's first picture of the product: one link, its code, and everyone's photographs going into one album.",
      context:
        "Each hero live at 1440, on a tablet held upright and at 375, its loop's score under the laptop, then its object close, at rest and under the pointer. Reduced motion stands each still: the demo's own address, every photograph credited.",
      options: [
        {
          id: "plate",
          label: "One pane: the code and its link",
          means:
            "The code over its link in one pane of the product's glass; each address's code switches on and blooms out of its party's picture as it lands.",
          gains:
            "One object that never changes shape: only the light in it moves, per address.",
          costs:
            "The code is the loudest thing on the screen; the link reads second, under it.",
        },
        {
          id: "card",
          label: "An event card over its link",
          means:
            "A mini event card (its cover, its name typed with the address, its day, faces and code) over the link set minimal; it comes into focus as each lands.",
          gains: "Every address reads as a real event, at a glance.",
          costs:
            "Its code is a picture, not a scan: a desk visitor scans in the demo's modal.",
        },
        {
          id: "field",
          label: "The link, yours to type",
          means:
            "The link as a field that types the demo's addresses until a visitor takes it and types their own party's, their code blooming as they pause.",
          gains:
            "The first screen is the product's first step, in the visitor's own words.",
          costs:
            "A press types rather than opens the demo; only its arrow opens the demo.",
        },
        {
          id: "wall",
          label: "The album fills from its code",
          means:
            "Two level rows of the party's photographs with its code at their heart, filling anew outward from the code as each address lands.",
          gains:
            "The album itself is the picture: everyone's photographs, at once, live.",
          costs:
            "No lightspeed: the calmest motion, and the most photographs to load.",
        },
        {
          id: "door",
          label: "Every link a door to its party",
          means:
            "The door every guest meets, open on its party's light and album, the link on its threshold; it shuts while an address types and opens on the next.",
          gains:
            "The home shows the very door the demo, and every guest, walks through.",
          costs:
            "A drawing of a door, not the link's own code: nothing on it scans.",
        },
      ],
      recommended: "card",
      because:
        "An address reads as an event: its cover, its name in the host's own words, its faces and code, the album leaving it at lightspeed.",
      overrule:
        "If the hero should show the scan itself, the pane; the album over its link, the wall; the visitor's own first step, the field.",
      lands:
        "cinema-hero.tsx's object and loop, cinema-hero-card.tsx, a designed code per address (reserved to the demo), hero-stream.ts's geometry.",
    },
  ],
});
