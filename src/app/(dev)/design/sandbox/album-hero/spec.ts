import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE ALBUM PAGE'S HERO, AS DATA. ROUND THREE, 2026-09-17: four calm
 * compositions, one pick.
 *
 * ★ WILL'S SIX NOTES ARE THIS ROUND'S BRIEF, and they are round two's verdict.
 * He scrolled the board ahead of his sitting: the hero was "copying the exact
 * H1 content component from the home hero but dropping the QR code, leaving a
 * ridiculous looking center gap"; "when I asked for this to be repurposed to
 * the live album page, I didn't want it used literally as is. It needs to be
 * redesigned to feel custom"; "let's make the next round of album hero visuals
 * feel a bit more calm. These are all moving too fast and feel distracting from
 * the actual page content. Many frames are also jittery/buggy"; "the album
 * dashboard visual beneath the hero should be centered and width constrained.
 * The attached screenshot of the Cosmos hero is a good idea, but a bit wider";
 * and he would "love to see a version of that" ring as one of the candidates.
 *
 * ★ SO THE BOARD IS ONE PICK AND FOUR FOLLOW-UPS. Round two argued one picture
 * and asked five questions around it; this one draws four finished pictures and
 * asks which. `catalog.mode` is `pick-one`, the `composition` ask records the
 * winner with "None of these" as its third exit, and the whole feature page
 * under the tiles wears whatever card is pressed.
 *
 * ★ THE FOUR ARE WRITTEN OUT HERE, NEVER MAPPED, AND THAT IS NOT LAZINESS ABOUT
 * DRY. `pnpm lab:review` reads a spec as TEXT rather than importing it, and it
 * resolves `candidates: ITEMS` exactly ONE HOP to a const array in this file: a
 * `.map` over the compositions would read as a catalog with no cards at all and
 * every ruling on one would be refused. The NUMBERS live in `compositions.ts`
 * and the WORDS live here; `compositions.test.ts` pins each Cost line to the
 * table it claims to report.
 *
 * ★ TWO OF ROUND TWO'S ASKS CHANGED SHAPE AND ONE LEFT. `life` is withdrawn,
 * because the arrival card is that question drawn rather than asked. `width`
 * was "as it ships, or four columns"; it is now the album's own column measured
 * by eye at three widths, so its id is `album-width` and the old answer is not
 * silently rejoined to a different question. `headline`, `no-script` and `copy`
 * keep their ids and their option ids, because the ledger joins on them.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads this for its header, so a spec that imported React, the
 * board or its sheet would drag a client tree into a server render.
 */
const ITEMS: readonly Candidate<"catalog" | "hero" | "album" | "page">[] = [
  {
    id: "orbit",
    name: "1. The orbit",
    one: "The ring Will named: photographs standing around the words, tilted, fainter toward the edges.",
    verdict: "ship",
    recommended: true,
    rationale:
      "Cosmos's shape, drawn round this page's own lockup. Fourteen stations, each an angle and a radius off the block, held for half a minute while they drift two degrees down their own arc; every few seconds one fades and another fills an empty place, so the ring turns and nothing crosses the canvas.",
    facts: [
      ["Grammar", "Fourteen held stations round the block; one swap a beat"],
      ["Cost", "13 lit of 14 nodes, 1 px a second"],
      ["Frames", "34 squares (row 2) and the 11 portraits (row 9)"],
      ["At rest", "the ring standing, most stations occupied"],
    ],
    lands:
      "The hero on /features/album: the orbit's station table and the shared engine.",
  },
  {
    id: "field",
    name: "2. The field, calmed",
    one: "Round two's picture, slowed right down: photographs out from behind the words, for ever.",
    verdict: "refine",
    rationale:
      "Round two's argument, slowed until it is calm. A frame is born at the centre, behind the words rather than in a hole cut through them, and is dark until it has cleared them; the rest of its flight is one slow crossing from the lockup's rim to the canvas edge, which is every frame of it anybody sees.",
    facts: [
      ["Grammar", "Fifteen rays, each crossing from the block's rim to the edge"],
      ["Cost", "12 lit of 15 nodes, 24 px a second"],
      ["Frames", "34 squares (row 2) and the 11 portraits (row 9)"],
      ["At rest", "the field deployed at its steady spacing"],
    ],
    lands:
      "The hero on /features/album: the field's ray table and the shared engine.",
  },
  {
    id: "shelf",
    name: "3. The shelf",
    one: "Two bands, one along the top edge and one along the foot, sliding past each other very slowly.",
    verdict: "ship",
    rationale:
      "The album as a contact sheet somebody is pulling past, which is what a reader's eye does to a grid anyway. Six frames a band, the top running right and the foot running left at about 31 px a second, outer edges flush and inner edges ragged. No births at all: nothing here ever asks to be noticed.",
    facts: [
      ["Grammar", "Two bands, opposite ways, wrapping off the canvas"],
      ["Cost", "12 lit of 12 nodes, 31 px a second"],
      ["Frames", "34 squares (row 2); a band reads flat without the portraits"],
      ["At rest", "both bands full, evenly spaced"],
    ],
    lands:
      "The hero on /features/album: the shelf's band table and the shared engine.",
  },
  {
    id: "arrival",
    name: "4. The arrival",
    one: "A still scatter where one photograph lands every few seconds and the oldest fades away.",
    verdict: "ship",
    rationale:
      "The truest to the product: a new tile arriving is what a guest uploading does to a real album. Fourteen places, ten taken at any moment, and the only motion is one card easing down onto an empty one over six tenths of a second. Between landings the hero is a still photograph.",
    facts: [
      ["Grammar", "Fourteen places, ten taken; one lands, the oldest goes"],
      ["Cost", "10 lit of 14 nodes, 0 px a second"],
      ["Frames", "34 squares (row 2) and the 11 portraits (row 9)"],
      ["At rest", "the scatter standing, four places empty"],
    ],
    lands:
      "The hero on /features/album: the arrival's place table and the shared engine.",
  },
];

export const ALBUM_HERO = defineBoard({
  id: "album-hero",
  title: "The album page's hero",

  question:
    "The album page opens on photographs behind its own words. Which of four calm compositions should it be, and how wide should the live album under it sit?",

  round: {
    n: 3,
    date: "2026-09-17",
    changed:
      "Four calm compositions on one engine after the notes on round two: the lockup is one block with no gap in it, nothing moves faster than 40 px a second, at most sixteen frames are lit, the jitter is gone, and the album below is centred and width-constrained.",
  },
  history: [
    {
      n: 2,
      date: "2026-09-15",
      changed:
        "One picture, the field, and five asks around it. Will: the hero borrowed the home hero's lockup and left a ridiculous centre gap; it should feel custom; it moves too fast, frames are jittery; the album below should be centred and width constrained, a bit wider than Cosmos; and show a version of the Cosmos ring.",
    },
    {
      n: 1,
      date: "2026-09-15",
      changed:
        "The field arrived from the home hero and lost its centre: a birth at a point, a vent where the QR plate was, the page's shipped lockup over it, and the real guest album below.",
    },
  ],
  context:
    "The field was built for the HOME page, lost there, and was sent here in the same breath. Round two showed it whole, with the home hero's lockup opened around a vent it no longer had anything to put in. What that proved is that a hero cannot be repurposed by deletion. So the lockup is composed for this page as one block, and the photographs are four different answers to the same question: what does an album look like standing behind a promise, calmly, for as long as somebody reads it.",

  verdict: {
    recommendation:
      "The orbit: the photographs standing in a ring around the page's own words, tilted, fainter toward the edges, turning one frame at a time.",
    because:
      "It is the reference Will named, and it is the only one of the four whose stillness is the picture rather than a budget: nothing crosses the canvas at all, so the hero can sit behind the words for a minute without ever becoming the thing your eye is chasing. The ring also says the one thing this page is about, an album that is whole and still filling, without spending a single moving frame on it.",
    overrule:
      "If the hero should demonstrate rather than depict, the arrival: the same stillness with one photograph landing every few seconds, which is literally what a guest uploading does.",
  },

  asks: [
    {
      id: "composition",
      question: "Which composition should the album page's hero be?",
      context:
        "Four finished heroes, each the real page's words with the real photographs around them, at 1440 with its own Replay. One wins and is wired into the live page; the other three leave with the board. All four hold the same rules: nothing over a word, nothing faster than 40 px a second, at most sixteen frames lit.",
      look: "Give each one thirty seconds with nothing else on screen, which is the check no tool can run. Nothing should ever become the thing your eye is following.",
      options: [
        {
          id: "orbit",
          label: "1. The orbit",
          means:
            "The ring you asked for: photographs held around the words, tilted, fainter outward, one swapped every few seconds.",
        },
        {
          id: "field",
          label: "2. The field, calmed",
          means:
            "Last round's picture at a quarter of the speed and a third of the frames, born behind the words rather than in a gap in them.",
        },
        {
          id: "shelf",
          label: "3. The shelf",
          means:
            "One band of photographs along the top edge and one along the foot, sliding past each other very slowly.",
        },
        {
          id: "arrival",
          label: "4. The arrival",
          means:
            "A still scatter where one photograph lands every few seconds and the oldest fades. Nothing else on the canvas moves.",
        },
        {
          id: "none",
          label: "None of these",
          means:
            "New directions. Say in the note what the four are missing, and the next round starts from that instead of from a card.",
        },
      ],
      recommended: "orbit",
      because:
        "It is the reference you named, and the only one whose stillness is the picture rather than a speed limit: nothing crosses the canvas at all.",
      evidence: "catalog",
      control: "composition",
      lands:
        "The hero component on /features/album, in files: one engine, the winning table, the other three deleted.",
      strip: ["canvas"],
    },
    {
      id: "album-width",
      question: "How wide should the live album under the hero sit?",
      context:
        "Under the hero is the real guest album, the shipped component itself. It used to run nearly the full page, which reads as a slab under a centred lockup. It is now a centred column, and the only question left is how wide: the Cosmos reference holds a narrow one, and your note was that a bit wider would be better.",
      look: "The album section at 1440, pressing each width in turn. Watch how large a face reads in one tile, and whether the column still sits under the hero rather than beside it.",
      options: [
        {
          id: "w720",
          label: "720, about the reference",
          means:
            "Two columns, a tile of about 346 px. The tightest block, and the one that reads most like the reference.",
        },
        {
          id: "w880",
          label: "880, a bit wider",
          means:
            "Two columns, a tile of about 426 px. The largest a single photograph ever reads on this page.",
        },
        {
          id: "w1040",
          label: "1040, and a third column",
          means:
            "Three columns, a tile of about 336 px, so half again as many photographs are on screen at once.",
        },
      ],
      recommended: "w880",
      because:
        "880 is the widest the column goes before the album stops reading as a block under the lockup and starts reading as the page. The third column buys count and costs the size of a face.",
      evidence: "album",
      control: "width",
      lands:
        "Two declarations: the masonry's column rule, and a wider laptop cap on the whole guest page.",
      strip: ["canvas"],
    },
    {
      id: "headline",
      question: "How big should the headline be?",
      context:
        "The site's type ladder offers this page two sizes: the one it ships, and one step up. The composition is drawn around whatever the words occupy, so this changes the picture and not only the type: at the louder step the photographs are pushed outward and the ones with no room left are not drawn at all.",
      look: "The picked hero with the Headline switch set each way. Count the photographs, and watch how much air is left between the words and the nearest frame.",
      options: [
        {
          id: "lg",
          label: "Today's headline",
          means:
            "The page keeps the size it ships, and the composition keeps the most room around it.",
        },
        {
          id: "xl",
          label: "One step louder",
          means:
            "The headline grows a step, the photographs are pushed outward, and the ones with nowhere left to go are dropped.",
        },
      ],
      recommended: "lg",
      because:
        "This is the one choice that changes the composition rather than the styling. At the louder step the block is 976 px of a 1440 canvas, and what pays for it is the picture around it.",
      overrule:
        "If this page should promise as loudly as the home page does, the louder headline is the better sentence.",
      evidence: "hero",
      control: "step",
      after: { ask: "composition" },
    },
    {
      id: "no-script",
      question: "What should the hero show when the animation cannot run?",
      context:
        "Search crawlers, and readers with JavaScript off, never get the loop. Last round they got the words on the dark ground and no photographs at all, because the composition had an entrance whose first frame was empty. None of these four has an entrance, so painting the album standing still costs nothing now: there is no snap to undo.",
      look: "The picked hero with the switch set each way. Both are static paints, which is exactly what that reader would see.",
      options: [
        {
          id: "lockup",
          label: "Words alone, as it is today",
          means:
            "A reader with no JavaScript gets the eyebrow, the headline, the sentence and the buttons, and no photographs.",
        },
        {
          id: "settled",
          label: "The album, standing still",
          means:
            "Everyone's first paint is the composition at rest, and the loop picks it up from exactly there with nothing to undo.",
        },
      ],
      recommended: "settled",
      because:
        "It was the wrong trade last round and it is the right one now. The still is the loop's own first frame, so a crawler gets the album and a reader gets no flash.",
      evidence: "hero",
      control: "no-script",
      after: { ask: "composition" },
    },
    {
      id: "copy",
      question: "Whose words should the hero say?",
      context:
        "The words are the live album page's own, printed exactly as the site says them today. The brand voice board is rewriting the site's sentences and proposes a new line for this page. This board proposes none of its own, because the picture is what it argues.",
      look: "The picked hero: the eyebrow, the headline and the sentence are the live page's, unchanged. Read them as a visitor arriving from the nav would.",
      options: [
        {
          id: "page",
          label: "The live page's own words",
          means:
            "The hero keeps the shipped eyebrow, headline and sentence, and whatever the voice board lands later reaches it for free.",
        },
        {
          id: "voice",
          label: "Hold for the brand voice line",
          means:
            "This hero waits for the voice exploration to land a new sentence, and is judged on that line instead.",
        },
      ],
      recommended: "page",
      because:
        "The picture is this board's argument and the sentence is the page's. Every line is open to a later round, so the voice ruling reaches this hero on its own.",
      evidence: "hero",
    },
  ],

  candidates: ITEMS,

  catalog: {
    section: "catalog",
    control: "composition",
    // Four variants of one hero, so ONE wins: the winner ask mirrors the pick
    // control and offers "None of these" as the new-directions exit, and the
    // whole feature page under the tiles wears whatever is pressed.
    mode: "pick-one",
    winner: "composition",
    stage: "page",
  },

  departures: [
    {
      id: "frame-shadow",
      from: 10,
      text: "Every frame carries the light spec's LIFT shadow. LIFT is the cue for two objects of the same lightness overlapping, which is what a ring and a scatter do constantly; without it the depth axis collapses into a flat scatter. It rides the card's own transform, and it darkens the ground behind the photograph rather than the photograph itself.",
      evidence: "catalog",
    },
    {
      id: "stand-in-frames",
      from: 18,
      text: "The twelve stand-in stills are stock, unverified, and wrong in shape: eleven of the twelve are landscape, and half of every composition here is a 4:5 slot. The fix is ASSETS rows 2 and 9, already requested, and the crop cycle is what holds the field together until they land.",
      evidence: "catalog",
    },
    {
      id: "outside-in",
      from: "precedent",
      text: "The production album is changed from the OUTSIDE: album.css drives GuestMasonry's column count through a variable rather than forking the component, so the candidate is composed and nothing under src/components/guest was edited. The diff it argues for is two declarations, and the album section carries the arithmetic.",
      evidence: "album",
    },
  ],

  assets: [
    {
      what: "34 event photographs, squares",
      spec: "Unchanged by this round, and this board needs no more than the row already asks for: the largest pool here is seventeen frames, so 34 covers every composition with none repeated.",
      replaces:
        "the 12 landscape stand-ins every composition cycles (FRAMES in the home hero's shared.tsx). The same 34 serve the hero and the album grid.",
      row: 2,
    },
    {
      what: "11 portrait crops of the squares",
      spec: "Unchanged: 512 x 640, the same photograph recropped, the same grade.",
      replaces:
        "the square box in every 4:5 slot. Half of each composition here is portrait, because half of what a guest shoots is a phone held up, and eleven of the twelve stand-ins are landscape.",
      row: 9,
    },
    {
      what: "2 short clips as album tiles",
      spec: "6 to 10 s, 4:5 or 9:16, muted, under 2 MB each, poster frame included.",
      replaces:
        "two photographs in the album grid, so it can show a real video tile with the corner play badge the guest album ships.",
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The four compositions",
      lede: "Each one the real hero at 1440 with its own Replay. Press a card to wear it on the whole page below.",
      argument: [
        "ONE ENGINE, FOUR TABLES. A card's phase is a closed form of the clock, so recycling falls out of a modulo, the still is the loop frozen at a phase, and there is no per-card bookkeeping, no timer and no React state. What differs between the four is where a card is placed and when it is lit; everything else, the DOM box, the clearance, the numbers on these cards and the tests, reads one description in compositions.ts.",
        "THE CALM RULE IS MEASURED AND PINNED, not asserted. Nothing on screen moves faster than 40 px a second at 1440, at most sixteen photographs are lit at once, and no lit frame ever touches the lockup's box at either headline step. Round two failed all three, with fifty-two frames, up to twenty-seven lit and a frame crossing the canvas in nine seconds. compositions.test.ts is what stops those coming back, because taste cannot be tested and arithmetic can.",
        "THE JITTER WAS A RE-RASTERISATION. A frame whose DOM box is 200 px and whose transform scales it to 400 is redrawn at twice its raster every frame that it grows. Every card here is sized to the largest moment anybody can see it at, so a photograph only ever scales DOWN. There is no filter and no blur anywhere, one transform and one opacity a frame, and the stacking order is written only when a card changes bucket.",
      ],
      eager: true,
      wiring: [
        "The winner lands in a hero component under src/components/marketing/sections/features/album/ and nowhere else. compositions.ts is already the shippable shape: pure, no React, both canvases and both headline steps solved at module load, one rAF loop writing transform and opacity and nothing else. Drop the three tables that lost and keep the engine. The lab pauses on a hidden TAB through the stage's data-paused; production swaps that for useAmbientPause, which also pauses off screen.",
      ],
    },
    {
      id: "hero",
      title: "The one you pressed, alone",
      lede: "The picked hero at true size with nothing under it, which is where the headline and the no-script questions are answered.",
      argument: [
        "THE LOCKUP IS ONE BLOCK AND THERE IS NO HOLE IN IT. The eyebrow, the headline, the sentence and the two actions stand together on the same gap every feature hero ships, centred on the canvas, and the photographs are composed around them. Nothing is born inside the type, so there is nothing to hold open. The words are the live page's, the buttons are the shipped ones untinted, and none of it is gated by anything that moves.",
        "THE QUIET ZONE IS GEOMETRY RATHER THAN A SCRIM. A station is pushed out to the smallest radius that clears the block along its own ray, a flying frame is dark until its whole box has left it, and a band takes its height from it. So the picture re-solves itself when the headline grows instead of breaking, and the photographs stay at 100 percent with no darkening layer anywhere on the hero.",
      ],
    },
    {
      id: "album",
      title: "The live album, centred",
      lede: "The shipped guest album itself, in a centred column you size by eye: the host's own chrome, the Live now dot, and almost no movement.",
      argument: [
        "IT IS THE SHIPPED COMPONENT, COMPOSED, not a drawing of one: GuestMasonry, the same MediaTile, the same natural-ratio masonry at a 3 px gap, the same lightbox trigger, the same corner play badge on a video. Its entrance is the product's own, which is the only motion on this half of the page: nothing here loops and nothing drifts, so the hero above keeps the whole of the eye's appetite for movement.",
        "BIBLE 4: a guest surface is the HOST'S. The chrome above the grid is the event's own identity in the shape the shipped guest page uses, the name in the heading face, the byline, then the stats line, with no Partyreel mark anywhere inside the frame. The one thing that is ours is the browser frame around it, which is the marketing page's furniture and not the album's.",
      ],
      wiring: [
        "If the width ask lands it is two declarations, in two files, and either alone is worse than shipping: columns-2 becomes columns-2 md:columns-3 in src/components/guest/guest-masonry.tsx, AND the whole guest column gets a wider laptop cap than max-w-2xl in src/components/guest/event-experience.tsx. The cap carries the event header, the reel card and the action row with the grid, so it is one visual change to the guest page rather than one to the album.",
      ],
    },
    {
      id: "page",
      title: "The page, whole",
      lede: "The picked hero, the album under it, then every section the route ships in its order: the only place to judge the cut to the light chapters under a moving hero.",
      argument: [
        "THE CUT IS THE THING TO LOOK AT. QualitySection winds the dark chapter down, PaperChapter flips the token subtree light on a hard hairline, and six desk sections run on paper before the close returns to cinema. If a hero is too loud the symptom shows up HERE, a chapter and a half below it, rather than in the hero alone.",
        "The stage mirrors the route BY HAND and deliberately: a route module is not something to import from a board, because it carries its own metadata and Next owns its module graph. Two things are left out, both of them chrome the layout owns: the BreadcrumbJsonLd, which is invisible, and the overlay MarketingHeader, whose sticky position would resolve against the lab page and ride down the board instead of sitting over the hero.",
        "The phone reading of the tail is approximate, and the reason is the shell. A Tailwind breakpoint prefix inside a Stage reads the REAL browser viewport rather than the canvas, so inside the 375 canvas on a wide window the shipped sections resolve their md and lg rules as desktop. The cut, the order and the type sizes read correctly; the tail's per-section vertical rhythm does not.",
      ],
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
      id: "composition",
      label: "The winner",
      // Nothing picked is a state of its own: the page below opens on the hero
      // that ships today, and pressing the picked card returns here (Will,
      // 2026-09-16).
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "orbit", label: "1. The orbit" },
        { id: "field", label: "2. The field" },
        { id: "shelf", label: "3. The shelf" },
        { id: "arrival", label: "4. The arrival" },
      ],
      default: "none",
      clearable: true,
    },
    {
      id: "width",
      label: "Album",
      options: [
        { id: "w720", label: "720" },
        { id: "w880", label: "880" },
        { id: "w1040", label: "1040" },
      ],
      default: "w880",
    },
    {
      id: "step",
      label: "Headline",
      options: [
        { id: "lg", label: "Today's headline" },
        { id: "xl", label: "One step louder" },
      ],
      default: "lg",
    },
    /* ★ THREE POSITIONS, TWO OF THEM THE ASK'S. A running hero is not one of
       the no-script answers, it is the absence of the question, so it is this
       control's CLEARED default and the ask offers the other two. Pressing the
       chosen tile again returns the hero to running, which is the one toggle
       rule every pick on the desk follows. */
    {
      id: "no-script",
      label: "With no JavaScript",
      options: [
        { id: "running", label: "Running" },
        { id: "lockup", label: "Words alone" },
        { id: "settled", label: "The album, still" },
      ],
      default: "running",
      clearable: true,
    },
  ],

  lookFirst: [
    {
      section: "catalog",
      state: { canvas: "desktop", composition: "none" },
      note: "The four at 1440, running. Thirty seconds on each with nothing else on screen: the album should never stop being there, and nothing should ever become the thing your eye is chasing.",
    },
    {
      section: "album",
      state: { canvas: "desktop", width: "w880" },
      note: "The real album, centred at the board's own answer to a bit wider. Press the other two widths and watch how large a face reads in one tile.",
    },
    {
      section: "page",
      note: "The only stage where the hero and the album run together. Scroll to the switch from the dark chapters to the light ones with the composition still going a chapter and a half above it.",
    },
    {
      section: "page",
      state: { canvas: "phone" },
      note: "The hero and the switch at 375. The tail's vertical rhythm is approximate here and the hero and the cut are not; the argument under this section says why.",
    },
  ],

  notes: [
    {
      section: "catalog",
      text: "An occluded or background tab suspends rAF outright, so a composition holds its clock until the tab is fronted. If the photographs look frozen, front the tab before concluding anything.",
    },
    {
      section: "album",
      state: { canvas: "phone" },
      text: "The width switch is a no-op at 375, and that is correct rather than broken: on a phone the frame is the canvas less its gutter and the album is two columns, which is what the product ships.",
    },
  ],

  links: {
    bible: [1, 4, 10, 13, 14, 18],
  },
});
