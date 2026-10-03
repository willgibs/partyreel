import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DEMO'S STORY, ROUND FIVE (his round four answer, 2026-10-03).
 *
 * His words. `stage`, none picked: "I'm jokingly mad at you for making this
 * decision so hard. Let's run another round on these so we can pick from an
 * even more polished group of options. I truly cannot wait to see them."
 *
 * ★ ONE DECISION, A MORE POLISHED THREE. Round four's strongest heroes are
 * taken further, each one's weakest part fixed: the card (his second
 * direction, recommended again), the pane (his first) and the door. Round
 * four's weakest parts were each a picture of something loading (the card's
 * cover blurred out of focus while an address typed, the pane's tile gone
 * dark to an empty code, the door shut to a dark slab), and nothing stands
 * empty or soft now. The field and the wall are retired: the field read as a
 * browser's address bar and made a press type rather than open the demo, and
 * the wall gave up the lightspeed tunnel he named. No new idea earned a place
 * beside these three.
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
    n: 5,
    date: "2026-10-03",
    changed:
      "From your round four note: the three strongest heroes taken further (the card, the pane and the door), each one's weakest part fixed, so nothing stands empty or soft between two parties; the field and the wall retired.",
  },
  history: [
    {
      n: 4,
      date: "2026-10-02",
      changed:
        "From your round three notes: your two directions nailed (the code and its link as one pane, and a mini event card over a minimal link) beside three new heroes of mine; every stream leaves each address at lightspeed.",
    },
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
    "Round five, from your round four note. Every photograph is still a stand-in from the band's twelve stills and every guest a persona (ASSETS 39 to 41 make each party's own), so judge the object, the motion and the words. A real cover changes the card most (its name stands on the photograph's own dark foot), then the pane (its glass is lit by the cover) and the door (the cover is what you see through it). Each code is the real code of the address beside it, read back in its caption.",
  opening: {
    about:
      "The home's first screen, round five: round four's three strongest heroes, each taken further and its weakest part fixed.",
    settled: [
      "The demo's address is partyreel.com/e/our-party, and every address the hero types is reserved to the demo, so each one opens it.",
      "An arrow after the address says it opens; under a pointer the object lifts and the arrow nudges toward where it goes.",
      "No eyebrow over the headline, and the typing and the stream take turns, never both at full force.",
      "Every photograph carries its guest's credit, a face and a first name, inside its corner; the address is a size down from round two's.",
      "The demo's door stays as today (your pick), so the demo is met through the regular experience first.",
    ],
    earlier: [
      "Round four: 'I'm jokingly mad at you for making this decision so hard. Let's run another round on these.'",
      "'The link and QR don't feel like a beautiful, cohesive item for the photos to stream from.'",
      "'A far more well designed mini-event card that updates off the slug typing would feel much more beautiful.'",
      "'I also don't like the streaming into the QR' next to 'the lightspeed tunnel the stream out version creates'.",
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
        "One piece of the product's own glass, lit from inside by its party's photograph, far out of focus.",
    },
    {
      term: "develops",
      means:
        "A photograph arriving as a print does: from bright and pale to itself, over the light it stood in.",
    },
    {
      term: "ajar",
      means:
        "The doorway's resting state: the door a little open, its light a line round the leaf.",
    },
    {
      term: "reduced motion",
      means:
        "A visitor's setting asking for less motion: they see the demo's own address, its object whole, and the stream at rest.",
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
      id: "card-line",
      question: "What does the card say under its name?",
      taken:
        "Its first faces, its guests and its photographs, never a date: nothing depends on a timeline, so a weekend and an undated party read alike.",
      overrule:
        "Its day as a host prints it (an undated party shows none), or the faces alone.",
    },
    {
      id: "whole",
      question: "What does a code do while the next address is typed?",
      taken:
        "It stands whole, the party standing, and is rewritten in a ripple from its heart as the address lands: never emptied.",
      overrule:
        "Round four's: it folds into its heart while the next is typed and blooms out as it lands.",
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
        "Each hero live at 1440, a tablet held upright and 375, its loop's score under the laptop, then its object close, at rest and under the pointer. Watch one turn and its landing; reduced motion stands each still and whole.",
      options: [
        {
          id: "card",
          label: "An event card over its link",
          means:
            "The product's own event card: its name typed on its party's photograph, which develops in as the address lands, its faces, counts and code; the link under it.",
          gains:
            "Every address reads as a real event, and the card is the one a host gets.",
          costs:
            "Its code is a picture, not a scan: a desk visitor scans in the demo's modal.",
        },
        {
          id: "plate",
          label: "One pane: the code and its link",
          means:
            "The code over its link in one pane of the product's glass, lit by its party's photograph; the code rewritten in a ripple from its heart as each lands.",
          gains:
            "The scan itself, one object that never changes shape: a desk visitor's phone opens it.",
          costs:
            "The code is the loudest thing on the screen: it says link before it says party.",
        },
        {
          id: "door",
          label: "Every link a door to its party",
          means:
            "The door every guest meets, open on its party's cover with the link on its threshold; ajar in the next party's light while its address types.",
          gains:
            "The home shows the very door the demo, and every guest, walks through.",
          costs:
            "A drawing of a door, not the link's own code or event: nothing on it scans.",
        },
      ],
      recommended: "card",
      because:
        "An address reads as an event, in the card the host will get: its photograph, its name in the host's own words, its faces, the album leaving it.",
      overrule:
        "If the hero should show the scan itself, the pane; if it should show the guest's way in, the door.",
      lands:
        "cinema-hero.tsx's object and loop, cinema-hero-card.tsx, a designed code per address (reserved to the demo), hero-stream.ts's geometry.",
    },
  ],
});
