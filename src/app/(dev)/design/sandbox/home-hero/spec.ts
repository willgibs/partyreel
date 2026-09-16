import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE HOME HERO, AS DATA. ROUND SEVEN, 2026-09-16: the symmetric catalog.
 *
 * ★ THE DIRECTION IS RULED AND IS NOT ON THE BOARD ANY MORE. Will answered
 * round five on all four asks (`docs/reviews/home-hero.json`): the source, the
 * album coming out of the code; the lockup centred; the site's one line as the
 * headline; no live count. Round six put four polished scatterings of the
 * stream on the board and he answered them `none`, in chat, with the direction
 * named: "I think I liked the more symmetrical approach more than the variants
 * we're using to scatter the photos as they stream out, similar to our original
 * reference example." Two references came with it (Melius's symmetric band,
 * Cosmos's ring around a centred lockup) and one more ask: a lockup that does
 * not split the headline from the rest of the hero with the code.
 *
 * ★ SO THE FOUR HERE ARE ONE STREAM SHAPE DRAWN TWICE. The band is the
 * reference's shape, split as before. The orbit is Cosmos's ring with his two
 * changes (the code above the headline, the ring centred on the code). The two
 * stacks are the band with the whole block under the code, and over it. Nothing
 * is dealt in any of them (`streams.ts`); the four scatterings left with their
 * tables (git holds them at bf1ee166).
 *
 * The winner is wired into `cinema-hero.tsx` in the next round and appears in
 * the Library with a `new` badge, so every card here is finished enough to ship
 * exactly as drawn.
 */
export const HOME_HERO = defineBoard({
  id: "home-hero",
  title: "The home hero",

  question:
    "The home page opens on the album coming out of the QR code. Which composition should it be, and where should the code sit against the type?",

  round: {
    n: 7,
    date: "2026-09-16",
    changed:
      "Four symmetric compositions after round six was answered none: the reference's band, split as before; Cosmos's ring with the code above the headline and the ring centred on the code; and the band with the whole block under the code, and over it.",
  },
  history: [
    {
      n: 6,
      date: "2026-09-16",
      changed:
        "Four polished scatterings of the stream, nothing dealt. Will answered none: the more symmetrical approach, like the original reference, over any scatter; Cosmos's ring around the code; and a lockup the code does not split.",
    },
    {
      n: 5,
      date: "2026-09-16",
      changed:
        "Will ruled the direction (the album out of the code), the centred lockup, the site's one line and no live count, and noted that the stream itself reads random.",
    },
  ],
  context:
    "Round one measured the defect the board exists to fix: the shipped hero carries three darkening layers over a wall of 24 tiles at desktop and a fourth on a phone, because white type has to survive over whichever tile the drift parks under it. Every composition since has refused that trade by changing the shape instead: the album leaves the code, the type is placed where the stream is measured never to reach, and the code holds still at scanning size. Round seven keeps that and changes the stream's grammar to a symmetric one, and asks where the code sits against the type.",

  verdict: {
    recommendation:
      "The band: the reference's shape, one file each way growing and curling with the distance, the headline above and the sentence below.",
    because:
      "It is the composition Will named, with nothing in it that could read as scatter: one axis, one depth, the spacing tied to the frame's own width, and the only two variables the ones that read as space. The stacks are the same band with the code moved, and the orbit is the other reference; they exist so the choice of where the code sits is made on the real hero rather than argued.",
    overrule:
      "If the code should lead the headline rather than divide the page, the orbit: the code above the type at the centre of the ring, the whole block under it.",
  },

  // ★ NO ASKS BESIDE THE WINNER, and the cards carry the whole choice. The
  // catalog is reviewed as a pick-one gallery: one composition kept, or
  // refinements asked for on one or more, or new directions.
  asks: [
    {
      id: "stream",
      question: "Which composition should the home hero ship?",
      context:
        "Four compositions of the album leaving the code, each the real hero at true size on the ruled lockup (centred, no count, the ruled headline). Two are the band with the code between the headline and the rest or not; one is the ring. One wins and is wired into cinema-hero.tsx; the other three leave with the board.",
      options: [
        {
          id: "band",
          label: "1. The band",
          means:
            "One file each way on one axis, growing and curling outward; the headline above, the sentence below.",
        },
        {
          id: "orbit",
          label: "2. The orbit",
          means:
            "The code above the headline, the whole block under it, the photographs in a ring around the code.",
        },
        {
          id: "stack-above",
          label: "3. Stacked, code above",
          means:
            "The band with the code above the whole block: headline, sentence and actions together under the stream.",
        },
        {
          id: "stack-below",
          label: "4. Stacked, code below",
          means:
            "The band with the code below the whole block: the type first, the code under the actions, the album along the foot.",
        },
        {
          id: "none",
          label: "None of these",
          means: "New directions: say what to try instead in the note.",
        },
      ],
      recommended: "band",
      because:
        "It is the shape Will named, and the only variables in it are the two that read as space.",
      evidence: "stream",
      control: "stream",
      lands:
        "The composition cinema-hero.tsx ships (src/components/marketing/sections/home/): one engine, the winning lockup and table, the other three deleted.",
      strip: ["canvas"],
    },
  ],

  candidates: [
    {
      id: "band",
      lands:
        "cinema-hero.tsx on the band's table under the split lockup; the orbit's table and the two other axes deleted.",
      name: "1. The band",
      one: "One file each way, a speck at the code, growing and curling outward. The headline above, the sentence below.",
      verdict: "ship",
      recommended: true,
      rationale:
        "The reference's shape. No station, no roll, one depth: the size and the turn are both functions of the distance crossed, so the band reads as the inside of a cylinder with the code on its far wall, and the travel grows about as fast as the frame does, so the gaps stay even the whole way out.",
      facts: [
        ["Grammar", "One file a side on one axis; size and turn grow with distance"],
        ["Cost", "12 frames lit of 18 nodes"],
        ["Frames", "the 34 squares (row 2), 9 a side, no photograph twice"],
        ["At rest", "the full file standing, symmetric about the code"],
      ],
    },
    {
      id: "orbit",
      lands:
        "cinema-hero.tsx on ORBIT_STATIONS and the polar placement under the orbit lockup; the band's table deleted.",
      name: "2. The orbit",
      one: "The code above the headline, the type as one block under it, and the album standing in a ring around the code.",
      verdict: "ship",
      rationale:
        "Cosmos's ring with Will's two changes: the code above the headline, and the ring centred on the code rather than on the type. Eight stations a side, mirrored, walked in order, so the births march round the code and the ring turns; a frame arrives, holds for seven seconds and fades.",
      facts: [
        ["Grammar", "Eight stations a side round the code, walked in order; held, then gone"],
        ["Cost", "18 frames lit of 34 nodes"],
        ["Frames", "the 34 squares (row 2) and the 12 portraits (row 12)"],
        ["At rest", "the stations occupied: the ring standing round the code"],
      ],
      assets: [
        {
          what: "12 event photographs, portraits",
          spec: "Logged already. This is the treatment that needs them: a held frame reads at up to 250 px wide, where a 512 square cropped to 4:5 is upscaled.",
          replaces: "the square crops, in the held stations only.",
          row: 12,
        },
      ],
    },
    {
      id: "stack-above",
      lands:
        "cinema-hero.tsx on the band's table under the stack-above lockup: the code at a third, the block hung under the band.",
      name: "3. Stacked, code above",
      one: "The band with the code above the whole block: the album first, then the headline, the sentence and the actions together.",
      verdict: "ship",
      rationale:
        "The same band, the code lifted to a third of the canvas so the stream runs through the top of the screen and the type reads as one thing under it. The block's top is measured off the band's reach at the headline's column, so nothing changes about how the type keeps clear, only where the code sits.",
      facts: [
        ["Grammar", "The band's, with the code at a third of the canvas"],
        ["Cost", "12 frames lit of 18 nodes"],
        ["Frames", "the 34 squares (row 2), 9 a side, no photograph twice"],
        ["At rest", "the file standing over the block"],
      ],
    },
    {
      id: "stack-below",
      lands:
        "cinema-hero.tsx on the band's table under the stack-below lockup: the code at two thirds, the block over the band.",
      name: "4. Stacked, code below",
      one: "The band with the code below the whole block: the type first, the code under the actions, the album along the foot.",
      verdict: "ship",
      rationale:
        "The mirror of the third: the block under the site header, the caption as its foot line one gap over the code, so the line about the guest who scanned it reads straight into the thing to scan, and the album leaves along the foot. The foot is measured off the band's reach at the caption's column.",
      facts: [
        ["Grammar", "The band's, with the code at two thirds of the canvas"],
        ["Cost", "12 frames lit of 18 nodes"],
        ["Frames", "the 34 squares (row 2), 9 a side, no photograph twice"],
        ["At rest", "the file standing under the block"],
      ],
    },
  ],

  departures: [
    {
      id: "stand-in-frames",
      from: 18,
      text: "The twelve stand-in stills are stock, unverified (ASSETS row 6), and wrong in shape: half of every stream is portrait. The fix is row 2, already requested.",
      evidence: "stream",
    },
    {
      id: "centred-lockup",
      from: "precedent",
      text: "The type is centred where every other marketing hero runs left. Ruled on round five, so it is precedent broken on purpose, and it is what lets the code hold the axis.",
      evidence: "page",
    },
  ],

  assets: [
    {
      what: "34 event photographs, squares",
      spec: "Unchanged by this round. A stream needs twice its pool for the two arms never to show one photograph at once; the orbit's 17 a side is the largest of the four, so 34 covers them all exactly.",
      replaces: "the 12 stand-ins (FRAMES in sandbox/home-hero/shared.tsx).",
      row: 2,
    },
  ],

  sections: [
    {
      id: "stream",
      title: "The four compositions",
      lede: "The real hero at 1440, running, with its own Replay. Pick dresses the page below; A and B choose the pair.",
      argument: [
        "One stream shape, drawn twice. The band is the reference's: one file each way on one axis, growing and curling with the distance, the headline above and the sentence below. The two stacks are the same band with the code moved off the middle so the headline, the sentence and the actions stay together as one block, under the code or over it. The orbit is the other reference: the code above the headline, the block hung under it, the photographs in a ring around the code.",
        "What all four hold fixed: photographs at 100 percent with no darkening layer anywhere, the headline in the markup at full opacity and never gated, the ladder resolved per canvas, every animation inside the reduced-motion block with its own designed rest state, the code still and scannable on its axis, and nothing dealt: every value a card carries is a step in a short declared cycle. The type is placed off the stream's measured reach at the nearest line's own column, and the orbit's stations are held outside the block's box by a test.",
        "What the Cost line is: the static half, which is the same number on any machine. The nodes handed to the compositor and the frames lit at the busiest instant; one transform and one opacity written per lit card per frame, no filter, no blur, and the one shadow riding the card's own transform.",
      ],
      wiring: [
        "The winner lands in cinema-hero.tsx and nowhere else. `streams.ts` is already the shippable shape: pure, no React, both canvases solved at module load, one rAF loop writing transform and opacity and nothing else. Drop the tables and the axes that lost and keep the engine. The lab pauses on a hidden TAB through the stage's data-paused; production swaps that for useAmbientPause, which also pauses off screen. The QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN.",
      ],
    },
    {
      id: "pair",
      title: "Two of them, on the real page",
      lede: "A and B as whole home pages at 1:1, scrolled together: the real header over the hero, the next section under the fold.",
      argument: [
        "A hero is never seen the way a board shows it. On the page it has a sticky header over its top 64 px, a section arriving under its fold, and a reader who is scrolling rather than watching. These two frames are the real route's chrome, the real cinema wrapper and the real sections in the real order, with one component swapped, so the only thing that differs between the halves is the composition.",
      ],
    },
    {
      id: "page",
      title: "The pick, on the real page",
      lede: "The picked card, worn by the home page. Nothing picked shows the hero that ships today, which is what all four replace.",
      argument: [
        "Round one's whole case was the scroll: a hero whose photographs you can see, and then the one with three darkening layers over twenty-four tiles. With nothing picked this frame is that reference, from production code, in the page it has to open. Pick a card and the same page wears it.",
      ],
    },
  ],

  catalog: {
    section: "stream",
    control: "stream",
    compare: ["compare-a", "compare-b"],
    // The stepped review (2026-09-16): four variants of one hero, so ONE wins.
    // The winner ask mirrors the pick control and offers "none" as the
    // new-directions exit; the real home page under the tiles wears the pick.
    mode: "pick-one",
    winner: "stream",
    stage: "page",
  },

  controls: [
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    {
      id: "stream",
      label: "Composition",
      // Nothing picked is a state of its own: the page below shows the hero
      // that ships today until a card is picked, and pressing the picked card
      // returns here (Will, 2026-09-16).
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "band", label: "1. The band" },
        { id: "orbit", label: "2. The orbit" },
        { id: "stack-above", label: "3. Code above" },
        { id: "stack-below", label: "4. Code below" },
      ],
      default: "none",
      clearable: true,
    },
    // A and B: the two halves of the comparison, set from the catalog's cards.
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "band", label: "1. The band" },
        { id: "orbit", label: "2. The orbit" },
        { id: "stack-above", label: "3. Code above" },
        { id: "stack-below", label: "4. Code below" },
      ],
      default: "band",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "band", label: "1. The band" },
        { id: "orbit", label: "2. The orbit" },
        { id: "stack-above", label: "3. Code above" },
        { id: "stack-below", label: "4. Code below" },
      ],
      default: "orbit",
    },
  ],

  lookFirst: [
    {
      section: "stream",
      state: { canvas: "desktop", stream: "none" },
      note: "The four at 1440, running. The band first: watch the file grow and curl for five seconds, then look at where the code sits in each of the other three.",
    },
    {
      section: "stream",
      state: { stream: "orbit" },
      note: "The other reference. The code leads the headline, the block hangs under it, and the ring turns as the births walk round the code. Take a screenshot at any moment: the stations are a still.",
    },
    {
      section: "pair",
      state: { "compare-a": "band", "compare-b": "orbit" },
      note: "The two references side by side as whole home pages, scrolled together. The header is over the hero and the next section is under the fold, as on the site.",
    },
    {
      section: "page",
      state: { stream: "stack-above" },
      note: "A stack worn by the page at full height. Swap the pick to the fourth card for the code under the block; clear it and the same frame is the hero that ships today.",
    },
    {
      section: "stream",
      state: { canvas: "phone", stream: "none" },
      note: "The four at 375, where the reader is holding the object the picture draws. The phone canvas is its own composition, never a squeezed desktop: the orbit is three stations a side there.",
    },
  ],

  links: {
    bible: [1, 10, 13, 14, 18],
    pages: [
      {
        label: "Home",
        path: "/",
        note: "the hero that ships today, in the page it has to open",
      },
    ],
  },
});
