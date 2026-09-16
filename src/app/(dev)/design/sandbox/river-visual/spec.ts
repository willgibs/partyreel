import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE RIVER AS A FEATURE VISUAL, AS DATA (the Library x Lab migration wave,
 * 2026-09-15; the four asks rewritten in plain words the same night, the
 * clarity round).
 *
 * Nothing here is new argument. Every ask, candidate, departure and asset is
 * round one's, moved out of `board.tsx` and out of `BoardMeta`'s prop strings so
 * the template, the desk, the record and the review ledger read ONE list. What
 * changed is where a reviewer meets them: the verdict and the four calls are the
 * first screen instead of the last.
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
 * ★ AND THE ASKS ARE NOW IN PLAIN WORDS (Will, 2026-09-15: "the more clearly you
 * can ask me questions, the more easily it is for me to respond"). The ids never
 * moved, because the ledger joins on them; what moved is every word around them.
 * "The river", "the bank", "the plate", "rest" and "1:1" were this board's own
 * shorthand, and a reviewer meets an ask on the desk, away from the board that
 * taught him the words. So every option is labelled in words with what picking
 * it does, every ask says what the thing is and where to look, and the evidence
 * carries the same words: the three placement sections are TITLED with the three
 * options of the placement ask, the size row's captions open with the code
 * ask's two, and the guest comparison labels both halves with the one answer
 * they both are.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or a sheet would drag a client tree into a server render.
 */
export const RIVER_VISUAL = defineBoard({
  id: "river-visual",
  title: "The river, a feature visual",

  question:
    "The river is the album pouring out of the scannable code, as one visual a page section can carry. Where should it go first, and should the code stay in it?",

  round: {
    n: 2,
    date: "2026-09-15",
    changed:
      "Onto the kit's template: the verdict and the four calls first, the still version a switch, the cost measured in phases. Then the four asks were rewritten in plain words with labelled options. No candidate, number or recommendation changed.",
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
    "The river is the album pouring down out of the scannable code: one flow of photographs, tumbling as they leave it and straightening as they land. It was one of the home page's hero concepts. Will killed it there and kept it: the animation could drop in one flow rather than two, and be saved for later use as a feature visual rather than a hero, a smaller way of showing the pictures coming out of the code. Round one deleted the hero's two braided arms, its clearing and its two hand typed geometries, worked every number out from the width instead, and put the result in three real places.",

  verdict: {
    recommendation:
      "Keep it as it stands, and use it first beside the words of a how it works step, at 560 px wide, with the scannable code still in it.",
    because:
      "Every measurement is worked out from the width, so the 560, the 400 and the 240 are one visual at three sizes on one clock. The tall column is the only slot that shows the whole fall, which is the thing itself: a card slot shows the top third, and the empty guest album has to fade it to grey before it can carry it at all.",
    overrule:
      "If a picture inside a section may not also be a thing to scan, the code comes out, and the size floor that makes it large in a small box goes with it.",
  },

  asks: [
    {
      id: "placement",
      question: "Which of the three real slots should carry the visual first?",
      context:
        "The visual is the event album pouring down out of the scannable code, one flow, sized to sit beside copy rather than fill a screen. The board puts it in three real slots, each drawn on the shell it would ship inside: beside the steps of a how it works section, in the picture slot of a feature card, and on the guest album screen before anyone has uploaded anything.",
      look: "The three sections after the sizes, each titled with one of these options: Beside a how it works step, In a feature card's picture slot, On the empty guest album. Compare how much of the fall each slot shows.",
      options: [
        {
          id: "column",
          label: "Beside a how it works step",
          means:
            "It ships first in a how it works section on a feature page, 560 px wide, with the steps listed beside it.",
        },
        {
          id: "card",
          label: "In a feature card's picture slot",
          means:
            "It ships first in the picture slot of one card in a three card row, a short box that shows the top of the fall.",
        },
        {
          id: "guest",
          label: "On the empty guest album",
          means:
            "It ships first on the guest screen before anyone uploads, in place of today's faded grid of photographs.",
        },
      ],
      recommended: "column",
      because:
        "The column is the only slot tall enough for the whole fall, and the only one that draws the visual at its full width. The card slot is the hardest test rather than the best one, and the guest album is an app screen that has to fade it to grey first.",
      overrule:
        "If the first use should be the hardest slot rather than the strongest, the card slot is that test.",
      evidence: "column",
      // The axes this ask turns on, and nothing else: the canvas is the
      // reviewer's own choice, and pinning it landed a phone reader on a 1440
      // stage he then had to scroll sideways.
      state: { origin: "code", motion: "live" },
    },
    {
      id: "code",
      question: "Should the scannable code stay inside the visual?",
      context:
        "The album pours out of an object at the top of the flow. That object can be the real demo code, which a phone can actually scan, so the picture doubles as a way into the demo; or a plain white card with no code on it; or nothing at all, with the flow entering from above the frame. A code that still scans is 123 px wide whatever the box is, so the smaller the visual, the more of it the code takes.",
      look: "The three sizes, and the dock: flip Pours out of between The demo code and A plain card on the same three specimens. Each caption opens with the answer it is showing and prints what the object took.",
      options: [
        {
          id: "in",
          label: "Keep the code in it",
          means:
            "The album pours out of the real scannable code, so the picture is also a way into the demo.",
        },
        {
          id: "out",
          label: "Take the code out",
          means:
            "The album pours out of a plain card, or out of nothing at all; the picture is only the album arriving.",
        },
      ],
      recommended: "in",
      because:
        "The code is what the album pours out of, and one that scans turns the picture into a way in. The price is fixed at 123 px whatever the box is, so its card takes about a quarter of the 560 version and three fifths of the 240 one.",
      overrule:
        "The guest album is the exception either way: a guest got there by scanning, so that screen takes the plain card.",
      evidence: "bank",
      state: { origin: "code" },
    },
    {
      id: "guest-photos",
      question: "May an empty album show faint photographs of other events?",
      context:
        "Before anyone uploads, the guest album screen has nothing of its own to show. Today it shows a 3 by 3 grid of nine photographs of other events, drained of colour and turned down to a quarter, with the invitation to add the first one floating over it. The candidate keeps that faint treatment and changes the picture: the grid becomes the flow, pouring out of the card the guest just scanned.",
      look: "The empty guest album section: today's grid beside the flow, both at the width the real guest page gives its gallery, and both labelled as the faded answer. The words alone answer is that screen with the picture taken out.",
      options: [
        {
          id: "ghost",
          label: "Yes, faded and grey",
          means:
            "Photographs of other events may appear drained of colour and turned down, as today's grid already is.",
        },
        {
          id: "none",
          label: "No, words alone",
          means:
            "No picture of other people's events at all: today's grid goes too, and the screen is type and a button.",
        },
      ],
      recommended: "ghost",
      because:
        "The app already made this call for the grid this would replace, so the promise reads as something arriving rather than a wall standing still. At full colour an empty album promises pictures that do not exist yet.",
      overrule:
        "If an empty screen may carry no picture of other people's events at all, the grid goes with it and the screen is words alone.",
      evidence: "guest",
      state: { origin: "none" },
    },
    {
      id: "proportion",
      question: "Should the box stay a third taller than it is wide?",
      context:
        "Every measurement in the visual is worked out from its width except one: how tall the box is. It stands at 1.32 times the width, which is the room the falling frames need to straighten up before they fade out at the bottom. A squarer box cuts that straightening short; a taller one keeps the frames small for longer before they land.",
      look: "The three sizes, which all share the one proportion: watch where a frame finishes straightening before it fades at the bottom. The board draws 1.32 only, so the other two are judged on the room the fall uses.",
      options: [
        {
          id: "keep",
          label: "Keep it as it is",
          means:
            "The box stays 1.32 times as tall as it is wide, the proportion every specimen on the board draws.",
        },
        {
          id: "taller",
          label: "Make it taller",
          means:
            "More fall in the same width: the frames stay small for longer and straighten later.",
        },
        {
          id: "squarer",
          label: "Make it squarer",
          means:
            "Less fall in the same width: the frames land sooner, with less room to straighten.",
        },
      ],
      recommended: "keep",
      because:
        "1.32 is the only number in the visual that is taste rather than arithmetic. It leaves the fall room to straighten before the fade takes it: squarer cuts the straightening, taller keeps the frames small for longer.",
      evidence: "bank",
      state: { motion: "live" },
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
      name: "Three things to pour out of",
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
      title: "The visual, at three sizes",
      lede: "The three sizes at their true size on one clock, with the dock's Pours out of switch changing what the album comes out of under all three at once: the demo code, a plain card, or nothing.",
      argument: [
        "One clock across all three, so the row is one visual at three sizes and not three tunings. Every number a specimen draws is worked out from its width: the frame size, the fan, the fall, the fade and the object. The one thing that is not is the code, which has a floor in pixels it cannot go under and still scan, so the smaller the box the larger its share, and each caption prints the share it actually got.",
        "That floor is the whole of the code ask. A scannable demo code is 123 px whatever the box is, so its printed card is about a quarter of the 560 column and three fifths of the 240 thumbnail: the small sizes pay for the code in composition rather than in legibility. Flip the dock's Pours out of to a plain card and the object becomes a fifth of the box at every size, because taking the code out takes its floor out with it.",
        "The still version is what a reader who asked for less motion gets, authored rather than reproduced by hand. The flow's final state is the album fully spread, written as custom properties during render, so that reader, a crawler and the server's own HTML all get the same picture. Switching Motion to Rest stops the loop and clears the two properties it writes, which is exactly that reader's frame.",
      ],
    },
    {
      id: "column",
      title: "Beside a how it works step",
      lede: "The first of the three slots, and the recommendation: the visual at 560 px beside the steps of a how it works section, drawn on the real section shell.",
      argument: [
        "The width is read off the sizes row rather than typed, through the same function that row uses, so this section draws exactly the number the first ask names: 560 at 1440 and 343 at 375. An earlier draft drew 460 here while the ask said 560, which put a width in front of a reviewer that nothing on the board rendered.",
        "This is the only slot tall enough to show the whole fall. The container leaves 616 px for the step list beside it at 1440, which is more room than the list needs, and the visual keeps its full width rather than being squeezed to fit a column that was not designed around it.",
      ],
      wiring: [
        "The visual moves whole to src/components/marketing/system/river-visual.tsx with its sheet and swaps the lab's [data-paused] ancestor read for useAmbientPause. Nothing else about the file changes: it imports only the media manifest, FooterQr, Caption and the reduced-motion hook.",
      ],
    },
    {
      id: "card",
      title: "In a feature card's picture slot",
      lede: "The second slot, and the hardest: the width the real three card row gives a card, on paper, beside the photographs its neighbours carry today.",
      argument: [
        "A card slot is the hardest of the three because the box is short. The flow is read at its top third, where the frames are still small and still tumbling, and an object at the top of it eats a third of the picture. This is the slot that argues for taking the code out, and it is the reason the code ask is asked at all rather than assumed.",
        "The width is the grid's, not the one the sizes row banked: a three card row inside max-w-5xl with a 16 px gap gives a card 330 px at 1440 and 311 at 375, where the banked card size is 400. The caption prints the number the canvas drew rather than the one the row banked.",
      ],
    },
    {
      id: "guest",
      title: "On the empty guest album",
      lede: "The third slot, and an app screen: today's faded grid beside the flow, both at the width the guest page really gives its gallery.",
      argument: [
        "Will opened the app's UI to the lab this round, so this placement is a redesign of a shipped app surface rather than a mock of one. Today's empty state is a 3 by 3 grid of nine photographs, drained of colour and turned down to a quarter, with the promise floating over it. The candidate keeps its two rules and changes its picture: the promise is a thing arriving, not a grid standing still, so the grid becomes the flow, pouring out of the card the guest just scanned.",
        "The column is worked out from the page it ships on rather than picked: the guest page clamps at a 672 column with 20 px gutters, so its gallery is the canvas or 672, whichever is smaller, less the two gutters. That is 632 at 1440 and 335 at 375, read off the stage's own canvas so it cannot drift from it.",
        "Type over the picture is allowed here and nowhere else on this board. The flow is already faded, which is the treatment an empty album needs anyway; in every marketing slot the visual is at full strength and the words go beside it. A feature visual has no clearing and never will, because the clearing was the hero's and it went with the hero.",
      ],
    },
    {
      id: "cost",
      title: "What it costs",
      lede: "Measured here, now: the still version, one of them running, and six at once, with everything else on the board hidden while the meter runs.",
      argument: [
        "The still version, one running and six is the whole question a saved visual has to answer: what the floor is, what a real page pays, and what happens to a page that wants several. A real page mounts one, so the middle row is production truth and the last is the stress case.",
        "The per-frame work does not grow with the box: twelve transform writes an instance a frame, and an opacity write only when it changed, which at rest is none. What does grow with the box is raster, which a frame gap cannot see, so the static line beside the meter is the half that carries to a slower machine.",
      ],
    },
    {
      id: "mount",
      title: "How a page uses it",
      lede: "Every setting it takes, each one worked out from the width, and the block a placement copies.",
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
      // The knob's own label in plain words too: "Origin" was this board's
      // coinage and a reviewer meets it with no gloss. The id stays `origin`,
      // because it is the URL param every shared link and every ask state
      // carries.
      id: "origin",
      label: "Pours out of",
      options: [
        { id: "code", label: "The demo code" },
        { id: "plate", label: "A plain card" },
        { id: "none", label: "Nothing at the top" },
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
      note: "The three sizes on one clock. If the row does not read as one visual at three sizes, the saved visual is the wrong shape and the rest of the walk is the wrong argument.",
    },
    {
      section: "bank",
      state: { origin: "none" },
      note: "The same row with the object taken out. That one flip is the whole of the code ask: with the code the picture is an invitation, without it the album is simply arriving.",
    },
    {
      section: "bank",
      state: { origin: "code", motion: "rest" },
      note: "What a reader who asked for less motion gets: the flow standing at its steady spacing, which is one instant of the running stream and cannot drift from it.",
    },
    {
      section: "column",
      state: { motion: "live" },
      note: "The recommended slot, at the width the first ask names. The list takes the rest of the container; judge whether the visual earns the room.",
    },
    {
      section: "card",
      note: "The same visual in a short box on paper, where the object eats a third of the slot. This is the hardest of the three and the one that argues for taking the code out.",
    },
    {
      section: "guest",
      state: { origin: "none" },
      note: "Today's grid beside the candidate, both at the width the guest page really gives its gallery. The third ask is whether an empty album may carry either of them.",
    },
  ],

  notes: [
    {
      section: "bank",
      state: { ground: "paper" },
      text: "On paper the plain card is a white card with a faint field in it. At the lightness the first draft used it vanished into the card entirely, which is not a quiet object but a missing one.",
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
