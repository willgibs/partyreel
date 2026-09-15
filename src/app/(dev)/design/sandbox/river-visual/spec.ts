import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE RIVER AS A FEATURE VISUAL, AS DATA (the Library x Lab migration wave,
 * 2026-09-15).
 *
 * Nothing here is new argument. Every ask, candidate, departure and asset is
 * round one's, moved out of `board.tsx` and out of `BoardMeta`'s prop strings so
 * the template, the desk, the record and the review ledger read ONE list. What
 * changed is where a reviewer meets them: the verdict and the four one-word
 * calls are the first screen instead of the last.
 *
 * ★ THE FOUR RECOMMENDATIONS ARE NOT NEW EITHER, and this is the one place the
 * migration had to make something explicit that was implicit. Round one's asks
 * were four sentences with no `recommended` field, because `BoardMeta` had
 * nowhere to put one; the kit's `Ask` requires it. Each is read off what the
 * board already stood on rather than decided here: the column is the placement
 * round one called "the strongest of the three", the code is what the dock, the
 * paste and the component's own prop all default to, the ghost is what the
 * candidate renders, and 1.32 is the visual's default. A reviewer who disagrees
 * presses the other pill; that is what the pills are for.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or a sheet would drag a client tree into a server render.
 */
export const RIVER_VISUAL = defineBoard({
  id: "river-visual",
  title: "The river, a feature visual",

  question:
    "The river as a section-scale feature visual, banked: three sizes, three origins, three real placements. Where does it go first, and does the code stay in it?",

  round: {
    n: 2,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. The verdict and the four calls are the first screen, the rest state is a switch rather than a resolution done by hand, and the cost is measured in phases. No candidate, number or recommendation changed.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-15",
      changed:
        "The river, killed as the home hero, came back as a banked feature visual: one flow, every number derived from its box, three sizes on one clock and three placements on the production shells they would ship inside.",
    },
  ],
  context:
    "The river was one of the home hero's concepts. Will killed it there and banked it: the animation could drop down in one flow rather than two, and be saved to the lab's design bank as a feature visual rather than a hero, a smaller alternative presentation of the images emanating from the code. Round one deleted the hero's two braided arms, its clearing, its held beat and its two hand-typed geometries, derived every number from the box instead, and put the result on three real placements.",

  verdict: {
    recommendation:
      "Bank it as written, and place it first beside the copy of a how it works step, at 560, with the code in it.",
    because:
      "Every number is derived from the box, so a 560 column, a 400 card and a 240 thumbnail are one visual at three scales on one clock. The column is the only slot tall enough to show the whole fall, which is the thing the visual is: the card slot reads it at its top third, and the guest album has to ghost it before it can carry it at all.",
    overrule:
      "If a section visual may not carry a second call to action, the code comes out, and the scan floor that makes the object large in a small box goes with it.",
  },

  asks: [
    {
      id: "placement",
      question: "Where it goes first",
      options: ["column", "card", "guest"],
      recommended: "column",
      because:
        "The column is the only slot tall enough for the whole fall, and the one placement that draws the visual at its full banked width. The card slot is the hardest test rather than the best one, and the guest album is an app surface that has to ghost it.",
      overrule:
        "If the first placement should be the hardest one rather than the strongest, the card slot is that test.",
      evidence: "column",
    },
    {
      id: "code",
      question: "The code, in or out",
      options: ["in", "out"],
      recommended: "in",
      because:
        "It is what the album pours out of, and a scannable code is a second call to action inside a section visual. The price is fixed: 123 px of code whatever the box is, so its card is a quarter of the 560 column and three fifths of the 240 thumbnail.",
      overrule:
        "The guest album is the exception either way: a guest arrived by scanning, so that placement takes the plain plate.",
      evidence: "bank",
    },
    {
      id: "guest-photos",
      question: "May an empty album show photographs",
      options: ["ghost", "none"],
      recommended: "ghost",
      because:
        "Production already made this call for the mosaic it would replace, at grayscale and low alpha, so the promise is a thing arriving rather than a grid standing still. At full luminance an empty album promises pictures that do not exist.",
      overrule:
        "If an empty state may carry no picture of other people's events at all, the mosaic goes with it and the screen is type alone.",
      evidence: "guest",
    },
    {
      id: "proportion",
      question: "The box's proportion",
      options: ["keep", "taller", "squarer"],
      recommended: "keep",
      because:
        "1.32 is the only number in the visual that is taste rather than derivation. It leaves the fall room to straighten before the dissolve takes it: squarer cuts the straightening, taller keeps the frames small for longer.",
      evidence: "bank",
    },
  ],

  candidates: [
    {
      id: "one-flow",
      name: "One flow",
      recommended: true,
      rationale:
        "One stream fanning out of one printed object. The hero's two braided arms, its measured clearing and its held beat are gone, and 210 lines of hero geometry left with them; what is left is the thing Will liked and the only thing a section slot has room for.",
    },
    {
      id: "one-clock",
      name: "Three sizes, one clock",
      rationale:
        "Every number is derived from the box, and the flight and the cadence are constants, so 560, 400 and 240 are one visual at three scales and two instances on a page pour in step. A placement at any other width is already correct.",
    },
    {
      id: "origins",
      name: "Three origins",
      rationale:
        "The demo code on its printed card (a link, and a call to action in disguise), the same card blank where the subject is not the code, or no object at all, where the flow enters from above the frame. The last is the quietest and the first is the loudest.",
    },
  ],

  departures: [
    {
      id: "ghost-in-the-app",
      from: 1,
      text: "The guest empty state renders the flow grayscale at low alpha, production's own treatment for the mosaic it replaces: at full luminance a stream of photographs in an empty album promises pictures that do not exist. It is a filter on the placement's wrapper and never a layer over the media, and it is the only place on this board where a photograph is not at 100 percent.",
      evidence: "guest",
    },
    {
      id: "pre-pour-frame",
      from: 13,
      text: "The pour's first frame lives inside the reduced-motion block, so a reader with scripting off who has not asked for less motion sees the flow rest at the object. Nothing that carries meaning is gated by it: the visual holds no type by design, and every placement's words are plain markup beside it.",
      evidence: "bank",
    },
    {
      id: "occasional",
      from: 12,
      text: "A feature visual is occasional rather than a hero, so the flight is 7.6 seconds and a frame launches every 611 ms: slow enough to be ambient beside copy. The lab pauses on a hidden tab only, so instances can be compared side by side; the wiring round swaps in useAmbientPause, which also pauses off screen.",
      evidence: "cost",
    },
    {
      id: "scan-floor",
      from: "precedent",
      text: "The code's size is measured off the value it draws rather than typed. FooterQr draws over a viewBox of the module count PLUS its 8 quiet-zone modules, so a module gets the size over 41 and not over 33: the demo URL is scannable from 123 px up and no smaller, whatever the box is. Every specimen prints what it got.",
      evidence: "bank",
    },
    {
      id: "prefix",
      from: "precedent",
      text: "The prefix moved, hhv- to rvr-, everywhere in this lane. hhv- meant home hero variation and this is no longer one; keyframe names are document global, so the rename also keeps this sheet from shadowing the hero board's if the two are ever mounted on one page.",
      evidence: "mount",
    },
  ],

  assets: [
    {
      what: "24 event photographs as squares",
      spec: "512 x 512, one grade, 6 to 35 KB webp each, framed tight enough to read at 110 px, which is the size a frame is as it leaves the object in the 560 column.",
      replaces:
        "the 12 landscape stand-ins and the per-frame crop table in river.tsx.",
      row: 2,
    },
    {
      what: "12 event photographs as 4:5 portraits",
      spec: "720 x 900, one grade, from the same shoot as the squares.",
      replaces:
        "the portrait cards (wf 0.8), which are cropped out of landscapes today.",
      row: 12,
    },
  ],

  sections: [
    {
      id: "bank",
      title: "The bank",
      lede: "The three banked sizes at 1:1 on one clock, with the object the dock flips under all three at once: the demo code, a plain plate, or nothing.",
      argument: [
        "One clock across all three, so the row is one visual at three scales and not three tunings. Every number a specimen draws is derived from its width: the frame size, the fan, the fall, the dissolve and the object. The one thing that is not derived is the code, which has an absolute floor in pixels, so the smaller the box the larger its share, and each caption prints the share it actually got.",
        "That floor is the whole of the second ask. A scannable demo code is 123 px whatever the box is, so its printed card is about a quarter of the 560 column and three fifths of the 240 thumbnail: the small sizes pay for the code in composition rather than in legibility. Flip the dock's Origin to a plain plate and the object becomes a fifth of the box at every size, because taking the code out takes the scan floor out with it.",
        "Rest is the reduced-motion state, authored rather than reproduced by hand. The flow's final state is the album fully deployed, written as custom properties during render, so a reduced-motion reader, a crawler and the server's own HTML all get the same still. Switching Motion to Rest stops the loop and clears the two properties it writes, which is exactly that reader's frame.",
      ],
    },
    {
      id: "column",
      title: "The column, on a feature page",
      lede: "Placement one, and the recommendation: the visual at the bank's own column size beside a how it works list, on the production section shell.",
      argument: [
        "The width is read off the bank rather than typed, through the same function the specimen row uses, so this section draws exactly the number the first ask names: 560 at 1440 and 343 at 375. An earlier draft drew 460 here while the ask said 560, which put a width in front of a reviewer that nothing on the board rendered.",
        "This is the only slot tall enough to show the whole fall. The container leaves 616 px for the step list beside it at 1440, which is more room than the list needs, and the visual keeps its full banked width rather than being squeezed to fit a column that was not designed around it.",
      ],
      wiring: [
        "The visual moves whole to src/components/marketing/system/river-visual.tsx with its sheet and swaps the lab's [data-paused] ancestor read for useAmbientPause. Nothing else about the file changes: it imports only the media manifest, FooterQr, Caption and the reduced-motion hook.",
      ],
    },
    {
      id: "card",
      title: "The card slot, on a doors row",
      lede: "Placement two, the hardest: the width the real three-up grid gives a door, on paper, beside the stills its neighbours carry today.",
      argument: [
        "A card slot is the hardest of the three because the box is short. The flow is read at its top third, where the frames are still small and still tumbling, and an object at the top of it eats a third of the picture. This is the slot that argues for taking the code out, and it is the reason the second ask is asked at all rather than assumed.",
        "The width is the grid's, not the bank's: a three-up row inside max-w-5xl with a 16 px gap gives a door 330 px at 1440 and 311 at 375, where the bank's card size is 400. The caption prints the number the canvas drew rather than the one the bank banked.",
      ],
    },
    {
      id: "guest",
      title: "The guest album, before anyone uploads",
      lede: "Placement three, and an app surface: today's ghost mosaic beside the flow, both at the width the guest page really gives its gallery.",
      argument: [
        "Will opened the app's UI to the lab this round, so this placement is a redesign of a shipped app surface rather than a mock of one. Today's empty state is a 3 by 3 ghost mosaic of nine grayscale stills with the promise floating over it. The candidate keeps its two rules and changes its picture: the promise is a thing arriving, not a grid standing still, so the mosaic becomes the flow, pouring out of the plate the guest just scanned.",
        "The column is derived from the page it ships on rather than picked: the guest page clamps at a 672 column with 20 px gutters, so its gallery is the canvas or 672, whichever is smaller, less the two gutters. That is 632 at 1440 and 335 at 375, read off the stage's own canvas so it cannot drift from it.",
        "Type over the media is allowed here and nowhere else on this board. The flow is already a ghost, which is the treatment an empty album needs anyway; in every marketing placement the visual is at full luminance and the words go beside it. A feature visual has no clearing and never will, because the clearing was the hero's and it went with the hero.",
      ],
    },
    {
      id: "cost",
      title: "What it costs",
      lede: "Measured here, now: the rest state, one instance running, and six at once, with everything else on the board hidden while the meter runs.",
      argument: [
        "One rest state, one instance and six is the whole question a bank entry has to answer: what the floor is, what a real page pays, and what happens to a page that wants several. A real page mounts one, so the middle row is production truth and the last is the stress case.",
        "The per-frame work does not grow with the box: twelve transform writes an instance a frame, and an opacity write only when it changed, which at rest is none. What does grow with the box is raster, which a frame gap cannot see, so the static line beside the meter is the half that carries to a slower machine.",
      ],
    },
    {
      id: "mount",
      title: "The mount",
      lede: "The props, every one of them derived from the box, and the paste a placement lands.",
    },
  ],

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
      id: "ground",
      label: "Ground",
      options: [
        { id: "cinema", label: "Cinema" },
        { id: "paper", label: "Paper" },
      ],
      default: "cinema",
    },
    {
      id: "origin",
      label: "Origin",
      options: [
        { id: "code", label: "The demo code" },
        { id: "plate", label: "A plain plate" },
        { id: "none", label: "No object" },
      ],
      default: "code",
    },
    {
      id: "motion",
      label: "Motion",
      options: [
        { id: "live", label: "Live" },
        { id: "rest", label: "Rest" },
      ],
      default: "live",
    },
  ],

  lookFirst: [
    {
      section: "bank",
      state: {
        canvas: "desktop",
        ground: "cinema",
        origin: "code",
        motion: "live",
      },
      note: "The three banked sizes on one clock. If the row does not read as one visual at three scales, the bank entry is the wrong shape and the rest of the walk is the wrong argument.",
    },
    {
      section: "bank",
      state: { origin: "none" },
      note: "The same row with the object taken out. That one flip is the whole second ask: with the code the flow is a call to action, without it the album is simply arriving.",
    },
    {
      section: "bank",
      state: { origin: "code", motion: "rest" },
      note: "What a reader who asked for less motion gets: the flow standing at its steady spacing, which is one instant of the running stream and cannot drift from it.",
    },
    {
      section: "column",
      state: { motion: "live" },
      note: "The recommended placement, at the width the first ask quotes. The list takes the rest of the container; judge whether the visual earns the room.",
    },
    {
      section: "card",
      note: "The same visual in a short box on paper, where the object eats a third of the slot. This is the hardest of the three and the one that argues for no code.",
    },
    {
      section: "guest",
      state: { origin: "none" },
      note: "Today's mosaic beside the candidate, both at the width the guest page really gives its gallery. The third ask is whether an empty album may carry either of them.",
    },
  ],

  notes: [
    {
      section: "bank",
      state: { ground: "paper" },
      text: "On paper the plain plate is a white card with a faint field in it. At the lightness the first draft used it vanished into the card entirely, which is not a quiet object but a missing one.",
    },
    {
      section: "card",
      text: "A production shell's own breakpoints read the browser window and not the stage, so the 375 canvas tells the truth about the visual and only approximates the shell's gutters unless the window is narrow too.",
    },
    {
      section: "cost",
      text: "Read the meter in a foreground tab. A hidden tab throttles frames and the stage pauses every loop, so a run taken behind another window reports a stopped clock as a perfect one.",
    },
  ],

  links: {
    bible: [1, 12, 13, 18],
  },
});
