import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE HOME HERO, AS DATA. ROUND SIX, 2026-09-16: the stream catalog.
 *
 * ★ THE DIRECTION IS RULED AND IS NOT ON THE BOARD ANY MORE. Will answered
 * round five on all four asks (`docs/reviews/home-hero.json`): the source, the
 * album coming out of the code; the lockup centred; the site's one line as the
 * headline; no live count. The guest scanning and the photos flying in were the
 * two candidates he did not pick, and they left with their files (`scan.tsx`,
 * `inflow.tsx`; git holds them). A board that keeps showing what was decided is
 * a museum, and this one is down to the single thing still open.
 *
 * ★ WHICH IS THE STREAM, IN HIS OWN WORDS: "The album coming out of the code
 * definitely looks best. However, I think we can improve this visual a lot. The
 * random stream feels worse than a more polished one." So the candidates are no
 * longer three pictures, they are four COMPOSITIONS of the one picture, and the
 * board is a catalog to rule on card by card rather than a paper about heroes.
 *
 * ★ AND NOTHING IN ANY OF THEM IS RANDOM. Round five dealt every frame four
 * seeded values off an integer hash; round six replaced every one of them with a
 * step in a declared cycle (`streams.ts`). That is the whole round, and it is
 * why the four differ in GRAMMAR rather than in tuning: order, rhythm,
 * arrangement, line.
 *
 * This is the last exploration this board gets. The winner is wired into
 * `cinema-hero.tsx` in the next round and appears in the Library with a `new`
 * badge, so every card here is finished enough to ship exactly as drawn.
 */
export const HOME_HERO = defineBoard({
  id: "home-hero",
  title: "The home hero",

  question:
    "The home page opens on the album coming out of the QR code. Which composition should the photographs leaving it be?",

  round: {
    n: 6,
    date: "2026-09-16",
    changed:
      "Four polished streams instead of three pictures. Every seeded value became a step in a declared cycle, so no frame is placed at random; the two directions Will did not pick left with their files.",
  },
  history: [
    {
      n: 5,
      date: "2026-09-16",
      changed:
        "Will ruled the direction (the album out of the code), the centred lockup, the site's one line and no live count, and noted that the stream itself reads random.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The lane of photographs became a volume rather than a plane: three depths, half the frames portrait, eight a side, and the type's clear lane measured off the geometry instead of chosen.",
    },
  ],
  context:
    "Round one measured the defect the board exists to fix: the shipped hero carries three darkening layers over a wall of 24 tiles at desktop and a fourth on a phone, because white type has to survive over whichever tile the 55 second drift parks under it. Bible 1 is inverted there and not one photograph reads as a photograph. Every composition since has refused that trade by changing the shape instead: the album is a band through the middle, the type lives above and below it, and the code holds the exact centre at scanning size.",

  verdict: {
    recommendation:
      "The album lays itself out: the only one of the four where the stream stops being traffic and becomes an arrangement you can read.",
    because:
      "A stream that never stops can only be judged while it moves. This one travels out, stops in four held places a side and holds, so the hero is a picture at any instant a screenshot is taken. The other three are all better than round five; none of them is that.",
    overrule:
      "If the first screen has to feel continuous rather than composed, the mirrored pair is the calmest that never stops.",
  },

  // ★ NO ASKS, AND THE CARDS CARRY THE WHOLE CHOICE. This catalog is reviewed
  // as a pick-one gallery: one treatment kept, or refinements asked for on one
  // or more, or new directions. Everything the round opens IS one of the items,
  // so a question beside them would be the same question twice (Will,
  // 2026-09-16: asks only for what is not one item). It also sets the bar for
  // the four cards below: the name, the one line and the four facts have to let
  // a stranger choose between them without opening a single fold.
  asks: [],

  candidates: [
    {
      id: "mirror",
      name: "1. A mirrored pair on every beat",
      one: "One frame each way on every beat, same height, same depth. Calm and symmetric.",
      verdict: "ship",
      rationale:
        "The quietest of the four: round five's silhouette with every dealt value replaced and the spacing made even. Five stations walked in order, three depths in order, the two arms taking the same one on the same beat, so the eye finds the pattern in about two seconds and stops hunting.",
      facts: [
        ["Grammar", "One pair a beat, the arms exact mirrors, five stations"],
        ["Cost", "18 frames lit of 28 nodes; 16.7 ms mean, measured"],
        ["Frames", "the 34 squares (row 2), 14 a side, no photograph twice"],
        ["At rest", "the fan standing symmetric about the code"],
      ],
    },
    {
      id: "phrase",
      name: "2. Three frames, then a breath",
      one: "Three frames leave together, then that side goes quiet and the other answers. It breathes.",
      verdict: "ship",
      rationale:
        "Round five was a metronome with its beats scattered, and a metronome has no phrases. Three frames leave 170ms apart and step far, middle, near, so a phrase opens as one gesture; the bar is then empty and the other arm answers. A short flight empties the stream between phrases, so one reads.",
      facts: [
        [
          "Grammar",
          "Three frames 170ms apart, then an empty bar; the arms alternate",
        ],
        ["Cost", "12 frames lit of 24 nodes; 16.7 ms mean, measured"],
        ["Frames", "the 34 squares (row 2), 12 a side, no photograph twice"],
        ["At rest", "one phrase mid-flight, the answering side just leaving"],
      ],
    },
    {
      id: "settle",
      name: "3. The album lays itself out",
      recommended: true,
      one: "Frames fly out and stop in four held places a side, long enough to read.",
      verdict: "ship",
      rationale:
        "The one that stops being traffic. The places are a composition rather than a scatter, walked in order, and a place is never double booked: a frame holds for less time than its place takes to come round. Because it arrives rather than passes, the album is legible in a still.",
      facts: [
        ["Grammar", "Out, a held arrangement of four places a side, then gone"],
        ["Cost", "15 frames lit of 22 nodes; 16.7 ms mean, measured"],
        ["Frames", "the 34 squares (row 2) and the 12 portraits (row 12)"],
        ["At rest", "the four places occupied: the idea standing still"],
      ],
      assets: [
        {
          what: "12 event photographs, portraits",
          spec: "Logged already. This is the treatment that needs them: a held frame reads at up to 332 px tall, where a 512 square cropped to 4:5 is upscaled.",
          replaces: "the square crops, in the held places only.",
          row: 12,
        },
      ],
    },
    {
      id: "ribbon",
      name: "4. One fanned file a side",
      one: "No scatter: one file each way up a rising arc, fanning as it goes.",
      verdict: "refine",
      rationale:
        "The most composed of the four and the least like an album: the angle is a function of how far along the file a frame is, so the stream reads as one fanned object rather than as many photographs, and it fills the top corners the centred lockup leaves empty. A deck is a deck, and a camera roll is not.",
      facts: [
        [
          "Grammar",
          "One file a side on an arc, the angle fanning with distance",
        ],
        ["Cost", "14 frames lit of 28 nodes; 16.7 ms mean, measured"],
        ["Frames", "the 34 squares (row 2), 14 a side, no photograph twice"],
        ["At rest", "the full file standing, the fan legible end to end"],
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
      text: "The type is centred where every other marketing hero runs left. Ruled on round five, so it is precedent broken on purpose, and it is what lets the code hold the exact middle.",
      evidence: "page",
    },
  ],

  assets: [
    {
      what: "34 event photographs, squares",
      spec: "Unchanged by this round. A stream needs twice its pool for the two arms never to show one photograph at once; 14 a side is the largest of the four, so 34 covers them all.",
      replaces: "the 12 stand-ins (FRAMES in sandbox/home-hero/shared.tsx).",
      row: 2,
    },
  ],

  sections: [
    {
      id: "stream",
      title: "The four streams",
      lede: "The real hero at 1440, running, with its own Replay. Pick dresses the page below; A and B choose the pair.",
      argument: [
        "One picture, four compositions. The first keeps round five's flight and makes the placement symmetric: the two arms take the same station and the same depth on the same beat, so the code is visibly the axis. The second gives the cadence a phrase: three frames close together, an empty bar, then the other arm answers. The third stops: the frames come to rest in four held places a side and hold there long enough to be read. The fourth refuses scatter altogether and runs one fanned file each way along an arc.",
        "What all four hold fixed, and what makes them answers to the note rather than four more tunings: not one value in any of them is seeded. Round five dealt every frame a vertical offset, a size jitter, a roll and a turn wobble off an integer hash, which is why sixteen frames on screen never resolved into a shape. Every one of those is now a step in a table you can read: a station table, a lane table, an aspect table, a roll table. A reader can watch one frame and know where the next will be.",
        "And what none of them touches: photographs at 100 percent with no darkening layer anywhere, the headline in the markup at full opacity and never gated, the ladder resolved per canvas, every animation inside the reduced-motion block with its own designed rest state, the code still and scannable at the exact centre. The type's clear lane is measured off each stream's own geometry rather than chosen, so swapping the composition re-solves it.",
        "What the Cost line is and is not. No phone was measured: the numbers are this machine, both canvases, on the meter below, and all four run at a 16.7 ms mean frame with three to twenty frames over 17 of about 108. The half that carries to a slower machine is the static one, which is the same number everywhere: the nodes handed to the compositor, the frames lit at the busiest instant, and one transform and one opacity written per lit card per frame, with no filter, no blur and the one shadow riding the card's own transform.",
      ],
      wiring: [
        "The winner lands in cinema-hero.tsx and nowhere else. `streams.ts` is already the shippable shape: pure, no React, both canvases solved at module load, one rAF loop writing transform and opacity and nothing else. Drop the three tables that lost and keep the engine. The lab pauses on a hidden TAB through the stage's data-paused; production swaps that for useAmbientPause, which also pauses off screen. The QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN.",
      ],
    },
    {
      id: "pair",
      title: "Two of them, on the real page",
      lede: "A and B as whole home pages at 1:1, scrolled together: the real header over the hero, the next section under the fold.",
      argument: [
        "A hero is never seen the way a board shows it. On the page it has a sticky header over its top 64 px, a section arriving under its fold, and a reader who is scrolling rather than watching. These two frames are the real route's chrome, the real cinema wrapper and the real fifteen sections in the real order, with one component swapped, so the only thing that differs between the halves is the stream.",
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
      label: "Stream",
      // Nothing picked is a state of its own: the page below shows the hero
      // that ships today until a card is picked, and pressing the picked card
      // returns here (Will, 2026-09-16).
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "mirror", label: "1. Mirrored" },
        { id: "phrase", label: "2. Phrased" },
        { id: "settle", label: "3. Lays out" },
        { id: "ribbon", label: "4. Fanned file" },
      ],
      default: "none",
      clearable: true,
    },
    // A and B: the two halves of the comparison, set from the catalog's cards.
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "mirror", label: "1. Mirrored" },
        { id: "phrase", label: "2. Phrased" },
        { id: "settle", label: "3. Lays out" },
        { id: "ribbon", label: "4. Fanned file" },
      ],
      default: "mirror",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "mirror", label: "1. Mirrored" },
        { id: "phrase", label: "2. Phrased" },
        { id: "settle", label: "3. Lays out" },
        { id: "ribbon", label: "4. Fanned file" },
      ],
      default: "settle",
    },
  ],

  lookFirst: [
    {
      section: "stream",
      state: { canvas: "desktop", stream: "none" },
      note: "The four at 1440, running. Watch each for five seconds, then look away and look back: the question is whether you can tell where the next frame will be.",
    },
    {
      section: "stream",
      state: { stream: "settle" },
      note: "The board's answer. It travels out, stops in four held places a side, and holds. Take a screenshot at any moment: that is the test the other three cannot pass.",
    },
    {
      section: "pair",
      state: { "compare-a": "mirror", "compare-b": "settle" },
      note: "The calmest of the three that never stop, against the one that lands, each as the whole home page. The header is over the hero and the next section is under the fold, as on the site.",
    },
    {
      section: "page",
      state: { stream: "settle" },
      note: "The pick worn by the page at full height. Clear the pick in the dock and the same frame is the hero that ships today, which is the comparison round one was built on.",
    },
    {
      section: "stream",
      state: { canvas: "phone", stream: "none" },
      note: "The four at 375, where the reader is holding the object the picture draws. The phone canvas is its own composition, never a squeezed desktop.",
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
