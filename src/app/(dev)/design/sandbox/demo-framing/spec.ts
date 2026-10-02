import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DEMO'S STORY, ROUND THREE (his round two answers, 2026-10-02).
 *
 * His words. `stage=centre`, "a dual selection of both options 2 and 4": "I
 * absolutely love the typing and streaming taking turns so each work off of
 * the other (new slug, new event stream, repeat). However, the address taking
 * the stage cleans up that visual design of the item a lot ... but I hate
 * losing the stream and QR visuals. ... knock the partyreel link typing font
 * size down a little so it doesn't fight with the H1, then maybe bounce in a
 * new QR above the input each time it's updated, and stream images off of
 * that QR + link with the turn taking each time it updates. I'd like the QR
 * to be vertically centered ... if the QR + input could stack/overlap/somehow
 * present as one group for the stream to emanate from ... If the emanating
 * photos each had a guest credit in their corner (likely within card, not on
 * corner so it doesn't go off image). Please take this idea with a grain of
 * salt and build your best version of the overall idea." `slug=our-party`,
 * with "the demo's welcome door specifically should likely avoid this event
 * title". `touch=arrow`, with "a slight hover state".
 *
 * ★ TWO DECISIONS. `stage` is his hybrid in three takes, each the whole idea
 * built its own way (the object, how the turns breathe, which way the album
 * flows), so he picks a hero rather than assembling one. `door` is the demo's
 * identity at its door, drawn in the doorway he picked on the door board.
 *
 * ★ SETTLED AND DRAWN IN EVERY TAKE, NEVER ASKED: the address `our-party`; the
 * arrow after it and its hover (the object lifts, the arrow nudges toward
 * where it goes); the eyebrow gone; the turns (never both motions at full
 * force); a credit inside every photograph's corner; the address a size down
 * from round two's stage.
 *
 * ★ EVERY LOOP IS ONE TABLE (`typing.ts`): the frames run it, the captions read
 * the addresses it holds, and the score under each take is drawn from it, so
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
    "src/components/guest/entry-modal.tsx",
    "src/lib/demo.ts",
    "src/lib/constants/reserved-slugs.ts",
    "scripts/seed-demo-event.mjs",
  ],
  round: {
    n: 3,
    date: "2026-10-02",
    changed:
      "From your round two answers: your hybrid in three takes (the code over a smaller address as one group the album leaves, a credit in every photograph, the turns kept), and the demo's door in three identities.",
  },
  history: [
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
    "Round three, from your round two answers. Every photograph is a stand-in from the band's twelve stills and every guest a persona: the kit is replaced before launch, so judge the object, the motion and the words. Each address's code is a real one, encoding that address's own link.",
  opening: {
    about:
      "The home's first screen and the demo's door: your hybrid of the turns and the address on the stage in three takes, and what the door says it is.",
    settled: [
      "The demo's address is partyreel.com/e/our-party (your pick), and every address the hero types is reserved to the demo, so each one opens it.",
      "An arrow after the address says it opens; under a pointer the object lifts and the arrow nudges toward where it goes (your note).",
      "The eyebrow over the headline is gone: the object is the first screen's one door to the demo.",
      "The typing and the stream take turns in every take, never both at full force (round two's turns, which you loved).",
      "Every photograph carries its guest's credit, a face and a first name, inside its corner and never off its edge (your note).",
    ],
    earlier: [
      "'I absolutely love the typing and streaming taking turns so each work off of the other (new slug, new event stream, repeat).'",
      "'The address taking the stage cleans up that visual design of the item a lot ... but I hate losing the stream and QR visuals.'",
      "'Knock the partyreel link typing font size down a little so it doesn't fight with the H1.'",
      "'Bounce in a new QR above the input each time it's updated, and stream images off of that QR + link.'",
      "'If the QR + input could stack/overlap/somehow present as one group for the stream to emanate from.'",
      "On the address: 'the demo's welcome door specifically should likely avoid this event title.'",
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
        "The photographs flowing along one line across the home's first screen, out of the object or into it.",
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
      term: "invite",
      means:
        "One white card holding the code at its head and the address under it, like a printed table card.",
    },
    {
      term: "doorway",
      means:
        "The door every guest meets, as you picked it on the door board: a drawn door, open onto the album.",
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
      question: "What does the code over the address open?",
      taken:
        "The address standing under it: each address is its own real code, and every one is reserved to the demo, so any scan opens it.",
      overrule:
        "One code for every address (the short /demo door), drawn anew each time for the look alone.",
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
        "The demo's own album for every address, so only the address and the code change.",
    },
    {
      id: "typed",
      question: "Which addresses does the hero type?",
      taken:
        "Round two's five, standing: our-wedding, my-30th, lake-weekend, our-reunion, team-party, then our-party again.",
      overrule:
        "Fewer, or others: the list is one line, and every address in it is reserved to the demo.",
    },
    {
      id: "album-name",
      question: "What is the album behind a door of its own called?",
      taken:
        "Our party, the address's own words, as round two drew it: the door says what the demo is, the album stays a party.",
      overrule:
        "A name of its own at the album's head too, as the other two doors have.",
    },
  ],
  asks: [
    /* ── 1. The stage ─────────────────────────────────────────────────── */
    {
      id: "stage",
      label: "Your hybrid, three takes",
      question: "Which take on your hybrid should the home's first screen run?",
      where: ["Marketing", "The home's first screen", "Its object and motion"],
      when: "Anyone arriving at partyreel.com: the object over the headline is the demo's invite, and the first thing on the page that moves.",
      matters:
        "It is every visitor's first picture of the product: one link, its code, and everyone's photographs going into one album.",
      context:
        "Each take live at 1440 and 375 with its loop's score under the laptop, then close at a desk, at rest and under the pointer. Reduced motion stands each still: the demo's own address and code, every photograph with its credit.",
      options: [
        {
          id: "rise",
          label: "The code rises out of the link",
          means:
            "A slimmer address with its code standing up out of it; a new code rises as each address lands, and the stream drifts while it types.",
          gains:
            "Closest to your note, and the card's own idea: things standing out of the link.",
          costs:
            "A more intricate silhouette than one card, and the stream never quite rests while it types.",
        },
        {
          id: "open",
          label: "The link opens into its invite",
          means:
            "One white object: a pill while the address types, an invite with its code once it lands; its album folds back in, then bursts out anew.",
          gains:
            "One object and one breath: every address reads as a new event with its own album.",
          costs:
            "The whole album moves twice a turn: the most motion of the three.",
        },
        {
          id: "words",
          label: "Just the code, photos coming in",
          means:
            "The code alone on paper, its address in white type under it; photographs come in from both edges and slip behind the code.",
          gains:
            "The cleanest object, and the motion says collects, the subhead's own word.",
          costs:
            "The album arrives into the link rather than leaving it, against your note's direction.",
        },
      ],
      recommended: "open",
      because:
        "One object that breathes with the turns: each address opens its own code and pours its own album, and the typing always has the stage.",
      overrule:
        "If the stream should never pause, the code rising out of the link; if the page should be its calmest, just the code.",
      lands:
        "cinema-hero.tsx's object, its loop and its frames; a code per address, each reserved to the demo; hero-stream.ts's object geometry.",
    },

    /* ── 2. The door ──────────────────────────────────────────────────── */
    {
      id: "door",
      label: "The demo's door",
      question: "What should the demo's door say a visitor has walked into?",
      where: ["Guest", "The demo's door", "On arrival"],
      when: "A visitor opens the demo from the home's object, in a new tab at a desk or off its code with a phone, and meets its door.",
      matters:
        "The door is where the demo says what it is; a generic party name there leaves a visitor unsure what they opened.",
      context:
        "Each drawn at 375 in the doorway you picked on the door board, open onto the demo album, then the album's head behind it. The address stays our-party in every one.",
      options: [
        {
          id: "brand",
          label: "Partyreel Demo",
          means:
            "The demo is named Partyreel Demo and hosted by Partyreel: on its door, at its album's head, wherever it is named.",
          gains: "Unmistakable: nobody wonders whose party it is.",
          costs:
            "Partyreel's name first on a guest's door, and no party a visitor could picture as theirs.",
        },
        {
          id: "example",
          label: "Example Party",
          means:
            "The demo is named Example Party and hosted by Sam Okafor: still a party a guest is invited to, plainly a sample.",
          gains: "Still an invitation to a party, and plainly a sample.",
          costs:
            "A placeholder's name on the first door most hosts will ever see.",
        },
        {
          id: "own",
          label: "A door of its own",
          means:
            "The door speaks as Partyreel, once: your guests start here, with the link the visitor came through; the album keeps its party's name.",
          gains:
            "Says what the demo is at the door, while the album behind it still feels like a real party.",
          costs:
            "One more set of words the shared door has to carry, and the only door that names no party.",
        },
      ],
      recommended: "own",
      because:
        "The door is the one place the demo may speak as Partyreel, so it says what this is there, and the album keeps feeling like a party.",
      overrule:
        "If the demo should be named for what it is everywhere, Partyreel Demo.",
      lands:
        "The demo's door words (entry-modal.tsx's demo step, the doorway's once wired), the demo event's name in its seed and its host persona.",
    },
  ],
});
